import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Mock Clerk hooks
const mockUser = {
  id: "user-123",
  primaryEmailAddress: { emailAddress: "admin@example.com" },
  fullName: "Admin User",
  firstName: "Admin",
  imageUrl: "https://example.com/avatar.png",
  publicMetadata: { role: "admin" },
};

let mockIsSignedIn = true;
let mockIsUserLoaded = true;
let mockIsAuthLoaded = true;
let mockUserValue: typeof mockUser | null = mockUser;
const mockSignOut = vi.fn();

vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({
    user: mockUserValue,
    isLoaded: mockIsUserLoaded,
  }),
  useAuth: () => ({
    isSignedIn: mockIsSignedIn,
    isLoaded: mockIsAuthLoaded,
  }),
  useClerk: () => ({
    signOut: mockSignOut,
  }),
}));

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthProvider, null, children);
  };
}

describe("AuthProvider and useAuth", () => {
  it("should throw error when used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
  });

  it("should provide auth context when signed in", () => {
    mockIsSignedIn = true;
    mockIsUserLoaded = true;
    mockIsAuthLoaded = true;
    mockUserValue = mockUser;

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.profile).not.toBeNull();
    expect(result.current.profile?.id).toBe("user-123");
    expect(result.current.profile?.email).toBe("admin@example.com");
    expect(result.current.profile?.fullName).toBe("Admin User");
    expect(result.current.profile?.role).toBe("admin");
    expect(result.current.profile?.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("should show loading when user not loaded", () => {
    mockIsUserLoaded = false;
    mockIsAuthLoaded = true;

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("should show loading when auth not loaded", () => {
    mockIsUserLoaded = true;
    mockIsAuthLoaded = false;

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("should return null profile when not signed in", () => {
    mockIsSignedIn = false;
    mockIsUserLoaded = true;
    mockIsAuthLoaded = true;
    mockUserValue = null;

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.profile).toBeNull();
  });

  it("hasRole should return true for matching single role", () => {
    mockIsSignedIn = true;
    mockIsUserLoaded = true;
    mockIsAuthLoaded = true;
    mockUserValue = mockUser;

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasRole("admin")).toBe(true);
    expect(result.current.hasRole("member")).toBe(false);
    expect(result.current.hasRole("viewer")).toBe(false);
  });

  it("hasRole should return true for matching role in array", () => {
    mockIsSignedIn = true;
    mockIsUserLoaded = true;
    mockIsAuthLoaded = true;
    mockUserValue = mockUser;

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasRole(["admin", "member"])).toBe(true);
    expect(result.current.hasRole(["member", "viewer"])).toBe(false);
  });

  it("hasRole should return false when no profile", () => {
    mockIsSignedIn = false;
    mockIsUserLoaded = true;
    mockIsAuthLoaded = true;
    mockUserValue = null;

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasRole("admin")).toBe(false);
    expect(result.current.hasRole(["admin", "member"])).toBe(false);
  });

  it("signOut should call Clerk signOut", async () => {
    mockIsSignedIn = true;
    mockIsUserLoaded = true;
    mockIsAuthLoaded = true;
    mockUserValue = mockUser;

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await result.current.signOut();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("should use firstName as fallback when fullName is null", () => {
    mockIsSignedIn = true;
    mockIsUserLoaded = true;
    mockIsAuthLoaded = true;
    mockUserValue = {
      ...mockUser,
      fullName: null as unknown as string,
      firstName: "Admin",
    };

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.profile?.fullName).toBe("Admin");
  });

  it("should default role to 'member' when publicMetadata has no role", () => {
    mockIsSignedIn = true;
    mockIsUserLoaded = true;
    mockIsAuthLoaded = true;
    mockUserValue = {
      ...mockUser,
      publicMetadata: {},
    };

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.profile?.role).toBe("member");
  });
});
