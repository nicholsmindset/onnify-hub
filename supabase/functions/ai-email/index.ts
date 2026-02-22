import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { callOpenRouter } from "../_shared/openrouter.ts";

interface EmailRequest {
  emailType: string;
  clientName: string;
  clientCompany: string;
  contactName?: string;
  clientIndustry?: string;
  planTier?: string;
  monthlyValue?: number;
  customContext?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: EmailRequest = await req.json();

    const systemPrompt = `You are a professional account manager at OnnifyWorks, a digital marketing agency.
Draft emails that are warm, professional, and action-oriented.
You MUST respond in valid JSON format with exactly two keys: "subject" and "body".
The body should be plain text (no HTML), with proper paragraph breaks using \\n\\n.
Do NOT wrap the JSON in code blocks. Output raw JSON only.`;

    let userPrompt = `Draft a "${body.emailType}" email for:
- Client: ${body.clientCompany}
- Contact: ${body.contactName || body.clientName}`;
    if (body.clientIndustry) userPrompt += `\n- Industry: ${body.clientIndustry}`;
    if (body.planTier) userPrompt += `\n- Plan: ${body.planTier}`;
    if (body.monthlyValue) userPrompt += `\n- Monthly Value: $${body.monthlyValue}`;
    if (body.customContext) userPrompt += `\n\nAdditional context: ${body.customContext}`;

    const raw = await callOpenRouter({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        subject: `${body.emailType} - ${body.clientCompany}`,
        body: raw,
      };
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
