import { useMutation } from "@tanstack/react-query";
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
    mutationFn: (params: AIEmailParams) => generateEmail(params),
    onError: (error) => {
      toast.error(`Email draft failed: ${error.message}`);
    },
  });
}
