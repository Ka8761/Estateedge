// EstateEdge — AI Service: Market Report Generation

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

interface MarketReportInput {
  location: string;
  reportType: "monthly" | "quarterly" | "neighborhood";
  marketData?: {
    medianPrice?: number;
    priceChange?: number;
    daysOnMarket?: number;
    inventory?: number;
    closedSales?: number;
  };
  agentName?: string;
}

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

export async function generateMarketReport(
  input: MarketReportInput
): Promise<{
  title: string;
  summary: string;
  keyInsights: string[];
  buyerAdvice: string;
  sellerAdvice: string;
  outlook: string;
}> {
  const dataSection = input.marketData
    ? `
Market Data:
- Median Home Price: ${
        input.marketData.medianPrice
          ? `$${input.marketData.medianPrice.toLocaleString()}`
          : "N/A"
      }
- Price Change (YoY): ${
        input.marketData.priceChange
          ? `${input.marketData.priceChange > 0 ? "+" : ""}${
              input.marketData.priceChange
            }%`
          : "N/A"
      }
- Days on Market: ${input.marketData.daysOnMarket ?? "N/A"}
- Inventory: ${input.marketData.inventory ?? "N/A"} homes
- Closed Sales: ${input.marketData.closedSales ?? "N/A"}
`
    : "";

  const prompt = `
Write a professional real estate market report for ${input.location}.
Report Type: ${input.reportType}
${dataSection}
${input.agentName ? `Written by: ${input.agentName}` : ""}

Return ONLY valid JSON:
{
  "title": "Market report title",
  "summary": "2-3 sentence summary",
  "keyInsights": ["insight 1", "insight 2", "insight 3", "insight 4"],
  "buyerAdvice": "2-3 sentences",
  "sellerAdvice": "2-3 sentences",
  "outlook": "2-3 sentences"
}
`;

  let rawText = "";
  let usedModel = "";

  // ─────────────────────────────
  // TRY CLAUDE FIRST
  // ─────────────────────────────

  try {
    console.log("🧠 Trying Claude...");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    rawText = response.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    usedModel = "claude-sonnet";
  } catch (err) {
    console.warn("⚠️ Claude failed → switching to Gemini");

    rawText = await callGemini(prompt);
    usedModel = "gemini-2.5-flash";
  }

  // ─────────────────────────────
  // CLEAN OUTPUT
  // ─────────────────────────────

  const cleaned = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let parsed;

  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ INVALID AI JSON OUTPUT:", rawText);
    throw new Error("AI returned invalid JSON");
  }

  console.log(`🚀 Market report generated via ${usedModel}`);

  return parsed;
}