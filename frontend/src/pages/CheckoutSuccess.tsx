import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const PLAN_DISPLAY: Record<string, { name: string; price: string; credits: number }> = {
  basic: { name: "Autor", price: "R$ 29,00", credits: 60 },
  premium: { name: "Obra Completa", price: "R$ 59,00", credits: 150 },
};

function Logo() {
  return (
    <div className="logo">
      <span>Escritor</span><span className="dot">.ai</span>
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
      }}>{value}</span>
    </div>
  );
}

export function CheckoutSuccess() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const plan = user?.user_plan?.plan ?? "basic";
  const planInfo = PLAN_DISPLAY[plan] ?? PLAN_DISPLAY.basic;
  const credits = user?.user_plan?.credits ?? planInfo.credits;
  const expiresAt = user?.user_plan?.expires_at
    ? new Date(user.user_plan.expires_at).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const userName = user?.first_name || user?.username || "escritor";

  return (
    <div style={{
      minHeight: "100vh", background: "var(--paper)",
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      {/* Decorative lines */}
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
        position: "relative", zIndex: 2,
        padding: "24px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Logo />
        <div className="mono" style={{ fontSize: 12, color: "var(--ink-4)", letterSpacing: 0.5 }}>
          PAGAMENTO SEGURO · SSL
        </div>
      </header>

      {/* Body */}
      <main style={{
        position: "relative", zIndex: 1, flex: 1,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
        alignItems: "center",
        gap: 48,
        padding: "0 60px 48px",
        maxWidth: 1200, width: "100%",
        margin: "0 auto",
      }}>
        {/* Left — copy */}
        <div>
          {/* Animated check seal */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--green)",
            display: "grid", placeItems: "center",
            boxShadow: "0 8px 24px -6px rgba(15,122,79,0.5)",
            marginBottom: 24, position: "relative",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5">
                <animate attributeName="stroke-dasharray" from="0 30" to="30 0" dur="0.5s" begin="0.2s" fill="freeze" />
              </path>
            </svg>
            <span style={{
              position: "absolute", inset: -6, borderRadius: "50%",
              border: "2px solid var(--mint)", opacity: 0.5,
            }} />
          </div>

          <div className="eyebrow">PAGAMENTO CONFIRMADO</div>

          <h1 className="serif" style={{
            marginTop: 18,
            fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 500,
            letterSpacing: "-0.03em", lineHeight: 1.0,
            color: "var(--ink)", textWrap: "balance" as React.CSSProperties["textWrap"],
          }}>
            Obrigado, {userName}.<br />
            <em style={{ color: "var(--ink-3)" }}>Sua história continua.</em>
          </h1>

          <p className="serif" style={{
            marginTop: 20, fontSize: 18, lineHeight: 1.55,
            color: "var(--ink-2)", maxWidth: 480,
          }}>
            Seu plano <strong style={{ color: "var(--ink)" }}>{planInfo.name}</strong> está ativo e{" "}
            <strong style={{ color: "var(--green)" }}>{credits} créditos</strong> já foram
            adicionados à sua conta. Pode voltar a escrever — a leitora paciente está pronta.
          </p>

          <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate("/dashboard")}>
              Voltar a escrever
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate("/dashboard")}>
              Ver meus projetos
            </button>
          </div>

          <div style={{
            marginTop: 28,
            display: "flex", alignItems: "center", gap: 10,
            fontSize: 13, color: "var(--ink-3)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            Enviamos o recibo para o seu e-mail.
          </div>
        </div>

        {/* Right — receipt card */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          <div className="card" style={{
            width: "min(400px, 100%)",
            padding: 0,
            boxShadow: "var(--sh-3)",
            transform: "rotate(1.2deg)",
            overflow: "hidden",
          }}>
            {/* Card header */}
            <div style={{
              padding: "20px 24px 18px",
              background: "linear-gradient(180deg, var(--mint-wash-soft), transparent)",
              borderBottom: "1px dashed var(--card-edge)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div className="eyebrow" style={{ fontSize: 10 }}>RECIBO</div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 500, marginTop: 6, color: "var(--ink)" }}>
                  Plano {planInfo.name}
                </div>
              </div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                height: 26, padding: "0 9px",
                fontSize: 11, fontWeight: 500, borderRadius: 999,
                background: "#d6efe2", color: "var(--green-deep)",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Pago
              </span>
            </div>

            {/* Credits highlight */}
            <div style={{
              padding: "20px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: "1px dashed var(--card-edge)",
            }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Créditos adicionados</div>
                <div className="serif" style={{
                  fontSize: 36, fontWeight: 500,
                  color: "var(--green)", letterSpacing: "-0.02em", lineHeight: 1.1,
                }}>
                  +{credits}
                </div>
              </div>
              <div style={{
                width: 54, height: 54, borderRadius: "50%",
                background: "var(--mint-wash)",
                display: "grid", placeItems: "center",
                color: "var(--green-deep)",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
                  <path d="M19 14l.7 1.6L21.5 16l-1.6.7L19 18l-.7-1.6L16.5 16l1.6-.7L19 14z" />
                </svg>
              </div>
            </div>

            {/* Line items */}
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 11 }}>
              <ReceiptRow label="Ciclo" value="Mensal" />
              <ReceiptRow label="Renova em" value={expiresAt} />
              <div style={{ height: 1, background: "var(--card-edge)", margin: "4px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>Total pago</span>
                <span className="serif" style={{ fontSize: 24, fontWeight: 500, color: "var(--ink)" }}>
                  {planInfo.price}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "14px 24px",
              background: "var(--paper)",
              borderTop: "1px dashed var(--card-edge)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: 0.5,
            }}>
              <span>ESCRITOR.AI</span>
              <span>OBRIGADO PELA CONFIANÇA ♥</span>
            </div>
          </div>
        </div>
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
        <span style={{ display: "flex", gap: 18 }}>
          <button
            onClick={() => navigate("/select-plan")}
            style={{ color: "var(--ink-3)", cursor: "pointer" }}
          >
            Gerenciar assinatura
          </button>
          <button style={{ color: "var(--green)", cursor: "pointer" }}>
            Precisa de ajuda?
          </button>
        </span>
      </footer>
    </div>
  );
}
