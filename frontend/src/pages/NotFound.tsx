import { useNavigate } from "react-router-dom";
import { Button } from "@/components/UI/Button";
import logo from "@/assets/logo.png";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--paper)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* paper grain + green underlines */}
      <svg aria-hidden="true" viewBox="0 0 1440 900" preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.6, pointerEvents: "none" }}>
        <g stroke="var(--mint)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M-40 200 C 360 200, 520 240, 880 180" opacity="0.35" />
          <path d="M-40 240 C 380 270, 600 320, 940 260" opacity="0.22" />
          <path d="M860 660 C 1060 640, 1240 700, 1480 660" opacity="0.3" />
          <path d="M860 700 C 1080 700, 1260 740, 1480 720" opacity="0.18" />
        </g>
      </svg>

      {/* Header */}
      <header style={{
        position: "relative",
        zIndex: 2,
        padding: "26px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <button onClick={() => navigate("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <img src={logo} alt="Escritor.ia" style={{ width: 24, height: 24, borderRadius: 6 }} />
        </button>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ color: "var(--ink-3)" }}>
          ← Voltar
        </button>
      </header>

      {/* Body */}
      <main style={{
        position: "relative",
        zIndex: 1,
        flex: 1,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
        alignItems: "center",
        gap: 40,
        padding: "0 60px 40px",
        maxWidth: 1280,
        width: "100%",
        margin: "0 auto",
      }}>
        {/* LEFT — copy */}
        <div>
          <div className="eyebrow">ERRO 404 · PÁGINA NÃO ENCONTRADA</div>

          <h1 className="serif" style={{
            marginTop: 20,
            fontSize: "clamp(44px, 5.4vw, 72px)",
            fontWeight: 500,
            letterSpacing: "-0.035em",
            lineHeight: 0.98,
            color: "var(--ink)",
            textWrap: "balance",
          } as React.CSSProperties}>
            Esta página<br />
            <em style={{ color: "var(--ink-3)" }}>nunca foi escrita.</em>
          </h1>

          <p className="serif" style={{
            marginTop: 20,
            fontSize: 17,
            lineHeight: 1.55,
            color: "var(--ink-2)",
            maxWidth: 460,
          }}>
            Você abriu um capítulo que não existe no nosso manuscrito.
            Talvez tenha sido um link antigo, talvez um erro de digitação —
            ou talvez, simplesmente, ainda esteja por vir.
          </p>

          <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Button variant="primary" size="lg" onClick={() => navigate("/login")}>
              Entrar na minha conta
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate("/register")}>
              Criar uma conta
            </Button>
          </div>

          <div style={{
            marginTop: 30,
            paddingLeft: 16,
            borderLeft: "2px solid var(--green)",
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 14,
            color: "var(--ink-3)",
            maxWidth: 420,
          }}>
            "Toda história tem um capítulo que se perdeu.
            Felizmente, este pode ser reescrito com um clique."
          </div>
        </div>

        {/* RIGHT — editorial "404" mark */}
        <div style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 460,
        }}>
          <div className="card" style={{
            position: "relative",
            width: "min(340px, 100%)",
            aspectRatio: "3 / 4",
            padding: "24px 22px",
            transform: "rotate(-3deg)",
            boxShadow: "var(--sh-3)",
            display: "flex",
            flexDirection: "column",
            background: "var(--card)",
          }}>
            <div className="eyebrow" style={{ fontSize: 10 }}>MANUSCRITO · FOLHA Nº 404</div>

            <div style={{ flex: 1, position: "relative", display: "grid", placeItems: "center" }}>
              <div className="serif" style={{
                fontSize: 144,
                fontWeight: 500,
                letterSpacing: "-0.05em",
                lineHeight: 1,
                color: "var(--ink)",
                position: "relative",
              }}>
                404
                {/* hand-drawn strike-through */}
                <svg aria-hidden="true" viewBox="0 0 300 200" style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}>
                  <path d="M20 130 C 90 90, 200 140, 290 70"
                    fill="none" stroke="var(--green)" strokeWidth="6"
                    strokeLinecap="round" opacity="0.9" />
                  <path d="M22 138 C 95 100, 205 148, 288 80"
                    fill="none" stroke="var(--green)" strokeWidth="2"
                    strokeLinecap="round" opacity="0.5" />
                </svg>
              </div>
            </div>

            <div style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 17,
              lineHeight: 1.45,
              color: "var(--ink-2)",
              textAlign: "center",
              marginTop: 4,
            }}>
              <span style={{ color: "var(--ink-4)" }}>Nota da autora:</span><br />
              <span>não dá pra encontrar<br />o que nunca foi escrito.</span>
            </div>

            <div style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "var(--ink-4)",
              letterSpacing: 0.5,
            }}>
              <span>v. 2.4 · MAI 2026</span>
              <span>// CAPÍTULO INEXISTENTE</span>
            </div>
          </div>

          {/* stamp accent */}
          <div style={{
            position: "absolute",
            right: -8,
            top: 30,
            transform: "rotate(8deg)",
            fontFamily: "var(--mono)",
            fontSize: 12,
            letterSpacing: 2,
            color: "var(--red)",
            border: "2px solid var(--red)",
            padding: "6px 12px",
            borderRadius: 4,
            background: "rgba(179, 56, 44, 0.04)",
            opacity: 0.85,
          }}>NÃO ENCONTRADO</div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: "relative",
        zIndex: 2,
        padding: "20px 40px",
        borderTop: "1px solid var(--card-edge)",
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        color: "var(--ink-4)",
        fontFamily: "var(--mono)",
        letterSpacing: 0.4,
      }}>
        <span>ESCRITOR.AI © 2026</span>
        <span>
          Precisa de ajuda?{" "}
          <a href="mailto:contato@escritor.ai" style={{ color: "var(--green)", cursor: "pointer" }}>
            contato@escritor.ai
          </a>
        </span>
      </footer>
    </div>
  );
}
