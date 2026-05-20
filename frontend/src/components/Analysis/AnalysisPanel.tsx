import { useState, useRef, useEffect } from "react";
import type { Analysis, AnalysisType, Chapter } from "@/types";
import { ANALYSIS_COSTS } from "@/types";
import { analysesApi } from "@/api/analyses";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/UI/Button";
import { Modal } from "@/components/UI/Modal";

interface AnalysisPanelProps {
  projectId: string;
  chapter?: Chapter | null;
  selectedText?: string;
  onCreditsUpdate?: (credits: number) => void;
}

type ReaderProfileSlug = "luna" | "rafael" | "camila" | "mateus" | "vera";

interface ReaderProfile {
  slug: ReaderProfileSlug;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  role: string;
  tagline: string;
  genres: string[];
  readingStyle: string;
  criteria: string;
  reviewTone: string;
  bio: string;
  strengths: string[];
  levelLabel: string;
}

const READER_PROFILES: ReaderProfile[] = [
  {
    slug: "luna",
    name: "Luna Bastos",
    initials: "LU",
    avatarBg: "#EAF3DE",
    avatarColor: "#3B6D11",
    role: "Leitora Casual · Nível 1",
    tagline: "Âncora no gosto popular. Representa quem compra o livro na livraria sem saber teoria literária.",
    genres: ["Romance", "Distopia YA", "Fanfiction"],
    readingStyle: "Lê pelo prazer puro, sem pressão de terminar. Abandona livros sem culpa.",
    criteria: "Gostei ou não gostei. Ritmo rápido, personagens carismáticos, final satisfatório.",
    reviewTone: "Animado, emoji liberado, nota de 1 a 5 estrelas com justificativa breve.",
    bio: 'Entra no sistema com energia de fandom. Não sabe o nome dos recursos literários, mas sabe exatamente quando um livro "virou" para ela. Sua força é representar o leitor médio com honestidade.',
    strengths: ["Perspectiva popular", "Alta velocidade de leitura", "Sem preconceito de gênero"],
    levelLabel: "⭐ Iniciante",
  },
  {
    slug: "rafael",
    name: "Rafael Andrade",
    initials: "RA",
    avatarBg: "#FAEEDA",
    avatarColor: "#854F0B",
    role: "Leitor de Gênero · Nível 2",
    tagline: "Sabe quando um thriller é previsível demais ou quando uma fantasia tem world-building frouxo.",
    genres: ["Thriller", "Fantasia Épica", "Ficção Científica Soft"],
    readingStyle: "Lê em surtos compulsivos. Consome séries inteiras num fim de semana.",
    criteria: "Tensão narrativa, world-building envolvente, reviravoltas e personagens com arcos bem construídos.",
    reviewTone: "Caloroso mas com opiniões firmes. Usa comparações com outros títulos do gênero.",
    bio: "Mantém uma lista de leitura gigante e orgulhosa. Conhece bem as convenções do gênero e sabe quando uma obra as subverte com inteligência ou só faz o feijão com arroz.",
    strengths: ["Convenções de gênero", "Senso de ritmo narrativo", "Capacidade comparativa"],
    levelLabel: "⭐⭐ Entusiasta",
  },
  {
    slug: "camila",
    name: "Camila Azevedo",
    initials: "CA",
    avatarBg: "#E1F5EE",
    avatarColor: "#0F6E56",
    role: "Leitora Culta · Nível 3",
    tagline: "Culta sem ser inacessível. Contextualiza sem afastar o leitor médio — a voz mais versátil.",
    genres: ["Lit. Contemporânea", "Ensaio", "Realismo Mágico", "Memórias"],
    readingStyle: "Leitura metódica com anotações. Busca entender o contexto histórico e cultural do autor.",
    criteria: "Coerência interna, voz autoral, como o livro se posiciona dentro do seu tempo e tradição literária.",
    reviewTone: "Equilibrado entre subjetividade e análise. Cita trechos para fundamentar opiniões.",
    bio: "Faz a ponte entre o leitor comum e o especialista. Leu o suficiente para perceber influências e diálogos entre obras, mas ainda escreve para ser entendida por qualquer um.",
    strengths: ["Leitura contextualizada", "Voz acessível e precisa", "Identifica intertextualidade"],
    levelLabel: "⭐⭐⭐ Intermediária",
  },
  {
    slug: "mateus",
    name: "Mateus Figueiredo",
    initials: "MF",
    avatarBg: "#EEEDFE",
    avatarColor: "#534AB7",
    role: "Leitor Técnico · Nível 4",
    tagline: "Cirúrgico. Vai direto à prosa, sintaxe e escolhas formais. Indispensável para obras literárias sérias.",
    genres: ["Lit. Modernista", "Ficção Experimental", "Contos", "Poesia em Prosa"],
    readingStyle: "Lento e deliberado. Relê capítulos. Presta atenção obsessiva à prosa, sintaxe e estrutura.",
    criteria: "Uso da linguagem, escolhas de narrador, ambiguidade produtiva, como o texto cria sentido além do enredo.",
    reviewTone: "Denso, preciso, às vezes difícil — mas nunca hermético por descuido.",
    bio: "Formação em Letras, pratica escrita criativa e tem opiniões fortes sobre pontuação. Vai dissecar a estrutura de uma oração antes de falar sobre o enredo. Inestimável para avaliar obras literárias sérias.",
    strengths: ["Análise estilística", "Teoria literária aplicada", "Identifica falhas de construção"],
    levelLabel: "⭐⭐⭐⭐ Avançado",
  },
  {
    slug: "vera",
    name: "Vera Salomão",
    initials: "VS",
    avatarBg: "#FAECE7",
    avatarColor: "#993C1D",
    role: "Crítica Literária · Nível 5",
    tagline: "A voz mais incômoda — e por isso a mais importante. Avalia o que o livro representa.",
    genres: ["Lit. Periférica", "Ficção Pós-colonial", "Autoficção", "Ensaio Crítico"],
    readingStyle: "Lê como ato político e filosófico. Questiona quem publica, quem narra, quem é silenciado.",
    criteria: "Posição ideológica, representatividade, originalidade dentro do cânone e subversão de expectativas.",
    reviewTone: "Contundente, rigoroso, profundamente referenciado. Não poupa nem clássicos intocáveis.",
    bio: "Décadas de leitura e escrita crítica. Vera enxerga um livro como documento cultural, não apenas como entretenimento ou arte. A voz mais desafiadora — e mais necessária — do sistema.",
    strengths: ["Crítica cultural e ideológica", "Cânone e contra-cânone", "Análise de representatividade", "Perspectiva histórica ampla"],
    levelLabel: "⭐⭐⭐⭐⭐ Expert",
  },
];

