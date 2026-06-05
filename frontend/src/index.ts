// EstateEdge — Analytics Service
// Tracks site analytics, stores and serves lead data

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, queryMany } from '../../backend/shared/db';
import { publishEvent, startConsumer } from '../../backend/shared/kafka';
import { KAFKA_TOPICS } from '../../backend/shared/types';

const app = express();
const PORT = process.env.PORT ?? 4004;

app.use(helmet());
app.use(cors());
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ service: 'analytics-service', status: 'ok' }));

// ─── Leads ────────────────────────────────────────────────────────────────────

// Public endpoint — called from published site contact forms
app.post('/leads', async (req, res) => {
  try {
    const { siteId, email, firstName, lastName, phone, message, source, metadata } = req.body;

    if (!siteId || !email) {
      return res.status(400).json({ error: 'siteId and email are required' });
    }

    // Resolve user_id from site
    const site = await queryOne(
      `SELECT user_id FROM sites WHERE id = $1 AND status = 'published'`,
      [siteId]
    );
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const lead = await queryOne(
      `INSERT INTO leads (id, site_id, user_id, email, first_name, last_name, phone, message, source, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        uuidv4(), siteId, site.user_id,
        email.toLowerCase().trim(),
        firstName ?? null, lastName ?? null, phone ?? null,
        message ?? null,
        source ?? 'contact-form',
        JSON.stringify(metadata ?? {}),
      ]
    );

    // Publish event — ai-service will auto-score this lead
    await publishEvent(KAFKA_TOPICS.LEAD_CREATED, {
      leadId: lead!.id,
      siteId,
      userId: site.user_id,
      email,
    });

    res.status(201).json({ data: { id: lead!.id, message: 'Thank you for your inquiry!' } });
  } catch (err) {
    console.error('[Analytics] Create lead error', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Protected — fetch leads for a user's site
app.get('/leads', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const siteId = req.query.siteId as string | undefined;
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string ?? '1');
    const limit = parseInt(req.query.limit as string ?? '50');
    const offset = (page - 1) * limit;

    let sql = `
      SELECT l.*, s.name as site_name
      FROM leads l
      JOIN sites s ON l.site_id = s.id
      WHERE l.user_id = $1
    `;
    const params: unknown[] = [userId];

    if (siteId) {
      params.push(siteId);
      sql += ` AND l.site_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND l.status = $${params.length}`;
    }

    sql += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const leads = await queryMany(sql, params);

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) FROM leads WHERE user_id = $1${siteId ? ' AND site_id = $2' : ''}`,
      siteId ? [userId, siteId] : [userId]
    );
    const total = parseInt(countResult?.count ?? '0');

    res.json({
      data: leads,
      meta: { total, page, pageSize: limit, hasMore: offset + leads.length < total },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Update lead status
app.patch('/leads/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { status } = req.body;

    const lead = await queryOne(
      `UPDATE leads SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, req.params.id, userId]
    );

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    await publishEvent(KAFKA_TOPICS.LEAD_UPDATED, { leadId: req.params.id, userId, status });
    res.json({ data: lead });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── Analytics ────────────────────────────────────────────────────────────────

// Get aggregated analytics for a site
app.get('/analytics/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const days = parseInt(req.query.days as string ?? '30');

    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await queryMany(
      `SELECT * FROM site_analytics_daily
       WHERE site_id = $1 AND date >= $2
       ORDER BY date ASC`,
      [siteId, since.toISOString().split('T')[0]]
    );

    // Aggregate
    const totalViews = rows.reduce((s, r) => s + (Number(r.page_views) || 0), 0);
    const totalVisitors = rows.reduce((s, r) => s + (Number(r.unique_visitors) || 0), 0);
    const totalLeads = rows.reduce((s, r) => s + (Number(r.leads_captured) || 0), 0);
    const avgSession = rows.length
      ? Math.round(rows.reduce((s, r) => s + (Number(r.avg_session_duration_sec) || 0), 0) / rows.length)
      : 0;
    const avgBounce = rows.length
      ? parseFloat((rows.reduce((s, r) => s + (Number(r.bounce_rate) || 0), 0) / rows.length).toFixed(1))
      : null;

    res.json({
      data: {
        siteId,
        pageViews: totalViews,
        uniqueVisitors: totalVisitors,
        leadsCaptured: totalLeads,
        avgSessionDuration: avgSession,
        bounceRate: avgBounce,
        topPages: rows[rows.length - 1]?.top_pages ?? [],
        trafficSources: rows[rows.length - 1]?.traffic_sources ?? {},
        daily: rows,
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Ingest a page view event (called from site embed script)
app.post('/analytics/events/pageview', async (req, res) => {
  try {
    const { siteId, path, sessionId, referrer, userAgent } = req.body;

    // Publish to Kafka — a background consumer aggregates these into daily buckets
    await publishEvent(KAFKA_TOPICS.PAGE_VIEWED, {
      siteId, path, sessionId, referrer,
      timestamp: new Date().toISOString(),
    });

    res.status(202).json({ ok: true });
  } catch {
    res.status(202).json({ ok: true }); // always 202 for tracking pixels
  }
});

// ─── Kafka Consumer — aggregate page views into daily analytics ───────────────

async function startKafkaConsumer() {
  await startConsumer({
    groupId: 'analytics-service-group',
    topics: [KAFKA_TOPICS.PAGE_VIEWED, KAFKA_TOPICS.LEAD_CREATED],
    handler: async (message) => {
      const today = new Date().toISOString().split('T')[0];

      if (message.topic === KAFKA_TOPICS.PAGE_VIEWED) {
        const { siteId } = message.payload as { siteId: string };
        // Upsert daily analytics row
        await query(
          `INSERT INTO site_analytics_daily (id, site_id, date, page_views)
           VALUES ($1, $2, $3, 1)
           ON CONFLICT (site_id, date)
           DO UPDATE SET page_views = site_analytics_daily.page_views + 1`,
          [uuidv4(), siteId, today]
        ).catch(console.error);
      }

      if (message.topic === KAFKA_TOPICS.LEAD_CREATED) {
        const { siteId } = message.payload as { siteId: string };
        await query(
          `INSERT INTO site_analytics_daily (id, site_id, date, leads_captured)
           VALUES ($1, $2, $3, 1)
           ON CONFLICT (site_id, date)
           DO UPDATE SET leads_captured = site_analytics_daily.leads_captured + 1`,
          [uuidv4(), siteId, today]
        ).catch(console.error);
      }
    },
  });
}

async function bootstrap() {
  await startKafkaConsumer();
  app.listen(PORT, () => console.log(`[Analytics Service] Running on port ${PORT}`));
}

bootstrap().catch((err) => {
  console.error('[Analytics Service] Fatal startup error', err);
  process.exit(1);
});