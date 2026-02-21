import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
  useNotificationRules,
  useCreateNotificationRule,
  useUpdateNotificationRule,
  useDeleteNotificationRule,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/hooks/use-notifications";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

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
                limit: (...limArgs: unknown[]) => {
                  mockLimit(...limArgs);
                  return {
                    eq: (...eqArgs: unknown[]) => {
                      mockEq(...eqArgs);
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
                  name: "New Rule",
                  trigger_type: "overdue_deliverable",
                  channel: "email",
                  recipients: ["admin@example.com"],
                  is_active: true,
                  conditions: {},
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
              return {
                eq: (...eqArgs2: unknown[]) => {
                  mockEq(...eqArgs2);
                  return { error: null };
                },
                select: () => ({
                  single: () => ({
                    data: {
                      id: "1",
                      name: "Updated Rule",
                      trigger_type: "status_change",
                      channel: "both",
                      recipients: ["admin@example.com"],
                      is_active: false,
                      conditions: {},
                    },
                    error: null,
                  }),
                }),
                error: null,
              };
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

describe("useNotificationRules", () => {
  it("should fetch notification rules", async () => {
    const { result } = renderHook(() => useNotificationRules(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("notification_rules");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});

describe("useCreateNotificationRule", () => {
  it("should create a notification rule", async () => {
    const { result } = renderHook(() => useCreateNotificationRule(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: "New Rule",
      triggerType: "overdue_deliverable",
      channel: "email",
      recipients: ["admin@example.com"],
      isActive: true,
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("notification_rules");
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("useUpdateNotificationRule", () => {
  it("should update a notification rule", async () => {
    const { result } = renderHook(() => useUpdateNotificationRule(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "1",
      name: "Updated Rule",
      isActive: false,
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("notification_rules");
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("useDeleteNotificationRule", () => {
  it("should delete a notification rule", async () => {
    const { result } = renderHook(() => useDeleteNotificationRule(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("1");

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("notification_rules");
    expect(mockDelete).toHaveBeenCalled();
  });
});

describe("useNotifications", () => {
  it("should fetch notifications for a user email", async () => {
    const { result } = renderHook(() => useNotifications("user@example.com"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("notifications");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(50);
    expect(mockEq).toHaveBeenCalledWith("user_email", "user@example.com");
  });

  it("should not fetch when userEmail is undefined", () => {
    const { result } = renderHook(() => useNotifications(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useMarkNotificationRead", () => {
  it("should mark a single notification as read", async () => {
    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("notif-1");

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("notifications");
    expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
    expect(mockEq).toHaveBeenCalledWith("id", "notif-1");
  });
});

describe("useMarkAllRead", () => {
  it("should mark all unread notifications as read for a user", async () => {
    const { result } = renderHook(() => useMarkAllRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("user@example.com");

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith("notifications");
    expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
    expect(mockEq).toHaveBeenCalledWith("user_email", "user@example.com");
    expect(mockEq).toHaveBeenCalledWith("is_read", false);
  });
});
