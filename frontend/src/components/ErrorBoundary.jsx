import React from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep logging for debugging; prevents silent blank screens.
    // eslint-disable-next-line no-console
    console.error("Notarain UI crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-container">
          <div className="card" style={{ textAlign: "center", padding: "42px 24px" }}>
            <h1 className="page-title" style={{ fontSize: 34 }}>
              Une erreur est survenue
            </h1>
            <p className="page-subtitle" style={{ marginBottom: 16 }}>
              La page ne s’est pas chargée correctement. Revenez à l’accueil puis réessayez.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              <Link to="/" className="btn-primary">
                Retour à l’accueil
              </Link>
              <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
                Recharger la page
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

