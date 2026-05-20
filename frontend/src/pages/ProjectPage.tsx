import { useState, useEffect, type FormEvent, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Project, Chapter, ProjectGenre, ProjectStatus } from "@/types";
import { GENRE_LABELS } from "@/types";

function formatGenres(genres: string[]): string {
  if (!genres.length) return "Sem gênero";
  return genres.map((g) => GENRE_LABELS[g as ProjectGenre] ?? g).join(", ");
}
import { projectsApi } from "@/api/projects";
import { chaptersApi } from "@/api/chapters";
import { Layout } from "@/components/Layout/Layout";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Modal } from "@/components/UI/Modal";

const STATUS_CHIP: Record<ProjectStatus, string> = {
  in_progress: "chip-progress",
  completed: "chip-done",
  paused: "chip-paused",
};
const STATUS_LABELS: Record<ProjectStatus, string> = {
  in_progress: "Em andamento",
  completed: "Concluído",
  paused: "Pausado",
};

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id!;

  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  const [newChapterOpen, setNewChapterOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creatingChapter, setCreatingChapter] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importTitle, setImportTitle] = useState("");
  const [importing, setImporting] = useState(false);

  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      projectsApi.get(projectId),
      chaptersApi.list(projectId),
    ]).then(([{ data: p }, { data: c }]) => {
      setProject(p);
      setChapters(Array.isArray(c) ? c : (c as { results: Chapter[] }).results ?? []);
      setLoading(false);
    });
  }, [projectId]);

  const handleCreateChapter = async (e: FormEvent) => {
    e.preventDefault();
    setCreatingChapter(true);
    try {
      const nextNumber = chapters.length > 0 ? Math.max(...chapters.map((c) => c.number)) + 1 : 1;
      const { data } = await chaptersApi.create(projectId, { number: nextNumber, title: newTitle, content: "" });
      setChapters((prev) => [...prev, data]);
      setNewChapterOpen(false);
      setNewTitle("");
      navigate(`/chapters/${data.id}`);
    } finally {
      setCreatingChapter(false);
    }
  };

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    try {
      const { data } = await chaptersApi.import(projectId, importFile, importTitle);
      setChapters((prev) => [...prev, data]);
      setImportOpen(false);
      setImportFile(null);
      setImportTitle("");
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteChapter = async (chapter: Chapter) => {
    if (!confirm(`Excluir "${chapter.title || `Capítulo ${chapter.number}`}"?`)) return;
    await chaptersApi.delete(chapter.id);
    setChapters((prev) => prev.filter((c) => c.id !== chapter.id));
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: 64, color: "var(--ink-3)" }}>
          Carregando projeto…
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <p style={{ textAlign: "center", color: "var(--ink-3)", padding: 64 }}>
          Projeto não encontrado.
        </p>
      </Layout>
    );
  }

  const totalWords = chapters.reduce((a, c) => {
    return a + (c.content ? c.content.trim().split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  return (
    <Layout>
      {/* Breadcrumb */}
      <button
        onClick={() => navigate("/dashboard")}
        style={{ fontSize: 13, color: "var(--ink-3)", display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <BackIcon /> Meus projetos
      </button>

      {/* Project header */}
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        gap: 24, flexWrap: "wrap", marginTop: 12, marginBottom: 28,
      }}>
        <div style={{ maxWidth: 700 }}>
          <h1 className="serif" style={{
            fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.08,
            padding: "4px 0",
          }}>
            {project.title}
          </h1>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 14, color: "var(--ink-3)", fontSize: 14 }}>
            <span className={`chip ${STATUS_CHIP[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
            <span>{formatGenres(project.genres)}</span>
            <Dot />
            <span>{chapters.length} capítulo{chapters.length !== 1 ? "s" : ""}</span>
            {totalWords > 0 && (
              <>
                <Dot />
                <span style={{ fontFamily: "var(--mono)" }}>{totalWords.toLocaleString("pt-BR")} palavras</span>
              </>
            )}
          </div>
          {project.synopsis && (
            <p className="serif" style={{
              marginTop: 18, color: "var(--ink-2)", fontSize: 17, lineHeight: 1.6,
              borderLeft: "2px solid var(--green)", paddingLeft: 16,
              fontStyle: "italic", maxWidth: 640,
            }}>
              "{project.synopsis}"
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <UploadIcon /> Importar arquivo
          </Button>
          <Button variant="primary" onClick={() => setNewChapterOpen(true)}>
            <PlusIcon /> Novo capítulo
          </Button>
        </div>
      </div>

      {/* Chapters */}
      {chapters.length === 0 ? (
        <div className="card" style={{ padding: 64, textAlign: "center", color: "var(--ink-3)" }}>
          <div className="serif" style={{ fontSize: 28, color: "var(--ink-2)", fontStyle: "italic", marginBottom: 8 }}>
            A página em branco.
          </div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>
            Por onde começar? Importe um arquivo ou crie um capítulo do zero.
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <UploadIcon /> Importar
            </Button>
            <Button variant="primary" onClick={() => setNewChapterOpen(true)}>
              <PlusIcon /> Criar capítulo
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {chapters.map((chapter) => {
            const hovered = hoveredChapter === chapter.id;
            const words = chapter.content ? chapter.content.trim().split(/\s+/).filter(Boolean).length : 0;
            const readMin = Math.max(1, Math.round(words / 250));
            return (
              <div
                key={chapter.id}
                className="card"
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
                style={{
                  display: "grid", gridTemplateColumns: "48px 1fr auto auto", alignItems: "center", gap: 16,
                  padding: "16px 20px", cursor: "pointer",
                  transition: "all .15s ease",
                  boxShadow: hovered ? "var(--sh-2)" : "var(--sh-1)",
                  borderColor: hovered ? "var(--ink-4)" : "var(--card-edge)",
                }}
                onClick={() => navigate(`/chapters/${chapter.id}`)}
              >
                <div className="mono" style={{ fontSize: 12, color: "var(--ink-4)", textAlign: "right" }}>
                  {String(chapter.number).padStart(2, "0")}
                </div>
                <div>
                  <div className="serif" style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink)" }}>
                    {chapter.title || `Capítulo ${chapter.number}`}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 10 }}>
                    {words > 0 ? (
                      <>
                        <span style={{ fontFamily: "var(--mono)" }}>{words.toLocaleString("pt-BR")} palavras</span>
                        <Dot />
                        <span>~{readMin} min de leitura</span>
                        <Dot />
                        <span>{new Date(chapter.updated_at).toLocaleDateString("pt-BR")}</span>
                      </>
                    ) : (
                      <span style={{ fontStyle: "italic", color: "var(--ink-4)" }}>página em branco</span>
                    )}
                  </div>
                </div>

                {/* Word progress bar */}
                <div style={{ width: 90, opacity: words ? 1 : 0.3 }}>
                  <div className="score-bar">
                    <div className="fill" style={{ width: Math.min(100, words / 50) + "%" }} />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteChapter(chapter); }}
                    style={{ opacity: hovered ? 1 : 0, transition: "opacity .12s ease", color: "var(--ink-4)", padding: 6 }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-4)")}
                  >
                    <TrashIcon />
                  </button>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: "rotate(180deg)", color: hovered ? "var(--ink)" : "var(--ink-4)", transition: "color .12s" }}>
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New chapter modal */}
      <Modal
        open={newChapterOpen}
        onClose={() => setNewChapterOpen(false)}
        title="Novo capítulo"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewChapterOpen(false)}>Cancelar</Button>
            <Button variant="primary" loading={creatingChapter} onClick={handleCreateChapter}>
              Criar e abrir
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateChapter}>
          <Input
            label="Título do capítulo (opcional)"
            placeholder="Ex: O início da jornada"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
        </form>
      </Modal>

      {/* Import modal */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Importar arquivo"
        footer={
          <>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>Cancelar</Button>
            <Button variant="primary" loading={importing} disabled={!importFile} onClick={handleImport}>
              Importar
            </Button>
          </>
        }
      >
        <form onSubmit={handleImport} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label
            style={{
              border: "1.5px dashed var(--card-edge)", borderRadius: 12,
              padding: 28, textAlign: "center", color: "var(--ink-3)", fontSize: 14,
              cursor: "pointer",
            }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--green)"; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--card-edge)"; }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = "var(--card-edge)";
              if (e.dataTransfer.files[0]) setImportFile(e.dataTransfer.files[0]);
            }}
          >
            {importFile ? (
              <div>
                <div style={{ color: "var(--ink)", fontWeight: 500 }}>{importFile.name}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {Math.round(importFile.size / 1024)} KB · pronto para importar
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                <div>Arraste seu .docx, .txt ou .pdf aqui</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>ou clique para selecionar</div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.docx,.pdf"
              style={{ display: "none" }}
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Input
            label="Título do capítulo (opcional)"
            placeholder="Deixe vazio para usar o nome do arquivo"
            value={importTitle}
            onChange={(e) => setImportTitle(e.target.value)}
          />
        </form>
      </Modal>
    </Layout>
  );
}

function Dot() {
  return <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--ink-5)", display: "inline-block" }} />;
}
function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
    </svg>
  );
}
