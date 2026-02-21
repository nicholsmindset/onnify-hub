import { useState } from "react";
import {
  useNotificationRules,
  useCreateNotificationRule,
  useUpdateNotificationRule,
  useDeleteNotificationRule,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/hooks/use-notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Bell, BellOff, Plus, Trash2, Mail, Monitor, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { NotificationRule, NotificationTrigger, NotificationChannel, NotificationType } from "@/types";

const triggerLabels: Record<NotificationTrigger, string> = {
  overdue_deliverable: "Overdue Deliverable",
  overdue_invoice: "Overdue Invoice",
  status_change: "Status Change",
  upcoming_due: "Upcoming Due Date",
  new_assignment: "New Assignment",
  client_onboarding: "Client Onboarding",
};

const channelIcons: Record<NotificationChannel, React.ReactNode> = {
  email: <Mail className="h-3.5 w-3.5" />,
  in_app: <Monitor className="h-3.5 w-3.5" />,
  both: <><Mail className="h-3.5 w-3.5" /><Monitor className="h-3.5 w-3.5" /></>,
};

const notifIcon: Record<NotificationType, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
};

const allRecipients = ["Robert", "Lina", "Freelancer"];

export default function Notifications() {
  const { data: rules = [], isLoading: loadingRules } = useNotificationRules();
  const { data: notifications = [], isLoading: loadingNotifs } = useNotifications("Robert");
  const createMutation = useCreateNotificationRule();
  const updateMutation = useUpdateNotificationRule();
  const deleteMutation = useDeleteNotificationRule();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllRead();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteRule, setDeleteRule] = useState<NotificationRule | null>(null);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState<NotificationTrigger>("overdue_deliverable");
  const [newChannel, setNewChannel] = useState<NotificationChannel>("both");
  const [newRecipients, setNewRecipients] = useState<string[]>(["Robert"]);

  const handleCreate = () => {
    createMutation.mutate(
      { name: newName, triggerType: newTrigger, channel: newChannel, recipients: newRecipients, isActive: true },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setNewName("");
          setNewRecipients(["Robert"]);
        },
      }
    );
  };

  const toggleRecipient = (name: string) => {
    setNewRecipients((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]
    );
  };

  const handleToggleActive = (rule: NotificationRule) => {
    updateMutation.mutate({ id: rule.id, isActive: !rule.isActive });
  };

  const handleDeleteRule = () => {
    if (!deleteRule) return;
    deleteMutation.mutate(deleteRule.id, { onSuccess: () => setDeleteRule(null) });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loadingRules || loadingNotifs) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">Notifications & Automations</h1>
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Notifications & Automations</h1>
        <p className="text-muted-foreground">Configure alerts and view notification history</p>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="inbox" className="relative">
            Inbox
            {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Add Rule</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Notification Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input placeholder="e.g. Overdue Invoice Alert" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Trigger</Label>
                    <Select value={newTrigger} onValueChange={(v) => setNewTrigger(v as NotificationTrigger)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(triggerLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select value={newChannel} onValueChange={(v) => setNewChannel(v as NotificationChannel)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email Only</SelectItem>
                        <SelectItem value="in_app">In-App Only</SelectItem>
                        <SelectItem value="both">Email + In-App</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <div className="flex gap-3">
                      {allRecipients.map((name) => (
                        <label key={name} className="flex items-center gap-1.5 text-sm">
                          <Checkbox checked={newRecipients.includes(name)} onCheckedChange={() => toggleRecipient(name)} />
                          {name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCreate} className="w-full" disabled={!newName || createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Rule"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {rule.isActive ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className="font-medium text-sm">{rule.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{triggerLabels[rule.triggerType]}</Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {channelIcons[rule.channel]}
                          </span>
                          <span className="text-xs text-muted-foreground">{rule.recipients.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.isActive} onCheckedChange={() => handleToggleActive(rule)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteRule(rule)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {rules.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-4 opacity-40" />
                  <p>No notification rules configured</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inbox" className="space-y-4">
          {unreadCount > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate("Robert")}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {notifications.map((notif) => (
              <Card key={notif.id} className={notif.isRead ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{notifIcon[notif.type]}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{notif.title}</p>
                        {!notif.isRead && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => markReadMutation.mutate(notif.id)}>
                            Mark read
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notif.createdAt && new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {notifications.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CheckCheck className="h-10 w-10 mx-auto mb-4 opacity-40" />
                  <p>No notifications yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Rule Confirmation */}
      <AlertDialog open={!!deleteRule} onOpenChange={(open) => !open && setDeleteRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteRule?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
