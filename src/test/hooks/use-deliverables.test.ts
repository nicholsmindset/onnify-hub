import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
  useDeliverables,
  useDeliverable,
  useCreateDeliverable,
  useUpdateDeliverable,
  useDeleteDeliverable,
} from "@/hooks/use-deliverables";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

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
            eq: (...eqArgs: unknown[]) => {
              mockEq(...eqArgs);
              return {
                single: () => {
                  mockSingle();
                  return {
                    data: {
                      id: "1",
                      deliverable_id: "DEL-001",
                      client_id: "c1",
                      service_type: "SEO",
                      name: "Test Deliverable",
                      assigned_to: "Robert",
                      priority: "High",
                      status: "In Progress",
                      due_date: "2026-02-25",
                      client_approved: false,
                      market: "SG",
                    },
                    error: null,
                  };
                },
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
                  deliverable_id: "DEL-NEW",
                  client_id: "c1",
                  service_type: "CRM",
                  name: "New Deliverable",
                  assigned_to: "Lina",
                  priority: "Medium",
                  status: "Not Started",
                  due_date: "2026-03-01",
                  client_approved: false,
                  market: "ID",
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
                    deliverable_id: "DEL-001",
                    client_id: "c1",
                    service_type: "SEO",
                    name: "Updated Deliverable",
                    assigned_to: "Robert",
                    priority: "High",
                    status: "Delivered",
                    due_date: "2026-02-25",
                    client_approved: true,
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

describe("useDeliverables", () => {
  it("should fetch deliverables from deliverables_with_client view", async () => {
    const { result } = renderHook(() => useDeliverables(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("deliverables_with_client");
    expect(mockOrder).toHaveBeenCalledWith("due_date", { ascending: true });
  });

  it("should apply assignee filter", async () => {
    const { result } = renderHook(() => useDeliverables({ assignee: "Robert" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("assigned_to", "Robert");
  });

  it("should apply market filter", async () => {
    const { result } = renderHook(() => useDeliverables({ market: "SG" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("market", "SG");
  });

  it("should apply clientId filter", async () => {
    const { result } = renderHook(() => useDeliverables({ clientId: "c1" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("client_id", "c1");
  });

  it("should skip filters when 'all'", async () => {
    const { result } = renderHook(
      () => useDeliverables({ assignee: "all", market: "all" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).not.toHaveBeenCalled();
  });
});

describe("useDeliverable", () => {
  it("should fetch a single deliverable by ID", async () => {
    const { result } = renderHook(() => useDeliverable("1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("deliverables_with_client");
    expect(mockEq).toHaveBeenCalledWith("id", "1");
    expect(mockSingle).toHaveBeenCalled();
  });

  it("should not fetch when id is undefined", () => {
    const { result } = renderHook(() => useDeliverable(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateDeliverable", () => {
  it("should create a deliverable", async () => {
    const { result } = renderHook(() => useCreateDeliverable(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      clientId: "c1",
      serviceType: "CRM",
      name: "New Deliverable",
      assignedTo: "Lina",
      priority: "Medium",
      status: "Not Started",
      dueDate: "2026-03-01",
      market: "ID",
      clientApproved: false,
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("deliverables");
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("useUpdateDeliverable", () => {
  it("should update a deliverable", async () => {
    const { result } = renderHook(() => useUpdateDeliverable(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "1",
      status: "Delivered",
      clientApproved: true,
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("deliverables");
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("useDeleteDeliverable", () => {
  it("should delete a deliverable", async () => {
    const { result } = renderHook(() => useDeleteDeliverable(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("1");

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("deliverables");
    expect(mockDelete).toHaveBeenCalled();
  });
});
