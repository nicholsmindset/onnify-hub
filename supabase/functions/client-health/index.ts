import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { corsHeaders } from "../_shared/cors.ts";
import { callOpenRouter } from "../_shared/openrouter.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch client data
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (!client) {
      return new Response(
        JSON.stringify({ error: "Client not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch related data
    const [delivResult, invResult, taskResult] = await Promise.all([
      supabase.from("deliverables").select("*").eq("client_id", clientId),
      supabase.from("invoices").select("*").eq("client_id", clientId),
      supabase.from("tasks").select("*").eq("client_id", clientId),
    ]);

    const deliverables = delivResult.data || [];
    const invoices = invResult.data || [];
    const tasks = taskResult.data || [];

    const now = new Date();

    // Calculate factors
    const totalDeliverables = deliverables.length;
    const completed = deliverables.filter(
      (d: any) => d.status === "Delivered" || d.status === "Approved"
    ).length;
    const deliveryRate = totalDeliverables > 0 ? (completed / totalDeliverables) * 100 : 100;

    const overdueDelivs = deliverables.filter(
      (d: any) => new Date(d.due_date) < now && d.status !== "Delivered" && d.status !== "Approved"
    ).length;
    const overdueTasks = tasks.filter(
      (t: any) => new Date(t.due_date) < now && t.status !== "Done"
    ).length;
    const overdueCount = overdueDelivs + overdueTasks;
    const onTimeScore = Math.max(0, 100 - overdueCount * 25);

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((i: any) => i.status === "Paid").length;
    const overdueInvoices = invoices.filter((i: any) => i.status === "Overdue").length;
    let paymentScore = totalInvoices > 0
      ? ((paidInvoices / totalInvoices) * 100) - (overdueInvoices * 20)
      : 100;
    paymentScore = Math.max(0, Math.min(100, paymentScore));

    const recentActivity = deliverables.filter((d: any) => {
      const updated = new Date(d.updated_at || d.created_at);
      return (now.getTime() - updated.getTime()) / 86400000 < 14;
    }).length + tasks.filter((t: any) => {
      const updated = new Date(t.updated_at || t.created_at);
      return (now.getTime() - updated.getTime()) / 86400000 < 14;
    }).length;
    const engagementScore = recentActivity > 0 ? 100 : (totalDeliverables === 0 ? 70 : 40);

    const score = Math.round(
      deliveryRate * 0.3 + onTimeScore * 0.25 + paymentScore * 0.25 + engagementScore * 0.2
    );

    // Generate AI narrative
    const narrative = await callOpenRouter({
      messages: [
        {
          role: "system",
          content: `You are a CRM health analyst for OnnifyWorks digital marketing agency.
Write a brief 2-3 sentence narrative explaining a client's health score.
Be specific about what's driving the score up or down.
Use plain language, no markdown. Be actionable.`,
        },
        {
          role: "user",
          content: `Client: ${client.company_name} (${client.market} market, ${client.plan_tier} plan, $${client.monthly_value}/mo)
Health Score: ${score}/100
- Delivery Rate: ${Math.round(deliveryRate)}% (${completed}/${totalDeliverables} completed)
- On-Time: ${onTimeScore}% (${overdueCount} overdue items)
- Payment: ${Math.round(paymentScore)}% (${paidInvoices} paid, ${overdueInvoices} overdue of ${totalInvoices} invoices)
- Engagement: ${engagementScore}% (${recentActivity} items updated in last 14 days)
Contract: ${client.contract_start || "N/A"} to ${client.contract_end || "Ongoing"}

Explain why this score is what it is and what the team should do.`,
        },
      ],
      maxTokens: 256,
    });

    const result = {
      clientId,
      score,
      factors: {
        deliveryRate: Math.round(deliveryRate),
        onTimeScore,
        paymentScore: Math.round(paymentScore),
        engagementScore,
      },
      narrative,
      calculatedAt: new Date().toISOString(),
    };

    // Cache to DB
    await supabase.from("client_health_scores").upsert(
      {
        client_id: clientId,
        score,
        delivery_rate: Math.round(deliveryRate),
        on_time_score: onTimeScore,
        payment_score: Math.round(paymentScore),
        engagement_score: engagementScore,
        narrative,
        calculated_at: result.calculatedAt,
      },
      { onConflict: "client_id" }
    );

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
