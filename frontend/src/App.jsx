import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import Accueil from "./pages/Accueil";
import ConnexionWallet from "./pages/ConnexionWallet";
import DashboardTestateur from "./pages/DashboardTestateur";
import DashboardNotaire from "./pages/DashboardNotaire";
import DashboardBeneficiaire from "./pages/DashboardBeneficiaire";
import UploadTestament from "./pages/UploadTestament";
import DetailsTestament from "./pages/DetailsTestament";
import Page404 from "./pages/Page404";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <div className="min-h-screen bg-gray-900">
          <Navbar />
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/connexion" element={<ConnexionWallet />} />
            <Route
              path="/testateur"
              element={
                <ProtectedRoute role={["testator", "admin"]}>
                  <DashboardTestateur />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute role={["testator", "admin"]}>
                  <UploadTestament />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notaire"
              element={
                <ProtectedRoute role="notary">
                  <DashboardNotaire />
                </ProtectedRoute>
              }
            />
            <Route
              path="/beneficiaire"
              element={
                <ProtectedRoute role="heir">
                  <DashboardBeneficiaire />
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

