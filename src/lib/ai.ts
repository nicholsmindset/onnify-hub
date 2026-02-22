const OPENROUTER_API_KEY =
  import.meta.env.VITE_OPENROUTER_API_KEY ||
  "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";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-sonnet-4";

interface AIRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

async function callAI({ systemPrompt, userPrompt, maxTokens = 2048 }: AIRequestOptions): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured. Set VITE_OPENROUTER_API_KEY in .env");
  }

  const res = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "OnnifyWorks CRM",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    if (res.status === 401) {
      throw new Error("OpenRouter API key is invalid or expired. Please update VITE_OPENROUTER_API_KEY in your .env file with a valid key from https://openrouter.ai/keys");
    }
    throw new Error(`AI request failed (${res.status}): ${error}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ============================================
// CONTENT GENERATION
// ============================================

export interface ContentGenerateParams {
  contentType: string;
  title: string;
  platform?: string;
  tone?: string;
  clientName?: string;
  clientIndustry?: string;
  clientMarket?: string;
  customPrompt?: string;
}

export async function generateContent(params: ContentGenerateParams): Promise<string> {
  const systemPrompt = `You are an expert content writer for a digital marketing agency called OnnifyWorks.
You specialize in creating high-quality content for clients across Singapore, Indonesia, and the US.
Write in a ${params.tone || "professional"} tone. Be concise, engaging, and action-oriented.
Output ONLY the content itself — no meta-commentary, no "Here's the content:", just the actual content ready to publish.`;

  let userPrompt = `Write a ${params.contentType}`;
  if (params.title) userPrompt += ` titled "${params.title}"`;
  if (params.platform) userPrompt += ` for ${params.platform}`;
  if (params.clientName) userPrompt += ` for client ${params.clientName}`;
  if (params.clientIndustry) userPrompt += ` in the ${params.clientIndustry} industry`;
  if (params.clientMarket) userPrompt += ` targeting the ${params.clientMarket} market`;
  if (params.customPrompt) userPrompt += `\n\nAdditional instructions: ${params.customPrompt}`;

  return callAI({ systemPrompt, userPrompt });
}

export async function refineContent(content: string, instruction: string): Promise<string> {
  const systemPrompt = `You are an expert content editor for a digital marketing agency.
Improve the given content based on the user's instruction.
Output ONLY the improved content — no commentary.`;

  const userPrompt = `Here is the existing content:\n\n${content}\n\nInstruction: ${instruction}`;

  return callAI({ systemPrompt, userPrompt });
}

// ============================================
// EMAIL DRAFTING
// ============================================

export interface EmailDraftParams {
  emailType: string;
  clientName: string;
  clientCompany: string;
  contactName?: string;
  clientIndustry?: string;
  planTier?: string;
  monthlyValue?: number;
  customContext?: string;
}

export interface EmailDraft {
  subject: string;
  body: string;
}

export async function generateEmail(params: EmailDraftParams): Promise<EmailDraft> {
  const systemPrompt = `You are a professional account manager at OnnifyWorks, a digital marketing agency.
Draft emails that are warm, professional, and action-oriented.
You MUST respond in valid JSON format with exactly two keys: "subject" and "body".
The body should be plain text (no HTML), with proper paragraph breaks using \\n\\n.
Do NOT wrap the JSON in code blocks. Output raw JSON only.`;

  let userPrompt = `Draft a "${params.emailType}" email for:
- Client: ${params.clientCompany}
- Contact: ${params.contactName || params.clientName}`;
  if (params.clientIndustry) userPrompt += `\n- Industry: ${params.clientIndustry}`;
  if (params.planTier) userPrompt += `\n- Plan: ${params.planTier}`;
  if (params.monthlyValue) userPrompt += `\n- Monthly Value: $${params.monthlyValue}`;
  if (params.customContext) userPrompt += `\n\nAdditional context: ${params.customContext}`;

  const raw = await callAI({ systemPrompt, userPrompt });

  try {
    const parsed = JSON.parse(raw);
    return { subject: parsed.subject || "", body: parsed.body || "" };
  } catch {
    // If AI didn't return valid JSON, extract what we can
    return {
      subject: `${params.emailType} - ${params.clientCompany}`,
      body: raw,
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
