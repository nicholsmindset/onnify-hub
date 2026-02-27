import { useState, useEffect } from "react";
import { useClientOnboarding, useUpsertOnboarding } from "@/hooks/use-onboarding";
import { Competitor } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Plus, Trash2, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const TOTAL_STEPS = 6;
const stepLabels = ["Welcome", "Your Business", "Brand Identity", "Competitors", "Goals", "Done!"];

interface WizardState {
  industry: string;
  websiteUrl: string;
  businessDescription: string;
  targetAudience: string;
  primaryColor: string;
  secondaryColor: string;
  fontPreferences: string;
  brandVoice: string;
  brandDos: string;
  brandDonts: string;
  competitors: Competitor[];
  goals: string;
  priority1: string;
  priority2: string;
  priority3: string;
  communicationStyle: string;
  additionalNotes: string;
}

function stateFromOnboarding(existing: Parameters<typeof useClientOnboarding>[0] extends string | undefined ? ReturnType<typeof useClientOnboarding>["data"] : never): WizardState {
  return {
    industry: existing?.industry ?? "",
    websiteUrl: existing?.websiteUrl ?? "",
    businessDescription: existing?.businessDescription ?? "",
    targetAudience: existing?.targetAudience ?? "",
    primaryColor: existing?.primaryColor ?? "#3b82f6",
    secondaryColor: existing?.secondaryColor ?? "#ffffff",
    fontPreferences: existing?.fontPreferences ?? "",
    brandVoice: existing?.brandVoice ?? "",
    brandDos: existing?.brandDos ?? "",
    brandDonts: existing?.brandDonts ?? "",
    competitors: existing?.competitors ?? [],
    goals: existing?.goals ?? "",
    priority1: existing?.priority1 ?? "",
    priority2: existing?.priority2 ?? "",
    priority3: existing?.priority3 ?? "",
    communicationStyle: existing?.communicationStyle ?? "",
    additionalNotes: existing?.additionalNotes ?? "",
  };
}

