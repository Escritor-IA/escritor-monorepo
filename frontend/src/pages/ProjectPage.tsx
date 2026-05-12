import { useState, useEffect, type FormEvent, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import type { Project, Chapter } from "@/types";
import { GENRE_LABELS } from "@/types";
import { projectsApi } from "@/api/projects";
import { chaptersApi } from "@/api/chapters";
import { Layout } from "@/components/Layout/Layout";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Modal } from "@/components/UI/Modal";
import { Spinner } from "@/components/UI/Spinner";

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);

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
      const { data } = await chaptersApi.create(projectId, {
        number: nextNumber,
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
        <div className="flex justify-center py-16">
          <Spinner label="Carregando projeto..." />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <p className="text-center text-gray-500 py-16">Projeto não encontrado.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-2">
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Meus projetos
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {GENRE_LABELS[project.genre]} · {chapters.length} capítulos
          </p>
          {project.synopsis && (
            <p className="text-sm text-gray-600 mt-2 max-w-xl">{project.synopsis}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            Importar arquivo
          </Button>
          <Button onClick={() => setNewChapterOpen(true)}>+ Novo capítulo</Button>
        </div>
      </div>

      {chapters.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-400 mb-4">Nenhum capítulo ainda.</p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Importar arquivo
            </Button>
            <Button onClick={() => setNewChapterOpen(true)}>Criar capítulo</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-300 hover:shadow-sm transition-all group"
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => navigate(`/chapters/${chapter.id}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-400 w-8 shrink-0">
                    {String(chapter.number).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 truncate">
                      {chapter.title || `Capítulo ${chapter.number}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {chapter.content
                        ? `${chapter.content.trim().split(/\s+/).length} palavras · v${chapter.version}`
                        : "Vazio"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteChapter(chapter)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={newChapterOpen}
        onClose={() => setNewChapterOpen(false)}
        title="Novo capítulo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNewChapterOpen(false)}>Cancelar</Button>
            <Button loading={creatingChapter} onClick={handleCreateChapter}>Criar</Button>
          </>
        }
      >
        <form onSubmit={handleCreateChapter}>
          <Input
            label="Título do capítulo (opcional)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ex: O Início da Jornada"
            autoFocus
          />
        </form>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Importar arquivo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(false)}>Cancelar</Button>
            <Button loading={importing} disabled={!importFile} onClick={handleImport}>
              Importar
            </Button>
          </>
        }
      >
        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo (.txt, .docx, .pdf)
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-brand-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {importFile ? (
                <p className="text-sm text-gray-700 font-medium">{importFile.name}</p>
              ) : (
                <p className="text-sm text-gray-400">Clique para selecionar um arquivo</p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.docx,.pdf"
              className="hidden"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <Input
            label="Título do capítulo (opcional)"
            value={importTitle}
            onChange={(e) => setImportTitle(e.target.value)}
            placeholder="Deixe vazio para usar o nome do arquivo"
          />
        </form>
      </Modal>
    </Layout>
  );
}
