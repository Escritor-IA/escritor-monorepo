import { useState, useEffect, useRef, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Project, Chapter, ProjectGenre, ProjectStatus } from "@/types";
import { GENRE_LABELS } from "@/types";
import { projectsApi } from "@/api/projects";
import { chaptersApi } from "@/api/chapters";
import { AnalysisPanel } from "@/components/Analysis/AnalysisPanel";
import { Layout } from "@/components/Layout/Layout";
import { ResourceNotFound } from "@/components/UI/ResourceNotFound";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Modal } from "@/components/UI/Modal";
import { ConfirmDialog } from "@/components/UI/ConfirmDialog";
import { countWords, exportBookDocx, exportBookPdf } from "@/utils/export";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function formatGenres(genres: string[]): string {
  if (!genres.length) return "Sem gênero";
  return genres.map((g) => GENRE_LABELS[g as ProjectGenre] ?? g).join(", ");
}

const STATUS_CHIP: Record<ProjectStatus, string> = {
  in_progress: "chip-progress",
  archived: "chip-paused",
};
const STATUS_LABELS: Record<ProjectStatus, string> = {
  in_progress: "Ativo",
  archived: "Arquivado",
};

// ── Sortable chapter card ──────────────────────────────────────

interface CardProps {
  chapter: Chapter;
  isEditingTitle: boolean;
  titleDraft: string;
  onTitleDraftChange: (v: string) => void;
  onStartEditTitle: (chapter: Chapter) => void;
  onSaveTitle: (chapter: Chapter) => void;
  onCancelEditTitle: () => void;
  onDelete: (chapter: Chapter, e: React.MouseEvent) => void;
  onNavigate: (id: string) => void;
}

function SortableChapterCard({
  chapter,
  isEditingTitle,
  titleDraft,
  onTitleDraftChange,
  onStartEditTitle,
  onSaveTitle,
  onCancelEditTitle,
  onDelete,
  onNavigate,
}: CardProps) {
  const [hovered, setHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  const words = countWords(chapter.content);
  const readMin = Math.max(1, Math.round(words / 250));
  const { chapterWordLimit } = usePlanLimits();
  // For premium (no limit) use 3000 as a visual reference only
  const barTarget = chapterWordLimit ?? 3_000;
  const barPct = Math.min(100, (words / barTarget) * 100);
  const barColor =
    chapterWordLimit === null ? "var(--green)"
    : barPct >= 100 ? "var(--red)"
    : barPct >= 75 ? "var(--amber)"
    : "var(--green)";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
    >
      <div
        className="card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "grid",
          gridTemplateColumns: "28px 44px 1fr auto auto",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px",
          cursor: isDragging ? "grabbing" : "pointer",
          transition: "all .15s ease",
          boxShadow: hovered ? "var(--sh-2)" : "var(--sh-1)",
          borderColor: hovered ? "var(--ink-4)" : "var(--card-edge)",
        }}
        onClick={() => !isEditingTitle && onNavigate(chapter.id)}
      >
        {/* Drag handle */}
        <div
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          title="Arrastar para reordenar"
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            color: hovered ? "var(--ink-4)" : "transparent",
            transition: "color .12s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GrabIcon />
        </div>

        {/* Number */}
        <div className="mono" style={{ fontSize: 12, color: "var(--ink-4)", textAlign: "right" }}>
          {String(chapter.number).padStart(2, "0")}
        </div>

        {/* Title + metadata */}
        <div>
          {isEditingTitle ? (
            <input
              value={titleDraft}
              onChange={(e) => onTitleDraftChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => onSaveTitle(chapter)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); onSaveTitle(chapter); }
                if (e.key === "Escape") { e.stopPropagation(); onCancelEditTitle(); }
              }}
              autoFocus
              style={{
                fontFamily: "var(--serif)",
                fontSize: 19, fontWeight: 500, letterSpacing: "-0.01em",
                color: "var(--ink)", background: "var(--paper-2)",
                border: "1px solid var(--ink-4)", borderRadius: 6,
                padding: "2px 8px", outline: "none", width: "100%",
              }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="serif" style={{ fontSize: 19, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink)" }}>
                {chapter.title || `Capítulo ${chapter.number}`}
              </div>
              <button
                title="Editar título"
                onClick={(e) => { e.stopPropagation(); onStartEditTitle(chapter); }}
                style={{
                  opacity: hovered ? 1 : 0, transition: "opacity .12s ease",
                  color: "var(--ink-4)", padding: 4, display: "flex",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-4)")}
              >
                <PencilIcon />
              </button>
            </div>
          )}
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

        {/* Progress bar */}
        <div style={{ width: 90, opacity: words ? 1 : 0.3 }}>
          <div className="score-bar">
            <div className="fill" style={{ width: barPct + "%", background: barColor }} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            title="Excluir capítulo"
            onClick={(e) => { e.stopPropagation(); onDelete(chapter, e); }}
            style={{ opacity: hovered ? 1 : 0, transition: "opacity .12s ease", color: "var(--ink-4)", padding: 6 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-4)")}
          >
            <TrashIcon />
          </button>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: "rotate(180deg)", color: hovered ? "var(--ink)" : "var(--ink-4)", transition: "color .12s" }}
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Export dropdown ────────────────────────────────────────────

