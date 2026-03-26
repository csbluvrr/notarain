import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import useAuth from "../hooks/useAuth";

export default function Landing() {
  const { user, connectWallet, isNotary } = useAuth();
  const navigate = useNavigate();

  const onConnect = async () => {
    try {
      await connectWallet();
      toast.success("Connected successfully");
    } catch (err) {
      toast.error(err?.message || "Connection failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center px-4">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Notarain
        </h1>
        <p className="mt-4 text-lg text-gray-200">
          Decentralized Notarial Testament Platform
        </p>
        <p className="mt-6 text-gray-300 leading-relaxed">
          Register your testament securely, encrypt it with a passphrase, and
          move it through notary review and on-chain execution.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          {!user ? (
            <button
              type="button"
              onClick={onConnect}
              className="px-7 py-3 rounded-md bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
            >
              Connect Wallet
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-7 py-3 rounded-md bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
              >
                Go to Dashboard
              </button>
              {isNotary ? (
                <button
                  type="button"
                  onClick={() => navigate("/notary")}
                  className="px-7 py-3 rounded-md bg-purple-700 hover:bg-purple-600 transition font-semibold"
                >
                  Go to Notary Panel
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

