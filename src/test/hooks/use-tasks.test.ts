import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";

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
          };
        },
        insert: (...insArgs: unknown[]) => {
          mockInsert(...insArgs);
          return {
            select: () => ({
              single: () => ({
                data: {
                  id: "new-1",
                  task_id: "TSK-NEW",
                  name: "New Task",
                  assigned_to: "Robert",
                  category: "Admin",
                  status: "To Do",
                  due_date: "2026-03-01",
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
                    task_id: "TSK-001",
                    name: "Updated Task",
                    assigned_to: "Lina",
                    category: "Content",
                    status: "In Progress",
                    due_date: "2026-03-01",
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

describe("useTasks", () => {
  it("should fetch tasks from tasks_with_relations view", async () => {
    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("tasks_with_relations");
    expect(mockOrder).toHaveBeenCalledWith("due_date", { ascending: true });
  });

  it("should apply assignee filter", async () => {
    const { result } = renderHook(() => useTasks({ assignee: "Robert" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("assigned_to", "Robert");
  });

  it("should skip assignee filter when 'all'", async () => {
    const { result } = renderHook(() => useTasks({ assignee: "all" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).not.toHaveBeenCalledWith("assigned_to", "all");
  });

  it("should apply category filter", async () => {
    const { result } = renderHook(() => useTasks({ category: "Content" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("category", "Content");
  });

  it("should apply clientId filter", async () => {
    const { result } = renderHook(() => useTasks({ clientId: "c1" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("client_id", "c1");
  });
});

describe("useCreateTask", () => {
  it("should create a task", async () => {
    const { result } = renderHook(() => useCreateTask(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: "New Task",
      assignedTo: "Robert",
      category: "Admin",
      status: "To Do",
      dueDate: "2026-03-01",
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("tasks");
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("useUpdateTask", () => {
  it("should update a task", async () => {
    const { result } = renderHook(() => useUpdateTask(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "1",
      name: "Updated Task",
      status: "In Progress",
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("tasks");
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("useDeleteTask", () => {
  it("should delete a task", async () => {
    const { result } = renderHook(() => useDeleteTask(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("1");

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("tasks");
    expect(mockDelete).toHaveBeenCalled();
  });
});
