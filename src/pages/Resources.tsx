import { useState, useMemo } from "react";
import {
  useResources,
  useUploadResource,
  useUpdateResource,
  useDeleteResource,
} from "@/hooks/use-resources";
import { Resource } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Upload,
  Download,
  Trash2,
  FolderOpen,
  File,
  FileText,
  Image,
  Video,
  Search,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "internal", label: "Internal" },
  { value: "client_facing", label: "Client Facing" },
  { value: "templates", label: "Templates" },
  { value: "training", label: "Training" },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  internal: "Internal",
  client_facing: "Client Facing",
  templates: "Templates",
  training: "Training",
};

const CATEGORY_COLORS: Record<string, string> = {
  internal: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  client_facing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  templates: "bg-green-500/10 text-green-600 border-green-500/20",
  training: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function FileTypeIcon({ fileType }: { fileType: string | null }) {
  const cls = "h-8 w-8";
  if (!fileType) return <File className={cls} />;
  if (fileType.startsWith("image/")) return <Image className={cls} />;
  if (fileType.startsWith("video/")) return <Video className={cls} />;
  if (
    fileType === "application/pdf" ||
    fileType.startsWith("text/") ||
    fileType.includes("document") ||
    fileType.includes("spreadsheet") ||
    fileType.includes("presentation")
  )
    return <FileText className={cls} />;
  return <File className={cls} />;
}

// ─── Upload Dialog ────────────────────────────────────────────────────────────

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const uploadMutation = useUploadResource();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("internal");

  const reset = () => {
    setFile(null);
    setName("");
    setDescription("");
    setCategory("internal");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected && !name) {
      // Auto-populate name from file name (without extension)
      const base = selected.name.replace(/\.[^/.]+$/, "");
      setName(base);
    }
  };

  const handleUpload = async () => {
    if (!file || !name.trim()) return;
    try {
      await uploadMutation.mutateAsync({
        file,
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        uploadedBy: "Agency",
      });
      toast.success("Resource uploaded successfully");
      reset();
      onOpenChange(false);
    } catch (err: any) {
      const msg: string = err?.message ?? String(err);
      if (
        msg.toLowerCase().includes("bucket") ||
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("storage")
      ) {
        toast.error(
          "Storage bucket not configured. Please create a 'resources' bucket in Supabase Storage settings."
        );
      } else {
        toast.error(`Upload failed: ${msg}`);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Resource</DialogTitle>
          <DialogDescription>
            Add a file to the resource library.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* File picker */}
          <div className="space-y-2">
            <Label htmlFor="resource-file">File</Label>
            <Input
              id="resource-file"
              type="file"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="resource-name">Name *</Label>
            <Input
              id="resource-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Resource name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="resource-desc">Description (optional)</Label>
            <Input
              id="resource-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="client_facing">Client Facing</SelectItem>
                <SelectItem value="templates">Templates</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={!file || !name.trim() || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Resource Card ────────────────────────────────────────────────────────────

interface ResourceCardProps {
  resource: Resource;
  onDelete: (resource: Resource) => void;
}

function ResourceCard({ resource, onDelete }: ResourceCardProps) {
  const updateMutation = useUpdateResource();

  const handlePublicToggle = (checked: boolean) => {
    updateMutation.mutate(
      { id: resource.id, isPublic: checked },
      {
        onSuccess: () =>
          toast.success(
            checked ? "Marked as public" : "Marked as private"
          ),
        onError: (err: any) =>
          toast.error(`Failed to update: ${err?.message ?? err}`),
      }
    );
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary/70">
            <FileTypeIcon fileType={resource.fileType} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight line-clamp-2">
              {resource.name}
            </p>
            {resource.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {resource.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        {/* Category badge + file size */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
              CATEGORY_COLORS[resource.category] ?? CATEGORY_COLORS.internal
            }`}
          >
            {CATEGORY_LABELS[resource.category] ?? resource.category}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(resource.fileSize)}
          </span>
        </div>

        {/* Uploaded by + date */}
        <p className="text-xs text-muted-foreground">
          {resource.uploadedBy} · {relativeDate(resource.createdAt)}
        </p>

        {/* Public toggle */}
        <div className="flex items-center justify-between">
          <Label
            htmlFor={`public-${resource.id}`}
            className="text-xs cursor-pointer select-none"
          >
            Public
          </Label>
          <Switch
            id={`public-${resource.id}`}
            checked={resource.isPublic}
            onCheckedChange={handlePublicToggle}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <a
            href={resource.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={resource.fileName}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full text-xs">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
            onClick={() => onDelete(resource)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const { data: resources = [], isLoading } = useResources(
    activeCategory !== "all" ? { category: activeCategory } : {}
  );

  const deleteMutation = useDeleteResource();

  const filtered = useMemo(() => {
    if (!search.trim()) return resources;
    const q = search.toLowerCase();
    return resources.filter((r) => r.name.toLowerCase().includes(q));
  }, [resources, search]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Resource deleted");
        setDeleteTarget(null);
      },
      onError: (err: any) =>
        toast.error(`Failed to delete: ${err?.message ?? err}`),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Resource Library</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-lg" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Resource Library</h1>
          <p className="text-muted-foreground">
            {resources.length} resource{resources.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Resource
        </Button>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Category tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeCategory === cat.value
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onDelete={setDeleteTarget}
          />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={FolderOpen}
              title="No resources found"
              description={
                search
                  ? "No resources match your search. Try a different term."
                  : activeCategory !== "all"
                  ? `No resources in the "${
                      CATEGORY_LABELS[activeCategory] ?? activeCategory
                    }" category yet.`
                  : "Upload your first resource to get started."
              }
              actionLabel={!search ? "Upload Resource" : undefined}
              onAction={!search ? () => setUploadOpen(true) : undefined}
            />
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This
              action cannot be undone. Note: the file in storage will not be
              removed automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
