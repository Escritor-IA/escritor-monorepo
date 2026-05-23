import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Project, ProjectGenre, ProjectStatus } from "@/types";
import { GENRE_LABELS } from "@/types";

function formatGenres(genres: string[]): string {
  if (!genres.length) return "Sem gênero";
  return genres.map((g) => GENRE_LABELS[g as ProjectGenre] ?? g).join(", ");
}
import { projectsApi } from "@/api/projects";
import { Layout } from "@/components/Layout/Layout";
import { Button } from "@/components/UI/Button";
import { Input, Textarea, Select } from "@/components/UI/Input";
import { Modal } from "@/components/UI/Modal";
import { ConfirmDialog } from "@/components/UI/ConfirmDialog";
import { useAuthStore } from "@/store/authStore";

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

const DEFAULT_FORM = {
  title: "",
  genres: [] as string[],
  synopsis: "",
  status: "in_progress" as ProjectStatus,
};

type Filter = "all" | ProjectStatus;

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [customGenre, setCustomGenre] = useState("");

  useEffect(() => {
    projectsApi.list().then(({ data }) => {
      setProjects(data.results);
      setLoading(false);
    });
  }, []);

  const totals = useMemo(() => ({
    projects: projects.length,
    words: 0,
    chapters: projects.reduce((a, p) => a + (p.chapters_count ?? 0), 0),
  }), [projects]);

  const visible = projects.filter((p) => filter === "all" ? true : p.status === filter);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await projectsApi.create(form);
      setProjects((prev) => [data, ...prev]);
      setModalOpen(false);
      setForm(DEFAULT_FORM);
      setCustomGenre("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingProject(true);
    try {
      await projectsApi.delete(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeletingProject(false);
    }
  };

  const filters: [Filter, string][] = [
    ["all", "Todos"],
    ["in_progress", "Em andamento"],
    ["completed", "Concluídos"],
    ["paused", "Pausados"],
  ];

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: 32 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            BIBLIOTECA · {totals.projects} {totals.projects === 1 ? "TÍTULO" : "TÍTULOS"}
          </div>
          <h1 className="serif" style={{ fontSize: 44, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            Olá, {user?.username}.<br />
            <em style={{ color: "var(--ink-3)" }}>O que vamos escrever hoje?</em>
          </h1>
          <p style={{ marginTop: 12, color: "var(--ink-3)", fontSize: 15 }}>
            Você tem{" "}
            <strong style={{ color: "var(--green)" }}>{user?.user_plan?.credits ?? 0} créditos</strong>{" "}
            disponíveis ·{" "}
            <span>{totals.chapters} capítulos</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary">
            <UploadIcon /> Importar manuscrito
          </Button>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <PlusIcon /> Novo projeto
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        marginBottom: 24, paddingBottom: 14,
        borderBottom: "1px solid var(--card-edge)",
      }}>
        {filters.map(([id, label]) => {
          const count = id === "all" ? projects.length : projects.filter((p) => p.status === id).length;
          const active = filter === id;
          return (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{
                height: 34, padding: "0 14px",
                borderRadius: 999, fontSize: 13,
                color: active ? "var(--ink)" : "var(--ink-3)",
                background: active ? "var(--card)" : "transparent",
                boxShadow: active ? "inset 0 0 0 1px var(--card-edge)" : "none",
                fontWeight: active ? 500 : 400,
                display: "inline-flex", alignItems: "center", gap: 8,
                transition: "all .15s ease",
              }}
            >
              {label}
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: active ? "var(--green)" : "var(--ink-4)" }}>
                {count}
              </span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{ color: "var(--ink-3)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ClockIcon /> Ordenado por edição recente
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 64, color: "var(--ink-3)" }}>
          Carregando projetos…
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {visible.map((project) => {
            const hovered = hoveredId === project.id;
            return (
              <div
                key={project.id}
                className="card"
                onMouseEnter={() => setHoveredId(project.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{
                  padding: 22, cursor: "pointer",
                  transition: "all .18s ease",
                  boxShadow: hovered ? "var(--sh-2)" : "var(--sh-1)",
                  transform: hovered ? "translateY(-2px)" : "none",
                  display: "flex", flexDirection: "column", gap: 12,
                  minHeight: 220, position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div className="eyebrow" style={{ fontSize: 10 }}>{formatGenres(project.genres)}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                    style={{
                      opacity: hovered ? 1 : 0,
                      color: "var(--ink-4)", padding: 4,
                      transition: "opacity .15s ease, color .15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-4)")}
                  >
                    <TrashIcon />
                  </button>
                </div>

                <h3 className="serif" style={{
                  fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                }}>
                  {project.title}
                </h3>

                {project.synopsis && (
                  <p style={{
                    color: "var(--ink-3)", fontSize: 13, lineHeight: 1.55,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {project.synopsis}
                  </p>
                )}

                <div style={{
                  marginTop: "auto",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingTop: 8, borderTop: "1px dashed var(--card-edge)",
                }}>
                  <span className={`chip ${STATUS_CHIP[project.status]}`}>
                    {STATUS_LABELS[project.status]}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--ink-3)" }}>
                    <span>{project.chapters_count} cap.</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* CTA card */}
          <button
            onClick={() => setModalOpen(true)}
            style={{
              border: "1.5px dashed var(--ink-5)",
              borderRadius: 14, padding: 24,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              color: "var(--ink-3)", gap: 10, minHeight: 220,
              background: "transparent",
              transition: "all .15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--green)";
              e.currentTarget.style.color = "var(--green)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--ink-5)";
              e.currentTarget.style.color = "var(--ink-3)";
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              border: "1.5px solid currentColor",
              display: "grid", placeItems: "center",
            }}>
              <PlusIcon />
            </div>
            <span className="serif" style={{ fontSize: 18 }}>Começar um novo livro</span>
            <span style={{ fontSize: 12 }}>do zero ou importando um arquivo</span>
          </button>
        </div>
      )}

      {visible.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: 64, color: "var(--ink-3)" }}>
          Nenhum projeto neste filtro ainda.
        </div>
      )}

      {/* New project modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm(DEFAULT_FORM); setCustomGenre(""); }}
        title="Novo projeto"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" loading={saving} onClick={handleCreate} disabled={!form.title.trim()}>
              Criar projeto
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Título"
            placeholder="O nome da sua obra"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
            required
          />
          <Select
            label="Gênero(s) literário(s)"
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (!val || form.genres.includes(val)) return;
              setForm({ ...form, genres: [...form.genres, val] });
            }}
          >
            <option value="" disabled>Selecione um gênero…</option>
            {(Object.entries(GENRE_LABELS) as [ProjectGenre, string][]).map(([v, l]) => (
              <option key={v} value={v} disabled={form.genres.includes(v)}>
                {form.genres.includes(v) ? `✓ ${l}` : l}
              </option>
            ))}
          </Select>
          {form.genres.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: -6 }}>
              {form.genres.map((g) => (
                <span
                  key={g}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: "var(--card)", border: "1px solid var(--card-edge)",
                    borderRadius: 999, padding: "2px 10px", fontSize: 12, color: "var(--ink-2)",
                  }}
                >
                  {GENRE_LABELS[g as ProjectGenre] ?? g}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, genres: form.genres.filter((x) => x !== g) })}
                    style={{ color: "var(--ink-4)", lineHeight: 1, padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {form.genres.includes("other") && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <Input
                label="Temas personalizados"
                placeholder="Ex: Steampunk, Distopia…"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const trimmed = customGenre.trim();
                  if (trimmed && !form.genres.includes(trimmed)) {
                    setForm({ ...form, genres: [...form.genres, trimmed] });
                  }
                  setCustomGenre("");
                }}
              />
              <Button
                type="button"
                variant="secondary"
                style={{ flexShrink: 0, height: 40, padding: "0 14px" }}
                onClick={() => {
                  const trimmed = customGenre.trim();
                  if (trimmed && !form.genres.includes(trimmed)) {
                    setForm({ ...form, genres: [...form.genres, trimmed] });
                  }
                  setCustomGenre("");
                }}
              >
                Adicionar
              </Button>
            </div>
          )}
          <Textarea
            label="Sinopse (opcional)"
            rows={3}
            placeholder="Em uma ou duas frases…"
            value={form.synopsis}
            onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
          />
        </form>
      </Modal>

      {deleteTarget && (
        <ConfirmDialog
          title={`Excluir "${deleteTarget.title}"`}
          description="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita — todos os capítulos serão perdidos."
          confirmLabel="Excluir projeto"
          danger
          loading={deletingProject}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Layout>
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

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}
