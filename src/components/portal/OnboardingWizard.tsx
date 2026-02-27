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
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Plus, Trash2, CheckCircle2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

const TOTAL_STEPS = 6;
const stepLabels = ["Welcome", "Your Business", "Brand Identity", "Competitors", "Goals", "Done!"];

// ── Reusable chip components ─────────────────────────────────────────────────

/** Multi-select pill buttons — selected pills are filled primary */
function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted text-foreground"
            )}
          >
            {active && <Check className="h-3 w-3" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/** Suggestion chips that append text to a string value */
function SuggestionChips({
  label,
  suggestions,
  value,
  onChange,
}: {
  label: string;
  suggestions: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const append = (s: string) => {
    const trimmed = value.trim();
    onChange(trimmed ? `${trimmed}\n${s}` : s);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => append(s)}
            className="px-2.5 py-1 rounded-full text-xs border border-dashed border-border hover:bg-muted hover:border-solid transition-colors text-muted-foreground hover:text-foreground"
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "Real Estate", "SaaS / Software", "Finance & Insurance",
  "Healthcare & Wellness", "Retail & E-commerce", "Restaurants & F&B",
  "Fitness & Sports", "Education & Training", "Construction & Trades",
  "Marketing & Advertising", "Legal Services", "Consulting",
  "Media & Entertainment", "Manufacturing", "Non-Profit", "Other",
];

const AUDIENCE_CHIPS = [
  "B2B (other businesses)", "B2C (consumers)", "Small Businesses",
  "Mid-Market", "Enterprise", "Millennials (25–40)", "Gen Z (18–24)",
  "Professionals", "Local Community", "Homeowners", "Parents", "Students",
];

const FONT_STYLES = [
  "Modern sans-serif — clean & contemporary",
  "Classic serif — traditional & authoritative",
  "Rounded & friendly — approachable & warm",
  "Bold display — impactful & confident",
  "Minimalist — simple & elegant",
  "No preference — your recommendation",
];

const DOS_SUGGESTIONS = [
  "Use our logo prominently",
  "Highlight customer success stories",
  "Keep copy concise and clear",
  "Use high-quality images",
  "Emphasize our core values",
  "Show real people / faces",
  "Use consistent brand colors",
  "Focus on benefits over features",
];

const DONTS_SUGGESTIONS = [
  "Avoid generic stock photos",
  "Don't use corporate jargon",
  "Never distort or alter the logo",
  "Avoid cluttered layouts",
  "Don't use competitor names",
  "Avoid off-brand colors",
  "Don't make unverified claims",
  "Avoid overly formal language",
];

const GOAL_CHIPS = [
  "Brand Awareness", "Lead Generation", "Sales Growth",
  "Social Media Presence", "Website Traffic", "Customer Retention",
  "Launch a New Product/Service", "Establish Credibility",
  "Reach a New Market", "Content Marketing", "Email Marketing",
  "Community Building",
];

// ── Wizard state ─────────────────────────────────────────────────────────────

interface WizardState {
  industry: string;
  websiteUrl: string;
  businessDescription: string;
  targetAudience: string;        // comma-joined chip selections + custom
  primaryColor: string;
  secondaryColor: string;
  fontPreferences: string;
  brandVoice: string;
  brandDos: string;
  brandDonts: string;
  competitors: Competitor[];
  goals: string;                 // comma-joined chip selections
  priority1: string;
  priority2: string;
  priority3: string;
  communicationStyle: string;
  additionalNotes: string;
}

function stateFromOnboarding(existing: ReturnType<typeof useClientOnboarding>["data"]): WizardState {
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

// ── Main component ────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (existing) {
      setForm(stateFromOnboarding(existing));
      if (existing.currentStep > 1 && existing.currentStep <= 5) {
        setStep(existing.currentStep);
      }
    }
  }, [existing]);

  const update = (key: keyof WizardState, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Audience chips helpers (stored as comma-separated string)
  const audienceTags = form.targetAudience
    ? form.targetAudience.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const toggleAudience = (tag: string) => {
    const updated = audienceTags.includes(tag)
      ? audienceTags.filter((t) => t !== tag)
      : [...audienceTags, tag];
    update("targetAudience", updated.join(", "));
  };

  // Goal chips helpers (stored as comma-separated string)
  const goalTags = form.goals
    ? form.goals.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const toggleGoal = (tag: string) => {
    const updated = goalTags.includes(tag)
      ? goalTags.filter((t) => t !== tag)
      : [...goalTags, tag];
    update("goals", updated.join(", "));
  };

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
      {/* Header */}
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

          {/* ── Step 1: Welcome ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold">Welcome, {contactName}! 👋</h2>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  We're thrilled to have you on board. Take 5 minutes to fill this in — mostly clicks, no essay writing — so we can hit the ground running.
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  { icon: "🏢", title: "About Your Business", desc: "Pick your industry & audience" },
                  { icon: "🎨", title: "Brand Identity", desc: "Colors, style, tone" },
                  { icon: "🏆", title: "Competitors", desc: "Optional — who else is in your space" },
                  { icon: "🎯", title: "Goals", desc: "Select what matters most to you" },
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
                ✅ Mostly click-to-select &nbsp;·&nbsp; ✅ Takes about 5 minutes &nbsp;·&nbsp; ✅ Progress saves automatically
              </p>
            </div>
          )}

          {/* ── Step 2: About Your Business ──────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold">About Your Business</h2>
                <p className="text-muted-foreground text-sm mt-1">Help us understand what you do and who you serve.</p>
              </div>
              <div className="space-y-5">
                {/* Industry — Select */}
                <div className="space-y-1.5">
                  <Label>Industry <span className="text-destructive">*</span></Label>
                  <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry…" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Website URL */}
                <div className="space-y-1.5">
                  <Label>Website URL <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <Input
                    placeholder="https://yourcompany.com"
                    value={form.websiteUrl}
                    onChange={(e) => update("websiteUrl", e.target.value)}
                  />
                </div>

                {/* What does your business do — short textarea */}
                <div className="space-y-1.5">
                  <Label>What do you do? <span className="text-xs text-muted-foreground">(1–2 sentences is fine)</span></Label>
                  <Textarea
                    placeholder="e.g. We help real estate agents close more deals with professional branding and marketing content."
                    rows={2}
                    value={form.businessDescription}
                    onChange={(e) => update("businessDescription", e.target.value)}
                  />
                </div>

                {/* Target Audience — chip multi-select */}
                <div className="space-y-2">
                  <Label>Target Audience <span className="text-xs text-muted-foreground">(select all that apply)</span></Label>
                  <ChipGroup
                    options={AUDIENCE_CHIPS}
                    selected={audienceTags}
                    onToggle={toggleAudience}
                  />
                  {audienceTags.length > 0 && (
                    <p className="text-xs text-muted-foreground">Selected: {audienceTags.join(" · ")}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Brand Identity ────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold">Brand Identity</h2>
                <p className="text-muted-foreground text-sm mt-1">Your brand's visual and verbal personality.</p>
              </div>
              <div className="space-y-5">
                {/* Colors */}
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

                {/* Font Style — Select */}
                <div className="space-y-1.5">
                  <Label>Font Style Preference</Label>
                  <Select value={form.fontPreferences} onValueChange={(v) => update("fontPreferences", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a font style…" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_STYLES.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand Voice — Select */}
                <div className="space-y-1.5">
                  <Label>Brand Voice</Label>
                  <Select value={form.brandVoice} onValueChange={(v) => update("brandVoice", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your brand's tone…" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Professional", "Casual & Approachable", "Bold & Confident", "Playful & Fun", "Authoritative", "Warm & Friendly"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand Dos — suggestion chips + textarea */}
                <div className="space-y-2">
                  <Label>Brand Do's ✅ <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <SuggestionChips
                    label="Quick add:"
                    suggestions={DOS_SUGGESTIONS}
                    value={form.brandDos}
                    onChange={(v) => update("brandDos", v)}
                  />
                  {form.brandDos && (
                    <Textarea
                      rows={2}
                      value={form.brandDos}
                      onChange={(e) => update("brandDos", e.target.value)}
                      placeholder="Things we should always include or emphasize…"
                      className="text-sm"
                    />
                  )}
                  {!form.brandDos && (
                    <p className="text-xs text-muted-foreground italic">Click suggestions above or skip this field.</p>
                  )}
                </div>

                {/* Brand Don'ts — suggestion chips + textarea */}
                <div className="space-y-2">
                  <Label>Brand Don'ts ❌ <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <SuggestionChips
                    label="Quick add:"
                    suggestions={DONTS_SUGGESTIONS}
                    value={form.brandDonts}
                    onChange={(v) => update("brandDonts", v)}
                  />
                  {form.brandDonts && (
                    <Textarea
                      rows={2}
                      value={form.brandDonts}
                      onChange={(e) => update("brandDonts", e.target.value)}
                      placeholder="Things we should avoid at all times…"
                      className="text-sm"
                    />
                  )}
                  {!form.brandDonts && (
                    <p className="text-xs text-muted-foreground italic">Click suggestions above or skip this field.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Competitors ───────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold">Competitors</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  List up to 5 competitors so we can position you strategically.{" "}
                  <span className="font-medium">This step is optional — feel free to skip.</span>
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
                          <Label className="text-xs">Website <span className="text-muted-foreground">(optional)</span></Label>
                          <Input
                            placeholder="https://"
                            className="text-sm"
                            value={comp.url}
                            onChange={(e) => updateCompetitor(idx, "url", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">What do you like or dislike about them? <span className="text-muted-foreground">(optional)</span></Label>
                        <Input
                          placeholder="e.g. Great branding, but pricing is unclear"
                          className="text-sm"
                          value={comp.notes}
                          onChange={(e) => updateCompetitor(idx, "notes", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {form.competitors.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-6 border-2 border-dashed rounded-lg">
                    No competitors added. You can skip this step.
                  </div>
                )}
                {form.competitors.length < 5 && (
                  <Button variant="outline" className="w-full gap-2" onClick={addCompetitor}>
                    <Plus className="h-4 w-4" /> Add Competitor
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 5: Goals ─────────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold">Goals & Expectations</h2>
                <p className="text-muted-foreground text-sm mt-1">What does success look like for you?</p>
              </div>
              <div className="space-y-5">
                {/* Goals — chip multi-select */}
                <div className="space-y-2">
                  <Label>What are your main goals? <span className="text-xs text-muted-foreground">(select all that apply)</span></Label>
                  <ChipGroup
                    options={GOAL_CHIPS}
                    selected={goalTags}
                    onToggle={toggleGoal}
                  />
                  {goalTags.length > 0 && (
                    <p className="text-xs text-muted-foreground">Selected: {goalTags.join(" · ")}</p>
                  )}
                </div>

                {/* Top 3 priorities */}
                <div className="space-y-2">
                  <Label>Top 3 Priorities <span className="text-xs text-muted-foreground">(optional — most important first)</span></Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="#1 — e.g. More Instagram followers"
                      value={form.priority1}
                      onChange={(e) => update("priority1", e.target.value)}
                    />
                    <Input
                      placeholder="#2 — e.g. Launch email newsletter"
                      value={form.priority2}
                      onChange={(e) => update("priority2", e.target.value)}
                    />
                    <Input
                      placeholder="#3 — e.g. Refresh our website copy"
                      value={form.priority3}
                      onChange={(e) => update("priority3", e.target.value)}
                    />
                  </div>
                </div>

                {/* Communication style */}
                <div className="space-y-1.5">
                  <Label>Preferred Update Style</Label>
                  <Select value={form.communicationStyle} onValueChange={(v) => update("communicationStyle", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How do you prefer to receive updates?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Detailed updates">Detailed updates — I like to know everything</SelectItem>
                      <SelectItem value="High-level summaries">High-level summaries — just the key highlights</SelectItem>
                      <SelectItem value="Only when action needed">Only ping me when you need something from me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Anything else — small optional field */}
                <div className="space-y-1.5">
                  <Label>Anything else we should know? <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <Textarea
                    placeholder="Any deadlines, preferences, or context that would help us serve you better…"
                    rows={2}
                    value={form.additionalNotes}
                    onChange={(e) => update("additionalNotes", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6: Done! ──────────────────────────────────────────── */}
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
                  Thank you for completing your brief. Your team has been notified and will review your information right away.
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

          {/* Navigation */}
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
                {upsert.isPending ? "Saving…" : step === 5 ? "Submit Brief" : step === 4 ? "Next →" : "Next"}
                {!upsert.isPending && step < 5 && <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
