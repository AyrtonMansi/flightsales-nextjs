import Anthropic from "@anthropic-ai/sdk";
import { estimateCost } from "./models";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface CallResult {
  text: string;
  cost: number;
  model: string;
  inTok: number;
  outTok: number;
}

// Single Messages call. webSearch=true enables Anthropic's server-side web search tool,
// which executes server-side and returns results inline (no client tool loop needed).
export async function callClaude(opts: {
  model: string;
  system: string;
  prompt: string;
  maxTokens?: number;
  webSearch?: boolean;
}): Promise<CallResult> {
  const res = await client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 2000,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
    ...(opts.webSearch ? { tools: [{ type: "web_search_20250305", name: "web_search" } as any] } : {}),
  });

  const text = res.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim();

  const inTok = res.usage?.input_tokens ?? 0;
  const outTok = res.usage?.output_tokens ?? 0;
  return { text, cost: estimateCost(opts.model, inTok, outTok), model: opts.model, inTok, outTok };
}

// Helper: ask for JSON and parse it defensively (models sometimes wrap in ```json fences).
export function parseJson<T = any>(text: string): T | null {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
}
