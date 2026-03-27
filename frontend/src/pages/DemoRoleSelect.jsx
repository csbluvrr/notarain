import React from "react";
import { useNavigate } from "react-router-dom";
import { demoUsers } from "../demo/demoData";
import { useDemoMode } from "../demo/DemoContext";

function IconScrollDoc() {
  return (
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M8 2h6l4 4v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}

function IconStamp() {
  return (
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="6.5" r="3" />
      <path d="M8 10.5h8v5.5a4 4 0 0 1-8 0v-5.5z" />
      <path d="M9.5 15l1.5 1.5 3.5-4" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M21 8a6 6 0 1 1-2-4.5" />
      <path d="M16 10l-4 4" />
      <path d="M12 14l-2 2" />
      <circle cx="6" cy="14" r="2" />
    </svg>
  );
}

function DemoRoleCard({ icon, roleKey, title, name, wallet, description, buttonLabel, onEnter }) {
  return (
    <button
      type="button"
      onClick={onEnter}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 28,
        textAlign: "center",
        cursor: "pointer",
        transition: "0.2s ease",
        width: "100%",
        color: "var(--text-primary)"
      }}
      className="demo-role-card"
      data-role={roleKey}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.boxShadow = "0 0 24px var(--accent-glow)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ color: "var(--accent)", marginBottom: 12, display: "flex", justifyContent: "center" }}>{icon}</div>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 26,
          marginBottom: 6
        }}
      >
        {title}
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 6 }}>{name}</div>
      <div style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "monospace", marginBottom: 14 }}>{wallet}</div>
      <div style={{ height: 1, background: "var(--border)", margin: "0 auto 14px", width: "80%" }} />
      <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, margin: 0, marginBottom: 18 }}>{description}</p>
      <div className="btn-primary" style={{ width: "100%", fontSize: 14, padding: "12px 24px" }}>
        {buttonLabel}
      </div>
    </button>
  );
}

export default function DemoRoleSelect() {
  const navigate = useNavigate();
  const { enterDemo } = useDemoMode();

  const goBack = () => navigate("/");

  const onEnter = (roleKey, path) => {
    enterDemo(roleKey);
    // Laisse DemoContext appliquer isDemoMode avant le guard /demo/*
    setTimeout(() => navigate(path), 0);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--black)"
      }}
    >
      <section style={{ width: "100%", maxWidth: 900, padding: "32px 24px" }}>
        <h1 style={{ fontSize: 42, textAlign: "center", marginBottom: 10, fontFamily: "'Cormorant Garamond', serif" }}>Choisir un rôle</h1>
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 15, marginBottom: 48, maxWidth: 620, marginInline: "auto" }}>
          Découvrez Notarain du point de vue de chaque participant
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16
          }}
          className="demo-role-grid"
        >
          <DemoRoleCard
            roleKey="testator"
            icon={<IconScrollDoc />}
            title="Testateur"
            name={demoUsers.testator.name}
            wallet="0x4959...8b51"
            description="Déposez des testaments chiffrés, désignez des bénéficiaires et enregistrez votre volonté de manière immuable sur la blockchain."
            buttonLabel="Entrer en tant que testateur"
            onEnter={() => onEnter("testator", "/demo/testator")}
          />
          <DemoRoleCard
            roleKey="notary"
            icon={<IconStamp />}
            title="Notaire"
            name={demoUsers.notary.name}
            wallet="0x7f3a...2c19"
            description="Examinez les testaments soumis, validez l’authenticité, approuvez ou rejetez les documents et confirmez l’exécution."
            buttonLabel="Entrer en tant que notaire"
            onEnter={() => onEnter("notary", "/demo/notary")}
          />
          <DemoRoleCard
            roleKey="heir"
            icon={<IconKey />}
            title="Héritier"
            name={demoUsers.heir.name}
            wallet="0x2b8e...a047"
            description="Consultez vos héritages et accédez aux documents déchiffrés une fois le testament exécuté."
            buttonLabel="Entrer en tant qu’héritier"
            onEnter={() => onEnter("heir", "/demo/heir")}
          />
        </div>

        <button type="button" className="btn-secondary" onClick={goBack} style={{ marginTop: 24, width: "fit-content" }}>
          ← Retour à l’accueil
        </button>
      </section>
    </main>
  );
}

