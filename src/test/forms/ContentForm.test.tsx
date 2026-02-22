import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContentForm } from "@/components/forms/ContentForm";

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

describe("ContentForm", () => {
  it("should render the title input", () => {
    const onSubmit = vi.fn();
    render(createElement(ContentForm, { onSubmit }), { wrapper: createWrapper() });
    expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
  });

  it("should render 'Update Content' button when defaultValues provided", () => {
    const onSubmit = vi.fn();
    const defaultValues = {
      id: "1",
      contentId: "CNT-001",
      title: "Blog Post",
      contentType: "Blog" as const,
      status: "Draft" as const,
      assignedTo: "Lina",
      dueDate: "2026-02-28",
      market: "SG" as const,
      clientId: "c1",
    };

    render(createElement(ContentForm, { defaultValues, onSubmit }), {
      wrapper: createWrapper(),
    });
    expect(screen.getByRole("button", { name: /update content/i })).toBeInTheDocument();
  });

  it("should populate title field with defaultValues", () => {
    const onSubmit = vi.fn();
    const defaultValues = {
      id: "1",
      contentId: "CNT-001",
      title: "My Blog Post",
      contentType: "Blog" as const,
      status: "Draft" as const,
      assignedTo: "Lina",
      dueDate: "2026-02-28",
      market: "SG" as const,
      clientId: "c1",
    };

    render(createElement(ContentForm, { defaultValues, onSubmit }), {
      wrapper: createWrapper(),
    });
    expect(screen.getByDisplayValue("My Blog Post")).toBeInTheDocument();
  });
});
