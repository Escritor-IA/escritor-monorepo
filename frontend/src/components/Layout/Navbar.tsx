import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { ProfileCard } from "./ProfileCard";
import { ConfirmDialog } from "@/components/UI/ConfirmDialog";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      logout();
      navigate("/login");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const plan = user?.user_plan;

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="logo">
            <span>Escritor</span>
            <span className="dot">.ai</span>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {plan && (
            <div className="credits" title="Créditos disponíveis">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
              </svg>
              <span className="num">{plan.credits}</span>
              <span>créditos</span>
            </div>
          )}

          {user && (
            <div ref={profileRef} style={{ position: "relative" }}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, color: "var(--ink-2)",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "var(--ink)", color: "var(--paper)",
                  display: "grid", placeItems: "center",
                  fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
                }}>
                  {user.first_name && user.last_name
                    ? (user.first_name[0] + user.last_name[0]).toUpperCase()
                    : user.username.slice(0, 2).toUpperCase()}
                </div>
                <span>{user.username}</span>
              </button>

              {profileOpen && plan && (
                <ProfileCard
                  user={user}
                  plan={plan}
                  onDeleteRequest={() => {
                    setProfileOpen(false);
                    setConfirmOpen(true);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="Excluir conta"
          description="Tem certeza que deseja excluir sua conta? Todos os seus projetos e dados serão removidos permanentemente."
          confirmLabel="Excluir conta"
          danger
          loading={deleting}
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </nav>
  );
}
