import { useState } from "react";
import { useActivityLog, useAddActivity } from "@/hooks/use-activity-log";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, FileCheck, Receipt, ListTodo, UserPlus, Edit, Trash2,
  ArrowRight, MessageSquare, StickyNote,
} from "lucide-react";
import { ActivityAction, ActivityEntity } from "@/types";

const actionIcons: Record<ActivityAction, React.ReactNode> = {
  created: <Plus className="h-3.5 w-3.5" />,
  updated: <Edit className="h-3.5 w-3.5" />,
  deleted: <Trash2 className="h-3.5 w-3.5" />,
  status_changed: <ArrowRight className="h-3.5 w-3.5" />,
  assigned: <UserPlus className="h-3.5 w-3.5" />,
  commented: <MessageSquare className="h-3.5 w-3.5" />,
  note_added: <StickyNote className="h-3.5 w-3.5" />,
};

const entityIcons: Record<ActivityEntity, React.ReactNode> = {
  client: <UserPlus className="h-3 w-3" />,
  deliverable: <FileCheck className="h-3 w-3" />,
  invoice: <Receipt className="h-3 w-3" />,
  task: <ListTodo className="h-3 w-3" />,
  content: <Edit className="h-3 w-3" />,
  contact: <UserPlus className="h-3 w-3" />,
};

const actionColors: Record<ActivityAction, string> = {
  created: "bg-green-500",
  updated: "bg-blue-500",
  deleted: "bg-red-500",
  status_changed: "bg-yellow-500",
  assigned: "bg-purple-500",
  commented: "bg-cyan-500",
  note_added: "bg-orange-500",
};

interface ActivityTimelineProps {
  clientId: string;
}

export function ActivityTimeline({ clientId }: ActivityTimelineProps) {
  const { data: activities = [], isLoading } = useActivityLog(clientId);
  const addActivity = useAddActivity();
  const { profile } = useAuth();
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addActivity.mutate(
      {
        clientId,
        entityType: "client",
        entityId: clientId,
        action: "note_added",
        description: noteText,
        performedBy: profile?.fullName || "System",
      },
      {
        onSuccess: () => {
          setNoteText("");
          setShowNoteInput(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{activities.length} activities</p>
        <Button variant="outline" size="sm" onClick={() => setShowNoteInput(!showNoteInput)}>
          <StickyNote className="h-3.5 w-3.5 mr-1.5" /> Add Note
        </Button>
      </div>

      {showNoteInput && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a note about this client..."
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="flex-1"
          />
          <div className="flex flex-col gap-1">
            <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim() || addActivity.isPending}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowNoteInput(false); setNoteText(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="relative flex gap-4 pl-1">
                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-white ${actionColors[activity.action]}`}>
                  {actionIcons[activity.action]}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{activity.performedBy}</span>
                    <Badge variant="outline" className="text-[10px] h-5 gap-1">
                      {entityIcons[activity.entityType]}
                      {activity.entityType}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(activity.createdAt).toLocaleDateString()} {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
