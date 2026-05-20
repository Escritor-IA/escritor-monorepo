import { useState, type FormEvent, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { authApi } from "@/api/auth";
import { Button } from "@/components/UI/Button";
import { AuthShell } from "./Login";

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendIn, setResendIn] = useState(28);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

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

  const filled = otp.every(Boolean);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const otp_code = otp.join("");
    if (otp_code.length < 6) { setError("Digite os 6 dígitos do código."); return; }
    setError("");
    setLoading(true);
    try {
      await authApi.verifyEmail({ email, otp_code });
      setSuccess("Email verificado! Redirecionando…");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (data) {
        const msg = Object.values(data).flat()[0];
        setError(typeof msg === "string" ? msg : "Código inválido.");
      } else {
        setError("Erro ao verificar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setResendLoading(true);
    setError("");
    try {
      await authApi.resendOtp({ email });
      setSuccess("Novo código enviado para seu email.");
      setResendIn(28);
    } catch {
      setError("Não foi possível reenviar o código.");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    navigate("/register");
    return null;
  }

  return (
    <AuthShell
      eyebrow="VERIFICAÇÃO"
      title="Confirme seu email."
      sub={
        <>
          Enviamos um código de 6 dígitos para{" "}
          <strong style={{ color: "var(--ink)" }}>{email}</strong>.
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
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

        {error && (
          <p style={{ fontSize: 13, color: "var(--red)", background: "var(--red-wash)", padding: "10px 12px", borderRadius: 8 }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ fontSize: 13, color: "var(--green)", background: "var(--mint-wash-soft)", padding: "10px 12px", borderRadius: 8 }}>
            {success}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!filled || loading}
          style={{ width: "100%", opacity: filled ? 1 : 0.55 }}
        >
          {loading ? "Verificando…" : "Confirmar"}
        </Button>

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--ink-3)" }}>
          {resendIn > 0 ? (
            <>Não recebeu? Reenviar em <strong style={{ color: "var(--ink)" }}>{resendIn}s</strong></>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              style={{ color: "var(--green)", cursor: "pointer", fontWeight: 500 }}
            >
              {resendLoading ? "Enviando…" : "Reenviar código"}
            </button>
          )}
        </div>
      </form>

      <div style={{ marginTop: 18, textAlign: "center", fontSize: 13, color: "var(--ink-3)" }}>
        <Link to="/register" style={{ color: "var(--green)" }}>
          ← Mudar email
        </Link>
      </div>
    </AuthShell>
  );
}
