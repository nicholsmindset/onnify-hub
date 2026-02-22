import { useState } from "react";
import { useAIContent, useAIRefine } from "@/hooks/use-ai";
import { ContentGenerateParams } from "@/lib/ai";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, Check, ArrowRight, RefreshCw } from "lucide-react";

const TONES = ["Professional", "Casual", "Persuasive", "Educational", "Witty"] as const;

const QUICK_PROMPTS: Record<string, string[]> = {
  Blog: [
    "Write an SEO-optimized blog post with headers and CTA",
    "Create a thought leadership article",
    "Write a how-to guide with step-by-step instructions",
  ],
  "Social Post": [
    "Write a punchy LinkedIn post with emojis and hashtags",
    "Create an Instagram caption with hooks",
    "Draft a Twitter/X thread (5 tweets)",
  ],
  "Email Campaign": [
    "Write a promotional email with subject line and CTA",
    "Create a nurture sequence email",
    "Draft a re-engagement email for cold leads",
  ],
  Video: [
    "Write a YouTube video script with hook and outline",
    "Create a TikTok/Reel script (30 seconds)",
    "Draft video ad copy with B-roll suggestions",
  ],
  "Case Study": [
    "Write a client success story (Problem-Solution-Result)",
    "Create a data-driven case study",
    "Draft a testimonial-style case study",
  ],
  Newsletter: [
    "Write a weekly digest newsletter",
    "Create a product update newsletter",
    "Draft an industry insights roundup",
  ],
};

interface ContentAIPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: string;
  title: string;
  platform?: string;
  clientName?: string;
  clientIndustry?: string;
  clientMarket?: string;
  currentContent?: string;
  onInsert: (content: string) => void;
}

export function ContentAIPanel({
  open,
  onOpenChange,
  contentType,
  title,
  platform,
  clientName,
  clientIndustry,
  clientMarket,
  currentContent,
  onInsert,
}: ContentAIPanelProps) {
  const [tone, setTone] = useState<string>("Professional");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [refineInstruction, setRefineInstruction] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMutation = useAIContent();
  const refineMutation = useAIRefine();

  const handleGenerate = (promptOverride?: string) => {
    const params: ContentGenerateParams = {
      contentType,
      title,
      platform,
      tone,
      clientName,
      clientIndustry,
      clientMarket,
      customPrompt: promptOverride || customPrompt,
    };

    generateMutation.mutate(params, {
      onSuccess: (data) => setGeneratedContent(data),
    });
  };

  const handleRefine = () => {
    if (!generatedContent || !refineInstruction) return;
    refineMutation.mutate(
      { content: generatedContent, instruction: refineInstruction },
      {
        onSuccess: (data) => {
          setGeneratedContent(data);
          setRefineInstruction("");
        },
      }
    );
  };

  const handleInsert = () => {
    onInsert(generatedContent);
    onOpenChange(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = generateMutation.isPending || refineMutation.isPending;
  const prompts = QUICK_PROMPTS[contentType] || QUICK_PROMPTS["Blog"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Content Assistant
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Context summary */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{contentType}</Badge>
            {platform && <Badge variant="outline">{platform}</Badge>}
            {clientName && <Badge variant="outline">{clientName}</Badge>}
            {clientMarket && <Badge variant="outline">{clientMarket}</Badge>}
          </div>

          {/* Tone selector */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tone</label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick prompts */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Quick Prompts</label>
            <div className="space-y-1.5">
              {prompts.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 text-xs"
                  disabled={isLoading}
                  onClick={() => handleGenerate(prompt)}
                >
                  <Sparkles className="h-3 w-3 mr-2 flex-shrink-0" />
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom prompt */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Custom Prompt</label>
            <Textarea
              placeholder="Describe what you want the AI to write..."
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
            <Button
              className="w-full mt-2"
              disabled={isLoading || !customPrompt}
              onClick={() => handleGenerate()}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate</>
              )}
            </Button>
          </div>

          {/* Generated content */}
          {generatedContent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Generated Content</label>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/50 p-3 max-h-64 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
              </div>

              {/* Refine */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Refine: make it shorter, add stats, change tone..."
                  rows={2}
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0 self-end"
                  disabled={isLoading || !refineInstruction}
                  onClick={handleRefine}
                >
                  {refineMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Insert button */}
              <Button className="w-full" onClick={handleInsert}>
                <ArrowRight className="h-4 w-4 mr-2" /> Insert into Content Body
              </Button>

              {currentContent && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onInsert(currentContent + "\n\n" + generatedContent)}
                >
                  Append to Existing Content
                </Button>
              )}
            </div>
          )}

          {/* Error display */}
          {(generateMutation.isError || refineMutation.isError) && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                {generateMutation.error?.message || refineMutation.error?.message}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
