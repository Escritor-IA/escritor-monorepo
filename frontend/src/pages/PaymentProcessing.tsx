import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paymentsApi, type PaymentStatus } from "@/api/payments";
import logo from "@/assets/logo.png";

const STEPS = [
  { label: "Pagamento recebido", sub: "O gateway aceitou sua transação." },
  { label: "Confirmando com o banco", sub: "Aguardando o evento de confirmação." },
  { label: "Liberando seus créditos", sub: "Ativando o plano na sua conta." },
];

const POLL_INTERVAL = 2500;
const SLOW_THRESHOLD = 30_000;

export function PaymentProcessing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderNsu = searchParams.get("order_nsu");

  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [slow, setSlow] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Animate steps independently of polling (UI feedback)
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 2_200);
    const t2 = setTimeout(() => setStep(2), 4_600);
    stepTimersRef.current = [t1, t2];
    return () => stepTimersRef.current.forEach(clearTimeout);
  }, []);

  // Elapsed timer + slow hint
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1_000);
    const slow = setTimeout(() => setSlow(true), SLOW_THRESHOLD);
    return () => {
      clearInterval(interval);
      clearTimeout(slow);
    };
  }, []);

  // Poll backend for payment status
  useEffect(() => {
    if (!orderNsu) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const checkStatus = async () => {
      try {
        const { data } = await paymentsApi.getStatus(orderNsu);
        if (data.status === "paid") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep(3);
          setTimeout(() => {
            navigate("/pagamento/sucesso", { state: { payment: data }, replace: true });
          }, 600);
        } else if (data.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          navigate("/dashboard", { replace: true });
        }
      } catch {
        // keep polling silently
      }
    };

    checkStatus();
    pollRef.current = setInterval(checkStatus, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderNsu, navigate]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--paper)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* decorative underlines */}
      <svg aria-hidden="true" viewBox="0 0 1440 900" preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5, pointerEvents: "none" }}>
        <g stroke="var(--mint)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M-40 180 C 360 170, 540 220, 880 160" opacity="0.28" />
          <path d="M820 700 C 1040 680, 1240 740, 1480 700" opacity="0.22" />
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
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px 48px",
        textAlign: "center",
        overflowY: "auto",
      }}>
        {/* Spinning ring with feather icon */}
        <div style={{ position: "relative", width: 96, height: 96, marginBottom: 30 }}>
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "conic-gradient(from 0deg, transparent 0deg, var(--green) 300deg, var(--mint) 360deg)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
            animation: "spin 1.1s linear infinite",
          }} />
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "4px solid var(--card-edge)",
          }} />
          <div style={{
            position: "absolute",
            inset: 14,
            borderRadius: "50%",
            background: "var(--card)",
            display: "grid",
            placeItems: "center",
            color: "var(--ink)",
            boxShadow: "var(--sh-1)",
          }}>
            <FeatherIcon />
          </div>
        </div>

        <div className="eyebrow">PROCESSANDO PAGAMENTO</div>

        <h1 className="serif" style={{
          marginTop: 16,
          fontSize: "clamp(32px, 4vw, 48px)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.04,
          color: "var(--ink)",
          maxWidth: 720,
        }}>
          Estamos confirmando<br />
          <em style={{ color: "var(--ink-3)" }}>o seu pagamento.</em>
        </h1>

        <p className="serif" style={{
          marginTop: 22,
          fontSize: 17,
          lineHeight: 1.55,
          color: "var(--ink-2)",
          maxWidth: 460,
        }}>
          Isso costuma levar apenas alguns segundos. Não feche nem
          atualize esta página — ela avança sozinha assim que recebermos
          a confirmação.
        </p>

        {/* Steps tracker */}
        <div className="card" style={{
          marginTop: 34,
          width: "min(440px, 100%)",
          padding: "8px",
          textAlign: "left",
          boxShadow: "var(--sh-2)",
        }}>
          {STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "active" : "pending";
            return <ProcessRow key={i} step={s} state={state} last={i === STEPS.length - 1} />;
          })}
        </div>

        {/* Webhook indicator + timer */}
        <div className="mono" style={{
          marginTop: 18,
          fontSize: 12,
          color: "var(--ink-4)",
          letterSpacing: 0.4,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green)",
              animation: "pulseDot 1s infinite",
            }} />
            AGUARDANDO WEBHOOK
          </span>
          <span style={{ color: "var(--ink-5)" }}>·</span>
          <span>{mm}:{ss}</span>
        </div>

        {/* Slow hint */}
        {slow && (
          <div className="fade-in" style={{
            marginTop: 20,
            padding: "12px 16px",
            background: "var(--amber-wash)",
            borderRadius: 10,
            fontSize: 13,
            color: "var(--ink-2)",
            maxWidth: 440,
          }}>
            Está demorando mais que o normal? Fique tranquilo — seu pagamento
            está seguro. Se nada acontecer, você receberá um e-mail e pode{" "}
            <button
              onClick={() => navigate("/dashboard")}
              style={{ color: "var(--green)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}
            >
              acessar o painel
            </button>
            .
          </div>
        )}
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
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <LockIcon />
          Transação criptografada de ponta a ponta
        </span>
      </footer>
    </div>
  );
}

function ProcessRow({ step, state, last }: {
  step: { label: string; sub: string };
  state: "done" | "active" | "pending";
  last: boolean;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "32px 1fr",
      gap: 12,
      padding: "12px",
      borderBottom: last ? "none" : "1px dashed var(--card-edge)",
      alignItems: "center",
      opacity: state === "pending" ? 0.5 : 1,
      transition: "opacity .3s ease",
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: state === "done" ? "var(--green)" : state === "active" ? "var(--mint-wash)" : "var(--paper-2)",
        color: state === "done" ? "white" : "var(--green-deep)",
        transition: "all .3s ease",
        flexShrink: 0,
      }}>
        {state === "done" ? (
          <CheckIcon />
        ) : state === "active" ? (
          <span style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid var(--green)",
            borderTopColor: "transparent",
            animation: "spin .8s linear infinite",
            display: "block",
          }} />
        ) : (
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-4)", display: "block" }} />
        )}
      </div>
      <div>
        <div style={{
          fontSize: 14,
          fontWeight: 500,
          color: state === "pending" ? "var(--ink-3)" : "var(--ink)",
          fontFamily: "var(--serif)",
        }}>
          {step.label}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>
          {state === "done" ? "Concluído" : state === "active" ? step.sub : "Aguardando…"}
        </div>
      </div>
    </div>
  );
}

function FeatherIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
      <path d="M16 8L2 22" />
      <path d="M17.5 15H9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
