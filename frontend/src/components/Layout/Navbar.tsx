import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="logo">
            <span>Escritor</span><span className="dot">.ai</span>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {user && (
            <div className="credits" title="Créditos disponíveis">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
              </svg>
              <span className="num">{user.credits_balance}</span>
              <span>créditos</span>
            </div>
          )}

          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-2)" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--ink)", color: "var(--paper)",
                display: "grid", placeItems: "center",
                fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
              }}>
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <span>{user.username}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
