import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useDemoMode } from "../demo/DemoContext";

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const { isDemoMode, demoUser } = useDemoMode();

  if (isDemoMode) {
    const virtualUser = demoUser
      ? {
          walletAddress: demoUser.walletAddress,
          role: demoUser.role
        }
      : null;

    if (role && virtualUser?.role) {
      const allowed = Array.isArray(role) ? role : [role];
      if (!allowed.includes(virtualUser.role)) {
        return <Navigate to="/demo" replace />;
      }
    }

    return children ? children : <Outlet />;
  }

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen">
        <span className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  if (children) return children;
  return <Outlet />;
}

