import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-2xl font-bold mb-4">404 — Page not found</div>
        <Link
          to="/"
          className="px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

