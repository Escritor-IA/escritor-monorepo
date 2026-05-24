import { useEffect, useState } from "react";
import logo from "./assets/logo.png";

const APP_URL = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";

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
          <a href="#produto">O Editor</a>
          <a href="#diferenciais">Diferenciais</a>
          <a href="#planos">Planos</a>
          <a href="#sobre">Sobre</a>
        </div>
        <div className="nav-cta">
          <a href={`${APP_URL}/login`} className="btn btn-ghost btn-sm">
            Entrar
          </a>
          <a href={`${APP_URL}/register`} className="btn btn-primary btn-sm">
            Comece aqui <Arrow />
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ============ EDITOR MOCKUP ============ */
function EditorMockup() {
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
        <span className="tool active">Revisão</span>
        <span className="tool">Reescrever</span>
        <span className="tool">Leitores</span>
        <span className="tool">Versões</span>
        <span className="tool-sep" />
        <span className="tool">Coerência</span>
        <span className="tool">Voz autoral</span>
        <span className="word-count">7.842 palavras · cap. 7 de 12</span>
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
          <div className="margin-title">Anotações · linha 7</div>
          <div className="note">
            <div className="who">
              <span>●</span> Coerência
            </div>
            A bolsa foi descrita como vazia no Capítulo 4. Você quer manter o
            fragmento aqui, ou ajustar lá?
          </div>
          <div className="note green">
            <div className="who">
              <span>●</span> Voz autoral
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
            <div className="readers-title">Leitores simulados · cap. 7</div>
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
  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">
          <span className="pulse" />
          Em beta
        </span>
        <h1 className="h1">
          Um parceiro para quem <em>escreve.</em>
        </h1>
        <p className="h1-sub">
          A primeira plataforma brasileira de apoio à escrita de ficção. Recebe
          seu texto, devolve coerência narrativa, reações de leitores simulados
          e sugestões — sempre sob seu pedido, sempre na sua voz. Nunca escreve
          por você.
        </p>
        <div className="hero-cta">
          <a href={`${APP_URL}/register`} className="btn btn-primary btn-lg">
            Comece aqui <Arrow />
          </a>
          <a href="#planos" className="btn btn-ghost btn-lg">
            Ver planos
          </a>
          <span className="hero-note">
            grátis até 5.000 palavras · sem cartão
          </span>
        </div>
      </div>
      <div className="wrap peek">
        <div className="peek-label">
          <span>Imagem apenas ilustrativa</span>
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
          <span>continue lendo</span>
          <span className="line" />
        </div>
      </div>
    </header>
  );
}

