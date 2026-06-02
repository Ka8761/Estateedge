// EstateEdge — AI Service: Content Generation Handler
// Generates agent bios, listing descriptions, neighborhood guides, SEO copy

import Anthropic from '@anthropic-ai/sdk';
import { query } from '../../../backend/shared/db';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ContentType =
  | 'bio'
  | 'listing-description'
  | 'neighborhood-guide'
  | 'seo-meta'
  | 'market-report-summary'
  | 'cta-copy'
  | 'hero-headline';

interface ContentRequest {
  contentType: ContentType;
  prompt: string;
  siteId?: string;
  pageId?: string;
  userId?: string;
  context?: Record<string, unknown>;
}

interface ContentResult {
  content: string;
  tokensUsed: number;
  model: string;
}

const SYSTEM_PROMPTS: Record<ContentType, string> = {
  'bio': `You are a real estate copywriter specializing in compelling agent biographies. 
Write professional, personable bios that build trust and highlight expertise. 
Tone: warm yet authoritative. Length: 150-250 words. First person.`,

  'listing-description': `You are a luxury real estate copywriter. 
Write evocative property descriptions that sell the lifestyle, not just the features. 
Use sensory language. Highlight unique selling points. 120-200 words. No clichés.`,

  'neighborhood-guide': `You are a local real estate expert creating neighborhood content for websites. 
Write informative, engaging neighborhood guides that help buyers understand the area. 
Cover: lifestyle, schools, amenities, market trends, what makes it special. 300-400 words.`,

  'seo-meta': `You are an SEO specialist for real estate websites. 
Generate SEO-optimized page titles (50-60 chars) and meta descriptions (150-160 chars). 
Return JSON: {"title": "...", "description": "..."} only.`,

  'market-report-summary': `You are a real estate market analyst. 
Write clear, insightful market summaries for homeowners and buyers. 
Use data points naturally. Balanced, professional tone. 200-300 words.`,

  'cta-copy': `You are a conversion copywriter for real estate. 
Write compelling calls-to-action that drive inquiries and appointments. 
Return 3 variations: button text + supporting line. JSON format.`,

  'hero-headline': `You are a real estate brand copywriter. 
Write punchy, memorable hero headlines for real estate agent websites. 
Return 3 headline options, each 6-10 words. JSON array format.`,
};

export async function generateContent(request: ContentRequest): Promise<ContentResult> {
  const systemPrompt = SYSTEM_PROMPTS[request.contentType];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      { role: 'user', content: request.prompt },
    ],
  });

  const content = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

  // Persist to history if we have user context
  if (request.userId) {
    await query(
      `INSERT INTO ai_content_history 
       (user_id, site_id, page_id, content_type, prompt, result, model, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        request.userId,
        request.siteId ?? null,
        request.pageId ?? null,
        request.contentType,
        request.prompt,
        content,
        'claude-sonnet-4-20250514',
        tokensUsed,
      ]
    ).catch(console.error);
  }

  return {
    content,
    tokensUsed,
    model: 'claude-sonnet-4-20250514',
  };
}