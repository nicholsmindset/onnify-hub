import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLogTime } from "@/hooks/use-time-entries";

const timeLogSchema = z.object({
  teamMember: z.string().min(1, "Team member is required"),
  hours: z.coerce.number().min(0.25, "Minimum 0.25 hours"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  isBillable: z.boolean(),
  hourlyRate: z.coerce.number().nullable().optional(),
});

type TimeLogFormValues = z.infer<typeof timeLogSchema>;

interface TimeLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  taskId?: string;
  deliverableId?: string;
  taskName?: string;
}

export function TimeLogDialog({
  open,
  onOpenChange,
  clientId,
  taskId,
  deliverableId,
  taskName,
}: TimeLogDialogProps) {
  const logTime = useLogTime();

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<TimeLogFormValues>({
    resolver: zodResolver(timeLogSchema),
    defaultValues: {
      teamMember: "",
      hours: 1,
      date: today,
      notes: "",
      isBillable: true,
      hourlyRate: null,
    },
  });

  const isBillable = form.watch("isBillable");

  const handleSubmit = (values: TimeLogFormValues) => {
    logTime.mutate(
      {
        clientId,
        taskId: taskId ?? null,
        deliverableId: deliverableId ?? null,
        teamMember: values.teamMember,
        hours: values.hours,
        date: values.date,
        notes: values.notes || null,
        isBillable: values.isBillable,
        hourlyRate: values.isBillable && values.hourlyRate ? values.hourlyRate : null,
      },
      {
        onSuccess: () => {
          toast.success("Time logged successfully");
          form.reset({
            teamMember: "",
            hours: 1,
            date: today,
            notes: "",
            isBillable: true,
            hourlyRate: null,
          });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(`Failed to log time: ${err.message}`);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
          <DialogDescription>
            {taskName ? `Logging time for: ${taskName}` : "Log a time entry"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="teamMember"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Member</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Robert" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0.25}
                        step={0.25}
                        placeholder="1.0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What was worked on..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isBillable"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Billable</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {isBillable && (
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="e.g. 100"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full" disabled={logTime.isPending}>
              {logTime.isPending ? "Logging..." : "Log Time"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
