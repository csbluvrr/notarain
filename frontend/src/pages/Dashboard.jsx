import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../services/api";
import TestamentCard from "../components/TestamentCard";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [testaments, setTestaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await api.get("/api/testament/my");
        if (mounted) setTestaments(res?.data?.testaments || []);
      } catch (err) {
        toast.error(err?.response?.data?.error || err?.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Your Testaments</h2>
        <Link
          to="/upload"
          className="px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
        >
          Upload New Testament
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-white" />
        </div>
      ) : testaments.length === 0 ? (
        <div className="border border-gray-800 rounded-lg p-6 bg-gray-800/30 text-gray-300">
          No testaments found. Upload a new testament to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testaments.map((t) => (
            <TestamentCard key={t._id} testament={t} />
          ))}
        </div>
      )}
    </div>
  );
}

