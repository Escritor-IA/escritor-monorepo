import { useState, type FormEvent, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { Button } from "@/components/UI/Button";

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const otp_code = otp.join("");
    if (otp_code.length < 6) {
      setError("Digite os 6 dígitos do código.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.verifyEmail({ email, otp_code });
      setSuccess("Email verificado! Redirecionando para o login...");
      setTimeout(() => navigate("/login", { state: { message: "Email verificado! Faça login." } }), 2000);
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
    if (resendCooldown > 0) return;
    setResendLoading(true);
    setError("");
    try {
      await authApi.resendOtp({ email });
      setSuccess("Novo código enviado para seu email.");
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      setError("Não foi possível reenviar o código. Tente novamente.");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    navigate("/register");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700">Escritor.AI</h1>
          <p className="text-gray-500 mt-2">Verificação de email</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirme seu email</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enviamos um código de 6 dígitos para{" "}
            <span className="font-medium text-gray-700">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Código de verificação
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`w-11 h-12 text-center text-lg font-semibold rounded-lg border
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                      ${digit ? "border-brand-400 bg-brand-50" : "border-gray-300"}
                      ${error ? "border-red-400" : ""}`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
              )}
              {success && (
                <p className="mt-2 text-sm text-green-600 text-center">{success}</p>
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Verificar email
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Não recebeu o código?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                className="text-brand-600 font-medium hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0
                  ? `Reenviar em ${resendCooldown}s`
                  : resendLoading
                  ? "Enviando..."
                  : "Reenviar código"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
