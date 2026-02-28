import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Users, FileCheck, Receipt, ListTodo, Loader2 } from "lucide-react";
import { useGlobalSearch, SearchResult } from "@/hooks/use-global-search";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons = {
  client: Users,
  deliverable: FileCheck,
  invoice: Receipt,
  task: ListTodo,
};

const typeLabels = {
  client: "Clients",
  deliverable: "Deliverables",
  invoice: "Invoices",
  task: "Tasks",
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { data: results = [], isLoading } = useGlobalSearch(query);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      navigate(result.path);
      onOpenChange(false);
    },
    [navigate, onOpenChange]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  }

  // Group by type
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  let flatIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden" aria-describedby={undefined}>
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            placeholder="Search clients, deliverables, invoices, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-sm"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Type to search across your workspace</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Clients · Deliverables · Invoices · Tasks</p>
            </div>
          )}

          {query.length >= 2 && !isLoading && results.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {(["client", "deliverable", "invoice", "task"] as const).map((type) => {
            const items = grouped[type];
            if (!items || items.length === 0) return null;
            const Icon = typeIcons[type];
            return (
              <div key={type}>
                <div className="px-3 py-1.5 flex items-center gap-2">
                  <Icon className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {typeLabels[type]}
                  </span>
                </div>
                {items.map((result) => {
                  const idx = flatIndex++;
                  return (
                    <button
                      key={result.id}
                      className={cn(
                        "w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors",
                        idx === selectedIndex ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleSelect(result)}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="border-t px-4 py-2 flex items-center gap-3 text-[10px] text-muted-foreground/60">
          <span><kbd className="font-mono bg-muted px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-muted px-1 rounded">↵</kbd> open</span>
          <span><kbd className="font-mono bg-muted px-1 rounded">Esc</kbd> close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
