import { Outlet } from "react-router-dom";

// Auth is deferred — allow all access for now
export function ProtectedRoute() {
  return <Outlet />;
}
