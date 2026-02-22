import { useMutation } from "@tanstack/react-query";
import {
  generateContent,
  refineContent,
  generateEmail,
  generateInsights,
  getClientHealthNarrative,
  ContentGenerateParams,
  EmailDraftParams,
  EmailDraft,
  HealthNarrativeResult,
} from "@/lib/ai";

export function useAIContent() {
  return useMutation({
    mutationFn: (params: ContentGenerateParams) => generateContent(params),
  });
}

export function useAIRefine() {
  return useMutation({
    mutationFn: ({ content, instruction }: { content: string; instruction: string }) =>
      refineContent(content, instruction),
  });
}

export function useAIEmail() {
  return useMutation({
    mutationFn: (params: EmailDraftParams): Promise<EmailDraft> => generateEmail(params),
  });
}

export function useAIInsights() {
  return useMutation({
    mutationFn: ({ context, market }: { context: string; market?: string }) =>
      generateInsights(context, market),
  });
}

export function useClientHealthNarrative() {
  return useMutation({
    mutationFn: (clientId: string): Promise<HealthNarrativeResult> =>
      getClientHealthNarrative(clientId),
  });
}