const ANALYSIS_TYPES: { id: AnalysisType; label: string; sub: string; icon: string }[] = [
  { id: "local", label: "Análise Local", sub: "Trecho selecionado. Estilo, ritmo, palavras repetidas.", icon: "target" },
  { id: "local_context", label: "Análise Narrativa", sub: "Trecho + capítulos anteriores. Coerência narrativa.", icon: "layers" },
  { id: "general_context", label: "Análise Geral", sub: "Capítulo inteiro. Arco, conflito, personagem.", icon: "book" },
  { id: "total", label: "Análise Total", sub: "Manuscrito completo. Visão de obra.", icon: "brain" },
  { id: "reader_simulation", label: "Simulação de Leitores", sub: "Escolha os perfis que vão reagir ao texto.", icon: "users" },
  { id: "creative_suggestion", label: "Sugestão Criativa", sub: "Direções, viradas, possíveis caminhos.", icon: "lightbulb" },
];

const CHAPTER_REQUIRED: AnalysisType[] = ["local", "local_context", "reader_simulation", "creative_suggestion"];
const SELECTION_REQUIRED: AnalysisType[] = ["local", "local_context"];

const SCORES = [
  { label: "Coesão", v: 86 },
  { label: "Ritmo", v: 72 },
  { label: "Repetição", v: 45 },
  { label: "Originalidade", v: 79 },
];

