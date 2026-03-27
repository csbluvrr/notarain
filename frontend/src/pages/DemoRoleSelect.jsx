import React from "react";
import { useNavigate } from "react-router-dom";
import { demoUsers } from "../demo/demoData";
import { useDemoMode } from "../demo/DemoContext";

function RoleCard({ icon, title, name, wallet, description, onEnter }) {
  return (
    <button
      type="button"
      onClick={onEnter}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "28px 24px",
        textAlign: "center",
        cursor: "pointer",
        transition: "0.2s ease",
        width: "100%"
      }}
      className="role-card"
    >
      <div style={{ color: "var(--accent)", marginBottom: 8 }}>{icon}</div>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 22,
          marginBottom: 4
        }}
      >
        {title}
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 2 }}>{name}</div>
      <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 10 }}>{wallet}</div>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, minHeight: 60 }}>{description}</p>
      <div style={{ marginTop: 14 }}>
        <span className="btn-primary" style={{ fontSize: 14 }}>
          Enter as {title}
        </span>
      </div>
    </button>
  );
}

export default function DemoRoleSelect() {
  const navigate = useNavigate();
  const { enterDemo } = useDemoMode();

  const goBack = () => navigate("/");

  return (
    <main
      style={{
        minHeight: "100vh",
        paddingTop: 64,
        display: "grid",
        placeItems: "center",
        background: "var(--black)"
      }}
    >
      <section style={{ width: "100%", maxWidth: 600, padding: "32px 24px" }}>
        <button
          type="button"
          onClick={goBack}
          className="btn-secondary"
          style={{ padding: "6px 12px", fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}
        >
          ← Back
        </button>

        <h1 style={{ fontSize: 36, textAlign: "center", marginBottom: 6 }}>Choose a Role to Demo</h1>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 14,
            marginBottom: 40
          }}
        >
          Explore Notarain from each participant&apos;s perspective
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16
          }}
        >
          <RoleCard
            icon="📜"
            title="Testator"
            name={demoUsers.testator.name}
            wallet={demoUsers.testator.displayWallet}
            description="Upload and manage your testament. Designate heirs and register your will on the blockchain."
            onEnter={() => {
              enterDemo("testator");
              navigate("/demo/testator");
            }}
          />
          <RoleCard
            icon="🕯️"
            title="Notary"
            name={demoUsers.notary.name}
            wallet={demoUsers.notary.displayWallet}
            description="Review and validate submitted testaments. Approve or reject documents and confirm execution."
            onEnter={() => {
              enterDemo("notary");
              navigate("/demo/notary");
            }}
          />
          <RoleCard
            icon="🔑"
            title="Heir"
            name={demoUsers.heir.name}
            wallet={demoUsers.heir.displayWallet}
            description="Access your designated inheritance once the testament has been validated and executed."
            onEnter={() => {
              enterDemo("heir");
              navigate("/demo/heir");
            }}
          />
        </div>
      </section>
    </main>
  );
}