function ExportMenu({ onTxt, onDoc }: { onTxt: () => void; onDoc: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Button variant="secondary" onClick={() => setOpen((v) => !v)}>
        <DownloadIcon /> Exportar livro <ChevronDownIcon />
      </Button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
          background: "var(--card)", border: "1px solid var(--card-edge)",
          borderRadius: 10, boxShadow: "var(--sh-2)", minWidth: 160, overflow: "hidden",
        }}>
          {[
            { label: "Exportar como .docx", action: onTxt },
            { label: "Exportar como PDF", action: onDoc },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={() => { action(); setOpen(false); }}
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
  );
}

// ── Main page ─────────────────────────────────────────────────

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id!;

  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Project title inline edit
  const [editingProjectTitle, setEditingProjectTitle] = useState(false);
  const [projectTitleDraft, setProjectTitleDraft] = useState("");

  // Project synopsis inline edit
  const [editingSynopsis, setEditingSynopsis] = useState(false);
  const [synopsisDraft, setSynopsisDraft] = useState("");

  // Chapter title inline edit
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterTitleDraft, setChapterTitleDraft] = useState("");

  // Chapter modals
  const [newChapterOpen, setNewChapterOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creatingChapter, setCreatingChapter] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importTitle, setImportTitle] = useState("");
  const [importing, setImporting] = useState(false);

  const [deleteChapterTarget, setDeleteChapterTarget] = useState<Chapter | null>(null);
  const [deletingChapter, setDeletingChapter] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors — requires 8px of movement before drag activates (prevents accidental drags on click)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    Promise.all([projectsApi.get(projectId), chaptersApi.list(projectId)]).then(
      ([{ data: p }, { data: c }]) => {
        setProject(p);
        const list = Array.isArray(c) ? c : (c as { results: Chapter[] }).results ?? [];
        setChapters(list.sort((a, b) => a.number - b.number));
        setLoading(false);
      }
    ).catch(() => {
      setNotFound(true);
      setLoading(false);
    });
  }, [projectId]);

  // ── Project title ──────────────────────────────────────────

  const handleStartEditProjectTitle = () => {
    if (!project) return;
    setProjectTitleDraft(project.title);
    setEditingProjectTitle(true);
  };

  const handleSaveProjectTitle = async () => {
    setEditingProjectTitle(false);
    if (!project || !projectTitleDraft.trim() || projectTitleDraft.trim() === project.title) return;
    const { data } = await projectsApi.update(projectId, { title: projectTitleDraft.trim() });
    setProject(data);
  };

  const handleStartEditSynopsis = () => {
    if (!project) return;
    setSynopsisDraft(project.synopsis ?? "");
    setEditingSynopsis(true);
  };

  const handleSaveSynopsis = async () => {
    setEditingSynopsis(false);
    if (!project || synopsisDraft === (project.synopsis ?? "")) return;
    const { data } = await projectsApi.update(projectId, { synopsis: synopsisDraft });
    setProject(data);
  };

  // ── Chapter title ──────────────────────────────────────────

  const handleStartEditChapterTitle = (chapter: Chapter) => {
    setEditingChapterId(chapter.id);
    setChapterTitleDraft(chapter.title);
  };

  const handleSaveChapterTitle = async (chapter: Chapter) => {
    setEditingChapterId(null);
    if (chapterTitleDraft === chapter.title) return;
    const { data } = await chaptersApi.update(chapter.id, { title: chapterTitleDraft });
    setChapters((prev) => prev.map((c) => (c.id === chapter.id ? data : c)));
  };

  // ── Create chapter ─────────────────────────────────────────

  const handleCreateChapter = async (e: FormEvent) => {
    e.preventDefault();
    setCreatingChapter(true);
    try {
      const { data } = await chaptersApi.create(projectId, {
        number: chapters.length + 1,
        title: newTitle,
        content: "",
      });
      setChapters((prev) => [...prev, data]);
      setNewChapterOpen(false);
      setNewTitle("");
      navigate(`/chapters/${data.id}`);
    } finally {
      setCreatingChapter(false);
    }
  };

  // ── Import ────────────────────────────────────────────────

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

  // ── Delete + auto-renumber ────────────────────────────────

  const handleConfirmDeleteChapter = async () => {
    if (!deleteChapterTarget) return;
    setDeletingChapter(true);
    try {
      await chaptersApi.delete(deleteChapterTarget.id);
      const remaining = chapters
        .filter((c) => c.id !== deleteChapterTarget.id)
        .map((c, i) => ({ ...c, number: i + 1 }));
      setChapters(remaining);
      setDeleteChapterTarget(null);
      // Persist new numbers silently
      if (remaining.length > 0) {
        await Promise.all(remaining.map((c) => chaptersApi.update(c.id, { number: c.number })));
      }
    } finally {
      setDeletingChapter(false);
    }
  };

  // ── Drag-and-drop reorder ─────────────────────────────────

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = chapters.findIndex((c) => c.id === active.id);
    const newIdx = chapters.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(chapters, oldIdx, newIdx).map((c, i) => ({ ...c, number: i + 1 }));

    setChapters(reordered); // optimistic
    await Promise.all(reordered.map((c) => chaptersApi.update(c.id, { number: c.number })));
  };

  // ── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: 64, color: "var(--ink-3)" }}>
          Carregando projeto…
        </div>
      </Layout>
    );
  }

  if (notFound || !project) {
    return (
      <ResourceNotFound
        eyebrow="ERRO 404 · PROJETO NÃO ENCONTRADO"
        title="Este projeto"
        titleEm="nunca foi escrito."
        description="O projeto que você buscou não existe no nosso manuscrito. Talvez tenha sido removido ou o link esteja errado."
        backLabel="← Voltar ao dashboard"
        backTo="/dashboard"
        cardLabel="PROJETO Nº 404"
      />
    );
  }

  const totalWords = chapters.reduce((sum, c) => sum + countWords(c.content), 0);

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
        <div style={{ maxWidth: 700, flex: 1 }}>
          {/* Editable project title */}
          {editingProjectTitle ? (
            <input
              value={projectTitleDraft}
              onChange={(e) => setProjectTitleDraft(e.target.value)}
              onBlur={handleSaveProjectTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveProjectTitle();
                if (e.key === "Escape") setEditingProjectTitle(false);
              }}
              autoFocus
              style={{
                fontFamily: "var(--serif)",
                fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.08,
                border: "none", outline: "none", background: "transparent",
                color: "var(--ink)", width: "100%", padding: "4px 0",
                borderBottom: "2px solid var(--green)",
              }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1
                className="serif"
                style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.08, padding: "4px 0" }}
              >
                {project.title}
              </h1>
              <button
                title="Editar nome do projeto"
                onClick={handleStartEditProjectTitle}
                style={{ color: "var(--ink-4)", marginBottom: 2, padding: 4 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-4)")}
              >
                <PencilIcon />
              </button>
            </div>
          )}

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 14, color: "var(--ink-3)", fontSize: 14 }}>
            <span className={`chip ${STATUS_CHIP[project.status]}`}>{STATUS_LABELS[project.status]}</span>
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

          <div style={{ marginTop: 18, maxWidth: 640 }}>
            {editingSynopsis ? (
              <input
                value={synopsisDraft}
                onChange={(e) => setSynopsisDraft(e.target.value)}
                onBlur={handleSaveSynopsis}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveSynopsis();
                  if (e.key === "Escape") setEditingSynopsis(false);
                }}
                autoFocus
                placeholder="Adicione uma sinopse…"
                style={{
                  fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.6,
                  fontStyle: "italic", color: "var(--ink-2)",
                  background: "transparent", border: "none", outline: "none",
                  width: "100%", maxWidth: 640, padding: "4px 0",
                  borderBottom: "2px solid var(--green)",
                }}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                {project.synopsis ? (
                  <p className="serif" style={{ color: "var(--ink-2)", fontSize: 17, lineHeight: 1.6, fontStyle: "italic" }}>
                    "{project.synopsis}"
                  </p>
                ) : (
                  <p className="serif" style={{ color: "var(--ink-4)", fontSize: 15, lineHeight: 1.6, fontStyle: "italic" }}>
                    Adicionar sinopse…
                  </p>
                )}
                <button
                  title="Editar sinopse"
                  onClick={handleStartEditSynopsis}
                  style={{ color: "var(--ink-4)", marginTop: 3, padding: 4, flexShrink: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-4)")}
                >
                  <PencilIcon />
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {chapters.length > 0 && (
            <ExportMenu
              onTxt={() => void exportBookDocx(project, chapters)}
              onDoc={() => exportBookPdf(project, chapters)}
            />
          )}
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <UploadIcon /> Importar arquivo
          </Button>
          <Button variant="primary" onClick={() => setNewChapterOpen(true)}>
            <PlusIcon /> Novo capítulo
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 0, alignItems: "start", margin: "0 -24px" }}>
        <div style={{ padding: "0 24px" }}>
          {/* Chapter list */}
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {chapters.map((chapter) => (
                    <SortableChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      isEditingTitle={editingChapterId === chapter.id}
                      titleDraft={chapterTitleDraft}
                      onTitleDraftChange={setChapterTitleDraft}
                      onStartEditTitle={handleStartEditChapterTitle}
                      onSaveTitle={handleSaveChapterTitle}
                      onCancelEditTitle={() => setEditingChapterId(null)}
                      onDelete={(c, e) => { e.stopPropagation(); setDeleteChapterTarget(c); }}
                      onNavigate={(cId) => navigate(`/chapters/${cId}`)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Book analysis panel */}
        <div style={{ position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <AnalysisPanel projectId={projectId} scope="book" />
        </div>
      </div>

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

      {/* Delete chapter confirm */}
      {deleteChapterTarget && (
        <ConfirmDialog
          title={`Excluir "${deleteChapterTarget.title || `Capítulo ${deleteChapterTarget.number}`}"`}
          description="Tem certeza que deseja excluir este capítulo? Os capítulos restantes serão renumerados automaticamente."
          confirmLabel="Excluir capítulo"
          danger
          loading={deletingChapter}
          onConfirm={handleConfirmDeleteChapter}
          onCancel={() => setDeleteChapterTarget(null)}
        />
      )}

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
              padding: 28, textAlign: "center", color: "var(--ink-3)", fontSize: 14, cursor: "pointer",
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
                <div style={{ fontSize: 12, marginTop: 4 }}>{Math.round(importFile.size / 1024)} KB · pronto para importar</div>
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

// ── Icons ─────────────────────────────────────────────────────

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
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
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
function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function GrabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
