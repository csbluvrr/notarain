import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import DashboardTestateur from "./pages/DashboardTestateur";
import DashboardNotaire from "./pages/DashboardNotaire";
import DashboardBeneficiaire from "./pages/DashboardBeneficiaire";
import AdminPanel from "./pages/AdminPanel";
import Page404 from "./pages/Page404";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: "#1E1E2E", color: "#F0EEF8",
          border: "1px solid #2A2A3D", borderRadius: "8px",
          fontSize: "14px", fontFamily: "Inter, sans-serif"
        }
      }} />
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={
              <ProtectedRoute role={["testator", "admin"]}>
                <DashboardTestateur />
              </ProtectedRoute>
            } />
            <Route path="/notary" element={
              <ProtectedRoute role="notary">
                <DashboardNotaire />
              </ProtectedRoute>
            } />
            <Route path="/heir" element={
              <ProtectedRoute role="heir">
                <DashboardBeneficiaire />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Page404 />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}