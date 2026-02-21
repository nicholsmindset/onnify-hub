import { createContext, useContext, ReactNode } from "react";
import { useUser, useClerk, useAuth as useClerkAuth } from "@clerk/clerk-react";
import type { UserProfile, UserRole } from "@/types";

interface AuthContextType {
  isSignedIn: boolean;
  isLoading: boolean;
  profile: UserProfile | null;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn, isLoaded: isAuthLoaded } = useClerkAuth();
  const { signOut: clerkSignOut } = useClerk();

  const isLoading = !isUserLoaded || !isAuthLoaded;

  const profile: UserProfile | null =
    user && isSignedIn
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
          fullName: user.fullName ?? user.firstName ?? "User",
          role: (user.publicMetadata?.role as UserRole) ?? "member",
          avatarUrl: user.imageUrl,
        }
      : null;

  const signOut = async () => {
    await clerkSignOut();
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!profile) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(profile.role);
  };

  return (
    <AuthContext.Provider value={{ isSignedIn: !!isSignedIn, isLoading, profile, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
