import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOnboarding, useCreateOnboarding, useUpdateOnboarding } from "@/hooks/use-onboarding";
import { onboardingIntakeSchema, OnboardingIntakeFormValues } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";

const STEPS = [
  { key: "intake", label: "Intake Form", index: 0 },
  { key: "brand-review", label: "Brand Review", index: 1 },
  { key: "publishing", label: "Publishing Setup", index: 2 },
  { key: "first-content", label: "First Content", index: 3 },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

function getStepFromStatus(status: string): StepKey {
  switch (status) {
    case "intake_pending":
      return "intake";
    case "intake_completed":
    case "brand_review":
      return "brand-review";
    case "first_content":
      return "publishing";
    case "client_review":
    case "complete":
      return "first-content";
    default:
      return "intake";
  }
}

function getStepIndex(step: StepKey): number {
  return STEPS.findIndex((s) => s.key === step);
}

export default function ClientOnboarding() {
  const { id } = useParams<{ id: string }>();
  const { data: onboarding, isLoading } = useOnboarding(id);
  const createOnboarding = useCreateOnboarding();
  const updateOnboarding = useUpdateOnboarding();

  const initialStep = onboarding ? getStepFromStatus(onboarding.status) : "intake";
  const [activeStep, setActiveStep] = useState<StepKey>(initialStep);

  const intakeData = (onboarding?.intakeData ?? {}) as Record<string, string>;

  const form = useForm<OnboardingIntakeFormValues>({
    resolver: zodResolver(onboardingIntakeSchema),
    defaultValues: {
      companyName: intakeData.companyName ?? "",
      websiteUrl: intakeData.websiteUrl ?? "",
      industry: intakeData.industry ?? "",
      targetMarkets: intakeData.targetMarkets ?? "",
      brandVoiceDescription: intakeData.brandVoiceDescription ?? "",
      sampleContentUrls: intakeData.sampleContentUrls ?? "",
      topKeywords: intakeData.topKeywords ?? "",
      competitorUrls: intakeData.competitorUrls ?? "",
      contentGoals: intakeData.contentGoals ?? "",
      tonePreferences: (intakeData.tonePreferences as OnboardingIntakeFormValues["tonePreferences"]) ?? undefined,
      contentCadence: (intakeData.contentCadence as OnboardingIntakeFormValues["contentCadence"]) ?? undefined,
      publishingCredentials: intakeData.publishingCredentials ?? "",
      existingContentUrl: intakeData.existingContentUrl ?? "",
      primaryServices: intakeData.primaryServices ?? "",
    },
  });

  const [brandVoiceDoc, setBrandVoiceDoc] = useState(
    onboarding?.brandVoiceDoc ?? intakeData.brandVoiceDescription ?? ""
  );

  const currentStepIndex = getStepIndex(activeStep);

  const handleIntakeSubmit = (data: OnboardingIntakeFormValues) => {
    if (onboarding) {
      updateOnboarding.mutate(
        {
          id: onboarding.id,
          clientId: id,
          status: "intake_completed",
          intakeData: data as unknown as Record<string, unknown>,
          brandVoiceDoc: data.brandVoiceDescription || brandVoiceDoc,
          checklist: [
            { step: "intake", completed: true, completedAt: new Date().toISOString() },
            ...(onboarding.checklist?.filter((c) => c.step !== "intake") ?? []),
          ],
        },
        { onSuccess: () => setActiveStep("brand-review") }
      );
    } else {
      createOnboarding.mutate(
        {
          clientId: id,
          status: "intake_completed",
          intakeData: data as unknown as Record<string, unknown>,
          brandVoiceDoc: data.brandVoiceDescription || "",
          onboardingStartedAt: new Date().toISOString(),
          checklist: [
            { step: "intake", completed: true, completedAt: new Date().toISOString() },
          ],
        },
        { onSuccess: () => setActiveStep("brand-review") }
      );
    }
  };

  const handleBrandReviewSave = () => {
    if (!onboarding) return;
    updateOnboarding.mutate(
      {
        id: onboarding.id,
        clientId: id,
        status: "brand_review",
        brandVoiceDoc: brandVoiceDoc,
        checklist: [
          ...(onboarding.checklist?.filter((c) => c.step !== "brand_review") ?? []),
          { step: "brand_review", completed: true, completedAt: new Date().toISOString() },
        ],
      },
      { onSuccess: () => setActiveStep("publishing") }
    );
  };

  const handlePublishingSave = () => {
    if (!onboarding) return;
    const formValues = form.getValues();
    updateOnboarding.mutate(
      {
        id: onboarding.id,
        clientId: id,
        status: "first_content",
        intakeData: {
          ...onboarding.intakeData,
          publishingCredentials: formValues.publishingCredentials,
          contentCadence: formValues.contentCadence,
        },
        checklist: [
          ...(onboarding.checklist?.filter((c) => c.step !== "publishing") ?? []),
          { step: "publishing", completed: true, completedAt: new Date().toISOString() },
        ],
      },
      { onSuccess: () => setActiveStep("first-content") }
    );
  };

  const handleCompleteOnboarding = () => {
    if (!onboarding) return;
    updateOnboarding.mutate({
      id: onboarding.id,
      clientId: id,
      status: "complete",
      onboardingCompletedAt: new Date().toISOString(),
      checklist: [
        ...(onboarding.checklist?.filter((c) => c.step !== "complete") ?? []),
        { step: "complete", completed: true, completedAt: new Date().toISOString() },
      ],
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={`/clients/${id}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Client
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-display font-bold">Client Onboarding</h1>
        <p className="text-muted-foreground">
          Complete each step to onboard the client
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.key} className="flex items-center gap-2">
              {index > 0 && (
                <div
                  className={`h-px w-8 ${
                    isCompleted ? "bg-success" : "bg-border"
                  }`}
                />
              )}
              <div className="flex items-center gap-1.5">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                ) : (
                  <Circle
                    className={`h-5 w-5 shrink-0 ${
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                )}
                <span
                  className={`text-sm hidden md:inline ${
                    isCurrent
                      ? "font-medium text-foreground"
                      : isCompleted
                        ? "text-muted-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs for steps */}
      <Tabs value={activeStep} onValueChange={(v) => setActiveStep(v as StepKey)}>
        <TabsList>
          {STEPS.map((step) => (
            <TabsTrigger key={step.key} value={step.key}>
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Step 1: Intake Form */}
        <TabsContent value="intake" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Intake Form</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleIntakeSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Real Estate, F&B, Tech" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetMarkets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Markets</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Singapore, Indonesia, US" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="brandVoiceDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Voice Samples</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the brand voice or paste sample content..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="competitorUrls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Competitor URLs</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="One URL per line..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="topKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Top Keywords</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Comma-separated keywords..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contentGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Goals</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What are the client's content objectives?"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tonePreferences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tone Preferences</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="technical">Technical</SelectItem>
                              <SelectItem value="conversational">Conversational</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contentCadence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content Cadence</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cadence" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="primaryServices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Services</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. SEO, Content Marketing, Social Media" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sampleContentUrls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sample Content URLs</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Links to existing content..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={createOnboarding.isPending || updateOnboarding.isPending}
                  >
                    {createOnboarding.isPending || updateOnboarding.isPending
                      ? "Saving..."
                      : "Save & Continue"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Brand Review */}
        <TabsContent value="brand-review" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Brand Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Intake Summary */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Intake Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-medium">
                      {intakeData.companyName || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Industry</p>
                    <p className="text-sm font-medium">
                      {intakeData.industry || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Target Markets</p>
                    <p className="text-sm font-medium">
                      {intakeData.targetMarkets || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tone</p>
                    <p className="text-sm font-medium capitalize">
                      {intakeData.tonePreferences || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Content Cadence</p>
                    <p className="text-sm font-medium capitalize">
                      {intakeData.contentCadence || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Primary Services</p>
                    <p className="text-sm font-medium">
                      {intakeData.primaryServices || "Not provided"}
                    </p>
                  </div>
                  {intakeData.topKeywords && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground">Top Keywords</p>
                      <p className="text-sm font-medium">{intakeData.topKeywords}</p>
                    </div>
                  )}
                  {intakeData.contentGoals && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground">Content Goals</p>
                      <p className="text-sm font-medium">{intakeData.contentGoals}</p>
                    </div>
                  )}
                  {intakeData.competitorUrls && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground">Competitor URLs</p>
                      <p className="text-sm font-medium whitespace-pre-line">
                        {intakeData.competitorUrls}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable Brand Voice Document */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Brand Voice Document
                </h3>
                <Textarea
                  value={brandVoiceDoc}
                  onChange={(e) => setBrandVoiceDoc(e.target.value)}
                  placeholder="Describe the brand voice, tone, style guidelines..."
                  rows={10}
                />
              </div>

              <Button
                onClick={handleBrandReviewSave}
                disabled={updateOnboarding.isPending}
              >
                {updateOnboarding.isPending ? "Saving..." : "Approve & Continue"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Publishing Setup */}
        <TabsContent value="publishing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Publishing Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Publishing Credentials</label>
                <Textarea
                  value={form.watch("publishingCredentials") ?? ""}
                  onChange={(e) => form.setValue("publishingCredentials", e.target.value)}
                  placeholder="CMS login details, API keys, or publishing instructions..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content Cadence Confirmation</label>
                <Select
                  value={form.watch("contentCadence") ?? ""}
                  onValueChange={(v) =>
                    form.setValue(
                      "contentCadence",
                      v as OnboardingIntakeFormValues["contentCadence"]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Confirm content cadence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handlePublishingSave}
                disabled={updateOnboarding.isPending}
              >
                {updateOnboarding.isPending ? "Saving..." : "Save & Continue"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: First Content */}
        <TabsContent value="first-content" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Onboarding Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Intake Form</span>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      Completed
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Brand Voice Document</span>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      {brandVoiceDoc ? "Reviewed" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Publishing Setup</span>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      Configured
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Content Cadence</span>
                    <span className="text-sm text-muted-foreground capitalize">
                      {intakeData.contentCadence || form.watch("contentCadence") || "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tone</span>
                    <span className="text-sm text-muted-foreground capitalize">
                      {intakeData.tonePreferences || "Not set"}
                    </span>
                  </div>
                </div>

                {brandVoiceDoc && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Brand Voice Preview
                    </h3>
                    <div className="rounded-lg border p-4 text-sm whitespace-pre-line bg-muted/30">
                      {brandVoiceDoc.length > 300
                        ? `${brandVoiceDoc.slice(0, 300)}...`
                        : brandVoiceDoc}
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCompleteOnboarding}
                disabled={updateOnboarding.isPending || onboarding?.status === "complete"}
                className="w-full"
              >
                {updateOnboarding.isPending
                  ? "Completing..."
                  : onboarding?.status === "complete"
                    ? "Onboarding Complete"
                    : "Complete Onboarding"}
              </Button>

              {onboarding?.status === "complete" && (
                <p className="text-sm text-success text-center">
                  Onboarding was completed on{" "}
                  {onboarding.onboardingCompletedAt
                    ? new Date(onboarding.onboardingCompletedAt).toLocaleDateString()
                    : "N/A"}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
