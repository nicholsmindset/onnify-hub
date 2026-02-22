import { useState } from "react";
import { useTeamMembers, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember } from "@/hooks/use-team";
import { useTasks } from "@/hooks/use-tasks";
import { useDeliverables } from "@/hooks/use-deliverables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Clock, FileCheck, ListTodo } from "lucide-react";
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

export default function Team() {
  const { data: members = [], isLoading } = useTeamMembers();
  const { data: tasks = [] } = useTasks();
  const { data: deliverables = [] } = useDeliverables();
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const deleteMutation = useDeleteTeamMember();

  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null);

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
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Member</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            {memberForm(false)}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const memberTasks = tasks.filter((t) => t.assignedTo === member.name && t.status !== "Done");
          const memberDeliverables = deliverables.filter((d) => d.assignedTo === member.name && d.status !== "Delivered" && d.status !== "Approved");
          const completedTasks = tasks.filter((t) => t.assignedTo === member.name && t.status === "Done").length;
          const totalTasks = tasks.filter((t) => t.assignedTo === member.name).length;
          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
                    <p className="text-lg font-bold">{memberTasks.length}</p>
                    <p className="text-[10px] text-muted-foreground">Open Tasks</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <FileCheck className="h-3 w-3" />
                    </div>
                    <p className="text-lg font-bold">{memberDeliverables.length}</p>
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
              </CardContent>
            </Card>
          );
        })}

        {members.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p>No team members yet. Add your first team member to get started.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => { if (!open) { setEditMember(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
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
