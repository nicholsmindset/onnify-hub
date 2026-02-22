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
import { generateContent, generateEmail, AIContentParams, AIEmailParams } from "@/lib/ai";
import { toast } from "sonner";

export function useAIContent() {
  return useMutation({
    mutationFn: (params: AIContentParams) => generateContent(params),
    onError: (error) => {
      toast.error(`AI generation failed: ${error.message}`);
    },
  });
}

export function useAIEmail() {
  return useMutation({
    mutationFn: (params: EmailDraftParams): Promise<EmailDraft> => generateEmail(params),
    mutationFn: (params: AIEmailParams) => generateEmail(params),
    onError: (error) => {
      toast.error(`Email draft failed: ${error.message}`);
    },
  });
}
