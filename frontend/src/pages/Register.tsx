import { useState, useRef, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { paymentsApi } from "@/api/payments";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { AuthShell } from "./Login";

type Step = 1 | 2 | 3;
type BillingCycle = "monthly" | "annual";
type PlanKey = "free" | "basic" | "premium";

const PLANS: {
  key: PlanKey;
  name: string;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  annualMonthly: string;
  credits: number;
  features: string[];
  highlight?: boolean;
  paid?: boolean;
}[] = [
  {
    key: "free",
    name: "Rascunho",
    tagline: "Para começar a tatear o caminho.",
    monthlyPrice: "0",
    annualPrice: "0",
    annualMonthly: "",
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
    monthlyPrice: "29",
    annualPrice: "288",
    annualMonthly: "R$ 24/mês",
    credits: 60,
    highlight: true,
    paid: true,
    features: [
      "60 créditos por mês",
      "3 perfis de leitor simulados",
      "Análise narrativa e total",
      "Sugestões criativas sob demanda",
      "Histórico de versões",
    ],
  },
  {
    key: "premium",
    name: "Obra Completa",
    tagline: "Para quem está fechando o livro.",
    monthlyPrice: "59",
    annualPrice: "588",
    annualMonthly: "R$ 49/mês",
    credits: 150,
    paid: true,
    features: [
      "150 créditos por mês",
      "6 perfis de leitor, incluindo nichos",
      "Análise total do livro",
      "Diff narrativo entre versões",
      "Exportação para revisão profissional",
    ],
  },
];

const REG_EMAIL_KEY = "reg_pending_email";

export function Register() {
  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState<Step>(1);

  // Step 1 — account info
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Step 2 — OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendIn, setResendIn] = useState(28);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3 — plan selection
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("basic");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Restore step on mount
  useEffect(() => {
    // Already authenticated (verified + logged in) — go straight to plan selection
    if (isAuthenticated) {
      setStep(3);
      return;
    }
    // Registered but not yet verified — restore OTP step
    const savedEmail = sessionStorage.getItem(REG_EMAIL_KEY);
    if (savedEmail) {
      setForm((f) => ({ ...f, email: savedEmail }));
      setStep(2);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const step1Valid =
    form.first_name &&
    form.last_name &&
    form.username &&
    form.email &&
    form.password.length >= 6 &&
    form.password_confirm &&
    agreed;

  // ── OTP resend countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2 || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  // ── Step 1: register ───────────────────────────────────────────────────
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setRegisterLoading(true);
    try {
      await authApi.register(form);
      sessionStorage.setItem(REG_EMAIL_KEY, form.email);
      setStep(2);
      setResendIn(28);
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
      setRegisterLoading(false);
    }
  };

  // ── Step 2: OTP handlers ───────────────────────────────────────────────
  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    const otp_code = otp.join("");
    if (otp_code.length < 6) { setOtpError("Digite os 6 dígitos do código."); return; }
    setOtpError("");
    setVerifyLoading(true);
    try {
      await authApi.verifyEmail({ email: form.email, otp_code });
      sessionStorage.removeItem(REG_EMAIL_KEY);

      if (form.password) {
        // Fresh registration — auto-login and go to plan selection
        setOtpSuccess("Email verificado! Entrando na sua conta…");
        const { data } = await authApi.login({ username: form.email, password: form.password });
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        setUser(data.user);
        setStep(3);
      } else {
        // Resumed session (password not in memory) — redirect to login
        setOtpSuccess("Email verificado! Faça login para continuar.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (data) {
        const msg = Object.values(data).flat()[0];
        setOtpError(typeof msg === "string" ? msg : "Código inválido.");
      } else {
        setOtpError("Erro ao verificar. Tente novamente.");
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setResendLoading(true);
    setOtpError("");
    try {
      await authApi.resendOtp({ email: form.email });
      setOtpSuccess("Novo código enviado para seu email.");
      setResendIn(28);
    } catch {
      setOtpError("Não foi possível reenviar o código.");
    } finally {
      setResendLoading(false);
    }
  };

  // ── Step 3: plan selection ─────────────────────────────────────────────
  const handlePlanSelect = async () => {
    setCheckoutError("");
    if (selectedPlan === "free") {
      navigate("/dashboard");
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data } = await paymentsApi.createCheckout({
        plan: selectedPlan as "basic" | "premium",
        billing_cycle: billingCycle,
      });
      window.location.href = data.checkout_url;
    } catch {
      setCheckoutError("Não foi possível iniciar o checkout. Tente novamente.");
      setCheckoutLoading(false);
    }
  };

  // ── Step 3 — plan selection UI ─────────────────────────────────────────
  if (step === 3) {
    const currentPlan = PLANS.find((p) => p.key === selectedPlan)!;
    const isPaid = currentPlan.paid;

    return (
      <AuthShell
        eyebrow="ESCOLHA SEU PLANO"
        title={<>Qual é o seu<br /><em style={{ fontStyle: "italic" }}>momento de escrita?</em></>}
        sub="Você pode mudar de plano a qualquer momento."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Billing cycle toggle */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            background: "var(--paper-2)",
            borderRadius: 999,
            padding: 3,
            width: "fit-content",
            marginBottom: 4,
          }}>
            {(["monthly", "annual"] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                style={{
                  padding: "5px 16px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  transition: "all .15s ease",
                  background: billingCycle === cycle ? "var(--card)" : "transparent",
                  color: billingCycle === cycle ? "var(--ink)" : "var(--ink-3)",
                  boxShadow: billingCycle === cycle ? "var(--sh-1)" : "none",
                }}
              >
                {cycle === "monthly" ? "Mensal" : "Anual"}
                {cycle === "annual" && (
                  <span style={{
                    marginLeft: 6,
                    fontSize: 10,
                    background: "var(--mint-wash)",
                    color: "var(--green-deep)",
                    padding: "1px 6px",
                    borderRadius: 999,
                    fontWeight: 600,
                  }}>
                    −17%
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Plan cards */}
          {PLANS.map((p) => {
            const active = selectedPlan === p.key;
            const price = billingCycle === "annual" && p.paid ? p.annualPrice : p.monthlyPrice;
            const priceNote = p.paid
              ? (billingCycle === "annual" ? "/ano" : "/mês")
              : "/sempre";
            const subNote = billingCycle === "annual" && p.paid ? p.annualMonthly : undefined;

            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedPlan(p.key)}
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
                      : "2px solid var(--card-edge)",
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
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{p.tagline}</div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                      {p.paid && <span style={{ fontSize: 11, color: "var(--ink-3)" }}>R$</span>}
                      <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: "var(--ink)" }}>
                        {price}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{priceNote}</span>
                    </div>
                    {subNote && (
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{subNote}</div>
                    )}
                  </div>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "flex", flexDirection: "column", gap: 5 }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ fontSize: 13, color: "var(--ink-2)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "var(--green)", lineHeight: 1.5, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}

          {checkoutError && (
            <p style={{ fontSize: 13, color: "var(--red)", background: "var(--red-wash)", padding: "10px 12px", borderRadius: 8 }}>
              {checkoutError}
            </p>
          )}

          <Button
            type="button"
            variant={isPaid ? "primary" : "secondary"}
            size="lg"
            loading={checkoutLoading}
            onClick={handlePlanSelect}
            style={{ width: "100%", marginTop: 4 }}
          >
            {checkoutLoading
              ? "Abrindo checkout…"
              : isPaid
                ? `Assinar plano ${currentPlan.name}`
                : "Começar grátis"}
          </Button>
        </div>
      </AuthShell>
    );
  }

  // ── Step 2 — OTP verification ──────────────────────────────────────────
  if (step === 2) {
    const filled = otp.every(Boolean);
    return (
      <AuthShell
        eyebrow="VERIFICAÇÃO"
        title="Confirme seu email."
        sub={
          <>
            Enviamos um código de 6 dígitos para{" "}
            <strong style={{ color: "var(--ink)" }}>{form.email}</strong>.
          </>
        }
      >
        <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div onPaste={handlePaste} style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            {otp.map((c, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                className="input"
                style={{
                  height: 60, textAlign: "center",
                  fontSize: 24, fontFamily: "var(--serif)", fontWeight: 500,
                  letterSpacing: 0,
                }}
                value={c}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                inputMode="numeric"
                maxLength={1}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {otpError && (
            <p style={{ fontSize: 13, color: "var(--red)", background: "var(--red-wash)", padding: "10px 12px", borderRadius: 8 }}>
              {otpError}
            </p>
          )}
          {otpSuccess && (
            <p style={{ fontSize: 13, color: "var(--green)", background: "var(--mint-wash-soft)", padding: "10px 12px", borderRadius: 8 }}>
              {otpSuccess}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={verifyLoading}
            disabled={!filled || verifyLoading}
            style={{ width: "100%", opacity: filled ? 1 : 0.55 }}
          >
            {verifyLoading ? "Verificando…" : "Confirmar"}
          </Button>

          <div style={{ textAlign: "center", fontSize: 13, color: "var(--ink-3)" }}>
            {resendIn > 0 ? (
              <>Não recebeu? Reenviar em <strong style={{ color: "var(--ink)" }}>{resendIn}s</strong></>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                style={{ color: "var(--green)", cursor: "pointer", fontWeight: 500, background: "none", border: "none" }}
              >
                {resendLoading ? "Enviando…" : "Reenviar código"}
              </button>
            )}
          </div>
        </form>

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 13, color: "var(--ink-3)" }}>
          <button
            type="button"
            onClick={() => setStep(1)}
            style={{ color: "var(--green)", background: "none", border: "none", cursor: "pointer" }}
          >
            ← Mudar email
          </button>
        </div>
      </AuthShell>
    );
  }

  // ── Step 1 — account info ──────────────────────────────────────────────
  return (
    <AuthShell
      eyebrow="NOVO MANUSCRITO"
      title={<>Comece a escrever<br /><em style={{ fontStyle: "italic" }}>em três páginas.</em></>}
      sub="Crie sua conta e escolha o plano ideal para o seu momento."
    >
      <form
        onSubmit={handleRegister}
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

        {errors.non_field_errors && (
          <p style={{ fontSize: 13, color: "var(--red)", background: "var(--red-wash)", padding: "10px 12px", borderRadius: 8 }}>
            {errors.non_field_errors}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={registerLoading}
          disabled={!step1Valid}
          style={{ width: "100%", marginTop: 8, opacity: step1Valid ? 1 : 0.55 }}
        >
          {registerLoading ? "Criando conta…" : "Próximo →"}
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
