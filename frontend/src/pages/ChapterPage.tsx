import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Chapter, Project, ProjectGenre } from "@/types";
import { GENRE_LABELS } from "@/types";

function formatGenres(genres: string[]): string {
  if (!genres.length) return "FICÇÃO";
  return genres.map((g) => GENRE_LABELS[g as ProjectGenre] ?? g).join(", ").toUpperCase();
}
import { chaptersApi } from "@/api/chapters";
import { projectsApi } from "@/api/projects";
import { AnalysisPanel } from "@/components/Analysis/AnalysisPanel";
import { Button } from "@/components/UI/Button";

const AUTOSAVE_DELAY = 2000;

export function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const chapterId = id!;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showOutline, setShowOutline] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    chaptersApi.get(chapterId).then(({ data }) => {
      setChapter(data);
      setContent(data.content);
      setTitle(data.title);
      return projectsApi.get(data.project);
    }).then(({ data }) => {
      setProject(data);
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

  const scheduleAutosave = (c: string, t: string) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => save(c, t), AUTOSAVE_DELAY);
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

  const handleEditorSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
    const text = sel.toString().trim();
    if (text) setSelectedText(text);
  }, []);

  // Stats
  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
  const charCount = content.length;
  const readingMin = Math.max(1, Math.round(wordCount / 250));
  const fmt = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // Outline
  const outline = useMemo(() => {
    return content.split("\n\n").filter((b) => b.startsWith("# ")).map((b, i) => ({
      i, label: b.replace(/^#+\s*/, ""),
    }));
  }, [content]);

  // Editor blocks
  const blocks = useMemo(() => content.split("\n\n"), [content]);
  const firstParaIdx = useMemo(() =>
    blocks.findIndex((b) => !b.startsWith("# ") && !b.startsWith("> ") && b.trim().length > 60),
    [blocks]
  );

  const updateBlock = (i: number, val: string) => {
    const next = [...blocks];
    next[i] = val;
    handleContentChange(next.join("\n\n"));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--paper)", color: "var(--ink-3)" }}>
        Carregando capítulo…
      </div>
    );
  }

  if (!chapter || !project) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--paper)", color: "var(--ink-3)" }}>
        Capítulo não encontrado.
      </div>
    );
  }

  const cols = [
    showOutline && !focusMode ? "212px" : "0px",
    "minmax(0, 1fr)",
    showAnalysis && !focusMode ? "380px" : "0px",
  ].join(" ");

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
            placeholder={`Capítulo ${chapter.number}`}
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
                Salvando…
              </span>
            ) : savedAt ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
                Salvo às {fmt(savedAt)}
              </span>
            ) : null}
          </div>

          <button
            className="btn btn-ghost btn-sm"
            title="Sumário"
            onClick={() => setShowOutline(!showOutline)}
            style={{ color: showOutline ? "var(--ink)" : "var(--ink-3)" }}
          >
            <OutlineIcon />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            title="Modo foco"
            onClick={() => setFocusMode(!focusMode)}
            style={{ color: focusMode ? "var(--green)" : "var(--ink-3)" }}
          >
            <FocusIcon />
          </button>
          <Button size="sm" variant="secondary" onClick={handleManualSave} disabled={saving}>
            Salvar
          </Button>
          <Button size="sm" variant="green" onClick={() => setShowAnalysis(!showAnalysis)}>
            <SparklesIcon />
            {showAnalysis ? "Esconder IA" : "Análise com IA"}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: cols, transition: "grid-template-columns .25s ease", flex: 1, minHeight: 0 }}>
        {/* Outline panel */}
        {showOutline && !focusMode && (
          <aside style={{ borderRight: "1px solid var(--card-edge)", padding: "28px 18px 24px 28px", overflowY: "auto" }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>SUMÁRIO</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {outline.length > 0 ? outline.map((o, i) => (
                <button
                  key={o.i}
                  style={{
                    textAlign: "left", padding: "8px 10px", borderRadius: 8,
                    fontSize: 13, color: i === 0 ? "var(--ink)" : "var(--ink-3)",
                    background: i === 0 ? "var(--paper-2)" : "transparent",
                    fontFamily: "var(--serif)", fontWeight: i === 0 ? 500 : 400, lineHeight: 1.4,
                  }}
                >
                  {o.label}
                </button>
              )) : (
                <p style={{ fontSize: 12, color: "var(--ink-4)", fontStyle: "italic" }}>
                  Use # para criar títulos de seção
                </p>
              )}
            </div>

            <div style={{ marginTop: 28, padding: 14, background: "var(--paper-2)", borderRadius: 10 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>DATAS</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)", lineHeight: 1.7 }}>
                <div>Criado em {new Date(chapter.created_at).toLocaleDateString("pt-BR")}</div>
                <div>Editado em {new Date(chapter.updated_at).toLocaleDateString("pt-BR")}</div>
              </div>
            </div>
          </aside>
        )}

        {/* Editor */}
        <main
          ref={editorRef}
          style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", position: "relative" }}
          onMouseUp={handleEditorSelection}
          onKeyUp={handleEditorSelection}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: focusMode ? "60px 24px 120px" : "44px 24px 120px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              {/* Chapter header in editor */}
              <div style={{ marginBottom: 28 }}>
                <div className="eyebrow" style={{ marginBottom: 14 }}>
                  CAPÍTULO {String(chapter.number).padStart(2, "0")} · {formatGenres(project.genres)}
                </div>
                <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.08, color: "var(--ink)" }}>
                  {title || `Capítulo ${chapter.number}`}
                </h1>
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ height: 1, width: 36, background: "var(--green)" }} />
                  <span style={{ height: 1, width: 4, background: "var(--green)" }} />
                </div>
              </div>

              {/* Editor blocks */}
              <div style={{ position: "relative" }}>
                {blocks.map((block, i) => {
                  const isHeading = block.startsWith("# ");
                  const isQuote = block.startsWith("> ");
                  const isDropCap = i === firstParaIdx;
                  let text = block;
                  if (isHeading) text = block.replace(/^#+\s*/, "");
                  if (isQuote) text = block.replace(/^>\s*/, "");

                  if (isHeading) {
                    return (
                      <h2
                        key={i}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlock(i, "# " + e.currentTarget.textContent)}
                        className="serif"
                        style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink)", margin: "32px 0 14px", outline: "none" }}
                      >
                        {text}
                      </h2>
                    );
                  }
                  if (isQuote) {
                    return (
                      <blockquote
                        key={i}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlock(i, "> " + e.currentTarget.textContent)}
                        className="serif"
                        style={{
                          margin: "20px 0", padding: "0 0 0 20px",
                          borderLeft: "2px solid var(--green)", fontStyle: "italic",
                          color: "var(--ink-2)", fontSize: 19, lineHeight: 1.55, outline: "none",
                        }}
                      >
                        {text}
                      </blockquote>
                    );
                  }
                  return (
                    <p
                      key={i}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateBlock(i, e.currentTarget.textContent ?? "")}
                      className={`serif${isDropCap ? " dropcap" : ""}`}
                      style={{
                        fontSize: 18, lineHeight: 1.72, color: "var(--ink)",
                        marginBottom: 16, outline: "none", hyphens: "auto",
                      }}
                    >
                      {text}
                    </p>
                  );
                })}

                {blocks.length === 0 && (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleContentChange(e.currentTarget.textContent ?? "")}
                    className="serif"
                    style={{
                      fontSize: 18, lineHeight: 1.72, color: "var(--ink-4)",
                      marginBottom: 16, outline: "none", fontStyle: "italic",
                    }}
                  >
                    Comece a escrever…
                  </p>
                )}
              </div>
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
            <div className="mono" style={{ display: "flex", gap: 18 }}>
              <span><strong style={{ color: "var(--ink)" }}>{wordCount.toLocaleString("pt-BR")}</strong> palavras</span>
              <span><strong style={{ color: "var(--ink)" }}>{charCount.toLocaleString("pt-BR")}</strong> caracteres</span>
              <span>~<strong style={{ color: "var(--ink)" }}>{readingMin} min</strong> de leitura</span>
            </div>
            <div style={{ fontStyle: "italic", fontFamily: "var(--serif)", fontSize: 13, color: "var(--ink-4)" }}>
              "Escrever é o ato de coragem mais barato que existe."
            </div>
          </div>
        </main>

        {/* AI Panel */}
        {showAnalysis && !focusMode && (
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
