import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/auth";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { GoogleAuthBlock } from "@/components/Auth/GoogleAuthBlock";
import { AuthShell } from "./Login";

export function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const isValid =
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
      }
    } finally {
      setLoading(false);
    }
  };

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
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>
              {t("auth.register.terms")}
            </Link>{" "}
            {t("auth.register.and")}{" "}
            <Link to="/terms#privacidade" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>
              {t("auth.register.privacy")}
            </Link>
            .
          </span>
        </label>

        {errors.non_field_errors && (
          <p style={{ fontSize: 13, color: "var(--red)", background: "var(--red-wash)", padding: "10px 12px", borderRadius: 8 }}>
            {errors.non_field_errors}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!isValid || loading}
          style={{ width: "100%", marginTop: 8, opacity: isValid ? 1 : 0.55 }}
        >
          {loading ? t("auth.register.creating") : t("auth.register.create_account_btn")}
        </Button>
      </form>

      <GoogleAuthBlock />

      <div style={{ marginTop: 22, textAlign: "center", fontSize: 13, color: "var(--ink-3)" }}>
        {t("auth.register.already_account")}{" "}
        <Link to="/login" style={{ color: "var(--green)", fontWeight: 500 }}>
          {t("auth.register.sign_in")}
        </Link>
      </div>
    </AuthShell>
  );
}
