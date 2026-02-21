import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { UserProfile, UserRole, mapUserProfile } from "@/types";
import { DEMO_PROFILE, isDemoMode, enableDemoMode, disableDemoMode } from "@/lib/demo-data";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInDemo: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error || !data) return null;
    return mapUserProfile(data as Record<string, unknown>);
  };

  useEffect(() => {
    if (isDemoMode()) {
      setIsDemo(true);
      setProfile(DEMO_PROFILE);
      setSession({ user: { id: "demo-user-001" } } as Session);
      setUser({ id: "demo-user-001", email: "demo@onnify.com" } as User);
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).then(setProfile);
      }
      setIsLoading(false);
    }).catch(() => {
      // Supabase not configured — allow login page to render
      setIsLoading(false);
    });

    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const result = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchProfile(s.user.id).then(setProfile);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      });
      subscription = result.data.subscription;
    } catch {
      // Supabase not configured
    }

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from("user_profiles").insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: "member",
      });
    }
  };

  const signInDemo = () => {
    enableDemoMode();
    setIsDemo(true);
    setProfile(DEMO_PROFILE);
    setSession({ user: { id: "demo-user-001" } } as Session);
    setUser({ id: "demo-user-001", email: "demo@onnify.com" } as User);
  };

  const signOut = async () => {
    if (isDemo) {
      disableDemoMode();
      setIsDemo(false);
      setSession(null);
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setProfile(null);
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!profile) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(profile.role);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, isDemo, signIn, signUp, signOut, signInDemo, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