export function AnalysisPanel({ projectId, chapter, selectedText, onCreditsUpdate }: AnalysisPanelProps) {
  const { user, updateCredits } = useAuthStore();
  const [selectedType, setSelectedType] = useState<AnalysisType>("local");
  const [selectedProfiles, setSelectedProfiles] = useState<ReaderProfileSlug[]>([]);
  const [infoProfile, setInfoProfile] = useState<ReaderProfileSlug | null>(null);
  const [creativeRequest, setCreativeRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requiresChapter = CHAPTER_REQUIRED.includes(selectedType);
  const requiresSelection = SELECTION_REQUIRED.includes(selectedType);
  const resultRef = useRef<HTMLDivElement>(null);
  const cost = selectedType === "reader_simulation"
    ? selectedProfiles.length
    : ANALYSIS_COSTS[selectedType];

  const canRun = !!user &&
    (!requiresChapter || !!chapter) &&
    (!requiresSelection || !!selectedText) &&
    (selectedType !== "reader_simulation"
      ? user.credits_balance >= cost
      : selectedProfiles.length > 0 && user.credits_balance >= cost);

  useEffect(() => {
    if (result) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, [result]);

  const toggleProfile = (slug: ReaderProfileSlug) => {
    setSelectedProfiles((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    );
  };

  const handleRun = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await analysesApi.run({
        project_id: projectId,
        chapter_id: chapter?.id ?? null,
        analysis_type: selectedType,
        creative_request: creativeRequest,
        reader_profiles: selectedType === "reader_simulation" ? selectedProfiles : undefined,
        selected_text: requiresSelection ? selectedText : undefined,
      });
      setResult(data.analysis);
      updateCredits(data.credits_remaining);
      onCreditsUpdate?.(data.credits_remaining);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Erro ao executar análise.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside style={{
      borderLeft: "1px solid var(--card-edge)",
      background: "var(--paper)",
      padding: "20px 22px",
      overflowY: "auto",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="eyebrow">ANÁLISE COM IA</div>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>escritor.ai</span>
      </div>

      {/* Analysis type cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ANALYSIS_TYPES.map((a) => {
          const active = a.id === selectedType;
          const needsChapter = CHAPTER_REQUIRED.includes(a.id);
          const disabled = needsChapter && !chapter;
          return (
            <div
              key={a.id}
              className={`analysis-card${active ? " active" : ""}`}
              onClick={() => !disabled && setSelectedType(a.id)}
              style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
            >
              <div style={{ width: 22, height: 22, color: "var(--ink)" }}>
                <TypeIcon name={a.icon} />
              </div>
              <div>
                <div className="a-title">{a.label}</div>
                <div className="a-sub">{a.sub}</div>
              </div>
              <div className="a-cost">
                {a.id === "reader_simulation" ? "1 cr./perfil" : `${ANALYSIS_COSTS[a.id]} cr.`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected text preview for local / local_context analysis */}
      {requiresSelection && (
        selectedText ? (
          <div style={{
            padding: "10px 12px",
            background: "var(--mint-wash-soft)",
            border: "1px solid var(--green)",
            borderRadius: 8,
            fontSize: 12,
          }}>
            <div style={{ color: "var(--green)", fontWeight: 600, marginBottom: 4, fontFamily: "var(--mono)" }}>
              TRECHO SELECIONADO
            </div>
            <div style={{
              color: "var(--ink-2)", lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
              overflow: "hidden", fontStyle: "italic",
            }}>
              "{selectedText}"
            </div>
            <div style={{ color: "var(--ink-4)", marginTop: 4 }}>
              {selectedText.length} caracteres · {selectedText.trim().split(/\s+/).length} palavras
            </div>
          </div>
        ) : (
          <div style={{
            padding: "10px 12px",
            background: "var(--amber-wash)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--amber)",
          }}>
            Selecione um trecho no editor para usar a Análise Local.
          </div>
        )
      )}

      {/* Reader profile picker */}
      {selectedType === "reader_simulation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="eyebrow">PERFIS DE LEITOR</div>
            {selectedProfiles.length > 0 && (
              <span className="mono" style={{
                fontSize: 11, color: "var(--green)",
                background: "var(--mint-wash-soft)",
                padding: "2px 8px", borderRadius: 4,
              }}>
                {selectedProfiles.length} × 1 cr.
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {READER_PROFILES.map((p) => {
              const active = selectedProfiles.includes(p.slug);
              return (
                <div
                  key={p.slug}
                  className={`reader-card${active ? " active" : ""}`}
                  onClick={() => toggleProfile(p.slug)}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: p.avatarBg, color: p.avatarColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 600, flexShrink: 0,
                    fontFamily: "var(--mono)",
                  }}>
                    {p.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: 1.3 }}>
                      {p.name}
                    </div>
                    <div style={{
                      fontSize: 11, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {p.tagline}
                    </div>
                  </div>
                  <button
                    className="reader-card-info"
                    onClick={(e) => { e.stopPropagation(); setInfoProfile(p.slug); }}
                    title="Ver perfil completo"
                  >
                    <InfoIcon />
                  </button>
                </div>
              );
            })}
          </div>
          {selectedProfiles.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-4)", textAlign: "center", paddingTop: 2 }}>
              Selecione ao menos um perfil para continuar.
            </p>
          )}
        </div>
      )}

      {/* Creative request textarea */}
      {selectedType === "creative_suggestion" && (
        <div className="field">
          <span className="field-label">O que você precisa?</span>
          <textarea
            value={creativeRequest}
            onChange={(e) => setCreativeRequest(e.target.value)}
            placeholder="Ex: Preciso de ideias para a virada do capítulo 3…"
            rows={3}
            className="textarea"
          />
        </div>
      )}

      {/* Warnings */}
      {!chapter && requiresChapter && (
        <div style={{ fontSize: 12, color: "var(--amber)", background: "var(--amber-wash)", padding: "10px 12px", borderRadius: 8 }}>
          Selecione um capítulo para usar este tipo de análise.
        </div>
      )}
      {user && selectedType !== "reader_simulation" && user.credits_balance < cost && (
        <div style={{ fontSize: 12, color: "var(--red)", textAlign: "center" }}>
          Créditos insuficientes para esta análise.
        </div>
      )}
      {user && selectedType === "reader_simulation" && selectedProfiles.length > 0 && user.credits_balance < cost && (
        <div style={{ fontSize: 12, color: "var(--red)", textAlign: "center" }}>
          Créditos insuficientes ({cost} necessários).
        </div>
      )}

      {/* Run button */}
      <Button
        variant="green"
        onClick={handleRun}
        disabled={!canRun || loading}
        style={{ width: "100%", height: 44 }}
      >
        {loading ? (
          <>
            <LoadingDots /> Analisando…
          </>
        ) : selectedType === "reader_simulation" && selectedProfiles.length === 0 ? (
          <>
            <SparklesIcon /> Escolha os perfis
          </>
        ) : requiresSelection && !selectedText ? (
          <>
            <SparklesIcon /> Selecione um trecho
          </>
        ) : (
          <>
            <SparklesIcon /> Executar · {cost} crédito{cost !== 1 ? "s" : ""}
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div style={{ padding: "10px 12px", background: "var(--red-wash)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {/* Placeholder - always visible when no result yet */}
      {!result && !loading && (
        <div style={{ marginTop: "auto", padding: 14, background: "var(--card)", border: "1px solid var(--card-edge)", borderRadius: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>COMO FUNCIONA</div>
          <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.6 }}>
            Escolha o tipo de análise acima e clique em Executar. A IA vai ler seu texto e devolver observações editoriais precisas.
          </p>
        </div>
      )}

      {/* Result */}
      <div ref={resultRef}>
        {result && result.analysis_type === "reader_simulation" ? (
          <ReaderSimulationResult result={result} />
        ) : result ? (
          <div className="ai-result fade-in">
            <div className="ai-result-head">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: "var(--ink)", color: "var(--mint)",
                  display: "grid", placeItems: "center",
                }}>
                  <SparklesIcon />
                </span>
                <div>
                  <div className="serif" style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>
                    {result.analysis_type_display}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                    {result.ai_model} · {result.credits_consumed} cr.
                  </div>
                </div>
              </div>
            </div>
            <div className="ai-result-body">
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--sans)", fontSize: 14, lineHeight: 1.62, color: "var(--ink-2)" }}>
                {result.content}
              </pre>
            </div>
          </div>
        ) : null}
      </div>

      {/* Profile info modal */}
      {infoProfile && (() => {
        const p = READER_PROFILES.find((rp) => rp.slug === infoProfile)!;
        return (
          <Modal open title={p.name} onClose={() => setInfoProfile(null)} maxWidth={460}>
            {/* Avatar + name + level */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                background: p.avatarBg, color: p.avatarColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 600, fontFamily: "var(--mono)",
              }}>
                {p.initials}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{p.role}</div>
                <span style={{
                  display: "inline-block", marginTop: 5,
                  fontSize: 11, fontWeight: 500, padding: "2px 10px",
                  borderRadius: 999, background: p.avatarBg, color: p.avatarColor,
                }}>
                  {p.levelLabel}
                </span>
              </div>
            </div>

            {/* Reading style + genres */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div className="field-label" style={{ marginBottom: 4 }}>Estilo de leitura</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{p.readingStyle}</div>
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>Gêneros favoritos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {p.genres.map((g) => (
                    <span key={g} style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 20,
                      background: p.avatarBg, color: p.avatarColor, fontWeight: 500,
                    }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Criteria + tone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <div className="field-label" style={{ marginBottom: 4 }}>Critérios de avaliação</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{p.criteria}</div>
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 4 }}>Tom das resenhas</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{p.reviewTone}</div>
              </div>
            </div>

            {/* Bio */}
            <div style={{
              fontSize: 13, color: "var(--ink-3)", lineHeight: 1.65,
              paddingTop: 14, borderTop: "1px solid var(--card-edge-soft)",
              marginBottom: 12,
            }}>
              {p.bio}
            </div>

            {/* Strengths */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {p.strengths.map((s) => (
                <span key={s} style={{
                  fontSize: 11, padding: "3px 9px",
                  border: "1px solid var(--card-edge)",
                  borderRadius: 6, color: "var(--ink-3)",
                }}>
                  {s}
                </span>
              ))}
            </div>
          </Modal>
        );
      })()}
    </aside>
  );
}

function ReaderSimulationResult({ result }: { result: Analysis }) {
  let parsed: Record<string, string> = {};
  try {
    parsed = JSON.parse(result.content);
  } catch {
    return (
      <div className="ai-result fade-in">
        <div className="ai-result-body">
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--sans)", fontSize: 14, lineHeight: 1.62, color: "var(--ink-2)" }}>
            {result.content}
          </pre>
        </div>
      </div>
    );
  }

  const orderedSlugs = ["luna", "rafael", "camila", "mateus", "vera"];
  const entries = orderedSlugs
    .filter((slug) => slug in parsed)
    .map((slug) => ({ slug, text: parsed[slug] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }} className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 6,
          background: "var(--ink)", color: "var(--mint)",
          display: "grid", placeItems: "center",
        }}>
          <SparklesIcon />
        </span>
        <div>
          <div className="serif" style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>
            Simulação de Leitores
          </div>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
            {result.ai_model} · {result.credits_consumed} cr.
          </div>
        </div>
      </div>

      {/* Per-profile results */}
      {entries.map(({ slug, text }) => {
        const p = READER_PROFILES.find((rp) => rp.slug === slug);
        if (!p) return null;
        return (
          <div key={slug} className="ai-result">
            <div className="ai-result-head">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: p.avatarBg, color: p.avatarColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 600, fontFamily: "var(--mono)",
                }}>
                  {p.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{p.role}</div>
                </div>
                <span style={{
                  marginLeft: "auto", fontSize: 10, fontWeight: 500,
                  padding: "2px 8px", borderRadius: 999,
                  background: p.avatarBg, color: p.avatarColor,
                }}>
                  {p.levelLabel}
                </span>
              </div>
            </div>
            <div className="ai-result-body">
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.65, color: "var(--ink-2)" }}>
                {text}
              </pre>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[0, 0.15, 0.3].map((d, i) => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%", background: "currentColor",
          animation: "pulseDot 1s infinite", animationDelay: d + "s",
        }} />
      ))}
    </span>
  );
}

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
      <path d="M19 14l.7 1.6L21.5 16l-1.6.7L19 18l-.7-1.6L16.5 16l1.6-.7L19 14z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function TypeIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    target: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    layers: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
    book: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    brain: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04zM14.5 2a2.5 2.5 0 0 0-2.5 2.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z"/></svg>,
    users: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    lightbulb: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z"/></svg>,
  };
  return <>{icons[name] ?? icons.book}</>;
}
