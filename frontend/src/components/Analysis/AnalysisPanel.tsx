import { useState } from "react";
import type { Analysis, AnalysisType, Chapter } from "@/types";
import { ANALYSIS_COSTS } from "@/types";
import { analysesApi } from "@/api/analyses";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/UI/Button";

interface AnalysisPanelProps {
  projectId: number;
  chapter?: Chapter | null;
  onCreditsUpdate?: (credits: number) => void;
}

const ANALYSIS_TYPES: { id: AnalysisType; label: string; sub: string; icon: string }[] = [
  { id: "local", label: "Análise Local", sub: "Trecho selecionado. Estilo, ritmo, palavras repetidas.", icon: "target" },
  { id: "local_context", label: "Análise com Contexto", sub: "Trecho + capítulos anteriores. Coerência narrativa.", icon: "layers" },
  { id: "general", label: "Análise Geral", sub: "Capítulo inteiro. Arco, conflito, personagem.", icon: "book" },
  { id: "total", label: "Análise Total", sub: "Manuscrito completo. Visão de obra.", icon: "brain" },
  { id: "reader_simulation", label: "Simulação de Leitores", sub: "Três perfis de leitor reagem ao texto.", icon: "users" },
  { id: "creative_suggestion", label: "Sugestão Criativa", sub: "Direções, viradas, possíveis caminhos.", icon: "lightbulb" },
];

const CHAPTER_REQUIRED: AnalysisType[] = ["local", "local_context", "reader_simulation", "creative_suggestion"];

const SCORES = [
  { label: "Coesão", v: 86 },
  { label: "Ritmo", v: 72 },
  { label: "Repetição", v: 45 },
  { label: "Originalidade", v: 79 },
];

export function AnalysisPanel({ projectId, chapter, onCreditsUpdate }: AnalysisPanelProps) {
  const { user, updateCredits } = useAuthStore();
  const [selectedType, setSelectedType] = useState<AnalysisType>("local");
  const [creativeRequest, setCreativeRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requiresChapter = CHAPTER_REQUIRED.includes(selectedType);
  const cost = ANALYSIS_COSTS[selectedType];
  const canRun = user && user.credits_balance >= cost && (!requiresChapter || !!chapter);;

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
              <div className="a-cost">{ANALYSIS_COSTS[a.id]} cr.</div>
            </div>
          );
        })}
      </div>

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
      {user && user.credits_balance < cost && (
        <div style={{ fontSize: 12, color: "var(--red)", textAlign: "center" }}>
          Créditos insuficientes para esta análise.
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
        ) : (
          <>
            <SparklesIcon /> Executar · {cost} crédito{cost > 1 ? "s" : ""}
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div style={{ padding: "10px 12px", background: "var(--red-wash)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
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
          {/* Score bars */}
          <div style={{ padding: "14px 18px 16px", borderTop: "1px solid var(--card-edge-soft)" }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>NOTAS DA ANÁLISE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {SCORES.map((s) => (
                <div key={s.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--ink-2)" }}>{s.label}</span>
                    <span className="mono" style={{ color: "var(--ink-3)" }}>{s.v}</span>
                  </div>
                  <div className="score-bar">
                    <div className="fill" style={{ width: s.v + "%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Placeholder when no result */}
      {!result && !loading && (
        <div style={{ marginTop: "auto", padding: 14, background: "var(--card)", border: "1px solid var(--card-edge)", borderRadius: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>COMO FUNCIONA</div>
          <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.6 }}>
            Escolha o tipo de análise acima e clique em Executar. A IA vai ler seu texto e devolver observações editoriais precisas.
          </p>
        </div>
      )}
    </aside>
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
