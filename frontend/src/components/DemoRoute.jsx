import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useDemoMode } from "../demo/DemoContext";

export default function DemoRoute({ children }) {
  const location = useLocation();
  const { isDemoMode } = useDemoMode();

  const isDemoPath = location.pathname !== "/demo" && location.pathname.startsWith("/demo");

  if (!isDemoMode && isDemoPath) {
    return <Navigate to="/demo" replace />;
  }

  return children;
}

