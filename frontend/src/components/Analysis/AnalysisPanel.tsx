import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Analysis, AnalysisType, Chapter } from "@/types";
import { ANALYSIS_COSTS } from "@/types";
import { analysesApi } from "@/api/analyses";
import { useAuthStore } from "@/store/authStore";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/UI/Button";
import { Modal } from "@/components/UI/Modal";
import { UpgradeModal } from "@/components/UI/UpgradeModal";
import { ErrorCard } from "@/components/UI/ErrorCard";
import { getErrorMessage } from "@/utils/errors";

interface AnalysisPanelProps {
  projectId: string;
  chapter?: Chapter | null;
  selectedText?: string;
  onCreditsUpdate?: (credits: number) => void;
  scope?: "chapter" | "book";
}

type ReaderProfileSlug = "luna" | "rafael" | "camila" | "mateus" | "vera" | "heitor";

interface ReaderProfile {
  slug: ReaderProfileSlug;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
}

const READER_PROFILES: ReaderProfile[] = [
  { slug: "luna",   name: "Luna Bastos",      initials: "LU", avatarBg: "#EAF3DE", avatarColor: "#3B6D11" },
  { slug: "rafael", name: "Rafael Andrade",   initials: "RA", avatarBg: "#FAEEDA", avatarColor: "#854F0B" },
  { slug: "camila", name: "Camila Azevedo",   initials: "CA", avatarBg: "#E1F5EE", avatarColor: "#0F6E56" },
  { slug: "mateus", name: "Mateus Figueiredo",initials: "MF", avatarBg: "#EEEDFE", avatarColor: "#534AB7" },
  { slug: "vera",   name: "Vera Salomão",     initials: "VS", avatarBg: "#FAECE7", avatarColor: "#993C1D" },
  { slug: "heitor", name: "Heitor Nogueira",  initials: "HN", avatarBg: "#EAF0FA", avatarColor: "#1A3A6B" },
];

const CHAPTER_ANALYSIS_TYPES: { id: AnalysisType; icon: string }[] = [
  { id: "local",               icon: "target"   },
  { id: "local_context",       icon: "layers"   },
  { id: "general_context",     icon: "book"     },
  { id: "total",               icon: "brain"    },
  { id: "reader_simulation",   icon: "users"    },
  { id: "creative_suggestion", icon: "lightbulb"},
];

const BOOK_ANALYSIS_TYPES: { id: AnalysisType; icon: string }[] = [
  { id: "book_general",           icon: "book"  },
  { id: "book_total",             icon: "brain" },
  { id: "book_reader_simulation", icon: "users" },
];

const CHAPTER_REQUIRED: AnalysisType[] = ["local", "local_context", "reader_simulation", "creative_suggestion"];
const SELECTION_REQUIRED: AnalysisType[] = ["local", "local_context"];
const READER_TYPES: AnalysisType[] = ["reader_simulation", "book_reader_simulation"];
const BOOK_TYPES: AnalysisType[] = ["book_general", "book_total", "book_reader_simulation"];

