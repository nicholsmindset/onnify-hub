import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { corsHeaders } from "../_shared/cors.ts";
import { callOpenRouter } from "../_shared/openrouter.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const marketFilter = body.market || "all";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all data
    const [clientsRes, delivRes, invRes, tasksRes] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("deliverables").select("*"),
      supabase.from("invoices").select("*"),
      supabase.from("tasks").select("*"),
    ]);

    let clients = clientsRes.data || [];
    let deliverables = delivRes.data || [];
    let invoices = invRes.data || [];
    let tasks = tasksRes.data || [];

    if (marketFilter !== "all") {
      clients = clients.filter((c: any) => c.market === marketFilter);
      deliverables = deliverables.filter((d: any) => d.market === marketFilter);
      invoices = invoices.filter((i: any) => i.market === marketFilter);
      tasks = tasks.filter((t: any) => t.market === marketFilter);
    }

    const now = new Date();
    const activeClients = clients.filter((c: any) => c.status === "Active");
    const completedDelivs = deliverables.filter(
      (d: any) => d.status === "Delivered" || d.status === "Approved"
    );
    const overdueDelivs = deliverables.filter(
      (d: any) => new Date(d.due_date) < now && d.status !== "Delivered" && d.status !== "Approved"
    );
    const paidInvoices = invoices.filter((i: any) => i.status === "Paid");
    const overdueInvoices = invoices.filter((i: any) => i.status === "Overdue");
    const totalRevenue = paidInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const overdueRevenue = overdueInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const completedTasks = tasks.filter((t: any) => t.status === "Done");
    const blockedTasks = tasks.filter((t: any) => t.status === "Blocked");

    const sgCount = activeClients.filter((c: any) => c.market === "SG").length;
    const idCount = activeClients.filter((c: any) => c.market === "ID").length;
    const usCount = activeClients.filter((c: any) => c.market === "US").length;
    const mrr = activeClients.reduce((s: number, c: any) => s + Number(c.monthly_value), 0);

    const context = `Analyze this agency's performance:
- ${activeClients.length} active clients across SG (${sgCount}), ID (${idCount}), US (${usCount})
- Total MRR from active clients: $${mrr.toLocaleString()}
- ${deliverables.length} total deliverables: ${completedDelivs.length} completed, ${overdueDelivs.length} overdue
- Delivery rate: ${deliverables.length > 0 ? Math.round((completedDelivs.length / deliverables.length) * 100) : 0}%
- ${invoices.length} invoices: ${paidInvoices.length} paid ($${totalRevenue.toLocaleString()}), ${overdueInvoices.length} overdue ($${overdueRevenue.toLocaleString()})
- ${tasks.length} tasks: ${completedTasks.length} done, ${blockedTasks.length} blocked
- Clients with most overdue: ${overdueDelivs.slice(0, 3).map((d: any) => d.client_name || d.client_id).filter(Boolean).join(", ") || "none"}
- Prospects: ${clients.filter((c: any) => c.status === "Prospect").length}, Onboarding: ${clients.filter((c: any) => c.status === "Onboarding").length}, Churned: ${clients.filter((c: any) => c.status === "Churned").length}

Provide: 1) Key strengths, 2) Areas needing attention, 3) Specific actions to take this week.`;

    const insights = await callOpenRouter({
      messages: [
        {
          role: "system",
          content: `You are an analytics advisor for OnnifyWorks, a digital marketing agency operating in Singapore, Indonesia, and the US. Provide actionable insights in a concise format. Use bullet points. Be specific with numbers. Focus on what needs attention and what's going well. Keep it under 200 words.`,
        },
        { role: "user", content: context },
      ],
      maxTokens: 1024,
    });

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
