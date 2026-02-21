import { createContext, useContext, useState, ReactNode } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { DEMO_PROFILE, isDemoMode, enableDemoMode, disableDemoMode } from "@/lib/demo-data";
import type { UserRole } from "@/types";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
}

interface AuthContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isDemo: boolean;
  isSignedIn: boolean;
  signInDemo: () => void;
  signOutDemo: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [isDemo, setIsDemo] = useState(isDemoMode());

  const profile: UserProfile | null = isDemo
    ? DEMO_PROFILE
    : isSignedIn && user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
          fullName: user.fullName ?? user.firstName ?? "User",
          role: "admin" as UserRole,
          avatarUrl: user.imageUrl,
        }
      : null;

  const signInDemo = () => {
    enableDemoMode();
    setIsDemo(true);
  };

  const signOutDemo = () => {
    disableDemoMode();
    setIsDemo(false);
  };

  const signOut = async () => {
    if (isDemo) {
      signOutDemo();
      return;
    }
    await clerkSignOut();
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!profile) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(profile.role);
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading: !isDemo && !isLoaded,
        isDemo,
        isSignedIn: isDemo || !!isSignedIn,
        signInDemo,
        signOutDemo: signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
