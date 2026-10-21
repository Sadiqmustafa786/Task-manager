import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";

export function AuthCallbackView() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const userParam = params.get("user");

    if (token && userParam) {
      const user = JSON.parse(decodeURIComponent(userParam));
      login(token, user);
      const returnTo = sessionStorage.getItem("auth:returnTo");
      sessionStorage.removeItem("auth:returnTo");
      navigate(returnTo?.startsWith("/") ? returnTo : "/dashboard", { replace: true });
    } else {
      navigate("/login");
    }
  }, [location.search, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}
