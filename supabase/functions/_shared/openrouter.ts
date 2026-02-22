const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterOptions {
  messages: Message[];
  model?: string;
  maxTokens?: number;
}

export async function callOpenRouter({
  messages,
  model = DEFAULT_MODEL,
  maxTokens = 2048,
}: OpenRouterOptions): Promise<string> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not set in Supabase secrets");
  }

  const res = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://onnifyworks.com",
      "X-Title": "OnnifyWorks CRM",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${error}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}
