// EstateEdge — AI Service
// Handles all LLM interactions via Anthropic Claude
// Listens on Kafka for AI requests, publishes results back

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { startConsumer, publishEvent } from './shared/kafka';
import { KAFKA_TOPICS, KafkaMessage, SiteGenerationInput, GeneratedSiteSpec } from './shared/types';
import { generateSite } from '../backend/services/ai-service/generateSite.js';
import { generateContent } from '../backend/services/ai-service/generateContent.js';
import { scoreLeadWithAI } from '../backend/services/ai-service/scoreLead.js';
import { generateMarketReport } from '../backend/services/ai-service/generateMarketReport.js';
import { checkDbHealth } from './shared/db';

const app = express();
const PORT = Number(process.env.AI_SERVICE_PORT) ?? 4002;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: [
      'https://estateedge-frontend.vercel.app',
      'http://localhost:5173',
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

// ─── Health / Readiness ───────────────────────────────────────────────────────

app.get('/health', async (_req, res) => {
  const dbOk = await checkDbHealth();
  res.json({
    service: 'ai-service',
    status: dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
  });
});

// ─── REST Endpoints (for synchronous requests from gateway) ──────────────────

app.post('/generate/site', async (req, res) => {
  try {
    const input: SiteGenerationInput = req.body;
    const userId: string = req.headers['x-user-id'] as string;
    
    const result = await generateSite(input, userId);
      console.log("AUTH HEADER:", req.headers.authorization);
    res.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

app.post('/generate/content', async (req, res) => {
  try {
    const result = await generateContent(req.body);
    res.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

app.post('/generate/market-report', async (req, res) => {
  try {
    const result = await generateMarketReport(req.body);
    res.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// ─── Kafka Consumer ───────────────────────────────────────────────────────────

async function startKafkaConsumer(): Promise<void> {
  await startConsumer({
    groupId: 'ai-service-group',
    topics: [
      KAFKA_TOPICS.AI_GENERATION_REQUESTED,
      KAFKA_TOPICS.AI_CONTENT_REQUESTED,
      KAFKA_TOPICS.LEAD_CREATED,
    ],
    handler: async (message: KafkaMessage) => {
      switch (message.topic) {
        case KAFKA_TOPICS.AI_GENERATION_REQUESTED: {
          const { input, userId, jobId } = message.payload as {
            input: SiteGenerationInput;
            userId: string;
            jobId: string;
          };
          try {
            const result = await generateSite(input, userId, jobId);
            await publishEvent(KAFKA_TOPICS.AI_GENERATION_COMPLETED, {
              jobId,
              userId,
              result,
              success: true,
            });
          } catch (err) {
            await publishEvent(KAFKA_TOPICS.AI_GENERATION_COMPLETED, {
              jobId,
              userId,
              error: err instanceof Error ? err.message : 'AI generation failed',
              success: false,
            });
          }
          break;
        }

        case KAFKA_TOPICS.AI_CONTENT_REQUESTED: {
          const { contentType, prompt, userId, requestId, siteId, pageId } = message.payload as {
            contentType: string;
            prompt: string;
            userId: string;
            requestId: string;
            siteId?: string;
            pageId?: string;
          };
          try {
            const result = await generateContent({ contentType, prompt, siteId, pageId });
            await publishEvent(KAFKA_TOPICS.AI_CONTENT_COMPLETED, {
              requestId,
              userId,
              result,
              success: true,
            });
          } catch (err) {
            await publishEvent(KAFKA_TOPICS.AI_CONTENT_COMPLETED, {
              requestId,
              userId,
              error: err instanceof Error ? err.message : 'Content generation failed',
              success: false,
            });
          }
          break;
        }

        case KAFKA_TOPICS.LEAD_CREATED: {
          // Automatically score new leads
          try {
            const leadData = message.payload as { leadId: string; siteId: string };
            await scoreLeadWithAI(leadData.leadId, leadData.siteId);
          } catch (err) {
            console.error('[AI Service] Lead scoring failed', err);
          }
          break;
        }
      }
    },
  });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  await startKafkaConsumer();
  app.listen(PORT, () => {
    console.log(`[AI Service] Running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[AI Service] Fatal startup error', err);
  process.exit(1);
});