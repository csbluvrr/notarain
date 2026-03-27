import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import NotaryDashboard from "./pages/NotaryDashboard";
import HeirDashboard from "./pages/HeirDashboard";
import DetailsTestament from "./pages/DetailsTestament";
import Page404 from "./pages/Page404";

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1E1E2E",
            color: "#F0EEF8",
            border: "1px solid #2A2A3D",
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: "Inter, sans-serif"
          }
        }}
      />
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role={["testator", "admin"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute role={["testator", "admin"]}>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notary"
              element={
                <ProtectedRoute role="notary">
                  <NotaryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/heir"
              element={
                <ProtectedRoute role="heir">
                  <HeirDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/testament/:id"
              element={
                <ProtectedRoute role={["testator", "admin", "notary", "heir"]}>
                  <DetailsTestament />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Page404 />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

