import React, { createContext, useContext, useMemo, useState } from "react";
import {
  demoUsers,
  demoTestaments as baseTestaments,
  demoPendingTestaments as basePending,
  demoAllNotaryTestaments as baseAllNotary,
  demoHeirTestaments
} from "./demoData";

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState(null);
  const [demoUser, setDemoUser] = useState(null);
  const [demoTestaments, setDemoTestaments] = useState(baseTestaments);
  const [demoPending, setDemoPending] = useState(basePending);
  const [demoAllNotary, setDemoAllNotary] = useState(baseAllNotary);

  const enterDemo = (role) => {
    const normalized = String(role || "").toLowerCase();
    if (!demoUsers[normalized]) return;
    setIsDemoMode(true);
    setDemoRole(normalized);
    setDemoUser(demoUsers[normalized]);
    setDemoTestaments(baseTestaments);
    setDemoPending(basePending);
    setDemoAllNotary(baseAllNotary);
  };

  const exitDemo = () => {
    setIsDemoMode(false);
    setDemoRole(null);
    setDemoUser(null);
    setDemoTestaments(baseTestaments);
    setDemoPending(basePending);
    setDemoAllNotary(baseAllNotary);
  };

  const approveTestament = (id) => {
    setDemoPending((prev) => prev.filter((t) => t._id !== id));
    setDemoAllNotary((prev) =>
      prev.map((t) => (t._id === id ? { ...t, status: "approved" } : t))
    );
    setDemoTestaments((prev) =>
      prev.map((t) => (t._id === id ? { ...t, status: "approved" } : t))
    );
  };

  const rejectTestament = (id) => {
    setDemoPending((prev) => prev.filter((t) => t._id !== id));
    setDemoAllNotary((prev) =>
      prev.map((t) => (t._id === id ? { ...t, status: "rejected" } : t))
    );
    setDemoTestaments((prev) =>
      prev.map((t) => (t._id === id ? { ...t, status: "rejected" } : t))
    );
  };

  const executeTestament = (id) => {
    setDemoAllNotary((prev) =>
      prev.map((t) => (t._id === id ? { ...t, status: "executed" } : t))
    );
    setDemoTestaments((prev) =>
      prev.map((t) => (t._id === id ? { ...t, status: "executed" } : t))
    );
  };

  const addDemoTestament = (testament) => {
    setDemoTestaments((prev) => [testament, ...prev]);
    if (testament.status === "pending") {
      setDemoPending((prev) => [testament, ...prev]);
      setDemoAllNotary((prev) => [testament, ...prev]);
    }
  };

  const value = useMemo(
    () => ({
      isDemoMode,
      demoRole,
      demoUser,
      demoTestaments,
      demoPending,
      demoAllNotary,
      demoHeirTestaments,
      enterDemo,
      exitDemo,
      approveTestament,
      rejectTestament,
      executeTestament,
      addDemoTestament
    }),
    [isDemoMode, demoRole, demoUser, demoTestaments, demoPending, demoAllNotary]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoMode() {
  return useContext(DemoContext);
}

export default DemoContext;

