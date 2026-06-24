import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import type { User, UserPlan } from "@/types";

const PLAN_COLORS: Record<string, string> = {
  free: "var(--ink-3)",
  basic: "var(--amber)",
  premium: "var(--green)",
};

interface Props {
  user: User;
  plan: UserPlan;
  onDeleteRequest: () => void;
}

export function ProfileCard({ user, plan, onDeleteRequest }: Props) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 10px)", right: 0,
      width: 220, background: "var(--paper)",
      border: "1px solid var(--border)", borderRadius: 10,
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      padding: "14px 16px", zIndex: 100,
    }}>
      {/* identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: "var(--ink)", color: "var(--paper)",
          display: "grid", placeItems: "center",
          fontSize: 13, fontWeight: 600, letterSpacing: 0.5,
        }}>
          {user.first_name && user.last_name
            ? (user.first_name[0] + user.last_name[0]).toUpperCase()
            : user.username.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          {(user.first_name || user.last_name) && (
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {[user.first_name, user.last_name].filter(Boolean).join(" ")}
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </div>
        </div>
      </div>

      {/* plan & credits */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink-3)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {t("nav.plan")}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: PLAN_COLORS[plan.plan] ?? "var(--ink-3)", textTransform: "uppercase" }}>
            {t(`plans.${plan.plan}`, plan.plan)}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink-3)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <polyline points="12 7 12 12 14.5 14.5"/>
            </svg>
            {t("nav.credits_label")}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>
            {plan.credits}
          </span>
        </div>

        {plan.billing_cycle && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{t("nav.billing_cycle")}</span>
            <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
              {plan.billing_cycle === "monthly" ? t("nav.monthly") : t("nav.annual")}
            </span>
          </div>
        )}

        {plan.expires_at && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{t("nav.valid_until")}</span>
            <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
              {new Date(plan.expires_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* actions */}
      <div style={{ borderTop: "1px solid var(--border)", marginTop: 10, paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            width: "100%", fontSize: 12, color: "var(--ink-3)",
            background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {t("nav.logout")}
        </button>
        <button
          onClick={onDeleteRequest}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            width: "100%", fontSize: 12, color: "var(--red)",
            background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          {t("nav.delete_account")}
        </button>
      </div>
    </div>
  );
}
