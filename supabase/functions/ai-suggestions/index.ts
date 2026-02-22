import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { corsHeaders } from "../_shared/cors.ts";
import { callOpenRouter } from "../_shared/openrouter.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all data
    const [clientsRes, delivRes, invRes, tasksRes, contentRes] = await Promise.all([
      supabase.from("clients").select("*").eq("status", "Active"),
      supabase.from("deliverables_with_client").select("*"),
      supabase.from("invoices_with_client").select("*"),
      supabase.from("tasks_with_relations").select("*"),
      supabase.from("content_items").select("*"),
    ]);

    const clients = clientsRes.data || [];
    const deliverables = delivRes.data || [];
    const invoices = invRes.data || [];
    const tasks = tasksRes.data || [];
    const content = contentRes.data || [];

    const now = new Date();

    // Build context summary for AI
    const overdueDelivs = deliverables.filter(
      (d: any) => new Date(d.due_date) < now && d.status !== "Delivered" && d.status !== "Approved"
    );
    const overdueInvoices = invoices.filter((i: any) => i.status === "Overdue");
    const dueSoon = deliverables.filter((d: any) => {
      const due = new Date(d.due_date);
      const daysUntil = (due.getTime() - now.getTime()) / 86400000;
      return daysUntil > 0 && daysUntil <= 3 && d.status === "Not Started";
    });
    const stuckContent = content.filter((c: any) => {
      if (c.status !== "Ideation") return false;
      const created = new Date(c.created_at);
      return (now.getTime() - created.getTime()) / 86400000 > 7;
    });
    const blockedTasks = tasks.filter((t: any) => t.status === "Blocked");

    const context = `Current CRM state for OnnifyWorks digital marketing agency:

Active Clients: ${clients.length}
Total Deliverables: ${deliverables.length}
Overdue Deliverables: ${overdueDelivs.map((d: any) => `"${d.name}" for ${d.client_name || "unknown"} (due ${d.due_date}, status: ${d.status}, assigned: ${d.assigned_to})`).join("; ") || "none"}
Overdue Invoices: ${overdueInvoices.map((i: any) => `${i.invoice_id} for ${i.client_name || "unknown"} ($${i.amount})`).join("; ") || "none"}
Due Soon (Not Started): ${dueSoon.map((d: any) => `"${d.name}" for ${d.client_name || "unknown"} (due ${d.due_date}, assigned: ${d.assigned_to})`).join("; ") || "none"}
Stuck Content (Ideation >7d): ${stuckContent.map((c: any) => `"${c.title}" assigned to ${c.assigned_to}`).join("; ") || "none"}
Blocked Tasks: ${blockedTasks.map((t: any) => `"${t.name}" assigned to ${t.assigned_to}`).join("; ") || "none"}

Based on this data, suggest the top 3-5 most urgent actions the team should take today. For each suggestion, provide:
1. priority: "high", "medium", or "low"
2. category: "overdue", "invoice", "deadline", "deliverable", or "content"
3. title: short headline
4. description: 1 sentence explanation
5. action: button label (e.g. "Create Follow-up Task", "Send Payment Reminder")
6. suggestedTask: { name, assignedTo, category, dueDate } if a task should be created

Respond in JSON format: { "suggestions": [...] }`;

    const raw = await callOpenRouter({
      messages: [
        {
          role: "system",
          content: `You are an operations advisor for a digital marketing agency CRM. Analyze the data and provide actionable suggestions. Always respond in valid JSON. Do NOT wrap in code blocks.`,
        },
        { role: "user", content: context },
      ],
      maxTokens: 1024,
    });

    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { suggestions: [], raw };
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
