import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateContentRequest } from "@/hooks/use-content-requests";
import { contentRequestSchema, ContentRequestFormValues } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Send } from "lucide-react";

interface PortalRequestFormProps {
  clientId: string;
  portalAccessId: string;
}

const contentTypes = [
  "Blog",
  "Social Post",
  "Email Campaign",
  "Video",
  "Case Study",
  "Newsletter",
];

export function PortalRequestForm({ clientId, portalAccessId }: PortalRequestFormProps) {
  const createMutation = useCreateContentRequest();

  const form = useForm<ContentRequestFormValues>({
    resolver: zodResolver(contentRequestSchema),
    defaultValues: {
      contentType: "",
      topic: "",
      targetKeyword: "",
      priority: "standard",
      desiredDate: "",
      referenceUrls: "",
      referenceNotes: "",
    },
  });

  const handleSubmit = (data: ContentRequestFormValues) => {
    createMutation.mutate(
      {
        clientId,
        portalAccessId,
        contentType: data.contentType,
        topic: data.topic,
        targetKeyword: data.targetKeyword || undefined,
        priority: data.priority,
        desiredDate: data.desiredDate || undefined,
        referenceUrls: data.referenceUrls || undefined,
        referenceNotes: data.referenceNotes || undefined,
        status: "pending",
      },
      {
        onSuccess: () => {
          form.reset();
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Submit Content Request</CardTitle>
        <p className="text-sm text-muted-foreground">
          Request new content from the team. We will review and get back to you.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the content topic or brief..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetKeyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Keyword (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. best project management tools" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="rush">Rush</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="desiredDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desired Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceUrls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference URLs</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste any reference URLs, one per line..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional context, tone preferences, or specific requirements..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
