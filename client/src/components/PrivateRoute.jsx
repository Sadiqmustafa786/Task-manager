import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";

export function PrivateRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user ? children : <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
}
