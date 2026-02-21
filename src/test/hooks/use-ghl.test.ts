import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
  useGhlConnections,
  useCreateGhlConnection,
  useUpdateGhlConnection,
  useDeleteGhlConnection,
} from "@/hooks/use-ghl";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
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
                  sync_enabled: true,
                  sync_status: "connected",
                  contacts_synced: 0,
                  pipelines_synced: 0,
                },
                error: null,
              }),
            }),
          };
        },
        update: (...updArgs: unknown[]) => {
          mockUpdate(...updArgs);
          return {
            eq: () => ({
              select: () => ({
                single: () => ({
                  data: {
                    id: "1",
                    client_id: "c1",
                    sync_enabled: true,
                    sync_status: "connected",
                    contacts_synced: 42,
                    pipelines_synced: 3,
                  },
                  error: null,
                }),
              }),
              data: null,
              error: null,
            }),
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

describe("useGhlConnections", () => {
  it("should fetch GHL connections from ghl_connections_with_client view", async () => {
    const { result } = renderHook(() => useGhlConnections(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("ghl_connections_with_client");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});

describe("useCreateGhlConnection", () => {
  it("should create a GHL connection", async () => {
    const { result } = renderHook(() => useCreateGhlConnection(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      clientId: "c1",
      syncEnabled: true,
      syncStatus: "connected",
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("ghl_connections");
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("useUpdateGhlConnection", () => {
  it("should update a GHL connection", async () => {
    const { result } = renderHook(() => useUpdateGhlConnection(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "1",
      syncEnabled: false,
      syncStatus: "disconnected",
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("ghl_connections");
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("useDeleteGhlConnection", () => {
  it("should delete a GHL connection", async () => {
    const { result } = renderHook(() => useDeleteGhlConnection(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("1");

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("ghl_connections");
    expect(mockDelete).toHaveBeenCalled();
  });
});
