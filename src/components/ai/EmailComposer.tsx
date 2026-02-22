import { useState } from "react";
import { useAIEmail } from "@/hooks/use-ai";
import { EmailDraftParams, EmailDraft } from "@/lib/ai";
import { Client } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Copy, Check, Mail } from "lucide-react";

const EMAIL_TYPES = [
  "Project Update",
  "Invoice Reminder",
  "Deliverable Delivery",
  "Monthly Report",
  "Onboarding Welcome",
  "Upsell Proposal",
  "Contract Renewal",
  "General Follow-up",
] as const;

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

export function EmailComposer({ open, onOpenChange, client }: EmailComposerProps) {
  const [emailType, setEmailType] = useState<string>("Project Update");
  const [customContext, setCustomContext] = useState("");
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [copied, setCopied] = useState(false);

  const emailMutation = useAIEmail();

  const handleGenerate = () => {
    const params: EmailDraftParams = {
      emailType,
      clientName: client.primaryContact,
      clientCompany: client.companyName,
      contactName: client.primaryContact,
      clientIndustry: client.industry,
      planTier: client.planTier,
      monthlyValue: client.monthlyValue,
      customContext: customContext || undefined,
    };

    emailMutation.mutate(params, {
      onSuccess: (data) => setDraft(data),
    });
  };

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInEmail = () => {
    if (!draft) return;
    const mailto = `mailto:?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
    window.open(mailto, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Email Composer — {client.companyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Email type */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email Type</label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom context */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Additional Context (optional)</label>
            <Textarea
              placeholder="e.g., We just completed their SEO audit, mention the 35% traffic increase..."
              rows={2}
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={emailMutation.isPending}
          >
            {emailMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Drafting Email...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Email</>
            )}
          </Button>

          {/* Draft display */}
          {draft && (
            <div className="space-y-3 pt-2 border-t">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Subject</label>
                <Input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Body</label>
                <Textarea
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleOpenInEmail}>
                  <Mail className="h-4 w-4 mr-2" /> Open in Email Client
                </Button>
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {emailMutation.isError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{emailMutation.error?.message}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
