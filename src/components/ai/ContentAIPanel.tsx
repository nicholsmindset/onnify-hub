import { useState } from "react";
import { useAIContent } from "@/hooks/use-ai";
import { isAIConfigured } from "@/lib/ai";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Copy, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface ContentAIPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (content: string) => void;
  contentType: string;
  platform?: string;
  existingContent?: string;
  clientContext?: {
    companyName?: string;
    industry?: string;
    market?: string;
  };
}

const PROMPT_TEMPLATES: Record<string, string[]> = {
  Blog: [
    "Write a blog post about",
    "Create an SEO-optimized article on",
    "Write a thought leadership piece about",
  ],
  "Social Post": [
    "Write 5 Instagram caption variations for",
    "Create a LinkedIn post about",
    "Write a Twitter/X thread about",
  ],
  "Email Campaign": [
    "Write a promotional email for",
    "Create a drip email sequence about",
    "Write a re-engagement email for",
  ],
  Video: [
    "Write a video script for",
    "Create a YouTube video outline about",
    "Write a TikTok video concept for",
  ],
  "Case Study": [
    "Write a case study about",
    "Create a client success story for",
  ],
  Newsletter: [
    "Write a monthly newsletter update about",
    "Create a curated newsletter on",
  ],
};

const TONES = ["Professional", "Casual", "Persuasive", "Educational", "Witty"];

export function ContentAIPanel({
  open,
  onOpenChange,
  onInsert,
  contentType,
  platform,
  existingContent,
  clientContext,
}: ContentAIPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Professional");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const mutation = useAIContent();
  const configured = isAIConfigured();
  const templates = PROMPT_TEMPLATES[contentType] || PROMPT_TEMPLATES["Blog"];

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    mutation.mutate(
      {
        prompt: prompt.trim(),
        contentType,
        platform,
        tone,
        clientContext,
        existingContent: existingContent || undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data);
        },
      }
    );
  };

  const handleInsert = () => {
    onInsert(result);
    toast.success("Content inserted");
    onOpenChange(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImprove = () => {
    setPrompt("Improve and refine this content. Make it more engaging and impactful.");
    mutation.mutate(
      {
        prompt: "Improve and refine this content. Make it more engaging and impactful.",
        contentType,
        platform,
        tone,
        clientContext,
        existingContent: result || existingContent,
      },
      { onSuccess: (data) => setResult(data) }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Content Assistant
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {!configured && (
            <div className="rounded-lg border border-warning/50 bg-warning/5 p-3">
              <p className="text-sm text-warning font-medium">API Key Required</p>
              <p className="text-xs text-muted-foreground mt-1">
                Set <code className="bg-muted px-1 rounded">VITE_OPENROUTER_API_KEY</code> in your <code className="bg-muted px-1 rounded">.env.local</code> file to enable AI features.
              </p>
            </div>
          )}

          {/* Quick Prompts */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick prompts for {contentType}</Label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setPrompt(t + " ")}
                >
                  {t}...
                </Button>
              ))}
            </div>
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label>What would you like to create?</Label>
            <Textarea
              placeholder={`e.g. "${templates[0]} digital transformation trends in 2026"`}
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
            />
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || mutation.isPending || !configured}
              className="w-full"
            >
              {mutation.isPending ? (
                "Generating..."
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </div>

          {/* Loading */}
          {mutation.isPending && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {/* Result */}
          {result && !mutation.isPending && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Generated Content</Label>
              <div className="rounded-lg border bg-muted/50 p-3 max-h-[300px] overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{result}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleInsert} className="flex-1">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Insert into Content
                </Button>
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleImprove}>
                <Sparkles className="h-3 w-3 mr-1" /> Refine & Improve
              </Button>
            </div>
          )}

          {clientContext?.companyName && (
            <p className="text-xs text-muted-foreground">
              Context: {clientContext.companyName} ({clientContext.industry}, {clientContext.market})
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
