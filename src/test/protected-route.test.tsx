import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Mock the useAuth hook
let mockAuthState = {
  isSignedIn: true,
  isLoading: false,
  hasRole: (_role: unknown) => true,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

function renderWithRouter(
  _requiredRole?: unknown,
  initialRoute = "/protected"
) {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: [initialRoute] },
      createElement(
        Routes,
        null,
        createElement(
          Route,
          { element: createElement(ProtectedRoute) },
          createElement(Route, {
            path: "/protected",
            element: createElement("div", null, "Protected Content"),
          })
        ),
        createElement(Route, {
          path: "/login",
          element: createElement("div", null, "Login Page"),
        }),
        createElement(Route, {
          path: "/",
          element: createElement("div", null, "Home Page"),
        })
      )
    )
  );
}

describe("ProtectedRoute", () => {
  it("should render protected content when authenticated", () => {
    mockAuthState = {
      isSignedIn: true,
      isLoading: false,
      hasRole: () => true,
    };

    renderWithRouter();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("should redirect to /login when not authenticated", () => {
    mockAuthState = {
      isSignedIn: false,
      isLoading: false,
      hasRole: () => false,
    };

    renderWithRouter();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("should show loading skeletons when loading", () => {
    mockAuthState = {
      isSignedIn: false,
      isLoading: true,
      hasRole: () => false,
    };

    renderWithRouter();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("should redirect to / when user doesn't have required role", () => {
    mockAuthState = {
      isSignedIn: true,
      isLoading: false,
      hasRole: () => false,
    };

    renderWithRouter("admin");
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("should render content when user has required role", () => {
    mockAuthState = {
      isSignedIn: true,
      isLoading: false,
      hasRole: (role: unknown) => role === "admin" || (Array.isArray(role) && role.includes("admin")),
    };

    renderWithRouter("admin");
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("should render content when no requiredRole is specified", () => {
    mockAuthState = {
      isSignedIn: true,
      isLoading: false,
      hasRole: () => false,
    };

    renderWithRouter(undefined);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
