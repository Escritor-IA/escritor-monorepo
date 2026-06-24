import { useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NotFound from "./pages/NotFound";
import logo from "./assets/logo.png";

const APP_URL = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";

/* ============ LANGUAGE SELECTOR ============ */
const LANGS = [
  { code: "pt-br", label: "Português" },
  { code: "en",    label: "English" },
  { code: "fr",    label: "Français" },
  { code: "es",    label: "Español" },
] as const;
type LangCode = (typeof LANGS)[number]["code"];

function FlagSVG({ code, size = 18 }: { code: LangCode; size?: number }) {
  const h = Math.round(size * 0.7);
  const style: React.CSSProperties = { display: "block", borderRadius: 2, flexShrink: 0 };
  if (code === "pt-br") return (
    <svg width={size} height={h} viewBox="0 0 20 14" style={style}>
      <rect width="20" height="14" fill="#009B3A" />
      <polygon points="10,1.4 18.8,7 10,12.6 1.2,7" fill="#FEDF00" />
      <circle cx="10" cy="7" r="3.6" fill="#002776" />
      <path d="M6.6 5.8 Q10 4.6 13.4 5.8" stroke="white" strokeWidth="0.7" fill="none" />
    </svg>
  );
  if (code === "en") return (
    <svg width={size} height={h} viewBox="0 0 20 14" style={style}>
      <rect width="20" height="14" fill="#B22234" />
      {([0, 2, 4, 6, 8, 10, 12] as number[]).map((y) => (
        <rect key={y} width="20" height="1.08" y={y + 1.08} fill="white" />
      ))}
      <rect width="8.5" height="7.6" fill="#3C3B6E" />
      {([1, 3, 5] as number[]).map((row) =>
        ([1.2, 2.8, 4.4, 6.0] as number[]).map((col) => (
          <circle key={`${row}-${col}`} cx={col} cy={row} r="0.38" fill="white" />
        ))
      )}
      {([2, 4] as number[]).map((row) =>
        ([2.0, 3.6, 5.2] as number[]).map((col) => (
          <circle key={`${row}-${col}`} cx={col} cy={row} r="0.38" fill="white" />
        ))
      )}
    </svg>
  );
  if (code === "fr") return (
    <svg width={size} height={h} viewBox="0 0 20 14" style={style}>
      <rect width="20" height="14" fill="#ED2939" />
      <rect width="13.4" height="14" fill="white" />
      <rect width="6.7" height="14" fill="#002395" />
    </svg>
  );
  return (
    <svg width={size} height={h} viewBox="0 0 20 14" style={style}>
      <rect width="20" height="14" fill="#C60B1E" />
      <rect width="20" height="7" y="3.5" fill="#FFC400" />
    </svg>
  );
}

function LandingLanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const rawLang = i18n.language?.toLowerCase() ?? "pt-br";
  const validCodes = LANGS.map((l) => l.code) as string[];
  const current: LangCode = validCodes.includes(rawLang) ? (rawLang as LangCode) : "pt-br";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const select = (code: LangCode) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 32,
          padding: "0 10px",
          borderRadius: 999,
          border: "1px solid rgba(0,0,0,0.12)",
          background: open ? "rgba(0,0,0,0.05)" : "transparent",
          color: "inherit",
          fontSize: 12,
          fontFamily: "inherit",
          cursor: "pointer",
          transition: "background .15s",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "rgba(0,0,0,0.05)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
        aria-label="Language"
      >
        <FlagSVG code={current} size={18} />
        <span>{current === "pt-br" ? "PT" : current.toUpperCase()}</span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: "transform .15s", transform: open ? "rotate(180deg)" : "none" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "#fff", border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          overflow: "hidden", minWidth: 148, zIndex: 300,
        }}>
          {LANGS.map((l, i) => {
            const active = l.code === current;
            return (
              <button
                key={l.code}
                onClick={() => select(l.code)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "9px 14px", fontSize: 13,
                  color: active ? "#111" : "#444",
                  background: active ? "rgba(0,0,0,0.04)" : "transparent",
                  fontWeight: active ? 600 : 400,
                  textAlign: "left", cursor: "pointer",
                  borderBottom: i < LANGS.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  transition: "background .1s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <FlagSVG code={l.code} size={20} />
                <span>{l.label}</span>
                {active && (
                  <svg style={{ marginLeft: "auto" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2d7a22" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ ARROW ============ */
function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="arrow"
      aria-hidden="true"
    >
      <path
        d="M2 7h10M8 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============ NAV ============ */
function Nav() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="wrap nav-inner">
        <a href="#" className="brand">
          <img
            src={logo}
            alt="Escritor.ia"
            style={{ width: 34, height: 34, borderRadius: 8 }}
          />
          <span>
            Escritor<span className="brand-dot">.</span>ia
          </span>
        </a>
        <div className="nav-links">
          <a href="#produto">{t("nav.editor")}</a>
          <a href="#diferenciais">{t("nav.features")}</a>
          <a href="#planos">{t("nav.plans")}</a>
          <a href="#sobre">{t("nav.about")}</a>
        </div>
        <div className="nav-cta">
          <LandingLanguageSelector />
          <a href={`${APP_URL}/login`} className="btn btn-ghost btn-sm">
            {t("nav.login")}
          </a>
          <a href={`${APP_URL}/register`} className="btn btn-primary btn-sm">
            {t("nav.register")} <Arrow />
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ============ EDITOR MOCKUP ============ */
function EditorMockup() {
  const { t } = useTranslation();
  return (
    <div className="editor">
      <div className="editor-bar">
        <div className="traffic">
          <span />
          <span />
          <span />
        </div>
        <div className="file-name">
          <span>O Vão da Estrela</span>
          <span className="sep">/</span>
          <b>Capítulo 7 — O cheiro do mercado</b>
        </div>
        <span className="genre-chip">Fantasia</span>
      </div>
      <div className="editor-toolbar">
        <span className="tool active">{t("mockup.revision")}</span>
        <span className="tool">{t("mockup.rewrite")}</span>
        <span className="tool">{t("mockup.readers")}</span>
        <span className="tool">{t("mockup.versions")}</span>
        <span className="tool-sep" />
        <span className="tool">{t("mockup.coherence")}</span>
        <span className="tool">{t("mockup.voice")}</span>
        <span className="word-count">{t("mockup.word_count")}</span>
      </div>
      <div className="editor-body">
        <div className="gutter">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((n) => (
            <div key={n} className={`ln${n === 7 ? " active" : ""}`}>
              {n}
            </div>
          ))}
        </div>
        <div className="prose">
          <div className="chapter">Capítulo 7</div>
          <h2 className="chapter-title">O cheiro do mercado</h2>
          <p>
            Eliana parou na entrada do mercado de pedras. O cheiro de incenso
            queimado misturava-se ao som metálico das moedas trocando de mão, e
            a luz da tarde caía sobre as bancas em listras de cobre velho.{" "}
            <span className="hl">Ela apertou a bolsa contra o peito</span> —
            dentro dela, o fragmento ainda pulsava, como se reconhecesse o lugar
            onde havia sido encontrado séculos antes.
          </p>
          <p>
            Um vendedor a chamou pelo nome que ela não usava há nove anos.
            Eliana <span className="strike"> sentiu medo</span>
            <span className="insert">
              {" "}
              hesitou — não pelo medo, mas pela facilidade com que aquele nome
              ainda servia
            </span>
            . Atravessou a multidão sem olhar para trás, e percebeu, tarde
            demais, que o homem de capa cinza já a seguia há três becos.
          </p>
          <p>
            <span className="hl warm">
              Foi nesse momento, e não antes, que ela decidiu não voltar mais
              para casa.
            </span>{" "}
            A decisão chegou sem palavras, como costumam chegar as decisões
            verdadeiras: uma certeza instalada nos ombros, no jeito de respirar,
            no peso da bolsa contra o peito.
          </p>
          <p>
            O mercado se fechava ao seu redor. Ela contou três saídas e escolheu
            a que cheirava a mar —{" "}
            <span className="hl cool">
              o mar, sempre o mar, lembrava-lhe a mãe
            </span>
            , e era para isso que mães serviam nas histórias em que os filhos
            fugiam: para serem cheiros, e não corpos.
          </p>
          <p>
            Ao virar a esquina, a capa cinza já estava à sua frente. Não atrás.
            À frente. E sorria.
          </p>
        </div>
        <aside className="margin">
          <div className="margin-title">{t("mockup.annotation_label")}</div>
          <div className="note">
            <div className="who">
              <span>●</span> {t("mockup.coherence")}
            </div>
            A bolsa foi descrita como vazia no Capítulo 4. Você quer manter o
            fragmento aqui, ou ajustar lá?
          </div>
          <div className="note green">
            <div className="who">
              <span>●</span> {t("mockup.voice")}
            </div>
            Sua escolha por{" "}
            <i>"como costumam chegar as decisões verdadeiras"</i> está coerente
            com o narrador onisciente que você firmou nos capítulos 2 e 5.
            Manter.
          </div>
          <div className="note gray">
            <div className="who">
              <span>●</span> Sugestão · sob pedido
            </div>
            "Sentiu medo" é dito antes de ser mostrado. Quer ver 3 reescritas
            que mostrem o medo pelo corpo dela?
          </div>
          <div className="readers">
            <div className="readers-title">{t("mockup.reader_label")}</div>
            <div className="reader">
              <div className="reader-avatar">M</div>
              <div className="reader-name">Marina · fantasia adulta</div>
              <div className="reader-meter">
                <span className="on" />
                <span className="on" />
                <span className="on" />
                <span className="on" />
                <span />
              </div>
            </div>
            <div className="reader">
              <div
                className="reader-avatar"
                style={{ background: "var(--leaf)" }}
              >
                D
              </div>
              <div className="reader-name">Davi · estreantes BR</div>
              <div className="reader-meter">
                <span className="on" />
                <span className="on" />
                <span className="on" />
                <span className="warn" />
                <span />
              </div>
            </div>
            <div className="reader">
              <div
                className="reader-avatar"
                style={{ background: "var(--ink-2)" }}
              >
                R
              </div>
              <div className="reader-name">Renata · leitura crítica</div>
              <div className="reader-meter">
                <span className="on" />
                <span className="on" />
                <span className="warn" />
                <span className="bad" />
                <span />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============ HERO ============ */
function Hero() {
  const { t } = useTranslation();
  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">
          <span className="pulse" />
          {t("hero.eyebrow")}
        </span>
        <h1 className="h1">
          {t("hero.h1_before")}<em>{t("hero.h1_em")}</em>
        </h1>
        <p className="h1-sub">{t("hero.sub")}</p>
        <div className="hero-cta">
          <a href={`${APP_URL}/register`} className="btn btn-primary btn-lg">
            {t("hero.cta_primary")} <Arrow />
          </a>
          <a href="#planos" className="btn btn-ghost btn-lg">
            {t("hero.cta_secondary")}
          </a>
          <span className="hero-note">{t("hero.note")}</span>
        </div>
      </div>
      <div className="wrap peek">
        <div className="peek-label">
          <span>{t("hero.mockup_hint")}</span>
          <svg width="46" height="10" viewBox="0 0 46 10" fill="none">
            <path
              d="M0 5h36M30 1l6 4-6 4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <EditorMockup />
        <div className="scroll-cue">
          <span>{t("hero.scroll_cue")}</span>
          <span className="line" />
        </div>
      </div>
    </header>
  );
}

/* ============ PRODUCT REVEAL ============ */
function ProductReveal() {
  const { t } = useTranslation();
  return (
    <section
      id="produto"
      className="wrap section"
      style={{ paddingTop: "clamp(40px, 6vw, 80px)" }}
    >
      <div className="below-editor-row">
        <div>
          <span className="reveal-eyebrow">{t("product.eyebrow")}</span>
          <h2 className="reveal-title">
            {t("product.h2_before")}<em>{t("product.h2_em")}</em>{t("product.h2_after")}
          </h2>
        </div>
        <div className="reveal-body">
          <p>{t("product.p1")}</p>
          <p>{t("product.p2")}</p>
        </div>
      </div>
    </section>
  );
}

/* ============ DIFERENCIAIS ============ */
interface FeatureItem {
  n: string;
  h_before: string;
  h_em: string;
  h_after: string;
  body: string;
  glyph: string;
}

function Diferenciais() {
  const { t } = useTranslation();
  const items = t("features.items", { returnObjects: true }) as FeatureItem[];

  return (
    <section id="diferenciais" className="wrap section">
      <span className="section-eyebrow">{t("features.eyebrow")}</span>
      <h2 className="section-h">
        {t("features.h2_before")}<em>{t("features.h2_em")}</em>{t("features.h2_after")}
      </h2>
      <p className="section-lead">{t("features.lead")}</p>
      <div className="features">
        {items.map((it) => (
          <div className="feature" key={it.n}>
            <div className="feature-num">{it.n}</div>
            <h3 className="feature-h">
              {it.h_before}<em>{it.h_em}</em>{it.h_after}
            </h3>
            <p className="feature-body">{it.body}</p>
            <div className="feature-glyph">{it.glyph}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============ PLANS ============ */
interface PlanTranslation {
  name: string;
  desc: string;
  per: string;
  meta: string;
  cta: string;
  feats: string[];
}

const PLAN_KEYS = ["free", "author", "complete"] as const;
const PLAN_PRICES = { free: "0", author: "29", complete: "59" };
const PLAN_FEATURED = { free: false, author: true, complete: false };
const PLAN_FEAT_OK: Record<string, boolean[]> = {
  free:     [true, true, true, true, false, false],
  author:   [true, true, true, true, true, true],
  complete: [true, true, true, true, true],
};

function Plans() {
  const { t } = useTranslation();

  return (
    <section id="planos" className="wrap section">
      <span className="section-eyebrow">{t("plans.eyebrow")}</span>
      <h2 className="section-h">
        {t("plans.h2_before")}<em>{t("plans.h2_em")}</em>{t("plans.h2_after")}
      </h2>
      <p className="section-lead">{t("plans.lead")}</p>
      <div className="pricing">
        {PLAN_KEYS.map((key) => {
          const p = t(`plans.${key}`, { returnObjects: true }) as PlanTranslation;
          const featured = PLAN_FEATURED[key];
          const okFlags = PLAN_FEAT_OK[key];
          return (
            <div key={key} className={`plan${featured ? " featured" : ""}`}>
              {featured && <span className="featured-tag">{t("plans.most_chosen")}</span>}
              <div className="plan-name">{p.name}</div>
              <div className="plan-desc">{p.desc}</div>
              <div className="price">
                <span className="currency">R$</span>
                <span className="amount">{PLAN_PRICES[key]}</span>
                <span className="per">{p.per}</span>
              </div>
              <div className="plan-meta">{p.meta}</div>
              <ul className="plan-feat">
                {p.feats.map((feat, i) => (
                  <li key={i} className={okFlags[i] ? "" : "off"}>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href={`${APP_URL}/register`}
                className={`btn ${featured ? "btn-primary" : "btn-ghost"}`}
              >
                {p.cta} <Arrow />
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============ FINAL CTA ============ */
function FinalCTA() {
  const { t } = useTranslation();
  return (
    <section id="sobre" className="wrap" style={{ paddingTop: 40 }}>
      <div className="final-cta">
        <h2 className="h">
          {t("final_cta.h_before")}<em>{t("final_cta.h_em")}</em>{t("final_cta.h_after")}
        </h2>
        <p className="sub">{t("final_cta.sub")}</p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <a href={`${APP_URL}/register`} className="btn btn-primary btn-lg">
            {t("final_cta.cta_primary")} <Arrow />
          </a>
          <a href="#planos" className="btn btn-ghost btn-lg">
            {t("final_cta.cta_secondary")}
          </a>
        </div>
        <div className="signoff">
          {t("final_cta.signoff_line1")}
          <br />
          {t("final_cta.signoff_line2")}
        </div>
      </div>
    </section>
  );
}

/* ============ FOOTER ============ */
function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-col">
            <a
              href="#"
              className="brand"
              style={{ marginBottom: 14, display: "inline-flex" }}
            >
              <img
                src={logo}
                alt="Escritor.ia"
                style={{ width: 34, height: 34, borderRadius: 8 }}
              />
              <span>
                Escritor<span className="brand-dot">.</span>ia
              </span>
            </a>
            <p className="foot-tag">{t("footer.tagline")}</p>
          </div>
          <div className="foot-col">
            <h4>{t("footer.col_product")}</h4>
            <ul>
              <li><a href="#produto">{t("footer.link_editor")}</a></li>
              <li><a href="#diferenciais">{t("footer.link_features")}</a></li>
              <li><a href="#planos">{t("footer.link_plans")}</a></li>
              <li><a href="#">{t("footer.link_genres")}</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>{t("footer.col_company")}</h4>
            <ul>
              <li><a href="#">{t("footer.link_about")}</a></li>
              <li><a href="#">{t("footer.link_manifesto")}</a></li>
              <li><a href="#">{t("footer.link_contact")}</a></li>
              <li><a href="#">{t("footer.link_careers")}</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>{t("footer.col_community")}</h4>
            <ul>
              <li><a href="#">{t("footer.link_blog")}</a></li>
              <li><a href="#">{t("footer.link_newsletter")}</a></li>
              <li><a href="#">{t("footer.link_discord")}</a></li>
              <li><a href="#">{t("footer.link_terms")}</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>{t("footer.copyright")}</span>
          <span>{t("footer.made_in")}</span>
        </div>
      </div>
    </footer>
  );
}

/* ============ LANDING ============ */
function Landing() {
  return (
    <>
      <Nav />
      <Hero />
      <ProductReveal />
      <Diferenciais />
      <Plans />
      <FinalCTA />
      <Footer />
    </>
  );
}

/* ============ APP ============ */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
