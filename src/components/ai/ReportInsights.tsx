import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Client, Deliverable, Invoice, Task } from "@/types";
import { useMutation } from "@tanstack/react-query";

interface ReportInsightsProps {
  clients: Client[];
  deliverables: Deliverable[];
  invoices: Invoice[];
  tasks: Task[];
}

async function generateInsights(context: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY ||
    "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";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "OnnifyWorks CRM",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are an analytics advisor for OnnifyWorks, a digital marketing agency operating in Singapore, Indonesia, and the US. Provide actionable insights in a concise format. Use bullet points. Be specific with numbers. Focus on what needs attention and what's going well. Keep it under 200 words.`,
        },
        { role: "user", content: context },
      ],
    }),
  });

  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export function ReportInsights({ clients, deliverables, invoices, tasks }: ReportInsightsProps) {
  const [expanded, setExpanded] = useState(true);

  const mutation = useMutation({
    mutationFn: () => {
      const now = new Date();
      const activeClients = clients.filter((c) => c.status === "Active");
      const overdueDeliverables = deliverables.filter(
        (d) => new Date(d.dueDate) < now && d.status !== "Delivered" && d.status !== "Approved"
      );
      const completedDeliverables = deliverables.filter(
        (d) => d.status === "Delivered" || d.status === "Approved"
      );
      const paidInvoices = invoices.filter((i) => i.status === "Paid");
      const overdueInvoices = invoices.filter((i) => i.status === "Overdue");
      const totalRevenue = paidInvoices.reduce((s, i) => s + i.amount, 0);
      const overdueRevenue = overdueInvoices.reduce((s, i) => s + i.amount, 0);
      const completedTasks = tasks.filter((t) => t.status === "Done");
      const blockedTasks = tasks.filter((t) => t.status === "Blocked");

      const context = `Analyze this agency's performance:
- ${activeClients.length} active clients across SG (${activeClients.filter((c) => c.market === "SG").length}), ID (${activeClients.filter((c) => c.market === "ID").length}), US (${activeClients.filter((c) => c.market === "US").length})
- Total MRR from active clients: $${activeClients.reduce((s, c) => s + c.monthlyValue, 0).toLocaleString()}
- ${deliverables.length} total deliverables: ${completedDeliverables.length} completed, ${overdueDeliverables.length} overdue
- Delivery rate: ${deliverables.length > 0 ? Math.round((completedDeliverables.length / deliverables.length) * 100) : 0}%
- ${invoices.length} invoices: ${paidInvoices.length} paid ($${totalRevenue.toLocaleString()}), ${overdueInvoices.length} overdue ($${overdueRevenue.toLocaleString()})
- ${tasks.length} tasks: ${completedTasks.length} done, ${blockedTasks.length} blocked
- Clients with most overdue: ${overdueDeliverables.slice(0, 3).map((d) => d.clientName).filter(Boolean).join(", ") || "none"}
- Prospects: ${clients.filter((c) => c.status === "Prospect").length}, Onboarding: ${clients.filter((c) => c.status === "Onboarding").length}, Churned: ${clients.filter((c) => c.status === "Churned").length}

Provide: 1) Key strengths, 2) Areas needing attention, 3) Specific actions to take this week.`;

      return generateInsights(context);
    },
  });

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> AI Performance Insights
        </CardTitle>
        <div className="flex gap-1">
          {mutation.data && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => mutation.mutate()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {mutation.data ? (
            <div className="prose prose-sm max-w-none text-sm">
              {mutation.data.split("\n").map((line, i) => (
                <p key={i} className={`${line.startsWith("-") || line.startsWith("*") ? "pl-2" : ""} ${line.startsWith("#") ? "font-semibold text-foreground" : "text-muted-foreground"} mb-1`}>
                  {line.replace(/^#+\s*/, "").replace(/^\*\*(.+)\*\*$/, "$1")}
                </p>
              ))}
            </div>
          ) : mutation.isPending ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Analyzing your data...</span>
            </div>
          ) : mutation.isError ? (
            <div className="text-center py-6">
              <p className="text-sm text-destructive mb-2">{mutation.error?.message}</p>
              <Button variant="outline" size="sm" onClick={() => mutation.mutate()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                Get AI-powered analysis of your agency's performance, trends, and actionable recommendations.
              </p>
              <Button onClick={() => mutation.mutate()} size="sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate Insights
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