/* ============ PRODUCT REVEAL ============ */
function ProductReveal() {
  return (
    <section
      id="produto"
      className="wrap section"
      style={{ paddingTop: "clamp(40px, 6vw, 80px)" }}
    >
      <div className="below-editor-row">
        <div>
          <span className="reveal-eyebrow">— o editor, por dentro</span>
          <h2 className="reveal-title">
            Anotações na margem. <em>Voz autoral</em> intacta.
          </h2>
        </div>
        <div className="reveal-body">
          <p>
            Você sobe um capítulo ou o manuscrito inteiro. O Escritor.AI lê o
            texto à luz do gênero que você declara — fantasia, mistério,
            infantojuvenil, romance — e devolve apontamentos pontuais na margem.
            Coerência de personagem. Continuidade de cena. Ritmo. Voz.
          </p>
          <p>
            Sugestões só aparecem quando você pede. A ferramenta nunca substitui
            um parágrafo seu; quando muito, propõe três caminhos e deixa a
            escolha com quem sempre teve a escolha: <i>você</i>.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============ DIFERENCIAIS ============ */
function Diferenciais() {
  const items = [
    {
      n: "01",
      h: (
        <>
          Calibrado por <em>gênero</em>, não por nicho de marketing.
        </>
      ),
      body: "Fantasia tem regras diferentes de romance, que tem regras diferentes de infantojuvenil. O Escritor.AI muda a lente conforme o gênero declarado da sua obra — não conforme um template de SEO.",
      glyph: "fantasia · mistério · infantojuvenil · romance",
    },
    {
      n: "02",
      h: (
        <>
          Leitores <em>simulados</em>. Reação antes da publicação.
        </>
      ),
      body: "Escolha de 3 a 6 perfis de leitor — estreante, leitor de gênero, leitura crítica. Veja onde cada um se prende, onde se solta, e em que cena fecha o livro pela primeira vez.",
      glyph: "3 a 6 perfis · feedback por cena",
    },
    {
      n: "03",
      h: (
        <>
          Sua voz, no centro. <em>Sempre</em>.
        </>
      ),
      body: "Nada de gerar o próximo parágrafo por você. Nada de uniformizar seu estilo. O Escritor.AI aprende sua voz autoral pelos capítulos que você já escreveu, e usa isso como referência das próprias sugestões.",
      glyph: "co-autor não. parceiro sim.",
    },
  ];

  return (
    <section id="diferenciais" className="wrap section">
      <span className="section-eyebrow">Diferenciais</span>
      <h2 className="section-h">
        Onde as outras ferramentas <em>falham</em>, a sua começa.
      </h2>
      <p className="section-lead">
        Jasper, QuillBot, Clarice.ai — todas excelentes para copy de marketing.
        Nenhuma feita para ficção literária brasileira. O Escritor.AI é a
        primeira.
      </p>
      <div className="features">
        {items.map((it) => (
          <div className="feature" key={it.n}>
            <div className="feature-num">{it.n}</div>
            <h3 className="feature-h">{it.h}</h3>
            <p className="feature-body">{it.body}</p>
            <div className="feature-glyph">{it.glyph}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============ PLANS ============ */
interface PlanFeat {
  t: string;
  ok: boolean;
}
interface PlanData {
  name: string;
  desc: string;
  price: string;
  per: string;
  meta: string;
  cta: string;
  feats: PlanFeat[];
  featured: boolean;
}

function Plans() {
  const plans: PlanData[] = [
    {
      name: "Rascunho",
      desc: "Para começar a tatear o caminho.",
      price: "0",
      per: "/sempre",
      meta: "Sem cartão · sem prazo",
      cta: "Criar conta",
      feats: [
        { t: "Até 5.000 palavras por capítulo", ok: true },
        { t: "10 créditos iniciais mensais", ok: true },
        { t: "Coerência narrativa básica", ok: true },
        { t: "1 leitor simulado por mês", ok: true },
        { t: "Análise Total do Manuscrito", ok: false },
        { t: "Sugestões pontuais sob demanda", ok: false },
      ],
      featured: false,
    },
    {
      name: "Autor",
      desc: "Para quem está escrevendo a obra.",
      price: "29",
      per: "/mês",
      meta: "Cobrança anual: R$ 24/mês",
      cta: "Começar 14 dias grátis",
      feats: [
        { t: "Até 15.000 palavras por capítulo", ok: true },
        { t: "60 créditos iniciais mensais", ok: true },
        { t: "Anotações calibradas por gênero", ok: true },
        { t: "3 perfis de leitor simulados", ok: true },
        { t: "Sugestões sob demanda", ok: true },
        { t: "Histórico de versões", ok: true },
      ],
      featured: true,
    },
    {
      name: "Obra Completa",
      desc: "Para quem está fechando o livro.",
      price: "59",
      per: "/mês",
      meta: "Cobrança anual: R$ 49/mês",
      cta: "Falar com a gente",
      feats: [
        { t: "Tudo do plano Autor", ok: true },
        { t: "Texto Ilimitado por capítulo", ok: true },
        { t: "150 créditos iniciais mensais", ok: true },
        { t: "Leitura crítica em capítulos longos", ok: true },
        { t: "6 perfis de leitor simulados", ok: true },
      ],
      featured: false,
    },
  ];

  return (
    <section id="planos" className="wrap section">
      <span className="section-eyebrow">Planos</span>
      <h2 className="section-h">
        Pague <em>menos</em> que um café por capítulo revisado.
      </h2>
      <p className="section-lead">
        Revisar profissionalmente um romance de 80 mil palavras custa entre
        R$2.400 e R$6.400. Aqui, você acompanha o processo inteiro pelo preço de
        uma assinatura.
      </p>
      <div className="pricing">
        {plans.map((p) => (
          <div key={p.name} className={`plan${p.featured ? " featured" : ""}`}>
            {p.featured && <span className="featured-tag">Mais escolhido</span>}
            <div className="plan-name">{p.name}</div>
            <div className="plan-desc">{p.desc}</div>
            <div className="price">
              <span className="currency">R$</span>
              <span className="amount">{p.price}</span>
              <span className="per">{p.per}</span>
            </div>
            <div className="plan-meta">{p.meta}</div>
            <ul className="plan-feat">
              {p.feats.map((f, i) => (
                <li key={i} className={f.ok ? "" : "off"}>
                  {f.t}
                </li>
              ))}
            </ul>
            <a
              href={`${APP_URL}/register`}
              className={`btn ${p.featured ? "btn-primary" : "btn-ghost"}`}
            >
              {p.cta} <Arrow />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============ FINAL CTA ============ */
function FinalCTA() {
  return (
    <section id="sobre" className="wrap" style={{ paddingTop: 40 }}>
      <div className="final-cta">
        <h2 className="h">
          O próximo capítulo é seu. A <em>ferramenta</em> é nossa.
        </h2>
        <p className="sub">
          Comece com o plano gratuito agora. Suba um trecho do seu livro,
          escolha o gênero e veja a margem se preencher de anotações em
          segundos.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <a href={`${APP_URL}/register`} className="btn btn-primary btn-lg">
            Comece aqui <Arrow />
          </a>
          <a href="#planos" className="btn btn-ghost btn-lg">
            Ver os planos
          </a>
        </div>
        <div className="signoff">
          "Nunca escreve por você.
          <br />
          Sempre a serviço de quem cria."
        </div>
      </div>
    </section>
  );
}

/* ============ FOOTER ============ */
function Footer() {
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
            <p className="foot-tag">
              A primeira plataforma brasileira de apoio à escrita de ficção.
              Para escritores independentes que querem escrever com qualidade,
              não apenas com velocidade.
            </p>
          </div>
          <div className="foot-col">
            <h4>Produto</h4>
            <ul>
              <li>
                <a href="#produto">O editor</a>
              </li>
              <li>
                <a href="#diferenciais">Diferenciais</a>
              </li>
              <li>
                <a href="#planos">Planos</a>
              </li>
              <li>
                <a href="#">Gêneros suportados</a>
              </li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Empresa</h4>
            <ul>
              <li>
                <a href="#">Sobre nós</a>
              </li>
              <li>
                <a href="#">Manifesto</a>
              </li>
              <li>
                <a href="#">Contato</a>
              </li>
              <li>
                <a href="#">Carreiras</a>
              </li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Comunidade</h4>
            <ul>
              <li>
                <a href="#">Blog do escritor</a>
              </li>
              <li>
                <a href="#">Boletim mensal</a>
              </li>
              <li>
                <a href="#">Discord</a>
              </li>
              <li>
                <a href="#">Termos e privacidade</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>
            © 2026 Escritor.AI — Souza · Grigolin · Lopes Filho · Thomazete ·
            Carbelotti
          </span>
          <span>feito no Brasil ✦</span>
        </div>
      </div>
    </footer>
  );
}

/* ============ APP ============ */
export default function App() {
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
