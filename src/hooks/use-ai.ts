import { useMutation } from "@tanstack/react-query";
import {
  generateContent,
  refineContent,
  generateEmail,
  ContentGenerateParams,
  EmailDraftParams,
  EmailDraft,
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
