import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useContent, useCreateContent, useUpdateContent, useDeleteContent } from "@/hooks/use-content";

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
              return {
                eq: (...eqArgs: unknown[]) => {
                  mockEq(...eqArgs);
                  return {
                    eq: (...eqArgs2: unknown[]) => {
                      mockEq(...eqArgs2);
                      return {
                        eq: (...eqArgs3: unknown[]) => {
                          mockEq(...eqArgs3);
                          return { data: [], error: null };
                        },
                        data: [],
                        error: null,
                      };
                    },
                    data: [],
                    error: null,
                  };
                },
                data: [],
                error: null,
              };
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
                  content_id: "CNT-NEW",
                  title: "New Post",
                  content_type: "Blog",
                  status: "Draft",
                  assigned_to: "Lina",
                  due_date: "2026-03-01",
                  market: "SG",
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
                    content_id: "CNT-001",
                    title: "Updated Post",
                    content_type: "Blog",
                    status: "Review",
                    assigned_to: "Lina",
                    due_date: "2026-03-01",
                    market: "SG",
                  },
                  error: null,
                }),
              }),
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

describe("useContent", () => {
  it("should fetch content from content_with_client view", async () => {
    const { result } = renderHook(() => useContent(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("content_with_client");
    expect(mockOrder).toHaveBeenCalledWith("due_date", { ascending: true });
  });

  it("should apply assignee filter", async () => {
    const { result } = renderHook(() => useContent({ assignee: "Lina" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("assigned_to", "Lina");
  });

  it("should apply market filter", async () => {
    const { result } = renderHook(() => useContent({ market: "SG" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("market", "SG");
  });

  it("should apply status filter", async () => {
    const { result } = renderHook(() => useContent({ status: "Draft" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("status", "Draft");
  });

  it("should apply contentType filter", async () => {
    const { result } = renderHook(() => useContent({ contentType: "Blog" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("content_type", "Blog");
  });

  it("should skip all filters when 'all'", async () => {
    const { result } = renderHook(
      () => useContent({ assignee: "all", market: "all", status: "all", contentType: "all" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).not.toHaveBeenCalled();
  });
});

describe("useCreateContent", () => {
  it("should create content", async () => {
    const { result } = renderHook(() => useCreateContent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: "New Post",
      contentType: "Blog",
      status: "Draft",
      assignedTo: "Lina",
      dueDate: "2026-03-01",
      market: "SG",
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("content_items");
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("useUpdateContent", () => {
  it("should update content", async () => {
    const { result } = renderHook(() => useUpdateContent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "1",
      title: "Updated Post",
      status: "Review",
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("content_items");
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("useDeleteContent", () => {
  it("should delete content", async () => {
    const { result } = renderHook(() => useDeleteContent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("1");

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("content_items");
    expect(mockDelete).toHaveBeenCalled();
  });
});
