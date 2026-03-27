import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

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

