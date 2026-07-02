import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

const STEPS = [
  { label: "Pagamento recebido", sub: "O gateway aceitou sua transação." },
  { label: "Confirmando com o banco", sub: "Aguardando o evento de confirmação." },
  { label: "Liberando seus créditos", sub: "Ativando o plano na sua conta." },
];

function Logo() {
  return (
    <div className="logo">
      <span>Escritor</span><span className="dot">.ai</span>
    </div>
  );
}

function ProcessRow({ step, state, last }: { step: typeof STEPS[0]; state: "done" | "active" | "pending"; last: boolean }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "32px 1fr", gap: 12,
      padding: "12px 12px",
      borderBottom: last ? "none" : "1px dashed var(--card-edge)",
      alignItems: "center",
      opacity: state === "pending" ? 0.5 : 1,
      transition: "opacity .3s ease",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        display: "grid", placeItems: "center",
        background: state === "done" ? "var(--green)" : state === "active" ? "var(--mint-wash)" : "var(--paper-2)",
        color: state === "done" ? "white" : "var(--green-deep)",
        transition: "all .3s ease",
      }}>
        {state === "done" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : state === "active" ? (
          <span style={{
            display: "block", width: 14, height: 14, borderRadius: "50%",
            border: "2px solid var(--green)", borderTopColor: "transparent",
            animation: "spin .8s linear infinite",
          }} />
        ) : (
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-4)" }} />
        )}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: state === "pending" ? "var(--ink-3)" : "var(--ink)", fontFamily: "var(--serif)" }}>
          {step.label}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>
          {state === "done" ? "Concluído" : state === "active" ? step.sub : "Aguardando…"}
        </div>
      </div>
    </div>
  );
}

export function CheckoutProcessing() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const expectedPlan = sessionStorage.getItem("checkout_plan") as "basic" | "premium" | null;

  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [slow, setSlow] = useState(false);
  const resolvedRef = useRef(false);

  // Animate the steps forward to feel responsive
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 2200);
    const t2 = setTimeout(() => setStep(2), 4600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Elapsed counter + "slow" hint after 30s
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    const slowTimer = setTimeout(() => setSlow(true), 30000);
    return () => { clearInterval(interval); clearTimeout(slowTimer); };
  }, []);

  // Poll the backend every 3s until the plan matches what was purchased
  useEffect(() => {
    if (!expectedPlan) return;

    const poll = async () => {
      if (resolvedRef.current) return;
      try {
        const { data } = await authApi.me();
        if (data.user_plan?.plan === expectedPlan) {
          resolvedRef.current = true;
          setUser(data);
          setStep(3);
          sessionStorage.removeItem("checkout_plan");
          setTimeout(() => navigate("/checkout/success"), 800);
        }
      } catch {
        // ignore poll errors
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [expectedPlan, navigate, setUser]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div style={{
      minHeight: "100vh", background: "var(--paper)",
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      {/* decorative lines */}
      <svg aria-hidden="true" viewBox="0 0 1440 900" preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5, pointerEvents: "none" }}>
        <g stroke="var(--mint)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M-40 180 C 360 170, 540 220, 880 160" opacity="0.28" />
          <path d="M820 700 C 1040 680, 1240 740, 1480 700" opacity="0.22" />
        </g>
      </svg>

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 2,
        padding: "24px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Logo />
        <div className="mono" style={{ fontSize: 12, color: "var(--ink-4)", letterSpacing: 0.5 }}>
          PAGAMENTO SEGURO · SSL
        </div>
      </header>

      {/* Main */}
      <main style={{
        position: "relative", zIndex: 1, flex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "32px 24px 48px", textAlign: "center",
      }}>
        {/* Spinning feather ring */}
        <div style={{ position: "relative", width: 96, height: 96, marginBottom: 30 }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "conic-gradient(from 0deg, transparent 0deg, var(--green) 300deg, var(--mint) 360deg)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
            animation: step >= 3 ? "none" : "spin 1.1s linear infinite",
          }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "4px solid var(--card-edge)" }} />
          <div style={{
            position: "absolute", inset: 14, borderRadius: "50%",
            background: "var(--card)", display: "grid", placeItems: "center",
            color: step >= 3 ? "var(--green)" : "var(--ink)",
            boxShadow: "var(--sh-1)",
            transition: "color .4s ease",
          }}>
            {step >= 3 ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
                <path d="M16 8L2 22M17.5 15H9" />
              </svg>
            )}
          </div>
        </div>

        <div className="eyebrow">PROCESSANDO PAGAMENTO</div>

        <h1 className="serif" style={{
          marginTop: 16,
          fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500,
          letterSpacing: "-0.03em", lineHeight: 1.04,
          color: "var(--ink)", maxWidth: 720,
        }}>
          Estamos confirmando<br />
          <em style={{ color: "var(--ink-3)" }}>o seu pagamento.</em>
        </h1>

        <p className="serif" style={{
          marginTop: 22, fontSize: 17, lineHeight: 1.55,
          color: "var(--ink-2)", maxWidth: 460,
        }}>
          Isso costuma levar apenas alguns segundos. Não feche nem
          atualize esta página — ela avança sozinha assim que recebermos
          a confirmação.
        </p>

        {/* Steps tracker */}
        <div className="card" style={{
          marginTop: 34, width: "min(440px, 100%)",
          padding: "8px 8px", textAlign: "left", boxShadow: "var(--sh-2)",
        }}>
          {STEPS.map((s, i) => {
            const state: "done" | "active" | "pending" =
              i < step ? "done" : i === step ? "active" : "pending";
            return <ProcessRow key={s.label} step={s} state={state} last={i === STEPS.length - 1} />;
          })}
        </div>

        {/* Meta line */}
        <div className="mono" style={{
          marginTop: 18, fontSize: 12, color: "var(--ink-4)", letterSpacing: 0.4,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--green)", animation: "pulseDot 1s infinite",
            }} />
            AGUARDANDO WEBHOOK
          </span>
          <span style={{ color: "var(--ink-5)" }}>·</span>
          <span>{mm}:{ss}</span>
        </div>

        {/* Slow hint */}
        {slow && (
          <div className="fade-in" style={{
            marginTop: 20, padding: "12px 16px",
            background: "var(--amber-wash)", borderRadius: 10,
            fontSize: 13, color: "var(--ink-2)", maxWidth: 440,
          }}>
            Está demorando mais que o normal? Fique tranquilo — seu pagamento
            está seguro. Se nada acontecer, você receberá um e-mail e pode{" "}
            <button
              onClick={() => navigate("/dashboard")}
              style={{ color: "var(--green)", fontWeight: 500, textDecoration: "underline" }}
            >
              acessar o painel
            </button>.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        position: "relative", zIndex: 2,
        padding: "18px 40px",
        borderTop: "1px solid var(--card-edge)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 12, color: "var(--ink-4)",
      }}>
        <span className="mono" style={{ letterSpacing: 0.4 }}>ESCRITOR.AI © 2026</span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Transação criptografada de ponta a ponta
        </span>
      </footer>
    </div>
  );
}
