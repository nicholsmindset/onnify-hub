import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpsertProfile, useUploadAvatar } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Camera, Linkedin, Twitter, Instagram, Globe, Phone, User } from "lucide-react";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.id);
  const upsert = useUpsertProfile();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: "",
    jobTitle: "",
    bio: "",
    linkedinUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    websiteUrl: "",
    phone: "",
  });

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName ?? "",
        jobTitle: profile.jobTitle ?? "",
        bio: profile.bio ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        twitterUrl: profile.twitterUrl ?? "",
        instagramUrl: profile.instagramUrl ?? "",
        websiteUrl: profile.websiteUrl ?? "",
        phone: profile.phone ?? "",
      });
    }
  }, [profile]);

  const handleSave = () => {
    if (!user) return;
    upsert.mutate({ id: user.id, ...form });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    uploadAvatar.mutate({ userId: user.id, file });
    e.target.value = "";
  };

  const avatarUrl = profile?.avatarUrl;
  const initials = (form.fullName || user?.email || "U").charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and account</p>
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and account preferences</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
          <CardDescription>Your public profile shown across the workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-primary-foreground text-2xl font-bold">{initials}</span>
                )}
              </div>
              <button
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{form.fullName || "Add your name"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <button
                className="text-xs text-primary hover:underline mt-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
              >
                {uploadAvatar.isPending ? "Uploading..." : "Change photo"}
              </button>
            </div>
          </div>

          <Separator />

          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="Robert Nichols"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                placeholder="Creative Director"
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Bio</Label>
              <Textarea
                placeholder="A short bio about yourself..."
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="+1 555 000 0000"
                  className="pl-9"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://onnify.com"
                  className="pl-9"
                  value={form.websiteUrl}
                  onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Social links */}
          <div>
            <h3 className="text-sm font-medium mb-3">Social Links</h3>
            <div className="grid gap-3">
              <div className="relative">
                <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://linkedin.com/in/username"
                  className="pl-9"
                  value={form.linkedinUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                />
              </div>
              <div className="relative">
                <Twitter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://x.com/username"
                  className="pl-9"
                  value={form.twitterUrl}
                  onChange={(e) => setForm((f) => ({ ...f, twitterUrl: e.target.value }))}
                />
              </div>
              <div className="relative">
                <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://instagram.com/username"
                  className="pl-9"
                  value={form.instagramUrl}
                  onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={upsert.isPending} className="w-full sm:w-auto">
            {upsert.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Account Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Signed in as {user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={signOut} className="text-destructive border-destructive/30 hover:bg-destructive/5">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
