import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SiteGenerationInput, GeneratedSiteSpec } from "../../shared/types";
import { query } from "../../shared/db";
import { v4 as uuidv4 } from "uuid";
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

// IMPORTANT: correct model you discovered
const geminiModel = gemini.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// ─────────────────────────────
// PROMPT
// ─────────────────────────────

const SYSTEM_PROMPT = `
You are EstateEdge AI Site Architect.

Return ONLY valid JSON.
No markdown.
No explanation.
`;

// ─────────────────────────────
// GEMINI CALL WRAPPER
// ─────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

// ─────────────────────────────
// BUILD PROMPT
// ─────────────────────────────

function buildUserPrompt(input: SiteGenerationInput): string {
  return `
Generate a real estate website spec:

Agent: ${input.agentName}
Location: ${input.location}
Tone: ${input.tone}
Specialties: ${input.specialties.join(", ")}

Return strict JSON only.
`;
}

// ─────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────

export async function generateSite(
  input: SiteGenerationInput,
  userId: string,
  jobId?: string
): Promise<{
  site: GeneratedSiteSpec;
  tokensUsed: number;
  durationMs: number;
}> {
  const start = Date.now();
  const actualJobId = jobId ?? uuidv4();

  // ─────────────────────────────
  // mark processing (safe)
  // ─────────────────────────────
  await query(
    `UPDATE generation_jobs 
     SET status='processing', updated_at=NOW() 
     WHERE id=$1`,
    [actualJobId]
  ).catch(console.error);

  let rawText = "";
  let usedModel = "";
  let tokensUsed = 0;

  // ─────────────────────────────
  // TRY CLAUDE
  // ─────────────────────────────
  try {
    console.log("🧠 Trying Claude...");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
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

    rawText = await callGemini(buildUserPrompt(input));
    usedModel = "gemini-2.5-flash";
    tokensUsed = 0;
  }

  // ─────────────────────────────
  // CLEAN JSON
  // ─────────────────────────────

  const cleaned = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let siteSpec: GeneratedSiteSpec;

  try {
    siteSpec = JSON.parse(cleaned);
  } catch (err) {
    console.error("RAW AI OUTPUT:", rawText);
    throw new Error("AI returned invalid JSON");
  }

  const durationMs = Date.now() - start;

  // ─────────────────────────────
  // DB UPDATE (SAFE VERSION)
  // ─────────────────────────────

  try {
    await query(
      `
      UPDATE generation_jobs
      SET 
        status='completed',
        output=$1,
        ai_model=$2,
        updated_at=NOW()
      WHERE id=$3
      `,
      [JSON.stringify(siteSpec), usedModel, actualJobId]
    );
  } catch (err) {
    console.error("JOB UPDATE FAILED:", err);
  }

  // ─────────────────────────────
  // HISTORY (SAFE)
  // ─────────────────────────────

  try {
    await query(
      `
      INSERT INTO ai_content_history
      (user_id, content_type, prompt, result, model, tokens_used)
      VALUES ($1,'site-generation',$2,$3,$4,$5)
      `,
      [
        userId,
        JSON.stringify(input),
        JSON.stringify(siteSpec),
        usedModel,
        tokensUsed,
      ]
    );
  } catch (err) {
    console.error("HISTORY INSERT FAILED:", err);
  }

  console.log(`🚀 Generated site via ${usedModel} in ${durationMs}ms`);

  return {
    site: siteSpec,
    tokensUsed,
    durationMs,
  };
}