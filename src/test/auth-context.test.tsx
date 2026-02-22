import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Mock Supabase auth
const mockSignOut = vi.fn().mockResolvedValue({});
let mockSession: { user: typeof mockUser } | null = null;
const mockSubscription = { unsubscribe: vi.fn() };
let authChangeCallback: (event: string, session: typeof mockSession) => void;

const mockUser = {
  id: "user-123",
  email: "admin@example.com",
  user_metadata: {
    full_name: "Admin User",
    role: "admin",
    avatar_url: "https://example.com/avatar.png",
  },
};

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession } }),
      onAuthStateChange: (cb: typeof authChangeCallback) => {
        authChangeCallback = cb;
        return { data: { subscription: mockSubscription } };
      },
      signOut: () => mockSignOut(),
    },
  },
}));

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthProvider, null, children);
  };
}

describe("AuthProvider and useAuth", () => {
  beforeEach(() => {
    mockSession = null;
    vi.clearAllMocks();
  });

  it("should throw error when used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
  });

  it("should provide auth context when signed in", async () => {
    mockSession = { user: mockUser };

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.profile).not.toBeNull();
    expect(result.current.profile?.id).toBe("user-123");
    expect(result.current.profile?.email).toBe("admin@example.com");
    expect(result.current.profile?.fullName).toBe("Admin User");
    expect(result.current.profile?.role).toBe("admin");
    expect(result.current.profile?.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("should show loading initially", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Initially loading is true before getSession resolves
    expect(result.current.isLoading).toBe(true);
  });

  it("should return null profile when not signed in", async () => {
    mockSession = null;

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.profile).toBeNull();
  });

  it("hasRole should return true for matching single role", async () => {
    mockSession = { user: mockUser };

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasRole("admin")).toBe(true);
    expect(result.current.hasRole("member")).toBe(false);
    expect(result.current.hasRole("viewer")).toBe(false);
  });

  it("hasRole should return true for matching role in array", async () => {
    mockSession = { user: mockUser };

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasRole(["admin", "member"])).toBe(true);
    expect(result.current.hasRole(["member", "viewer"])).toBe(false);
  });

  it("hasRole should return false when no profile", async () => {
    mockSession = null;

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasRole("admin")).toBe(false);
    expect(result.current.hasRole(["admin", "member"])).toBe(false);
  });

  it("signOut should call supabase signOut", async () => {
    mockSession = { user: mockUser };

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("should use email prefix as fallback when full_name is missing", async () => {
    mockSession = {
      user: {
        ...mockUser,
        user_metadata: { role: "member" },
      },
    };

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.profile?.fullName).toBe("admin");
  });

  it("should default role to 'member' when metadata has no role", async () => {
    mockSession = {
      user: {
        ...mockUser,
        user_metadata: { full_name: "Test User" },
      },
    };

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.profile?.role).toBe("member");
  });

  it("should unsubscribe on unmount", async () => {
    const { unmount } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    unmount();
    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });
});
