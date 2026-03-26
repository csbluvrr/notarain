import React from "react";
import { Link } from "react-router-dom";

export default function Page404() {
  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-2xl font-bold mb-3">404 — Page introuvable</div>
        <p className="text-gray-300 mb-6">La page demandée n’existe pas.</p>
        <Link
          to="/"
          className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}

