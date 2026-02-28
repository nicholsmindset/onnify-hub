import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpsertProfile, useUploadAvatar } from "@/hooks/use-profile";
import { useWorkspaceSettings, useUpdateWorkspace } from "@/hooks/use-workspace";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Linkedin, Twitter, Instagram, Globe, Phone, User, Building2, LayoutTemplate } from "lucide-react";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: workspace, isLoading: workspaceLoading } = useWorkspaceSettings();
  const upsert = useUpsertProfile();
  const uploadAvatar = useUploadAvatar();
  const updateWorkspace = useUpdateWorkspace();
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

  const [wsForm, setWsForm] = useState({
    agencyName: "Onnify Works",
    logoUrl: "",
    accentColor: "#6366f1",
    defaultMarket: "SG",
    portalTitle: "Your Project Portal",
    portalWelcomeMessage: "",
    hidePoweredBy: false,
  });

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

  useEffect(() => {
    if (workspace) {
      setWsForm({
        agencyName: workspace.agencyName,
        logoUrl: workspace.logoUrl ?? "",
        accentColor: workspace.accentColor,
        defaultMarket: workspace.defaultMarket,
        portalTitle: workspace.portalTitle,
        portalWelcomeMessage: workspace.portalWelcomeMessage ?? "",
        hidePoweredBy: workspace.hidePoweredBy,
      });
    }
  }, [workspace]);

  const handleSaveProfile = () => {
    if (!user) return;
    upsert.mutate({ id: user.id, ...form });
  };

  const handleSaveWorkspace = () => {
    updateWorkspace.mutate({
      agencyName: wsForm.agencyName,
      logoUrl: wsForm.logoUrl || null,
      accentColor: wsForm.accentColor,
      defaultMarket: wsForm.defaultMarket,
      portalTitle: wsForm.portalTitle,
      portalWelcomeMessage: wsForm.portalWelcomeMessage || null,
      hidePoweredBy: wsForm.hidePoweredBy,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    uploadAvatar.mutate({ userId: user.id, file });
    e.target.value = "";
  };

  const avatarUrl = profile?.avatarUrl;
  const initials = (form.fullName || user?.email || "U").charAt(0).toUpperCase();
  const isLoading = profileLoading || workspaceLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and workspace</p>
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
        <p className="text-muted-foreground">Manage your profile, workspace, and portal branding</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="workspace" className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" /> Workspace
          </TabsTrigger>
          <TabsTrigger value="portal" className="flex items-center gap-2">
            <LayoutTemplate className="h-3.5 w-3.5" /> Portal Branding
          </TabsTrigger>
        </TabsList>

        {/* ─── Profile Tab ─── */}
        <TabsContent value="profile" className="space-y-4 mt-4">
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

              <Button onClick={handleSaveProfile} disabled={upsert.isPending} className="w-full sm:w-auto">
                {upsert.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

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
        </TabsContent>

        {/* ─── Workspace Tab ─── */}
        <TabsContent value="workspace" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> Workspace Settings
              </CardTitle>
              <CardDescription>Configure your agency identity across the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Agency Name</Label>
                <Input
                  placeholder="Onnify Works"
                  value={wsForm.agencyName}
                  onChange={(e) => setWsForm((f) => ({ ...f, agencyName: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Displayed in the sidebar header and portal emails</p>
              </div>

              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  placeholder="https://yourdomain.com/logo.png"
                  value={wsForm.logoUrl}
                  onChange={(e) => setWsForm((f) => ({ ...f, logoUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Optional — used in client portal header</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={wsForm.accentColor}
                      onChange={(e) => setWsForm((f) => ({ ...f, accentColor: e.target.value }))}
                      className="h-9 w-9 cursor-pointer rounded border p-0.5"
                    />
                    <Input
                      value={wsForm.accentColor}
                      onChange={(e) => setWsForm((f) => ({ ...f, accentColor: e.target.value }))}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Default Market</Label>
                  <Select value={wsForm.defaultMarket} onValueChange={(v) => setWsForm((f) => ({ ...f, defaultMarket: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SG">Singapore</SelectItem>
                      <SelectItem value="ID">Indonesia</SelectItem>
                      <SelectItem value="US">USA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveWorkspace} disabled={updateWorkspace.isPending} className="w-full sm:w-auto">
                {updateWorkspace.isPending ? "Saving..." : "Save Workspace Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Portal Branding Tab ─── */}
        <TabsContent value="portal" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LayoutTemplate className="h-4 w-4" /> Client Portal Branding
              </CardTitle>
              <CardDescription>Customize how your clients experience the portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Portal Title</Label>
                <Input
                  placeholder="Your Project Portal"
                  value={wsForm.portalTitle}
                  onChange={(e) => setWsForm((f) => ({ ...f, portalTitle: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Shown in the portal header instead of "Client Portal"</p>
              </div>

              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Textarea
                  placeholder="Welcome to your project dashboard. Here you can view deliverables, track progress, and communicate with our team."
                  rows={4}
                  value={wsForm.portalWelcomeMessage}
                  onChange={(e) => setWsForm((f) => ({ ...f, portalWelcomeMessage: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Shown below the portal header on first login</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Hide "Powered by Onnify Works"</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Remove the branding footer from client portals</p>
                </div>
                <Switch
                  checked={wsForm.hidePoweredBy}
                  onCheckedChange={(checked) => setWsForm((f) => ({ ...f, hidePoweredBy: checked }))}
                />
              </div>

              <Button onClick={handleSaveWorkspace} disabled={updateWorkspace.isPending} className="w-full sm:w-auto">
                {updateWorkspace.isPending ? "Saving..." : "Save Portal Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
