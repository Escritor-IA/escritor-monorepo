import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Project, ProjectGenre, ProjectStatus } from "@/types";
import { GENRE_LABELS } from "@/types";
import { projectsApi } from "@/api/projects";
import { Layout } from "@/components/Layout/Layout";
import { Button } from "@/components/UI/Button";
import { Input, Textarea } from "@/components/UI/Input";
import { Modal } from "@/components/UI/Modal";
import { Spinner } from "@/components/UI/Spinner";
import { useAuthStore } from "@/store/authStore";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  in_progress: "Em andamento",
  completed: "Concluído",
  paused: "Pausado",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  paused: "bg-gray-100 text-gray-600",
};

const DEFAULT_FORM = {
  title: "",
  genre: "fantasy" as ProjectGenre,
  synopsis: "",
  status: "in_progress" as ProjectStatus,
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  useEffect(() => {
    projectsApi.list().then(({ data }) => {
      setProjects(data.results);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await projectsApi.create(form);
      setProjects((prev) => [data, ...prev]);
      setModalOpen(false);
      setForm(DEFAULT_FORM);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await projectsApi.delete(deleteTarget.id);
    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus projetos</h1>
          {user && (
            <p className="text-sm text-gray-500 mt-1">
              Olá, {user.username} · {user.credits_balance} crédito(s) disponíveis
            </p>
          )}
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Novo projeto</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Carregando projetos..." />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">Nenhum projeto ainda.</p>
          <Button onClick={() => setModalOpen(true)}>Criar primeiro projeto</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{GENRE_LABELS[project.genre]}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(project);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all ml-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {project.synopsis && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.synopsis}</p>
              )}

              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>
                  {STATUS_LABELS[project.status]}
                </span>
                <span className="text-xs text-gray-400">
                  {project.chapters_count} cap.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo projeto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleCreate}>Criar projeto</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            autoFocus
            placeholder="O nome da sua obra"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gênero literário</label>
            <select
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value as ProjectGenre })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {(Object.entries(GENRE_LABELS) as [ProjectGenre, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <Textarea
            label="Sinopse (opcional)"
            value={form.synopsis}
            onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
            rows={3}
            placeholder="Breve descrição da sua obra..."
          />
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir projeto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Excluir</Button>
          </>
        }
      >
        <p className="text-gray-600">
          Tem certeza que deseja excluir <strong>{deleteTarget?.title}</strong>? Esta ação não pode
          ser desfeita.
        </p>
      </Modal>
    </Layout>
  );
}
