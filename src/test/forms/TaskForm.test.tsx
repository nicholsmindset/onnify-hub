import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TaskForm } from "@/components/forms/TaskForm";

vi.mock("@/hooks/use-clients", () => ({
  useClients: () => ({
    data: [
      { id: "c1", clientId: "OW-SG-001", companyName: "PropNex Realty" },
    ],
    isLoading: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("TaskForm", () => {
  it("should render the task name input", () => {
    const onSubmit = vi.fn();
    render(createElement(TaskForm, { onSubmit }), { wrapper: createWrapper() });
    expect(screen.getByLabelText(/task name/i)).toBeInTheDocument();
  });

  it("should render 'Update Task' button when defaultValues provided", () => {
    const onSubmit = vi.fn();
    const defaultValues = {
      id: "1",
      taskId: "TSK-001",
      name: "Test Task",
      assignedTo: "Robert",
      category: "Admin" as const,
      status: "To Do" as const,
      dueDate: "2026-02-21",
      clientId: "c1",
    };

    render(createElement(TaskForm, { defaultValues, onSubmit }), {
      wrapper: createWrapper(),
    });
    expect(screen.getByRole("button", { name: /update task/i })).toBeInTheDocument();
  });

  it("should populate name field with defaultValues", () => {
    const onSubmit = vi.fn();
    const defaultValues = {
      id: "1",
      taskId: "TSK-001",
      name: "Write blog post",
      assignedTo: "Lina",
      category: "Content" as const,
      status: "In Progress" as const,
      dueDate: "2026-02-22",
      notes: "Draft #3",
      clientId: "c1",
    };

    render(createElement(TaskForm, { defaultValues, onSubmit }), {
      wrapper: createWrapper(),
    });
    expect(screen.getByDisplayValue("Write blog post")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Draft #3")).toBeInTheDocument();
  });
});
