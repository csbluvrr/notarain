import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import useAuth from "../hooks/useAuth";
import ConnectWallet from "./ConnectWallet";

function truncateMiddle(text, left = 6, right = 4) {
  const s = String(text || "");
  if (!s) return "";
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
}

function roleBadge(role) {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "notary") return "bg-purple-700 text-white";
  if (normalized === "admin") return "bg-indigo-700 text-white";
  return "bg-gray-700 text-white";
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await logout();
      toast.success("Logged out");
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="w-full border-b border-gray-800 bg-gray-900/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-indigo-600 flex items-center justify-center font-bold">
            N
          </div>
          <div className="font-bold text-lg">Notarain</div>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm text-gray-300">
              {truncateMiddle(user.walletAddress)}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleBadge(user.role)}`}>
              {user.role}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition font-semibold"
            >
              Logout
            </button>
          </div>
        ) : (
          <ConnectWallet />
        )}
      </div>
    </div>
  );
}

