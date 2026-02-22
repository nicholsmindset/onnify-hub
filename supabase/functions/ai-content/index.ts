import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { callOpenRouter } from "../_shared/openrouter.ts";

interface ContentRequest {
  action: "generate" | "refine";
  contentType?: string;
  title?: string;
  platform?: string;
  tone?: string;
  clientName?: string;
  clientIndustry?: string;
  clientMarket?: string;
  customPrompt?: string;
  content?: string;
  instruction?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: ContentRequest = await req.json();

    if (body.action === "refine") {
      if (!body.content || !body.instruction) {
        return new Response(
          JSON.stringify({ error: "content and instruction required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await callOpenRouter({
        messages: [
          {
            role: "system",
            content: `You are an expert content editor for a digital marketing agency. Improve the given content based on the user's instruction. Output ONLY the improved content — no commentary.`,
          },
          {
            role: "user",
            content: `Here is the existing content:\n\n${body.content}\n\nInstruction: ${body.instruction}`,
          },
        ],
      });

      return new Response(
        JSON.stringify({ content: result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate
    const systemPrompt = `You are an expert content writer for a digital marketing agency called OnnifyWorks.
You specialize in creating high-quality content for clients across Singapore, Indonesia, and the US.
Write in a ${body.tone || "professional"} tone. Be concise, engaging, and action-oriented.
Output ONLY the content itself — no meta-commentary, no "Here's the content:", just the actual content ready to publish.`;

    let userPrompt = `Write a ${body.contentType || "content piece"}`;
    if (body.title) userPrompt += ` titled "${body.title}"`;
    if (body.platform) userPrompt += ` for ${body.platform}`;
    if (body.clientName) userPrompt += ` for client ${body.clientName}`;
    if (body.clientIndustry) userPrompt += ` in the ${body.clientIndustry} industry`;
    if (body.clientMarket) userPrompt += ` targeting the ${body.clientMarket} market`;
    if (body.customPrompt) userPrompt += `\n\nAdditional instructions: ${body.customPrompt}`;

    const result = await callOpenRouter({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    return new Response(
      JSON.stringify({ content: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
