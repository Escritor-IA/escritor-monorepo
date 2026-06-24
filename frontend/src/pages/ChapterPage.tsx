import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Chapter, Project } from "@/types";
import { chaptersApi } from "@/api/chapters";
import { projectsApi } from "@/api/projects";
import { AnalysisPanel } from "@/components/Analysis/AnalysisPanel";
import { ChapterEditor } from "@/components/Editor/ChapterEditor";
import { Button } from "@/components/UI/Button";
import { exportChapterDocx, exportChapterPdf } from "@/utils/export";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { ResourceNotFound } from "@/components/UI/ResourceNotFound";

const AUTOSAVE_DELAY = 2000;

export function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const chapterId = id!;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showOutline, setShowOutline] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chaptersApi.get(chapterId).then(({ data }) => {
      setChapter(data);
      setContent(data.content);
      setTitle(data.title);
      return projectsApi.get(data.project);
    }).then(({ data }) => {
      setProject(data);
      setLoading(false);
    }).catch(() => {
      setNotFound(true);
      setLoading(false);
    });
  }, [chapterId]);

  const save = useCallback(async (latestContent: string, latestTitle: string) => {
    setSaving(true);
    try {
      const { data } = await chaptersApi.update(chapterId, { content: latestContent, title: latestTitle });
      setChapter(data);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }, [chapterId]);

  const scheduleAutosave = (c: string, tl: string) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => save(c, tl), AUTOSAVE_DELAY);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    scheduleAutosave(val, title);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    scheduleAutosave(content, val);
  };

  const handleManualSave = () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    save(content, title);
  };

  useEffect(() => () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleManualSave]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [exportMenuOpen]);

  const handleFocusMode = async () => {
    if (!focusMode) {
      try { await document.documentElement.requestFullscreen(); } catch { /* unsupported */ }
      setFocusMode(true);
    } else {
      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch { /* unsupported */ }
      }
      setFocusMode(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setFocusMode(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const plainText = useMemo(() => {
    if (!content) return "";
    const div = document.createElement("div");
    div.innerHTML = content;
    return div.textContent || "";
  }, [content]);

  const wordCount = useMemo(() => plainText.trim().split(/\s+/).filter(Boolean).length, [plainText]);
  const charCount = plainText.length;
  const readingMin = Math.max(1, Math.round(wordCount / 250));
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const planLimits = usePlanLimits();
  const wordLimit = planLimits.chapterWordLimit;
  const wordLimitPct = wordLimit ? wordCount / wordLimit : null;
  const wordLimitColor =
    wordLimitPct === null ? "var(--ink)"
    : wordLimitPct >= 1 ? "var(--red)"
    : wordLimitPct >= 0.85 ? "var(--amber)"
    : "var(--ink)";

  const outline = useMemo(() => {
    if (!content) return [];
    const div = document.createElement("div");
    div.innerHTML = content;
    return Array.from(div.querySelectorAll("h1, h2")).map((h, i) => ({
      i,
      label: h.textContent?.trim() || "",
      level: h.tagName,
    }));
  }, [content]);

  const scrollToHeading = (index: number) => {
    if (!editorScrollRef.current) return;
    const headings = editorScrollRef.current.querySelectorAll("h1, h2");
    headings[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const formatGenres = (genres: string[]) => {
    if (!genres.length) return t("chapter.fiction");
    return genres.map((g) => t(`genres.${g}`, g)).join(", ").toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--paper)", color: "var(--ink-3)" }}>
        {t("chapter.loading")}
      </div>
    );
  }

  if (notFound || !chapter || !project) {
    return (
      <ResourceNotFound
        eyebrow={t("chapter.error_eyebrow")}
        title={t("chapter.error_title")}
        titleEm={t("chapter.error_title_em")}
        description={t("chapter.error_description")}
        backLabel={t("chapter.error_back")}
        backTo="/dashboard"
        cardLabel="CAPÍTULO Nº 404"
      />
    );
  }

  const showLeft = showOutline && !focusMode;
  const showRight = showAnalysis && !focusMode;
  const cols = focusMode
    ? "1fr"
    : [showLeft ? "212px" : "0px", "minmax(0, 1fr)", showRight ? "380px" : "0px"].join(" ");

  const hintItems = [
    { keys: "# ", label: t("chapter.hint_title") },
    { keys: "## ", label: t("chapter.hint_subtitle") },
    { keys: "**negrito**", label: t("chapter.hint_bold") },
    { keys: "_itálico_", label: t("chapter.hint_italic") },
    { keys: "> ", label: t("chapter.hint_quote") },
  ];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--paper)", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(246,243,235,0.92)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--card-edge)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, height: 60, padding: "0 22px" }}>
          <button
            onClick={() => navigate(`/projects/${project.id}`)}
            style={{ fontSize: 13, color: "var(--ink-3)", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
          >
            <BackIcon />
            {project.title.length > 32 ? project.title.slice(0, 32) + "…" : project.title}
          </button>
          <div style={{ width: 1, height: 22, background: "var(--card-edge)", flexShrink: 0 }} />

          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={t("project.chapter_number", { number: chapter.number })}
            style={{
              flex: 1, minWidth: 0,
              fontFamily: "var(--serif)",
              fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em",
              border: 0, outline: "none", background: "transparent", color: "var(--ink)",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-3)", fontSize: 12, flexShrink: 0 }}>
            {saving ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", animation: "pulseDot 1s infinite" }} />
                {t("chapter.saving")}
              </span>
            ) : savedAt ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
                {t("chapter.saved_at", { time: fmt(savedAt) })}
              </span>
            ) : null}
          </div>

          <button
            className="btn btn-ghost btn-sm"
            title={t("chapter.outline")}
            onClick={() => setShowOutline(!showOutline)}
            style={{ color: showOutline && !focusMode ? "var(--ink)" : "var(--ink-3)" }}
          >
            <OutlineIcon />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            title={t("chapter.focus_mode")}
            onClick={handleFocusMode}
            style={{ color: focusMode ? "var(--green)" : "var(--ink-3)" }}
          >
            <FocusIcon />
          </button>
          <Button size="sm" variant="secondary" onClick={handleManualSave} disabled={saving}>
            {t("chapter.save")}
          </Button>

          {chapter && (
            <div ref={exportMenuRef} style={{ position: "relative" }}>
              <button
                className="btn btn-ghost btn-sm"
                title={t("chapter.export")}
                onClick={() => setExportMenuOpen((v) => !v)}
                style={{ color: "var(--ink-3)", gap: 4 }}
              >
                <DownloadIconSm />
              </button>
              {exportMenuOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                  background: "var(--card)", border: "1px solid var(--card-edge)",
                  borderRadius: 10, boxShadow: "var(--sh-2)", minWidth: 168, overflow: "hidden",
                }}>
                  {[
                    { label: t("chapter.export_docx"), action: () => void exportChapterDocx({ ...chapter, content }) },
                    { label: t("chapter.export_pdf"), action: () => exportChapterPdf({ ...chapter, content }) },
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      onClick={() => { action(); setExportMenuOpen(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "10px 14px", fontSize: 13, color: "var(--ink-2)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button size="sm" variant="green" onClick={() => setShowAnalysis(!showAnalysis)}>
            <SparklesIcon />
            {showAnalysis ? t("chapter.hide_analysis") : t("chapter.show_analysis")}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: cols, transition: "grid-template-columns .25s ease", flex: 1, minHeight: 0 }}>
        {/* Outline panel */}
        {showLeft && (
          <aside style={{ borderRight: "1px solid var(--card-edge)", padding: "28px 18px 24px 28px", overflowY: "auto", overflow: "hidden auto" }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>{t("chapter.outline")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {outline.length > 0 ? outline.map((o, i) => (
                <button
                  key={i}
                  onClick={() => scrollToHeading(o.i)}
                  style={{
                    textAlign: "left", padding: "7px 10px", borderRadius: 8,
                    fontSize: o.level === "H1" ? 13 : 12,
                    paddingLeft: o.level === "H2" ? 20 : 10,
                    color: "var(--ink-2)",
                    background: "transparent",
                    fontFamily: "var(--serif)", lineHeight: 1.4,
                    transition: "background .12s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {o.label}
                </button>
              )) : (
                <p style={{ fontSize: 12, color: "var(--ink-4)", fontStyle: "italic" }}>
                  {t("chapter.outline_hint")}
                </p>
              )}
            </div>

            <div style={{ marginTop: 28, padding: 14, background: "var(--paper-2)", borderRadius: 10 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>{t("chapter.dates")}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)", lineHeight: 1.7 }}>
                <div>{t("chapter.created_at")} {new Date(chapter.created_at).toLocaleDateString()}</div>
                <div>{t("chapter.updated_at_label")} {new Date(chapter.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
          </aside>
        )}

        {/* Editor */}
        <main style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", position: "relative", background: "var(--paper)" }}>
          <div
            ref={editorScrollRef}
            style={{ flex: 1, overflowY: "auto", padding: focusMode ? "60px 24px 120px" : "44px 24px 120px" }}
          >
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              {/* Chapter header */}
              <div style={{ marginBottom: 28 }}>
                <div className="eyebrow" style={{ marginBottom: 14 }}>
                  {t("project.chapter_number", { number: String(chapter.number).padStart(2, "0") })} · {formatGenres(project.genres)}
                </div>
                <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.08, color: "var(--ink)" }}>
                  {title || t("project.chapter_number", { number: chapter.number })}
                </h1>
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ height: 1, width: 36, background: "var(--green)" }} />
                  <span style={{ height: 1, width: 4, background: "var(--green)" }} />
                </div>
              </div>

              {/* Formatting hint bar */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {hintItems.map((h) => (
                  <span key={h.keys} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ink-4)", background: "var(--paper-2)", borderRadius: 6, padding: "3px 8px" }}>
                    <code style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{h.keys}</code>
                    {h.label}
                  </span>
                ))}
              </div>

              {/* Rich text editor */}
              <ChapterEditor
                initialContent={content}
                onUpdate={handleContentChange}
                onSelectionChange={setSelectedText}
              />
            </div>
          </div>

          {/* Footer stats */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "12px 28px",
            background: "linear-gradient(180deg, transparent, var(--paper) 30%)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 12, color: "var(--ink-3)", pointerEvents: "none",
          }}>
            <div className="mono" style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <span>
                <strong style={{ color: wordLimitColor }}>{wordCount.toLocaleString()}</strong>
                {wordLimit ? (
                  <> / <span style={{ color: "var(--ink-4)" }}>{wordLimit.toLocaleString()}</span> {t("chapter.words")}</>
                ) : (
                  <> {t("chapter.words")}</>
                )}
              </span>
              <span><strong style={{ color: "var(--ink)" }}>{charCount.toLocaleString()}</strong> {t("chapter.characters")}</span>
              <span>~<strong style={{ color: "var(--ink)" }}>{readingMin} min</strong> {t("chapter.read_min")}</span>
              {wordLimitPct !== null && wordLimitPct >= 0.85 && (
                <span style={{
                  color: wordLimitPct >= 1 ? "var(--red)" : "var(--amber)",
                  pointerEvents: "auto",
                }}>
                  {wordLimitPct >= 1
                    ? t("chapter.plan_limit_reached")
                    : t("chapter.plan_limit_pct", { pct: Math.round(wordLimitPct * 100) })}
                </span>
              )}
            </div>
            <div style={{ fontStyle: "italic", fontFamily: "var(--serif)", fontSize: 13, color: "var(--ink-4)" }}>
              "Escrever é o ato de coragem mais barato que existe."
            </div>
          </div>
        </main>

        {/* AI Panel */}
        {showRight && (
          <AnalysisPanel projectId={project.id} chapter={chapter} selectedText={selectedText} />
        )}
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
function OutlineIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
function FocusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    </svg>
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
function DownloadIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}
