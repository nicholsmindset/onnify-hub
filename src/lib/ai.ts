import { supabase } from "./supabase";

// ============================================
// EDGE FUNCTION + DIRECT CALL INFRASTRUCTURE
// ============================================

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-sonnet-4";

/**
 * Try calling a Supabase Edge Function first.
 * Falls back to direct OpenRouter call if the Edge Function is not deployed.
 */
async function callEdgeFunction<T>(
  fnName: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fnName, { body });
  if (error) throw error;
  return data as T;
}

interface AIRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export function isAIConfigured(): boolean {
  return !!OPENROUTER_API_KEY;
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
  // Try Edge Function first
  try {
    const result = await callEdgeFunction<{ content: string }>("ai-content", {
      action: "generate",
      ...params,
    });
    return result.content;
  } catch {
    // Fallback to direct call
  }

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
  // Try Edge Function first
  try {
    const result = await callEdgeFunction<{ content: string }>("ai-content", {
      action: "refine",
      content,
      instruction,
    });
    return result.content;
  } catch {
    // Fallback to direct call
  }

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
  // Try Edge Function first
  try {
    const result = await callEdgeFunction<EmailDraft>("ai-email", params);
    return { subject: result.subject || "", body: result.body || "" };
  } catch {
    // Fallback to direct call
  }

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
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return { subject: parsed.subject || "", body: parsed.body || "" };
  } catch {
    return {
      subject: `${params.emailType} - ${params.clientCompany}`,
      body: raw,
    };
  }
}

// ============================================
// REPORT INSIGHTS (Edge Function with fallback)
// ============================================

export async function generateInsights(context: string, market?: string): Promise<string> {
  // Try Edge Function first — aggregates data server-side
  try {
    const result = await callEdgeFunction<{ insights: string }>("ai-insights", {
      market: market || "all",
    });
    return result.insights;
  } catch {
    // Fallback to direct call with provided context
  }

  const systemPrompt = `You are an analytics advisor for OnnifyWorks, a digital marketing agency operating in Singapore, Indonesia, and the US. Provide actionable insights in a concise format. Use bullet points. Be specific with numbers. Focus on what needs attention and what's going well. Keep it under 200 words.`;

  return callAI({ systemPrompt, userPrompt: context, maxTokens: 1024 });
}

// ============================================
// CLIENT HEALTH (AI NARRATIVE)
// ============================================

export interface HealthNarrativeResult {
  clientId: string;
  score: number;
  factors: {
    deliveryRate: number;
    onTimeScore: number;
    paymentScore: number;
    engagementScore: number;
  };
  narrative: string;
  calculatedAt: string;
}

export async function getClientHealthNarrative(clientId: string): Promise<HealthNarrativeResult> {
  return callEdgeFunction<HealthNarrativeResult>("client-health", { clientId });
}
