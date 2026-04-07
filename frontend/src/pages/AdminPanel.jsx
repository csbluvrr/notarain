import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const { user, getContract } = useAuth();
  const [notaries, setNotaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ address: "", name: "", publicKey: "" });

  useEffect(() => { loadNotaries(); }, []);

  async function loadNotaries() {
    try {
      setLoading(true);
      const c = await getContract();
      const addrs = await c.getNotaries();
      const infos = await Promise.all(addrs.map(a => c.getNotaryInfo(a)));
      setNotaries(infos.map((n, i) => ({ ...n, address: addrs[i] })));
    } catch (e) {
      toast.error("Erreur: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addNotary() {
    if (!form.address || !form.name || !form.publicKey)
      return toast.error("Remplissez tous les champs");
    try {
      setAdding(true);
      const c = await getContract(true);
      const tx = await c.addNotary(form.address, form.name, form.publicKey);
      await tx.wait();
      toast.success("Notaire ajouté !");
      setForm({ address: "", name: "", publicKey: "" });
      loadNotaries();
    } catch (e) {
      toast.error("Erreur: " + (e.reason || e.message));
    } finally {
      setAdding(false);
    }
  }

  async function removeNotary(address) {
    try {
      const c = await getContract(true);
      const tx = await c.removeNotary(address);
      await tx.wait();
      toast.success("Notaire supprimé");
      loadNotaries();
    } catch (e) {
      toast.error("Erreur: " + (e.reason || e.message));
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Panel Admin</h1>
      <p className="page-subtitle">Gérez les notaires autorisés sur la blockchain</p>

      <div className="card" style={{ marginBottom: 32, borderColor: "var(--accent)" }}>
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>Ajouter un notaire</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <input
            className="input"
            placeholder="Adresse wallet (0x...)"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Nom du notaire"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Clé publique"
            value={form.publicKey}
            onChange={e => setForm(f => ({ ...f, publicKey: e.target.value }))}
          />
          <button className="btn-primary" onClick={addNotary} disabled={adding}>
            {adding ? <><span className="spinner" /> Ajout en cours...</> : "Ajouter le notaire"}
          </button>
        </div>
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 16 }}>Notaires enregistrés</h2>

      {loading ? (
        <div style={{ textAlign: "center" }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : notaries.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--text-muted)" }}>Aucun notaire enregistré.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {notaries.map((n, i) => (
            <div key={i} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{n.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{n.address}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 11,
                    background: n.isActive ? "var(--success-dim)" : "var(--danger-dim)",
                    border: `1px solid ${n.isActive ? "var(--success)" : "var(--danger)"}`,
                    color: n.isActive ? "var(--success)" : "var(--danger)"
                  }}>
                    {n.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
              {n.isActive && (
                <button className="btn-danger" style={{ padding: "8px 16px" }} onClick={() => removeNotary(n.address)}>
                  Supprimer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}