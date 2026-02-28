import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface SearchResult {
  id: string;
  type: "client" | "deliverable" | "invoice" | "task";
  title: string;
  subtitle: string;
  path: string;
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["global_search", query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query || query.length < 2) return [];
      const q = `%${query}%`;

      const [clients, deliverables, invoices, tasks] = await Promise.all([
        supabase
          .from("clients")
          .select("id, company_name, market, status")
          .ilike("company_name", q)
          .limit(5),
        supabase
          .from("deliverables")
          .select("id, name, client_id, status")
          .ilike("name", q)
          .limit(5),
        supabase
          .from("invoices")
          .select("id, invoice_code, client_id, status, amount, currency")
          .ilike("invoice_code", q)
          .limit(5),
        supabase
          .from("tasks")
          .select("id, name, assigned_to, status")
          .ilike("name", q)
          .limit(5),
      ]);

      const results: SearchResult[] = [];

      (clients.data || []).forEach((c) => {
        results.push({
          id: c.id,
          type: "client",
          title: c.company_name,
          subtitle: `${c.market} · ${c.status}`,
          path: `/clients/${c.id}`,
        });
      });

      (deliverables.data || []).forEach((d) => {
        results.push({
          id: d.id,
          type: "deliverable",
          title: d.name,
          subtitle: d.status,
          path: `/deliverables`,
        });
      });

      (invoices.data || []).forEach((i) => {
        results.push({
          id: i.id,
          type: "invoice",
          title: i.invoice_code || "Invoice",
          subtitle: `${i.currency} ${Number(i.amount).toLocaleString()} · ${i.status}`,
          path: `/invoices`,
        });
      });

      (tasks.data || []).forEach((t) => {
        results.push({
          id: t.id,
          type: "task",
          title: t.name,
          subtitle: `${t.assigned_to} · ${t.status}`,
          path: `/tasks`,
        });
      });

      return results;
    },
    enabled: query.length >= 2,
    staleTime: 5000,
  });
}
