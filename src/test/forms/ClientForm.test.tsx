import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClientForm } from "@/components/forms/ClientForm";

vi.mock("@/hooks/use-clients", () => ({
  useClients: () => ({
    data: [],
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

describe("ClientForm", () => {
  it("should render key form fields", () => {
    const onSubmit = vi.fn();
    render(createElement(ClientForm, { onSubmit }), { wrapper: createWrapper() });

    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^industry$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/primary contact/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly value/i)).toBeInTheDocument();
  });

  it("should render 'Create Client' button when no defaultValues", () => {
    const onSubmit = vi.fn();
    render(createElement(ClientForm, { onSubmit }), { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: /create client/i })).toBeInTheDocument();
  });

  it("should render 'Update Client' button when defaultValues provided", () => {
    const onSubmit = vi.fn();
    const defaultValues = {
      id: "1",
      clientId: "OW-SG-001",
      companyName: "Test Corp",
      market: "SG" as const,
      industry: "Tech",
      planTier: "Pro" as const,
      status: "Active" as const,
      primaryContact: "John",
      monthlyValue: 997,
    };

    render(createElement(ClientForm, { defaultValues, onSubmit }), {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button", { name: /update client/i })).toBeInTheDocument();
  });

  it("should populate form fields with defaultValues", () => {
    const onSubmit = vi.fn();
    const defaultValues = {
      id: "1",
      clientId: "OW-SG-001",
      companyName: "Acme Corp",
      market: "SG" as const,
      industry: "Tech",
      planTier: "Pro" as const,
      status: "Active" as const,
      primaryContact: "John Doe",
      monthlyValue: 997,
    };

    render(createElement(ClientForm, { defaultValues, onSubmit }), {
      wrapper: createWrapper(),
    });

    expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tech")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("997")).toBeInTheDocument();
  });

  it("should disable submit button when isLoading", () => {
    const onSubmit = vi.fn();
    render(createElement(ClientForm, { onSubmit, isLoading: true }), {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
  });

  it("should not submit with empty required fields", async () => {
    const onSubmit = vi.fn();
    render(createElement(ClientForm, { onSubmit }), { wrapper: createWrapper() });

    const companyNameInput = screen.getByLabelText(/company name/i);
    fireEvent.change(companyNameInput, { target: { value: "" } });

    const submitButton = screen.getByRole("button", { name: /create client/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("should render contract date fields", () => {
    const onSubmit = vi.fn();
    render(createElement(ClientForm, { onSubmit }), { wrapper: createWrapper() });

    expect(screen.getByLabelText(/contract start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contract end/i)).toBeInTheDocument();
  });

  it("should render GHL URL field", () => {
    const onSubmit = vi.fn();
    render(createElement(ClientForm, { onSubmit }), { wrapper: createWrapper() });

    expect(screen.getByLabelText(/gohighlevel url/i)).toBeInTheDocument();
  });
});
