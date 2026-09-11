import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { LanguageSelector } from "@/components/UI/LanguageSelector";
import { GoogleAuthBlock } from "@/components/Auth/GoogleAuthBlock";

function AuthShell({
  children,
  eyebrow,
  title,
  sub,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
        background: "var(--paper)",
      }}
    >
      {/* Left: editorial pane */}
      <aside
        style={{
          position: "relative",
          background: "linear-gradient(180deg, #1a1640 0%, #251f55 100%)",
          color: "var(--paper)",
          padding: "48px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 600 800"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, opacity: 0.55 }}
        >
          <g stroke="#4ee8a3" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M-20 200 C 200 200, 280 230, 520 160" opacity="0.5" />
            <path d="M-20 240 C 220 250, 320 290, 560 240" opacity="0.35" />
            <path d="M-20 290 C 180 310, 350 340, 540 320" opacity="0.2" />
          </g>
          <g fill="#4ee8a3">
            <path d="M40 560 L60 540 L80 560 L60 580 Z" opacity="0.18" />
          </g>
        </svg>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            className="logo"
            style={{ color: "var(--paper)", fontSize: 24 }}
          >
            <span>Escritor</span>
            <span style={{ color: "#4ee8a3", fontStyle: "italic" }}>.ai</span>
          </span>
        </div>

        <div style={{ position: "relative" }}>
          <div className="eyebrow" style={{ color: "#4ee8a3" }}>
            <span
              style={{
                background: "#4ee8a3",
                height: 1,
                width: 24,
                display: "inline-block",
              }}
            />
            {t("auth.manuscript_no")}
          </div>
          <h1
            className="serif"
            style={{
              marginTop: 16,
              fontSize: 44,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.06,
            }}
          >
            {t("auth.hero_quote")}<br />
            <em style={{ fontWeight: 400 }}>{t("auth.hero_quote_em")}</em>
          </h1>
          <p
            className="serif"
            style={{
              marginTop: 18,
              fontSize: 17,
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.7)",
              maxWidth: 460,
            }}
          >
            {t("auth.hero_paragraph")}
          </p>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            color: "rgba(255,255,255,0.55)",
            fontFamily: "var(--mono)",
            fontSize: 12,
            letterSpacing: "0.04em",
          }}
        >
          <div>{t("auth.version")}</div>
          <div>{t("auth.version_sub")}</div>
        </div>
      </aside>

      {/* Right: form */}
      <main
        style={{
          padding: "48px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          minHeight: "100vh",
        }}
      >
        {/* Language selector top-right */}
        <div style={{ position: "absolute", top: 24, right: 32 }}>
          <LanguageSelector />
        </div>

        <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
          {eyebrow && (
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              {eyebrow}
            </div>
          )}
          <h2
            className="serif"
            style={{
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {title}
          </h2>
          {sub && (
            <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 15 }}>
              {sub}
            </p>
          )}
          <div style={{ marginTop: 32 }}>{children}</div>
        </div>
      </main>
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useTranslation();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      setUser(data.user);
      navigate("/dashboard");
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string[] } } })?.response?.data?.code?.[0];
      setError(
        code === "google_account"
          ? t("auth.login.google_account_error")
          : t("auth.login.invalid_credentials")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={t("auth.login.eyebrow")}
      title={t("auth.login.title")}
      sub={t("auth.login.sub")}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <Input
          label={t("auth.login.username_label")}
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          autoFocus
          required
        />
        <Input
          label={t("auth.login.password_label")}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--ink-3)",
            }}
          >
            <input
              type="checkbox"
              defaultChecked
              style={{ accentColor: "var(--ink)" }}
            />
            {t("auth.login.keep_connected")}
          </label>
          <span
            style={{ fontSize: 13, color: "var(--green)", cursor: "pointer" }}
          >
            {t("auth.login.forgot_password")}
          </span>
        </div>

        {error && (
          <p
            style={{
              fontSize: 13,
              color: "var(--red)",
              background: "var(--red-wash)",
              padding: "10px 12px",
              borderRadius: 8,
            }}
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full"
          style={{ marginTop: 10, width: "100%" }}
        >
          {loading ? t("auth.login.signing_in") : t("auth.login.sign_in")}
        </Button>
      </form>

      <GoogleAuthBlock />

      <div
        style={{
          marginTop: 22,
          textAlign: "center",
          fontSize: 13,
          color: "var(--ink-3)",
        }}
      >
        {t("auth.login.no_account")}{" "}
        <Link to="/register" style={{ color: "var(--green)", fontWeight: 500 }}>
          {t("auth.login.create_account")}
        </Link>
      </div>
    </AuthShell>
  );
}

export { AuthShell };
