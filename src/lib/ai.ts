/**
 * AI Service - calls OpenRouter API for content generation, email drafting, etc.
 *
 * In production, these calls should go through Supabase Edge Functions
 * to keep the API key server-side. For development, we call OpenRouter directly.
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIRequestParams {
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIContentParams {
  prompt: string;
  contentType: string;
  platform?: string;
  tone?: string;
  clientContext?: {
    companyName?: string;
    industry?: string;
    market?: string;
  };
  existingContent?: string;
}

export interface AIEmailParams {
  emailType: string;
  clientContext: {
    companyName: string;
    primaryContact: string;
    industry: string;
    market: string;
    planTier: string;
    monthlyValue: number;
  };
  additionalContext?: string;
  deliverables?: { name: string; status: string; serviceType: string }[];
  invoices?: { invoiceId: string; status: string; amount: number; currency: string }[];
}

export function isAIConfigured(): boolean {
  return !!OPENROUTER_API_KEY;
}

async function callOpenRouter(params: AIRequestParams): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured. Set VITE_OPENROUTER_API_KEY in .env.local");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "ONNIFY WORKS CRM",
    },
    body: JSON.stringify({
      model: params.model || DEFAULT_MODEL,
      messages: params.messages,
      max_tokens: params.maxTokens || 2048,
      temperature: params.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI request failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function generateContent(params: AIContentParams): Promise<string> {
  const clientInfo = params.clientContext
    ? `The client is ${params.clientContext.companyName || "unknown"} in the ${params.clientContext.industry || "unknown"} industry, ${params.clientContext.market || ""} market.`
    : "";

  const toneInstruction = params.tone
    ? `Tone: ${params.tone}.`
    : "Tone: professional but engaging.";

  const systemPrompt = [
    "You are a content writer for ONNIFY WORKS, a digital marketing agency.",
    clientInfo,
    `Content type: ${params.contentType}. Platform: ${params.platform || "general"}.`,
    toneInstruction,
    "Write high-quality marketing content. Be concise and impactful.",
    "Do not include meta-commentary about the content — just write it directly.",
  ].join(" ");

  const userPrompt = params.existingContent
    ? `Here is the existing content to improve:\n\n${params.existingContent}\n\nInstruction: ${params.prompt}`
    : params.prompt;

  return callOpenRouter({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });
}

export async function generateEmail(params: AIEmailParams): Promise<{ subject: string; body: string }> {
  const { clientContext, emailType, additionalContext, deliverables, invoices } = params;

  const deliverablesInfo = deliverables?.length
    ? `\nActive deliverables:\n${deliverables.map((d) => `- ${d.name} (${d.serviceType}): ${d.status}`).join("\n")}`
    : "";

  const invoicesInfo = invoices?.length
    ? `\nRecent invoices:\n${invoices.map((i) => `- ${i.invoiceId}: ${i.currency} ${i.amount.toLocaleString()} — ${i.status}`).join("\n")}`
    : "";

  const systemPrompt = [
    "You are drafting a professional email from ONNIFY WORKS (a digital marketing agency).",
    `Recipient: ${clientContext.primaryContact} at ${clientContext.companyName}.`,
    `Market: ${clientContext.market}. Industry: ${clientContext.industry}. Plan: ${clientContext.planTier}.`,
    "Tone: professional but friendly. Keep it concise.",
    'Respond in JSON format: {"subject": "...", "body": "..."}',
    "The body should be plain text (not HTML). Use line breaks for paragraphs.",
  ].join(" ");

  const userPrompt = [
    `Draft a ${emailType} email.`,
    deliverablesInfo,
    invoicesInfo,
    additionalContext ? `\nAdditional context: ${additionalContext}` : "",
  ].join("");

  const result = await callOpenRouter({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
  });

  try {
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      subject: `${emailType} — ${clientContext.companyName}`,
      body: result,
    };
  }
}
