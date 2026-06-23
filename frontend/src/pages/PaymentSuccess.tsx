import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/UI/Button";
import { PLAN_LABELS } from "@/types";
import type { PaymentStatus } from "@/api/payments";
import logo from "@/assets/logo.png";

const PLAN_CREDITS: Record<string, number> = {
  basic: 60,
  premium: 150,
};

const CAPTURE_METHOD_LABELS: Record<string, string> = {
  credit_card: "Cartão de crédito",
  pix: "Pix",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRenewal(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatAmount(amount: string) {
  const num = parseFloat(amount);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();

  const payment: PaymentStatus | undefined = location.state?.payment;

  // Refresh user data to reflect new plan and credits
  useEffect(() => {
    authApi.me().then(({ data }) => setUser(data)).catch(() => {});
  }, [setUser]);

  // If no payment state, redirect to dashboard gracefully
  if (!payment) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const planLabel = PLAN_LABELS[payment.plan] ?? payment.plan;
  const credits = PLAN_CREDITS[payment.plan] ?? 0;
  const methodLabel = CAPTURE_METHOD_LABELS[payment.capture_method] || payment.capture_method;
  const shortOrderId = `ESC-${payment.order_nsu.slice(0, 8).toUpperCase()}`;

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--paper)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* decorative green underlines */}
      <svg aria-hidden="true" viewBox="0 0 1440 900" preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.55, pointerEvents: "none" }}>
        <g stroke="var(--mint)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M-40 160 C 360 150, 540 200, 880 140" opacity="0.30" />
          <path d="M-40 200 C 380 230, 620 270, 940 210" opacity="0.18" />
          <path d="M820 720 C 1040 700, 1240 760, 1480 720" opacity="0.26" />
        </g>
      </svg>

      {/* Header */}
      <header style={{
        position: "relative",
        zIndex: 2,
        padding: "24px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <button onClick={() => navigate("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <img src={logo} alt="Escritor.ai" style={{ width: 24, height: 24, borderRadius: 6 }} />
        </button>
        <div className="mono" style={{ fontSize: 12, color: "var(--ink-4)", letterSpacing: 0.5 }}>
          PAGAMENTO SEGURO · SSL
        </div>
      </header>

      {/* Body */}
      <main style={{
        position: "relative",
        zIndex: 1,
        flex: 1,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
        alignItems: "center",
        gap: 48,
        padding: "0 60px 48px",
        maxWidth: 1200,
        width: "100%",
        margin: "0 auto",
      }}>
        {/* LEFT — confirmation copy */}
        <div>
          {/* check seal */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--green)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 8px 24px -6px rgba(15,122,79,0.5)",
            marginBottom: 24,
            position: "relative",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5">
                <animate attributeName="stroke-dasharray" from="0 30" to="30 0" dur="0.5s" begin="0.4s" fill="freeze" />
              </path>
            </svg>
            <span style={{
              position: "absolute",
              inset: -6,
              borderRadius: "50%",
              border: "2px solid var(--mint)",
              opacity: 0.5,
            }} />
          </div>

          <div className="eyebrow">PAGAMENTO CONFIRMADO</div>

          <h1 className="serif" style={{
            marginTop: 18,
            fontSize: "clamp(40px, 5vw, 64px)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.0,
            color: "var(--ink)",
            textWrap: "balance",
          } as React.CSSProperties}>
            Obrigado.<br />
            <em style={{ color: "var(--ink-3)" }}>Sua história continua.</em>
          </h1>

          <p className="serif" style={{
            marginTop: 20,
            fontSize: 18,
            lineHeight: 1.55,
            color: "var(--ink-2)",
            maxWidth: 480,
          }}>
            Seu plano <strong style={{ color: "var(--ink)" }}>{planLabel}</strong> está ativo e{" "}
            <strong style={{ color: "var(--green)" }}>{credits} créditos</strong> já foram
            adicionados à sua conta. Pode voltar a escrever — a leitora paciente está pronta.
          </p>

          <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Button variant="primary" size="lg" onClick={() => navigate("/dashboard")}>
              Voltar a escrever
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate("/dashboard")}>
              Ver meus projetos
            </Button>
          </div>

          <div style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            color: "var(--ink-3)",
          }}>
            <EmailIcon />
            Enviamos o recibo para o seu e-mail.{" "}
            {payment.receipt_url && (
              <a
                href={payment.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--green)" }}
              >
                Ver comprovante
              </a>
            )}
          </div>
        </div>

        {/* RIGHT — receipt card */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          <div className="card" style={{
            width: "min(400px, 100%)",
            padding: 0,
            boxShadow: "var(--sh-3)",
            transform: "rotate(1.2deg)",
            overflow: "hidden",
          }}>
            {/* card header */}
            <div style={{
              padding: "20px 24px 18px",
              background: "linear-gradient(180deg, var(--mint-wash-soft), transparent)",
              borderBottom: "1px dashed var(--card-edge)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div className="eyebrow" style={{ fontSize: 10 }}>RECIBO</div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 500, marginTop: 6, color: "var(--ink)" }}>
                  Plano {planLabel}
                </div>
              </div>
              <span className="chip chip-done" style={{ height: 26 }}>
                <CheckIcon /> Pago
              </span>
            </div>

            {/* credits highlight */}
            <div style={{
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px dashed var(--card-edge)",
            }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Créditos adicionados</div>
                <div className="serif" style={{
                  fontSize: 36,
                  fontWeight: 500,
                  color: "var(--green)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}>
                  +{credits}
                </div>
              </div>
              <div style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: "var(--mint-wash)",
                display: "grid",
                placeItems: "center",
                color: "var(--green-deep)",
              }}>
                <SparklesIcon />
              </div>
            </div>

            {/* line items */}
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 11 }}>
              <ReceiptRow label="Forma de pagamento" value={methodLabel} />
              <ReceiptRow label="Pedido" value={shortOrderId} mono />
              <ReceiptRow label="Data" value={formatDate(payment.created_at)} />
              <ReceiptRow label="Renova em" value={formatRenewal(payment.expires_at)} />
              <div style={{ height: 1, background: "var(--card-edge)", margin: "4px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>Total pago</span>
                <span className="serif" style={{ fontSize: 24, fontWeight: 500, color: "var(--ink)" }}>
                  {formatAmount(payment.amount)}
                </span>
              </div>
            </div>

            {/* perforated footer */}
            <div style={{
              padding: "14px 24px",
              background: "var(--paper)",
              borderTop: "1px dashed var(--card-edge)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "var(--ink-4)",
              letterSpacing: 0.5,
            }}>
              <span>ESCRITOR.AI</span>
              <span>OBRIGADO PELA CONFIANÇA ♥</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: "relative",
        zIndex: 2,
        padding: "18px 40px",
        borderTop: "1px solid var(--card-edge)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 12,
        color: "var(--ink-4)",
      }}>
        <span className="mono" style={{ letterSpacing: 0.4 }}>ESCRITOR.AI © 2026</span>
        <span style={{ display: "flex", gap: 18 }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}
          >
            Gerenciar assinatura
          </button>
          <a href="mailto:contato@escritor.ai" style={{ color: "var(--green)" }}>
            Precisa de ajuda?
          </a>
        </span>
      </footer>
    </div>
  );
}

function ReceiptRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span style={{
        color: "var(--ink)",
        fontFamily: mono ? "var(--mono)" : "inherit",
        fontSize: mono ? 12 : 13,
      }}>
        {value}
      </span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
      <path d="M19 14l.7 1.6L21.5 16l-1.6.7L19 18l-.7-1.6L16.5 16l1.6-.7L19 14z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
