import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Change to your verified Resend domain for production
// e.g. "Onnify Works <team@onnify.com>"
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Onnify Works <onboarding@resend.dev>";

// Your app's public URL — used to build portal deep links
const APP_URL = Deno.env.get("APP_URL") ?? "https://app.onnify.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  // Identify recipient via clientId OR portalAccessId — edge fn looks up email from DB
  clientId?: string;
  portalAccessId?: string;
  subject: string;
  html: string; // Use {PORTAL_URL} and {CONTACT_NAME} as placeholders
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const payload: EmailPayload = await req.json();
    const { clientId, portalAccessId, subject, html } = payload;

    // Look up portal contact details
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let contactEmail: string | null = null;
    let contactName: string | null = null;
    let accessToken: string | null = null;

    if (clientId || portalAccessId) {
      let query = db
        .from("portal_access")
        .select("contact_email, contact_name, access_token")
        .eq("is_active", true);

      if (clientId) {
        query = query.eq("client_id", clientId);
      } else if (portalAccessId) {
        query = query.eq("id", portalAccessId);
      }

      const { data } = await query.maybeSingle();
      if (data) {
        contactEmail = data.contact_email;
        contactName = data.contact_name;
        accessToken = data.access_token;
      }
    }

    if (!contactEmail) {
      return new Response(
        JSON.stringify({ error: "Recipient email not found" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const portalUrl = accessToken
      ? `${APP_URL}/portal?token=${accessToken}`
      : `${APP_URL}/portal`;

    const finalHtml = html
      .replace(/\{PORTAL_URL\}/g, portalUrl)
      .replace(/\{CONTACT_NAME\}/g, contactName ?? "there");

    const to = contactName ? `${contactName} <${contactEmail}>` : contactEmail;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html: finalHtml }),
    });

    const result = await res.json();

    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