export function AnalysisPanel({ projectId, chapter, selectedText, onCreditsUpdate, scope = "chapter" }: AnalysisPanelProps) {
  const { t } = useTranslation();
  const { user, updateCredits } = useAuthStore();
  const planLimits = usePlanLimits();
  const analysisTypes = scope === "book" ? BOOK_ANALYSIS_TYPES : CHAPTER_ANALYSIS_TYPES;
  const defaultType = analysisTypes[0].id;

  const [selectedType, setSelectedType] = useState<AnalysisType>(defaultType);
  const [selectedProfiles, setSelectedProfiles] = useState<ReaderProfileSlug[]>([]);
  const [infoProfile, setInfoProfile] = useState<ReaderProfileSlug | null>(null);
  const [creativeRequest, setCreativeRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ featureName: string; requiredPlan: string } | null>(null);

  const isReaderType = READER_TYPES.includes(selectedType);
  const requiresChapter = scope === "chapter" && CHAPTER_REQUIRED.includes(selectedType);
  const requiresSelection = scope === "chapter" && SELECTION_REQUIRED.includes(selectedType);
  const resultRef = useRef<HTMLDivElement>(null);

  const creditPerProfile = selectedType === "book_reader_simulation" ? 2 : 1;
  const cost = isReaderType
    ? selectedProfiles.length * creditPerProfile
    : ANALYSIS_COSTS[selectedType] ?? 1;

  const canRun = !!user &&
    planLimits.isAnalysisTypeAllowed(selectedType) &&
    (!requiresChapter || !!chapter) &&
    (!requiresSelection || !!selectedText) &&
    (!isReaderType ? user.user_plan.credits >= cost : selectedProfiles.length > 0 && user.user_plan.credits >= cost);

  useEffect(() => {
    setSelectedType(defaultType);
    setSelectedProfiles([]);
    setResult(null);
    setError(null);
  }, [scope]);

  useEffect(() => {
    if (result) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, [result]);

  useEffect(() => {
    if (scope === "book") {
      analysesApi.list({ project: projectId }).then(({ data }) => {
        const items = (data.results ?? []).filter((a) => BOOK_TYPES.includes(a.analysis_type));
        setHistory(items.slice(0, 10));
      }).catch(() => {});
    } else if (chapter) {
      analysesApi.list({ chapter: chapter.id }).then(({ data }) => {
        setHistory((data.results ?? []).slice(0, 10));
      }).catch(() => {});
    }
  }, [scope, projectId, chapter?.id]);

  const handleSelectAnalysisType = (id: AnalysisType) => {
    const min = planLimits.minPlanForAnalysis(id);
    if (min) {
      setUpgradeModal({ featureName: t(`analysis.types.${id}.label`), requiredPlan: min });
      return;
    }
    setSelectedType(id);
  };

  const toggleProfile = (slug: ReaderProfileSlug) => {
    if (!planLimits.isProfileAllowed(slug)) {
      const min = planLimits.minPlanForProfile(slug);
      const p = READER_PROFILES.find((rp) => rp.slug === slug);
      setUpgradeModal({ featureName: p?.name ?? slug, requiredPlan: min! });
      return;
    }
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
        chapter_id: scope === "chapter" ? (chapter?.id ?? null) : null,
        analysis_type: selectedType,
        creative_request: creativeRequest,
        reader_profiles: isReaderType ? selectedProfiles : undefined,
        selected_text: requiresSelection ? selectedText : undefined,
      });
      setResult(data.analysis);
      setHistory((prev) => [data.analysis, ...prev.slice(0, 9)]);
      updateCredits(data.credits_remaining);
      onCreditsUpdate?.(data.credits_remaining);
    } catch (err: unknown) {
      setError(getErrorMessage(err, t("errors.generic")));
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
        <div className="eyebrow">
          {scope === "book" ? t("analysis.header_book") : t("analysis.header_chapter")}
        </div>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>escritor.ai</span>
      </div>

      {/* Analysis type cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {analysisTypes.map((a) => {
          const active = a.id === selectedType;
          const disabledByChapter = scope === "chapter" && CHAPTER_REQUIRED.includes(a.id) && !chapter;
          const locked = !planLimits.isAnalysisTypeAllowed(a.id);
          const minPlan = planLimits.minPlanForAnalysis(a.id);

          return (
            <div
              key={a.id}
              className={`analysis-card${active && !locked ? " active" : ""}`}
              onClick={() => !disabledByChapter && handleSelectAnalysisType(a.id)}
              style={{
                opacity: disabledByChapter ? 0.4 : locked ? 0.6 : 1,
                cursor: disabledByChapter ? "not-allowed" : "pointer",
                position: "relative",
              }}
            >
              <div style={{ width: 22, height: 22, color: locked ? "var(--ink-4)" : "var(--ink)" }}>
                {locked ? <LockIcon size={14} /> : <TypeIcon name={a.icon} />}
              </div>
              <div>
                <div className="a-title" style={{ color: locked ? "var(--ink-3)" : undefined }}>
                  {t(`analysis.types.${a.id}.label`)}
                </div>
                <div className="a-sub">{t(`analysis.types.${a.id}.sub`)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div className="a-cost">
                  {READER_TYPES.includes(a.id)
                    ? `${a.id === "book_reader_simulation" ? 2 : 1} ${t("analysis.per_profile")}`
                    : `${ANALYSIS_COSTS[a.id]} ${t("analysis.credits_abbr")}`}
                </div>
                {locked && minPlan && (
                  <span style={{
                    fontSize: 9, fontWeight: 600, fontFamily: "var(--mono)",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    color: "var(--amber)", background: "var(--amber-wash)",
                    padding: "2px 6px", borderRadius: 4,
                  }}>
                    {minPlan}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected text preview */}
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
              {t("analysis.selected_excerpt")}
            </div>
            <div style={{
              color: "var(--ink-2)", lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
              overflow: "hidden", fontStyle: "italic",
            }}>
              "{selectedText}"
            </div>
            <div style={{ color: "var(--ink-4)", marginTop: 4 }}>
              {selectedText.length} {t("chapter.selection")} · {selectedText.trim().split(/\s+/).length} {t("project.words")}
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
            {t("analysis.select_excerpt_warning")}
          </div>
        )
      )}

      {/* Reader profile picker */}
      {isReaderType && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="eyebrow">{t("analysis.reader_profiles")}</div>
            {selectedProfiles.length > 0 && (
              <span className="mono" style={{
                fontSize: 11, color: "var(--green)",
                background: "var(--mint-wash-soft)",
                padding: "2px 8px", borderRadius: 4,
              }}>
                {selectedProfiles.length} × {creditPerProfile} {t("analysis.credits_abbr")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {READER_PROFILES.map((p) => {
              const active = selectedProfiles.includes(p.slug);
              const locked = !planLimits.isProfileAllowed(p.slug);
              const minPlan = planLimits.minPlanForProfile(p.slug);

              return (
                <div
                  key={p.slug}
                  className={`reader-card${active ? " active" : ""}`}
                  onClick={() => toggleProfile(p.slug)}
                  style={{ opacity: locked ? 0.55 : 1, position: "relative" }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: p.avatarBg, color: p.avatarColor,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 600,
                      fontFamily: "var(--mono)",
                      filter: locked ? "grayscale(0.4)" : undefined,
                    }}>
                      {p.initials}
                    </div>
                    {locked && (
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "50%",
                        background: "rgba(246,243,235,0.55)",
                      }}>
                        <LockIcon size={12} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: locked ? "var(--ink-3)" : "var(--ink)", lineHeight: 1.3 }}>
                        {p.name}
                      </span>
                      {locked && minPlan && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, fontFamily: "var(--mono)",
                          letterSpacing: "0.06em", textTransform: "uppercase",
                          color: "var(--amber)", background: "var(--amber-wash)",
                          padding: "1px 5px", borderRadius: 3, flexShrink: 0,
                        }}>
                          {minPlan}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 11, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {t(`analysis.profiles.${p.slug}.tagline`)}
                    </div>
                  </div>
                  <button
                    className="reader-card-info"
                    onClick={(e) => { e.stopPropagation(); setInfoProfile(p.slug); }}
                    title={t("analysis.view_full_profile")}
                  >
                    <InfoIcon />
                  </button>
                </div>
              );
            })}
          </div>
          {selectedProfiles.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-4)", textAlign: "center", paddingTop: 2 }}>
              {t("analysis.select_profiles")}
            </p>
          )}
          {planLimits.weeklySimLimit !== null && (
            <div style={{
              fontSize: 11, color: "var(--amber)",
              padding: "6px 10px", background: "var(--amber-wash)",
              borderRadius: 6, lineHeight: 1.5,
            }}>
              {t("analysis.weekly_limit", { plan: planLimits.planLabel, limit: planLimits.weeklySimLimit })}
            </div>
          )}
          {scope === "book" && (
            <div style={{ fontSize: 11, color: "var(--ink-4)", padding: "6px 10px", background: "var(--card)", borderRadius: 6, lineHeight: 1.5 }}>
              {t("analysis.book_reader_note")}
            </div>
          )}
        </div>
      )}

      {/* Creative request textarea */}
      {selectedType === "creative_suggestion" && (
        <div className="field">
          <span className="field-label">{t("analysis.what_you_need")}</span>
          <textarea
            value={creativeRequest}
            onChange={(e) => setCreativeRequest(e.target.value)}
            placeholder={t("analysis.creative_placeholder")}
            rows={3}
            className="textarea"
          />
        </div>
      )}

      {/* Warnings */}
      {!chapter && requiresChapter && (
        <div style={{ fontSize: 12, color: "var(--amber)", background: "var(--amber-wash)", padding: "10px 12px", borderRadius: 8 }}>
          {t("analysis.select_chapter_warning")}
        </div>
      )}
      {user && !isReaderType && user.user_plan.credits < cost && planLimits.isAnalysisTypeAllowed(selectedType) && (
        <div style={{ fontSize: 12, color: "var(--red)", textAlign: "center" }}>
          {t("analysis.insufficient_credits")}
        </div>
      )}
      {user && isReaderType && selectedProfiles.length > 0 && user.user_plan.credits < cost && (
        <div style={{ fontSize: 12, color: "var(--red)", textAlign: "center" }}>
          {t("analysis.insufficient_credits_count", { cost })}
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
          <><LoadingDots /> {t("analysis.analyzing")}</>
        ) : !planLimits.isAnalysisTypeAllowed(selectedType) ? (
          <><LockIcon size={14} /> {t("analysis.run_locked")}</>
        ) : isReaderType && selectedProfiles.length === 0 ? (
          <><SparklesIcon /> {t("analysis.run_choose_profiles")}</>
        ) : requiresSelection && !selectedText ? (
          <><SparklesIcon /> {t("analysis.run_select_excerpt")}</>
        ) : (
          <><SparklesIcon /> {cost === 1 ? t("analysis.run_execute", { cost }) : t("analysis.run_execute_plural", { cost })}</>
        )}
      </Button>

      {/* Error */}
      {error && <ErrorCard message={error} onDismiss={() => setError(null)} />}

      {/* Placeholder */}
      {!result && !loading && (
        <div style={{ marginTop: "auto", padding: 14, background: "var(--card)", border: "1px solid var(--card-edge)", borderRadius: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{t("analysis.how_it_works")}</div>
          <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.6 }}>
            {t("analysis.how_it_works_text")}
          </p>
        </div>
      )}

      {/* Current result */}
      <div ref={resultRef}>
        {result && (result.analysis_type === "reader_simulation" || result.analysis_type === "book_reader_simulation") ? (
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
                    {result.ai_model} · {result.credits_consumed} {t("analysis.credits_abbr")}
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

      {/* History */}
      {history.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="eyebrow" style={{ marginTop: 8 }}>{t("analysis.previous")}</div>
          {history.map((a) => {
            const isExpanded = expandedHistory === a.id;
            const isReaderSim = a.analysis_type === "reader_simulation" || a.analysis_type === "book_reader_simulation";
            return (
              <div key={a.id} style={{ border: "1px solid var(--card-edge)", borderRadius: 8, overflow: "hidden" }}>
                <button
                  onClick={() => setExpandedHistory(isExpanded ? null : a.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", background: "var(--card)", border: "none", cursor: "pointer",
                    gap: 8, textAlign: "left",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: 1.3 }}>
                      {a.analysis_type_display}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--ink-4)", marginTop: 2, fontFamily: "var(--mono)" }}>
                      {new Date(a.created_at).toLocaleDateString()} · {a.credits_consumed} {t("analysis.credits_abbr")}
                      {a.chapter_title && <> · {a.chapter_title}</>}
                    </div>
                  </div>
                  <ChevronIcon expanded={isExpanded} />
                </button>
                {isExpanded && (
                  <div style={{ padding: "10px 12px", borderTop: "1px solid var(--card-edge)", background: "var(--paper)" }}>
                    {isReaderSim ? (
                      <ReaderSimulationResult result={a} compact />
                    ) : (
                      <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--sans)", fontSize: 12, lineHeight: 1.6, color: "var(--ink-2)", margin: 0 }}>
                        {a.content}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Profile info modal */}
      {infoProfile && (() => {
        const p = READER_PROFILES.find((rp) => rp.slug === infoProfile)!;
        const genres = t(`analysis.profiles.${p.slug}.genres`, { returnObjects: true }) as string[];
        const strengths = t(`analysis.profiles.${p.slug}.strengths`, { returnObjects: true }) as string[];
        return (
          <Modal open title={p.name} onClose={() => setInfoProfile(null)} maxWidth={460}>
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
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{t(`analysis.profiles.${p.slug}.role`)}</div>
                <span style={{
                  display: "inline-block", marginTop: 5,
                  fontSize: 11, fontWeight: 500, padding: "2px 10px",
                  borderRadius: 999, background: p.avatarBg, color: p.avatarColor,
                }}>
                  {t(`analysis.profiles.${p.slug}.level`)}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div className="field-label" style={{ marginBottom: 4 }}>{t("analysis.reading_style")}</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  {t(`analysis.profiles.${p.slug}.reading_style`)}
                </div>
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>{t("analysis.favorite_genres")}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {Array.isArray(genres) && genres.map((g) => (
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <div className="field-label" style={{ marginBottom: 4 }}>{t("analysis.evaluation_criteria")}</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  {t(`analysis.profiles.${p.slug}.criteria`)}
                </div>
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 4 }}>{t("analysis.review_tone")}</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  {t(`analysis.profiles.${p.slug}.review_tone`)}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: 13, color: "var(--ink-3)", lineHeight: 1.65,
              paddingTop: 14, borderTop: "1px solid var(--card-edge-soft)",
              marginBottom: 12,
            }}>
              {t(`analysis.profiles.${p.slug}.bio`)}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Array.isArray(strengths) && strengths.map((s) => (
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

      {/* Upgrade modal */}
      {upgradeModal && (
        <UpgradeModal
          open
          onClose={() => setUpgradeModal(null)}
          featureName={upgradeModal.featureName}
          requiredPlan={upgradeModal.requiredPlan}
        />
      )}
    </aside>
  );
}

function ReaderSimulationResult({ result, compact = false }: { result: Analysis; compact?: boolean }) {
  const { t } = useTranslation();
  let parsed: Record<string, string> = {};
  try {
    parsed = JSON.parse(result.content);
  } catch {
    return (
      <div className={compact ? "" : "ai-result fade-in"}>
        <div className="ai-result-body">
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--sans)", fontSize: compact ? 12 : 14, lineHeight: 1.62, color: "var(--ink-2)" }}>
            {result.content}
          </pre>
        </div>
      </div>
    );
  }

  const orderedSlugs = ["luna", "rafael", "camila", "mateus", "vera", "heitor"];
  const entries = orderedSlugs
    .filter((slug) => slug in parsed)
    .map((slug) => ({ slug, text: parsed[slug] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }} className={compact ? "" : "fade-in"}>
      {!compact && (
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
              {t("analysis.reader_simulation")}
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
              {result.ai_model} · {result.credits_consumed} {t("analysis.credits_abbr")}
            </div>
          </div>
        </div>
      )}

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
                  <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{t(`analysis.profiles.${slug}.role`)}</div>
                </div>
                <span style={{
                  marginLeft: "auto", fontSize: 10, fontWeight: 500,
                  padding: "2px 8px", borderRadius: 999,
                  background: p.avatarBg, color: p.avatarColor,
                }}>
                  {t(`analysis.profiles.${slug}.level`)}
                </span>
              </div>
            </div>
            <div className="ai-result-body">
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--sans)", fontSize: compact ? 12 : 13, lineHeight: 1.65, color: "var(--ink-2)" }}>
                {text}
              </pre>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: "var(--ink-4)", flexShrink: 0, transition: "transform .15s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
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

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
