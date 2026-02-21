import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InvoiceForm } from "@/components/forms/InvoiceForm";

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

describe("InvoiceForm", () => {
  it("should render key form fields", () => {
    const onSubmit = vi.fn();
    render(createElement(InvoiceForm, { onSubmit }), { wrapper: createWrapper() });

    expect(screen.getByLabelText(/^month$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^amount$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/services billed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment date/i)).toBeInTheDocument();
  });

  it("should render 'Create Invoice' button when no defaultValues", () => {
    const onSubmit = vi.fn();
    render(createElement(InvoiceForm, { onSubmit }), { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: /create invoice/i })).toBeInTheDocument();
  });

  it("should render 'Update Invoice' button when defaultValues provided", () => {
    const onSubmit = vi.fn();
    const defaultValues = {
      id: "1",
      invoiceId: "INV-2026-001",
      clientId: "c1",
      month: "2026-02",
      amount: 997,
      currency: "SGD" as const,
      servicesBilled: "SEO + Content",
      status: "Sent" as const,
      market: "SG" as const,
    };

    render(createElement(InvoiceForm, { defaultValues, onSubmit }), {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button", { name: /update invoice/i })).toBeInTheDocument();
  });

  it("should populate form fields with defaultValues", () => {
    const onSubmit = vi.fn();
    const defaultValues = {
      id: "1",
      invoiceId: "INV-2026-001",
      clientId: "c1",
      month: "2026-02",
      amount: 997,
      currency: "SGD" as const,
      servicesBilled: "SEO + Content",
      status: "Sent" as const,
      market: "SG" as const,
    };

    render(createElement(InvoiceForm, { defaultValues, onSubmit }), {
      wrapper: createWrapper(),
    });

    expect(screen.getByDisplayValue("2026-02")).toBeInTheDocument();
    expect(screen.getByDisplayValue("997")).toBeInTheDocument();
    expect(screen.getByDisplayValue("SEO + Content")).toBeInTheDocument();
  });

  it("should disable submit button when isLoading", () => {
    const onSubmit = vi.fn();
    render(createElement(InvoiceForm, { onSubmit, isLoading: true }), {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
  });

  it("should not submit when required fields are empty", async () => {
    const onSubmit = vi.fn();
    render(createElement(InvoiceForm, { onSubmit }), { wrapper: createWrapper() });

    const submitButton = screen.getByRole("button", { name: /create invoice/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
