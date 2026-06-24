import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/auth";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { AuthShell } from "./Login";

type PlanKey = "free" | "basic" | "premium";

const PLAN_META: { key: PlanKey; price: string; credits: number; highlight?: boolean }[] = [
  { key: "free", price: "0", credits: 10 },
  { key: "basic", price: "29", credits: 60, highlight: true },
  { key: "premium", price: "59", credits: 150 },
];

export function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirm: "",
    plan: "basic" as PlanKey,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const step1Valid =
    form.first_name && form.last_name && form.username && form.email &&
    form.password.length >= 6 && form.password_confirm && agreed;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await authApi.register(form);
      navigate("/verify-email", { state: { email: form.email } });
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (data) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(data)) {
          flat[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setErrors(flat);
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <AuthShell
        eyebrow={t("auth.register.plan_eyebrow")}
        title={
          <>
            {t("auth.register.plan_title")}
            <br />
            <em style={{ fontStyle: "italic" }}>{t("auth.register.plan_title_em")}</em>
          </>
        }
        sub={t("auth.register.plan_sub")}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PLAN_META.map((p) => {
            const active = form.plan === p.key;
            const features = t(`auth.register.plans.${p.key}.features`, { returnObjects: true }) as string[];
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setForm({ ...form, plan: p.key })}
                style={{
                  position: "relative",
                  width: "100%",
                  padding: "20px 22px",
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s",
                  border: active
                    ? "2px solid var(--green)"
                    : p.highlight
                      ? "2px solid #1a1640"
                      : "2px solid var(--border)",
                  background: active ? "rgba(78,232,163,0.05)" : "var(--paper)",
                  color: "var(--ink)",
                }}
              >
                {p.highlight && (
                  <div style={{
                    position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                    background: "#1a1640", color: "#fff",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap",
                  }}>
                    {t("auth.register.most_chosen")}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{
                      fontSize: 16, fontWeight: 600,
                      color: active || p.highlight ? "var(--green)" : "var(--ink)",
                      marginBottom: 2,
                    }}>
                      {t(`auth.register.plans.${p.key}.name`)}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {t(`auth.register.plans.${p.key}.tagline`)}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>R$</span>
                      <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: "var(--ink)" }}>
                        {p.price}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                        {t(`auth.register.plans.${p.key}.price_note`)}
                      </span>
                    </div>
                    {t(`auth.register.plans.${p.key}.annual_note`, "") && (
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                        {t(`auth.register.plans.${p.key}.annual_note`)}
                      </div>
                    )}
                  </div>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "flex", flexDirection: "column", gap: 5 }}>
                  {Array.isArray(features) && features.map((f) => (
                    <li key={f} style={{
                      fontSize: 13,
                      color: "var(--ink-2)",
                      display: "flex", gap: 8, alignItems: "flex-start",
                    }}>
                      <span style={{ color: "var(--green)", lineHeight: 1.5, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}

          {errors.non_field_errors && (
            <p style={{ fontSize: 13, color: "var(--red)", background: "var(--red-wash)", padding: "10px 12px", borderRadius: 8 }}>
              {errors.non_field_errors}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} style={{ flex: 1 }}>
              {t("auth.register.back")}
            </Button>
            <Button type="submit" variant="primary" size="lg" loading={loading} style={{ flex: 2 }}>
              {loading ? t("auth.register.creating") : t("auth.register.create")}
            </Button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={t("auth.register.eyebrow")}
      title={
        <>
          {t("auth.register.title")}
          <br />
          <em style={{ fontStyle: "italic" }}>{t("auth.register.title_em")}</em>
        </>
      }
      sub={t("auth.register.sub")}
    >
      <form
        onSubmit={(e) => { e.preventDefault(); setStep(2); }}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <Input
            label={t("auth.register.first_name")}
            placeholder={t("auth.register.first_name_placeholder")}
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            error={errors.first_name}
            autoFocus
            required
          />
          <Input
            label={t("auth.register.last_name")}
            placeholder={t("auth.register.last_name_placeholder")}
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            error={errors.last_name}
            required
          />
        </div>
        <Input
          label={t("auth.register.username")}
          placeholder={t("auth.register.username_placeholder")}
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          error={errors.username}
          required
        />
        <Input
          label={t("auth.register.email")}
          type="email"
          placeholder={t("auth.register.email_placeholder")}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          required
        />
        <Input
          label={t("auth.register.password")}
          type="password"
          placeholder={t("auth.register.password_placeholder")}
          hint={t("auth.register.password_hint")}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          required
        />
        <Input
          label={t("auth.register.password_confirm")}
          type="password"
          placeholder={t("auth.register.password_placeholder")}
          value={form.password_confirm}
          onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
          error={errors.password_confirm}
          required
        />

        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ accentColor: "var(--ink)", marginTop: 3 }}
          />
          <span>
            {t("auth.register.terms_agree")}{" "}
            <span style={{ color: "var(--green)" }}>{t("auth.register.terms")}</span>{" "}
            {t("auth.register.and")}{" "}
            <span style={{ color: "var(--green)" }}>{t("auth.register.privacy")}</span>.
          </span>
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!step1Valid}
          style={{ width: "100%", marginTop: 8, opacity: step1Valid ? 1 : 0.55 }}
        >
          {t("auth.register.next")}
        </Button>
      </form>

      <div style={{ marginTop: 22, textAlign: "center", fontSize: 13, color: "var(--ink-3)" }}>
        {t("auth.register.already_account")}{" "}
        <Link to="/login" style={{ color: "var(--green)", fontWeight: 500 }}>
          {t("auth.register.sign_in")}
        </Link>
      </div>
    </AuthShell>
  );
}
