// EstateEdge — AI Service: Content Generation Handler
// Generates agent bios, listing descriptions, neighborhood guides, SEO copy

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../../shared/db";
import dotenv from "dotenv";

dotenv.config();

// ─────────────────────────────
// AI CLIENTS
// ─────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const gemini = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

const geminiModel = gemini.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// ─────────────────────────────
// TYPES
// ─────────────────────────────

export type ContentType =
  | "bio"
  | "listing-description"
  | "neighborhood-guide"
  | "seo-meta"
  | "market-report-summary"
  | "cta-copy"
  | "hero-headline";

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

// ─────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────

const SYSTEM_PROMPTS: Record<ContentType, string> = {
  bio: `You are a real estate copywriter. Write a 150–250 word professional bio.`,
  "listing-description": `Write luxury property descriptions (120–200 words).`,
  "neighborhood-guide": `Write neighborhood guides (300–400 words).`,
  "seo-meta": `Return JSON {"title": "...", "description": "..."}.`,
  "market-report-summary": `Write market summaries (200–300 words).`,
  "cta-copy": `Return 3 CTA variations in JSON format.`,
  "hero-headline": `Return 3 headlines (6–10 words each) as JSON array.`,
};

// ─────────────────────────────
// GEMINI WRAPPER
// ─────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

// ─────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────

export async function generateContent(
  request: ContentRequest
): Promise<ContentResult> {
  const systemPrompt = SYSTEM_PROMPTS[request.contentType];

  let rawText = "";
  let usedModel = "";
  let tokensUsed = 0;

  // ─────────────────────────────
  // TRY CLAUDE FIRST
  // ─────────────────────────────

  try {
    console.log("🧠 Trying Claude...");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: request.prompt }],
    });

    rawText = response.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    tokensUsed =
      (response as any).usage?.input_tokens +
        (response as any).usage?.output_tokens || 0;

    usedModel = "claude-sonnet";
  } catch (err) {
    console.warn("⚠️ Claude failed → switching to Gemini");

    rawText = await callGemini(
      `${systemPrompt}\n\nUser: ${request.prompt}`
    );

    usedModel = "gemini-2.5-flash";
    tokensUsed = 0;
  }

  // ─────────────────────────────
  // CLEAN OUTPUT
  // ─────────────────────────────

  const cleaned = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let finalContent = cleaned;

  // ─────────────────────────────
  // OPTIONAL JSON SAFETY CHECK
  // ─────────────────────────────

  try {
    // if it's JSON, validate it
    if (
      cleaned.startsWith("{") ||
      cleaned.startsWith("[")
    ) {
      JSON.parse(cleaned);
    }
  } catch {
    console.warn("⚠️ Invalid JSON returned (keeping raw text)");
  }

  // ─────────────────────────────
  // SAVE HISTORY (SAFE)
  // ─────────────────────────────

  if (request.userId) {
    await query(
      `
      INSERT INTO ai_content_history
      (user_id, site_id, page_id, content_type, prompt, result, model, tokens_used)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        request.userId,
        request.siteId ?? null,
        request.pageId ?? null,
        request.contentType,
        request.prompt,
        finalContent,
        usedModel,
        tokensUsed,
      ]
    ).catch(console.error);
  }

  console.log(`🚀 Content generated via ${usedModel}`);

  return {
    content: finalContent,
    tokensUsed,
    model: usedModel,
  };
}