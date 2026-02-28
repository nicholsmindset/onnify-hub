import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTeamMembers, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember } from "@/hooks/use-team";
import { useTasks } from "@/hooks/use-tasks";
import { useDeliverables } from "@/hooks/use-deliverables";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Clock, FileCheck, ListTodo, UsersRound, LayoutGrid, BarChart2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TeamMember, TeamRole } from "@/types";

const roleColors: Record<TeamRole, string> = {
  owner: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  manager: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  specialist: "bg-green-500/10 text-green-600 border-green-500/20",
  freelancer: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const roleLabels: Record<TeamRole, string> = {
  owner: "Owner",
  manager: "Manager",
  specialist: "Specialist",
  freelancer: "Freelancer",
};

// Get Monday and Sunday of current week as ISO date strings
function getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
  };
}

export default function Team() {
  const { data: members = [], isLoading } = useTeamMembers();
  const { data: tasks = [] } = useTasks();
  const { data: deliverables = [] } = useDeliverables();

  const [viewMode, setViewMode] = useState<"cards" | "capacity">("cards");

  // Week range for time_entries query
  const { weekStart, weekEnd } = useMemo(() => getCurrentWeekRange(), []);

  // Inline query for weekly time entries
  const { data: weeklyEntries = [] } = useQuery({
    queryKey: ["team-weekly-time-entries", weekStart, weekEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("team_member, hours, is_billable")
        .gte("date", weekStart)
        .lte("date", weekEnd);
      if (error) throw error;
      return (data ?? []) as { team_member: string | null; hours: number; is_billable: boolean }[];
    },
  });

  // Map member name -> hours logged this week
  const weeklyHoursByMember = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of weeklyEntries) {
      if (!entry.team_member) continue;
      map[entry.team_member] = (map[entry.team_member] || 0) + (entry.hours || 0);
    }
    return map;
  }, [weeklyEntries]);

  // Pre-compute per-member stats once when data changes — not on every render
  const memberStats = useMemo(() => {
    const stats: Record<string, { activeTasks: number; activeDeliverables: number; completionRate: number }> = {};
    for (const member of members) {
      const memberTasks = tasks.filter((t) => t.assignedTo === member.name);
      const done  = memberTasks.filter((t) => t.status === "Done").length;
      stats[member.id] = {
        activeTasks:        memberTasks.filter((t) => t.status !== "Done").length,
        activeDeliverables: deliverables.filter((d) => d.assignedTo === member.name && d.status !== "Delivered" && d.status !== "Approved").length,
        completionRate:     memberTasks.length > 0 ? Math.round((done / memberTasks.length) * 100) : 0,
      };
    }
    return stats;
  }, [members, tasks, deliverables]);

  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const deleteMutation = useDeleteTeamMember();

  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null);

  // Cmd+N shortcut handler
  useEffect(() => {
    const handler = () => setCreateOpen(true);
    window.addEventListener("keyboard:new-item", handler);
    return () => window.removeEventListener("keyboard:new-item", handler);
  }, []);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<TeamRole>("specialist");
  const [formTitle, setFormTitle] = useState("");
  const [formCapacity, setFormCapacity] = useState("40");
  const [formRate, setFormRate] = useState("0");
  const [formMarket, setFormMarket] = useState("");

  const resetForm = () => {
    setFormName(""); setFormEmail(""); setFormRole("specialist");
    setFormTitle(""); setFormCapacity("40"); setFormRate("0"); setFormMarket("");
  };

  const loadForm = (m: TeamMember) => {
    setFormName(m.name); setFormEmail(m.email); setFormRole(m.role);
    setFormTitle(m.title || ""); setFormCapacity(String(m.weeklyCapacityHours));
    setFormRate(String(m.hourlyRate)); setFormMarket(m.market || "");
  };

  const handleCreate = () => {
    createMutation.mutate(
      {
        name: formName, email: formEmail, role: formRole, title: formTitle || undefined,
        weeklyCapacityHours: Number(formCapacity), hourlyRate: Number(formRate),
        market: formMarket as "SG" | "ID" | "US" | undefined, isActive: true,
      },
      { onSuccess: () => { setCreateOpen(false); resetForm(); } }
    );
  };

  const handleUpdate = () => {
    if (!editMember) return;
    updateMutation.mutate(
      {
        id: editMember.id, name: formName, email: formEmail, role: formRole,
        title: formTitle || undefined, weeklyCapacityHours: Number(formCapacity),
        hourlyRate: Number(formRate), market: formMarket as "SG" | "ID" | "US" | undefined,
      },
      { onSuccess: () => { setEditMember(null); resetForm(); } }
    );
  };

  const handleDelete = () => {
    if (!deleteMember) return;
    deleteMutation.mutate(deleteMember.id, { onSuccess: () => setDeleteMember(null) });
  };

  const memberForm = (isEdit: boolean) => (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Full name" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@company.com" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={formRole} onValueChange={(v) => setFormRole(v as TeamRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(roleLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. SEO Specialist" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Weekly Hours</Label>
          <Input type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Hourly Rate ($)</Label>
          <Input type="number" value={formRate} onChange={(e) => setFormRate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Market</Label>
          <Select value={formMarket || "none"} onValueChange={(v) => setFormMarket(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any</SelectItem>
              <SelectItem value="SG">Singapore</SelectItem>
              <SelectItem value="ID">Indonesia</SelectItem>
              <SelectItem value="US">USA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button className="w-full" onClick={isEdit ? handleUpdate : handleCreate}
        disabled={!formName || !formEmail || (isEdit ? updateMutation.isPending : createMutation.isPending)}>
        {(isEdit ? updateMutation.isPending : createMutation.isPending) ? "Saving..." : isEdit ? "Update Member" : "Add Member"}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">Team</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Team</h1>
          <p className="text-muted-foreground">{members.length} team member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              className="rounded-none border-0 gap-1.5"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </Button>
            <Button
              variant={viewMode === "capacity" ? "default" : "outline"}
              size="sm"
              className="rounded-none border-0 gap-1.5 border-l"
              onClick={() => setViewMode("capacity")}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Capacity
            </Button>
          </div>

          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Member</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>Add a new member to your team.</DialogDescription>
              </DialogHeader>
              {memberForm(false)}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Capacity View */}
      {viewMode === "capacity" && (
        <div className="rounded-lg border bg-card">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">Weekly Capacity — {weekStart} to {weekEnd}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Hours logged this week vs. weekly capacity</p>
          </div>
          {members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No team members yet.</div>
          ) : (
            <div className="divide-y">
              {members.map((member) => {
                const hoursLogged = Math.round((weeklyHoursByMember[member.name] || 0) * 10) / 10;
                const capacity = member.weeklyCapacityHours || 40;
                const utilPct = Math.min(Math.round((hoursLogged / capacity) * 100), 100);
                const rawPct = (hoursLogged / capacity) * 100;
                const barColor =
                  rawPct >= 100
                    ? "bg-destructive"
                    : rawPct >= 80
                    ? "bg-amber-500"
                    : "bg-green-500";

                return (
                  <div key={member.id} className="flex items-center gap-4 px-4 py-3">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-2 w-48 shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <span className="text-primary-foreground font-bold text-xs">
                          {member.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.title || roleLabels[member.role]}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex-1 mx-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${utilPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right w-36 shrink-0">
                      <p className="text-sm font-mono font-medium">
                        {hoursLogged}h / {capacity}h
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          rawPct >= 100
                            ? "text-destructive"
                            : rawPct >= 80
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      >
                        {Math.round(rawPct)}% utilized
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const { activeTasks: memberTaskCount, activeDeliverables: memberDelivCount, completionRate } = memberStats[member.id] ?? { activeTasks: 0, activeDeliverables: 0, completionRate: 0 };
            const hoursLogged = Math.round((weeklyHoursByMember[member.name] || 0) * 10) / 10;

            return (
              <Card key={member.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <span className="text-primary-foreground font-bold text-sm">
                          {member.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{member.title || member.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { loadForm(member); setEditMember(member); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteMember(member)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleColors[member.role]}`}>
                      {roleLabels[member.role]}
                    </span>
                    {member.market && <Badge variant="outline" className="text-xs">{member.market}</Badge>}
                    {!member.isActive && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <ListTodo className="h-3 w-3" />
                      </div>
                      <p className="text-lg font-bold">{memberTaskCount}</p>
                      <p className="text-[10px] text-muted-foreground">Open Tasks</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <FileCheck className="h-3 w-3" />
                      </div>
                      <p className="text-lg font-bold">{memberDelivCount}</p>
                      <p className="text-[10px] text-muted-foreground">Deliverables</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                      </div>
                      <p className="text-lg font-bold">{member.weeklyCapacityHours}h</p>
                      <p className="text-[10px] text-muted-foreground">Weekly Cap</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Task Completion</span>
                      <span className="text-xs font-mono">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-1.5" />
                  </div>

                  {member.hourlyRate > 0 && (
                    <p className="text-xs text-muted-foreground">${member.hourlyRate}/hr</p>
                  )}

                  {/* Weekly hours logged */}
                  <p className="text-xs text-muted-foreground border-t pt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {hoursLogged}h logged this week
                  </p>
                </CardContent>
              </Card>
            );
          })}

          {members.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={UsersRound}
                title="No team members yet"
                description="Add your first team member to start tracking tasks, deliverables, and capacity."
                actionLabel="Add Member"
                onAction={() => setCreateOpen(true)}
              />
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => { if (!open) { setEditMember(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update this team member's details.</DialogDescription>
          </DialogHeader>
          {memberForm(true)}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteMember} onOpenChange={(open) => !open && setDeleteMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deleteMember?.name}? Their task and deliverable assignments will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
