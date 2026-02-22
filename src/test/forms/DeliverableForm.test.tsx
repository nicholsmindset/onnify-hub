import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DeliverableForm } from "@/components/forms/DeliverableForm";

// Mock useClients hook
vi.mock("@/hooks/use-clients", () => ({
  useClients: () => ({
    data: [
      { id: "c1", clientId: "OW-SG-001", companyName: "PropNex Realty" },
      { id: "c2", clientId: "OW-SG-002", companyName: "LiHO Tea" },
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

describe("DeliverableForm", () => {
  it("should render key form fields", () => {
    const onSubmit = vi.fn();
    render(createElement(DeliverableForm, { onSubmit }), { wrapper: createWrapper() });

    expect(screen.getByLabelText(/deliverable name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("should render 'Create Deliverable' button when no defaultValues", () => {
    const onSubmit = vi.fn();
    render(createElement(DeliverableForm, { onSubmit }), { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: /create deliverable/i })).toBeInTheDocument();
  });

  it("should render 'Update Deliverable' button when defaultValues provided", () => {
    const onSubmit = vi.fn();
    const defaultValues = {
      id: "1",
      deliverableId: "DEL-001",
      clientId: "c1",
      serviceType: "SEO" as const,
      name: "Q1 Audit",
      assignedTo: "Robert",
      priority: "High" as const,
      status: "In Progress" as const,
      dueDate: "2026-02-25",
      clientApproved: false,
      market: "SG" as const,
    };

    render(createElement(DeliverableForm, { defaultValues, onSubmit }), {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button", { name: /update deliverable/i })).toBeInTheDocument();
  });

  it("should populate name field with defaultValues", () => {
    const onSubmit = vi.fn();
    const defaultValues = {
      id: "1",
      deliverableId: "DEL-001",
      clientId: "c1",
      serviceType: "SEO" as const,
      name: "Q1 SEO Audit Report",
      assignedTo: "Robert",
      priority: "High" as const,
      status: "In Progress" as const,
      dueDate: "2026-02-25",
      clientApproved: false,
      market: "SG" as const,
    };

    render(createElement(DeliverableForm, { defaultValues, onSubmit }), {
      wrapper: createWrapper(),
    });

    expect(screen.getByDisplayValue("Q1 SEO Audit Report")).toBeInTheDocument();
  });

  it("should disable submit button when isLoading", () => {
    const onSubmit = vi.fn();
    render(createElement(DeliverableForm, { onSubmit, isLoading: true }), {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
  });

  it("should not submit when required fields are empty", async () => {
    const onSubmit = vi.fn();
    render(createElement(DeliverableForm, { onSubmit }), { wrapper: createWrapper() });

    const submitButton = screen.getByRole("button", { name: /create deliverable/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
