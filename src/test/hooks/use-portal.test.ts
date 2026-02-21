import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
  usePortalAccessList,
  useCreatePortalAccess,
  useTogglePortalAccess,
  useDeletePortalAccess,
} from "@/hooks/use-portal";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => {
      mockFrom(...args);
      return {
        select: (...selArgs: unknown[]) => {
          mockSelect(...selArgs);
          return {
            order: (...ordArgs: unknown[]) => {
              mockOrder(...ordArgs);
              return { data: [], error: null };
            },
            eq: () => ({
              eq: () => ({
                single: () => ({
                  data: {
                    id: "1",
                    client_id: "c1",
                    access_token: "token123",
                    contact_email: "client@example.com",
                    contact_name: "Client",
                    is_active: true,
                  },
                  error: null,
                }),
              }),
            }),
          };
        },
        insert: (...insArgs: unknown[]) => {
          mockInsert(...insArgs);
          return {
            select: () => ({
              single: () => ({
                data: {
                  id: "new-1",
                  client_id: "c1",
                  access_token: "generated-token",
                  contact_email: "new@example.com",
                  contact_name: "New Client",
                  is_active: true,
                },
                error: null,
              }),
            }),
          };
        },
        update: (...updArgs: unknown[]) => {
          mockUpdate(...updArgs);
          return {
            eq: (...eqArgs: unknown[]) => {
              mockEq(...eqArgs);
              return { error: null };
            },
          };
        },
        delete: () => {
          mockDelete();
          return {
            eq: () => ({ error: null }),
          };
        },
      };
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePortalAccessList", () => {
  it("should fetch portal access list", async () => {
    const { result } = renderHook(() => usePortalAccessList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("portal_access");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});

describe("useCreatePortalAccess", () => {
  it("should create portal access with auto-generated token", async () => {
    const { result } = renderHook(() => useCreatePortalAccess(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      clientId: "c1",
      contactEmail: "new@example.com",
      contactName: "New Client",
      isActive: true,
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("portal_access");
    expect(mockInsert).toHaveBeenCalled();

    // Verify that access_token was generated (it should be part of the inserted row)
    const insertedRow = mockInsert.mock.calls[0]?.[0];
    expect(insertedRow).toBeDefined();
    if (insertedRow) {
      expect(insertedRow.access_token).toBeDefined();
      expect(typeof insertedRow.access_token).toBe("string");
      expect(insertedRow.access_token.length).toBe(64); // Two UUIDs without dashes
    }
  });
});

describe("useTogglePortalAccess", () => {
  it("should toggle portal access active state", async () => {
    const { result } = renderHook(() => useTogglePortalAccess(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: "1", isActive: false });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("portal_access");
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    expect(mockEq).toHaveBeenCalledWith("id", "1");
  });

  it("should enable portal access", async () => {
    const { result } = renderHook(() => useTogglePortalAccess(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: "1", isActive: true });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith({ is_active: true });
  });
});

describe("useDeletePortalAccess", () => {
  it("should delete portal access", async () => {
    const { result } = renderHook(() => useDeletePortalAccess(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("1");

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("portal_access");
    expect(mockDelete).toHaveBeenCalled();
  });
});
