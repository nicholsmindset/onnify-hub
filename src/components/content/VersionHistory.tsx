import { useContentVersions } from "@/hooks/use-content-versions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface VersionHistoryProps {
  contentId: string;
}

export function VersionHistory({ contentId }: VersionHistoryProps) {
  const { data: versions = [], isLoading } = useContentVersions(contentId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No versions recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {versions.map((version, index) => (
        <div key={version.id} className="relative flex gap-3">
          {/* Timeline line */}
          {index < versions.length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
          )}

          {/* Timeline dot */}
          <div className="flex-shrink-0 mt-1">
            <div className="h-[30px] w-[30px] rounded-full bg-primary/10 flex items-center justify-center">
              <Badge variant="default" className="h-5 w-auto px-1.5 text-[10px]">
                v{version.versionNumber}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{version.author}</span>
              <span className="text-xs text-muted-foreground">
                {version.createdAt ? new Date(version.createdAt).toLocaleString() : "Unknown date"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{version.title}</p>
            {version.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">{version.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
