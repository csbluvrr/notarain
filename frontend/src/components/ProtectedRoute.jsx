import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-white" />
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

