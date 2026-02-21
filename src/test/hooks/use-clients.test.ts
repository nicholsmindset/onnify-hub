import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useClients, useClient, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/use-clients";

// Mock supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOr = vi.fn();
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
                    or: (...orArgs: unknown[]) => {
                      mockOr(...orArgs);
                      return { data: [], error: null };
                    },
                    data: [],
                    error: null,
                  };
                },
                or: (...orArgs: unknown[]) => {
                  mockOr(...orArgs);
                  return { data: [], error: null };
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
                      client_id: "OW-SG-001",
                      company_name: "Test",
                      market: "SG",
                      industry: "Tech",
                      plan_tier: "Pro",
                      status: "Active",
                      primary_contact: "John",
                      monthly_value: 997,
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
                  client_id: "OW-SG-NEW",
                  company_name: "New Corp",
                  market: "SG",
                  industry: "Tech",
                  plan_tier: "Pro",
                  status: "Prospect",
                  primary_contact: "Jane",
                  monthly_value: 500,
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
                    client_id: "OW-SG-001",
                    company_name: "Updated Corp",
                    market: "SG",
                    industry: "Tech",
                    plan_tier: "Pro",
                    status: "Active",
                    primary_contact: "John",
                    monthly_value: 1500,
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

describe("useClients", () => {
  it("should fetch clients without filters", async () => {
    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("clients");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("should apply market filter", async () => {
    const { result } = renderHook(() => useClients({ market: "SG" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("market", "SG");
  });

  it("should skip market filter when 'all'", async () => {
    const { result } = renderHook(() => useClients({ market: "all" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).not.toHaveBeenCalledWith("market", "all");
  });

  it("should apply search filter with ilike", async () => {
    const { result } = renderHook(() => useClients({ search: "Prop" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockOr).toHaveBeenCalledWith(
      "company_name.ilike.%Prop%,client_id.ilike.%Prop%"
    );
  });
});

describe("useClient", () => {
  it("should fetch a single client by ID", async () => {
    const { result } = renderHook(() => useClient("1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("clients");
    expect(mockEq).toHaveBeenCalledWith("id", "1");
    expect(mockSingle).toHaveBeenCalled();
  });

  it("should not fetch when id is undefined", () => {
    const { result } = renderHook(() => useClient(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateClient", () => {
  it("should create a client", async () => {
    const { result } = renderHook(() => useCreateClient(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      companyName: "New Corp",
      market: "SG",
      industry: "Tech",
      planTier: "Pro",
      status: "Prospect",
      primaryContact: "Jane",
      monthlyValue: 500,
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("clients");
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("useUpdateClient", () => {
  it("should update a client", async () => {
    const { result } = renderHook(() => useUpdateClient(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "1",
      companyName: "Updated Corp",
      monthlyValue: 1500,
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("clients");
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("useDeleteClient", () => {
  it("should delete a client", async () => {
    const { result } = renderHook(() => useDeleteClient(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("1");

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("clients");
    expect(mockDelete).toHaveBeenCalled();
  });
});
