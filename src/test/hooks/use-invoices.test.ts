import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "@/hooks/use-invoices";

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
                  invoice_id: "INV-2026-NEW",
                  client_id: "c1",
                  month: "2026-03",
                  amount: 500,
                  currency: "SGD",
                  services_billed: "SEO",
                  status: "Draft",
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
                    invoice_id: "INV-2026-001",
                    client_id: "c1",
                    month: "2026-02",
                    amount: 1500,
                    currency: "SGD",
                    services_billed: "SEO + Content",
                    status: "Sent",
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

describe("useInvoices", () => {
  it("should fetch invoices from invoices_with_client view", async () => {
    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("invoices_with_client");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("should apply status filter", async () => {
    const { result } = renderHook(() => useInvoices({ status: "Paid" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("status", "Paid");
  });

  it("should skip status filter when 'all'", async () => {
    const { result } = renderHook(() => useInvoices({ status: "all" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).not.toHaveBeenCalledWith("status", "all");
  });

  it("should apply market filter", async () => {
    const { result } = renderHook(() => useInvoices({ market: "US" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("market", "US");
  });

  it("should apply clientId filter", async () => {
    const { result } = renderHook(() => useInvoices({ clientId: "c1" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith("client_id", "c1");
  });
});

describe("useCreateInvoice", () => {
  it("should create an invoice", async () => {
    const { result } = renderHook(() => useCreateInvoice(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      clientId: "c1",
      month: "2026-03",
      amount: 500,
      currency: "SGD",
      servicesBilled: "SEO",
      status: "Draft",
      market: "SG",
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("invoices");
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("useUpdateInvoice", () => {
  it("should update an invoice", async () => {
    const { result } = renderHook(() => useUpdateInvoice(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "1",
      amount: 1500,
      status: "Sent",
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("invoices");
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("useDeleteInvoice", () => {
  it("should delete an invoice", async () => {
    const { result } = renderHook(() => useDeleteInvoice(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("1");

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("invoices");
    expect(mockDelete).toHaveBeenCalled();
  });
});
