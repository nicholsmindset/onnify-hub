import { useNavigate } from "react-router-dom";
import { useActivityLogs, useMarkAllActivityRead, useMarkActivityRead, useUnreadActivityCount } from "@/hooks/use-activity-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare, FileCheck, Receipt, ListTodo, Users, FileText,
  Zap, CheckCheck,
} from "lucide-react";
import type { ActivityLogWithMeta } from "@/hooks/use-activity-logs";
import type { ActivityEntity } from "@/types";

const entityIcons: Record<ActivityEntity, React.ElementType> = {
  deliverable: FileCheck,
  invoice: Receipt,
  task: ListTodo,
  client: Users,
  content: FileText,
  contact: MessageSquare,
};

const entityColors: Record<ActivityEntity, string> = {
  deliverable: "text-blue-500",
  invoice: "text-green-500",
  task: "text-yellow-500",
  client: "text-purple-500",
  content: "text-orange-500",
  contact: "text-primary",
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ActivityItem({ log, onRead }: { log: ActivityLogWithMeta; onRead: (id: string) => void }) {
  const navigate = useNavigate();
  const Icon = entityIcons[log.entityType] ?? Zap;
  const color = entityColors[log.entityType] ?? "text-muted-foreground";

  const handleClick = () => {
    onRead(log.id);
    if (log.linkPath) navigate(log.linkPath);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors hover:bg-muted/60 ${
        !log.isRead ? "bg-primary/5 border-l-2 border-primary" : ""
      }`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!log.isRead ? "font-medium" : ""}`}>
          {log.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {log.clientName && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {log.clientName}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{timeAgo(log.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}

export function ActivityFeed() {
  const { data: logs = [], isLoading } = useActivityLogs(25);
  const { data: unreadCount = 0 } = useUnreadActivityCount();
  const markAllRead = useMarkAllActivityRead();
  const markRead = useMarkActivityRead();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" /> Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Activity Feed
          {unreadCount > 0 && (
            <Badge className="h-5 text-[10px] px-1.5 bg-primary">{unreadCount}</Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-3 w-3" /> Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-3">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
        ) : (
          <div className="space-y-0.5 max-h-[420px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <ActivityItem key={log.id} log={log} onRead={(id) => markRead.mutate(id)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
