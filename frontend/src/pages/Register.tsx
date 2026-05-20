import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { AuthShell } from "./Login";

export function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    profile: "beginner",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const valid = form.username && form.email && form.password.length >= 6 && form.password_confirm && agreed;

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
      eyebrow="NOVO MANUSCRITO"
      title={<>Comece a escrever<br /><em style={{ fontStyle: "italic" }}>em três páginas.</em></>}
      sub="Você ganha 5 créditos no cadastro para experimentar as análises."
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input
          label="Nome / Usuário"
          placeholder="Como deseja ser chamado(a)"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          error={errors.username}
          autoFocus
          required
        />
        <Input
          label="E-mail"
          type="email"
          placeholder="voce@exemplo.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          required
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          hint="Mínimo 6 caracteres."
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          required
        />
        <Input
          label="Confirmar senha"
          type="password"
          placeholder="••••••••"
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
            Concordo com os{" "}
            <span style={{ color: "var(--green)" }}>Termos</span>{" "}
            e a{" "}
            <span style={{ color: "var(--green)" }}>Política de Privacidade</span>.
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
          disabled={!valid || loading}
          style={{ width: "100%", marginTop: 8, opacity: valid ? 1 : 0.55 }}
        >
          {loading ? "Criando conta…" : "Criar minha conta"}
        </Button>
      </form>

      <div style={{ marginTop: 22, textAlign: "center", fontSize: 13, color: "var(--ink-3)" }}>
        Já tem conta?{" "}
        <Link to="/login" style={{ color: "var(--green)", fontWeight: 500 }}>
          Entrar
        </Link>
      </div>
    </AuthShell>
  );
}
