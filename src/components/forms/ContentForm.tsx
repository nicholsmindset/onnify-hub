import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentSchema, ContentFormValues } from "@/lib/validations";
import { ContentItem } from "@/types";
import { useClients } from "@/hooks/use-clients";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ContentFormProps {
  defaultValues?: ContentItem;
  onSubmit: (data: ContentFormValues) => void;
  isLoading?: boolean;
}

export function ContentForm({ defaultValues, onSubmit, isLoading }: ContentFormProps) {
  const { data: clients = [] } = useClients();

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      clientId: defaultValues?.clientId || "",
      title: defaultValues?.title || "",
      contentType: defaultValues?.contentType || "Blog",
      platform: defaultValues?.platform || "",
      status: defaultValues?.status || "Ideation",
      assignedTo: defaultValues?.assignedTo || "",
      dueDate: defaultValues?.dueDate || "",
      publishDate: defaultValues?.publishDate || "",
      contentBody: defaultValues?.contentBody || "",
      fileLink: defaultValues?.fileLink || "",
      notes: defaultValues?.notes || "",
      market: defaultValues?.market || "SG",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl><Input placeholder="Content title" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="contentType" render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {["Blog", "Social Post", "Email Campaign", "Video", "Case Study", "Newsletter"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="platform" render={({ field }) => (
            <FormItem>
              <FormLabel>Platform</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger></FormControl>
                <SelectContent>
                  {["Website", "Instagram", "LinkedIn", "Facebook", "YouTube", "Email", "TikTok"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="clientId" render={({ field }) => (
          <FormItem>
            <FormLabel>Client (optional)</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="">No client</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {["Ideation", "Draft", "Review", "Approved", "Scheduled", "Published"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="assignedTo" render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned To</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Robert">Robert</SelectItem>
                  <SelectItem value="Lina">Lina</SelectItem>
                  <SelectItem value="Freelancer">Freelancer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="dueDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="market" render={({ field }) => (
            <FormItem>
              <FormLabel>Market</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="SG">Singapore</SelectItem>
                  <SelectItem value="ID">Indonesia</SelectItem>
                  <SelectItem value="US">USA</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="contentBody" render={({ field }) => (
          <FormItem>
            <FormLabel>Content Body</FormLabel>
            <FormControl><Textarea placeholder="Write content here..." rows={4} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl><Textarea placeholder="Internal notes..." rows={2} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="fileLink" render={({ field }) => (
          <FormItem>
            <FormLabel>File Link</FormLabel>
            <FormControl><Input placeholder="https://..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : defaultValues ? "Update Content" : "Create Content"}
        </Button>
      </form>
    </Form>
  );
}
