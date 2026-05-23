import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { AuthShell } from "./Login";

type PlanKey = "free" | "basic" | "premium";

const PLANS: {
  key: PlanKey;
  name: string;
  tagline: string;
  price: string;
  priceNote?: string;
  annualNote?: string;
  credits: number;
  features: string[];
  highlight?: boolean;
}[] = [
  {
    key: "free",
    name: "Rascunho",
    tagline: "Para começar a tatear o caminho.",
    price: "0",
    priceNote: "/sempre",
    credits: 10,
    features: [
      "10 créditos iniciais",
      "1 leitor simulado",
      "Análise local",
    ],
  },
  {
    key: "basic",
    name: "Autor",
    tagline: "Para quem está escrevendo a obra.",
    price: "29",
    priceNote: "/mês",
    annualNote: "Cobrança anual: R$ 24/mês",
    credits: 60,
    highlight: true,
    features: [
      "Texto ilimitado",
      "Anotações calibradas por gênero",
      "3 perfis de leitor simulados",
      "Sugestões sob demanda",
      "Histórico de versões",
    ],
  },
  {
    key: "premium",
    name: "Obra Completa",
    tagline: "Para quem está fechando o livro.",
    price: "59",
    priceNote: "/mês",
    annualNote: "Cobrança anual: R$ 49/mês",
    credits: 150,
    features: [
      "Tudo do plano Autor",
      "Leitura crítica em capítulos longos",
      "6 perfis de leitor, incluindo nichos",
      "Diff narrativo entre versões",
      "Exportação para revisão profissional",
    ],
  },
];

export function Register() {
  const navigate = useNavigate();
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
    form.first_name && form.last_name && form.username && form.email && form.password.length >= 6 && form.password_confirm && agreed;

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
        eyebrow="ESCOLHA SEU PLANO"
        title={<>Qual é o seu<br /><em style={{ fontStyle: "italic" }}>momento de escrita?</em></>}
        sub="Você pode mudar de plano a qualquer momento."
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PLANS.map((p) => {
            const active = form.plan === p.key;
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
                  background: active
                    ? "rgba(78,232,163,0.05)"
                    : "var(--paper)",
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
                    MAIS ESCOLHIDO
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{
                      fontSize: 16, fontWeight: 600,
                      color: active || p.highlight ? "var(--green)" : "var(--ink)",
                      marginBottom: 2,
                    }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {p.tagline}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>R$</span>
                      <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: "var(--ink)" }}>
                        {p.price}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                        {p.priceNote}
                      </span>
                    </div>
                    {p.annualNote && (
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                        {p.annualNote}
                      </div>
                    )}
                  </div>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "flex", flexDirection: "column", gap: 5 }}>
                  {p.features.map((f) => (
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
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setStep(1)}
              style={{ flex: 1 }}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              style={{ flex: 2 }}
            >
              {loading ? "Criando conta…" : "Criar minha conta"}
            </Button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="NOVO MANUSCRITO"
      title={<>Comece a escrever<br /><em style={{ fontStyle: "italic" }}>em três páginas.</em></>}
      sub="Crie sua conta e escolha o plano ideal para o seu momento."
    >
      <form
        onSubmit={(e) => { e.preventDefault(); setStep(2); }}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <Input
            label="Nome"
            placeholder="João"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            error={errors.first_name}
            autoFocus
            required
          />
          <Input
            label="Sobrenome"
            placeholder="Silva"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            error={errors.last_name}
            required
          />
        </div>
        <Input
          label="Nome de usuário"
          placeholder="Como deseja ser chamado(a)"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          error={errors.username}
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

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!step1Valid}
          style={{ width: "100%", marginTop: 8, opacity: step1Valid ? 1 : 0.55 }}
        >
          Próximo →
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