export function OnboardingWizard({
  portalAccessId,
  contactName,
  onComplete,
}: {
  portalAccessId: string;
  contactName: string;
  onComplete: () => void;
}) {
  const { data: existing } = useClientOnboarding(portalAccessId);
  const upsert = useUpsertOnboarding();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardState>(() => stateFromOnboarding(undefined));

  // Sync form + step from existing data once loaded
  useEffect(() => {
    if (existing) {
      setForm(stateFromOnboarding(existing));
      // Resume from saved step (but cap at step 5 so they re-confirm submission)
      if (existing.currentStep > 1 && existing.currentStep <= 5) {
        setStep(existing.currentStep);
      }
    }
  }, [existing]);

  const update = (key: keyof WizardState, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const saveAndAdvance = async (nextStep: number, completedAt?: string) => {
    try {
      await upsert.mutateAsync({
        portalAccessId,
        currentStep: nextStep,
        completedAt,
        ...form,
      });
      setStep(nextStep);
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  const handleNext = () => {
    if (step === 5) {
      saveAndAdvance(6, new Date().toISOString());
    } else if (step < 5) {
      saveAndAdvance(step + 1);
    }
  };

  const addCompetitor = () => {
    if (form.competitors.length >= 5) return;
    update("competitors", [...form.competitors, { name: "", url: "", notes: "" }]);
  };

  const updateCompetitor = (idx: number, field: keyof Competitor, value: string) => {
    update(
      "competitors",
      form.competitors.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  };

  const removeCompetitor = (idx: number) =>
    update("competitors", form.competitors.filter((_, i) => i !== idx));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with progress */}
      <div className="border-b bg-card px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">O</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-sm">ONNIFY WORKS</h1>
              <p className="text-xs text-muted-foreground">Client Onboarding</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}</span>
              <span>{Math.round(progressPct)}% complete</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-6 pb-12">
        <div className="w-full max-w-2xl space-y-8">

          {/* ── Step 1: Welcome ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold">Welcome, {contactName}! 👋</h2>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  We're thrilled to have you on board. To hit the ground running, we'd love to learn everything about your brand — so we can create work you're truly proud of.
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  { icon: "🏢", title: "About Your Business", desc: "Industry, website, and what you do" },
                  { icon: "🎨", title: "Brand Identity", desc: "Colors, fonts, brand voice, do's and don'ts" },
                  { icon: "🏆", title: "Competitors", desc: "Who else is in your space?" },
                  { icon: "🎯", title: "Goals & Expectations", desc: "What success looks like for you" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                    <span className="text-2xl leading-none mt-0.5">{item.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border">
                ✅ Takes about 5–10 minutes &nbsp;·&nbsp; ✅ Your progress saves automatically &nbsp;·&nbsp; ✅ You can return anytime
              </p>
            </div>
          )}

          {/* ── Step 2: About Your Business ────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold">About Your Business</h2>
                <p className="text-muted-foreground text-sm mt-1">Help us understand what you do and who you serve.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Input
                    placeholder="e.g. Real Estate, SaaS, F&B, Insurance"
                    value={form.industry}
                    onChange={(e) => update("industry", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Website URL</Label>
                  <Input
                    placeholder="https://yourcompany.com"
                    value={form.websiteUrl}
                    onChange={(e) => update("websiteUrl", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>What does your business do?</Label>
                  <Textarea
                    placeholder="Briefly describe your products or services and what makes you unique..."
                    rows={3}
                    value={form.businessDescription}
                    onChange={(e) => update("businessDescription", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Target Audience</Label>
                  <Textarea
                    placeholder="Who are your ideal customers? (demographics, job titles, industries, pain points...)"
                    rows={2}
                    value={form.targetAudience}
                    onChange={(e) => update("targetAudience", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Brand Identity ─────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold">Brand Identity</h2>
                <p className="text-muted-foreground text-sm mt-1">Your brand's visual and verbal personality.</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.primaryColor}
                        onChange={(e) => update("primaryColor", e.target.value)}
                        className="h-9 w-12 rounded border cursor-pointer p-0.5"
                      />
                      <Input
                        value={form.primaryColor}
                        onChange={(e) => update("primaryColor", e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.secondaryColor}
                        onChange={(e) => update("secondaryColor", e.target.value)}
                        className="h-9 w-12 rounded border cursor-pointer p-0.5"
                      />
                      <Input
                        value={form.secondaryColor}
                        onChange={(e) => update("secondaryColor", e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Font Preferences</Label>
                  <Input
                    placeholder="e.g. Modern sans-serif, classic serif, prefer Google Fonts"
                    value={form.fontPreferences}
                    onChange={(e) => update("fontPreferences", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Brand Voice</Label>
                  <Select value={form.brandVoice} onValueChange={(v) => update("brandVoice", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your brand's tone..." />
                    </SelectTrigger>
                    <SelectContent>
                      {["Professional", "Casual & Approachable", "Bold & Confident", "Playful & Fun", "Authoritative", "Warm & Friendly"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Brand Do's ✅</Label>
                    <Textarea
                      placeholder="Things we should always include or emphasize..."
                      rows={3}
                      value={form.brandDos}
                      onChange={(e) => update("brandDos", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Brand Don'ts ❌</Label>
                    <Textarea
                      placeholder="Things we should avoid at all times..."
                      rows={3}
                      value={form.brandDonts}
                      onChange={(e) => update("brandDonts", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Competitors ────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold">Competitors</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  List up to 5 competitors so we can position you strategically. This step is optional.
                </p>
              </div>
              <div className="space-y-3">
                {form.competitors.map((comp, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Competitor {idx + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeCompetitor(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Name</Label>
                          <Input
                            placeholder="Competitor name"
                            className="text-sm"
                            value={comp.name}
                            onChange={(e) => updateCompetitor(idx, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Website</Label>
                          <Input
                            placeholder="https://"
                            className="text-sm"
                            value={comp.url}
                            onChange={(e) => updateCompetitor(idx, "url", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Notes (what do you like or dislike?)</Label>
                        <Textarea
                          placeholder="e.g. Great branding, but their pricing is unclear..."
                          rows={2}
                          className="text-sm"
                          value={comp.notes}
                          onChange={(e) => updateCompetitor(idx, "notes", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {form.competitors.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No competitors added yet. You can skip this step if you'd like.
                  </p>
                )}
                {form.competitors.length < 5 && (
                  <Button variant="outline" className="w-full gap-2" onClick={addCompetitor}>
                    <Plus className="h-4 w-4" /> Add Competitor
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 5: Goals ─────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold">Goals & Expectations</h2>
                <p className="text-muted-foreground text-sm mt-1">What does success look like for you?</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Main Goals</Label>
                  <Textarea
                    placeholder="What do you want to achieve with ONNIFY WORKS? (brand awareness, lead generation, sales growth, etc.)"
                    rows={3}
                    value={form.goals}
                    onChange={(e) => update("goals", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Top 3 Priorities</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Priority #1 — most important"
                      value={form.priority1}
                      onChange={(e) => update("priority1", e.target.value)}
                    />
                    <Input
                      placeholder="Priority #2"
                      value={form.priority2}
                      onChange={(e) => update("priority2", e.target.value)}
                    />
                    <Input
                      placeholder="Priority #3"
                      value={form.priority3}
                      onChange={(e) => update("priority3", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred Communication Style</Label>
                  <Select value={form.communicationStyle} onValueChange={(v) => update("communicationStyle", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How do you prefer to receive updates?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Detailed updates">Detailed updates — I like to know everything</SelectItem>
                      <SelectItem value="High-level summaries">High-level summaries — just the key highlights</SelectItem>
                      <SelectItem value="Only when action needed">Only when action is needed from me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Anything else we should know?</Label>
                  <Textarea
                    placeholder="Any concerns, preferences, deadlines, or context that would help us serve you better..."
                    rows={3}
                    value={form.additionalNotes}
                    onChange={(e) => update("additionalNotes", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6: Done! ─────────────────────────────── */}
          {step === 6 && (
            <div className="text-center space-y-6 py-10">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">You're all set, {contactName}!</h2>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                  Thank you for completing your onboarding brief. Your team has been notified and will review your information right away.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2.5 rounded-lg border">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Your portal is ready — let's get to work!
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className={`flex mt-6 ${step > 1 && step < 6 ? "justify-between" : "justify-end"}`}>
            {step > 1 && step < 6 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step === 6 ? (
              <Button onClick={onComplete} size="lg" className="px-10">
                Open My Portal
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={upsert.isPending} className="gap-1">
                {upsert.isPending ? "Saving..." : step === 5 ? "Submit Brief" : "Next"}
                {!upsert.isPending && step < 5 && <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
