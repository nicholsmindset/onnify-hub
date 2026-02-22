import { useState } from "react";
import { useAIEmail } from "@/hooks/use-ai";
import { isAIConfigured } from "@/lib/ai";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientContext: {
    companyName: string;
    primaryContact: string;
    industry: string;
    market: string;
    planTier: string;
    monthlyValue: number;
  };
  deliverables?: { name: string; status: string; serviceType: string }[];
  invoices?: { invoiceId: string; status: string; amount: number; currency: string }[];
}

const EMAIL_TYPES = [
  { value: "project_update", label: "Project Update" },
  { value: "invoice_reminder", label: "Invoice/Payment Reminder" },
  { value: "deliverable_delivery", label: "Deliverable Delivery" },
  { value: "proposal_followup", label: "Proposal Follow-up" },
  { value: "contract_renewal", label: "Contract Renewal" },
  { value: "onboarding_welcome", label: "Onboarding Welcome" },
  { value: "check_in", label: "Check-in / Catch-up" },
  { value: "custom", label: "Custom Email" },
];

export function EmailComposer({
  open,
  onOpenChange,
  clientContext,
  deliverables,
  invoices,
}: EmailComposerProps) {
  const [emailType, setEmailType] = useState("project_update");
  const [additionalContext, setAdditionalContext] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  const mutation = useAIEmail();
  const configured = isAIConfigured();

  const handleGenerate = () => {
    const typeLabel = EMAIL_TYPES.find((t) => t.value === emailType)?.label || emailType;
    mutation.mutate(
      {
        emailType: typeLabel,
        clientContext,
        additionalContext: additionalContext || undefined,
        deliverables,
        invoices,
      },
      {
        onSuccess: (data) => {
          setSubject(data.subject);
          setBody(data.body);
        },
      }
    );
  };

  const handleCopyAll = () => {
    const full = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailto = () => {
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            AI Email Composer — {clientContext.companyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {!configured && (
            <div className="rounded-lg border border-warning/50 bg-warning/5 p-3">
              <p className="text-sm text-warning font-medium">API Key Required</p>
              <p className="text-xs text-muted-foreground mt-1">
                Set <code className="bg-muted px-1 rounded">VITE_OPENROUTER_API_KEY</code> in <code className="bg-muted px-1 rounded">.env.local</code> to enable AI features.
              </p>
            </div>
          )}

          {/* Email Type */}
          <div className="space-y-2">
            <Label>Email Type</Label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Context */}
          <div className="space-y-2">
            <Label>Additional Context (optional)</Label>
            <Textarea
              placeholder="e.g. We just completed the new website redesign and want to share results..."
              rows={2}
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={mutation.isPending || !configured}
            className="w-full"
          >
            {mutation.isPending ? (
              "Drafting..."
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Email Draft
              </>
            )}
          </Button>

          {/* Loading */}
          {mutation.isPending && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {/* Result */}
          {subject && !mutation.isPending && (
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Body</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleOpenMailto} className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Open in Email Client
                </Button>
                <Button variant="outline" onClick={handleCopyAll}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-2">Copy</span>
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={handleGenerate}
              >
                <Sparkles className="h-3 w-3 mr-1" /> Regenerate
              </Button>
            </div>
          )}

          {/* Context Info */}
          <div className="text-xs text-muted-foreground space-y-0.5 border-t pt-3">
            <p>To: {clientContext.primaryContact} at {clientContext.companyName}</p>
            <p>Market: {clientContext.market} · Plan: {clientContext.planTier} · Industry: {clientContext.industry}</p>
            {deliverables && deliverables.length > 0 && (
              <p>{deliverables.length} deliverable(s) included as context</p>
            )}
            {invoices && invoices.length > 0 && (
              <p>{invoices.length} invoice(s) included as context</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
