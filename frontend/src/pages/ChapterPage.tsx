import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import type { Chapter, Project } from "@/types";
import { chaptersApi } from "@/api/chapters";
import { projectsApi } from "@/api/projects";
import { Layout } from "@/components/Layout/Layout";
import { TextEditor } from "@/components/Editor/TextEditor";
import { AnalysisPanel } from "@/components/Analysis/AnalysisPanel";
import { Button } from "@/components/UI/Button";
import { Spinner } from "@/components/UI/Spinner";

const AUTOSAVE_DELAY = 2000;

export function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const chapterId = Number(id);

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);

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

  const save = useCallback(
    async (latestContent: string, latestTitle: string) => {
      setSaving(true);
      try {
        const { data } = await chaptersApi.update(chapterId, {
          content: latestContent,
          title: latestTitle,
        });
        setChapter(data);
        setSavedAt(new Date());
        isDirty.current = false;
      } finally {
        setSaving(false);
      }
    },
    [chapterId]
  );

  const handleContentChange = (value: string) => {
    setContent(value);
    isDirty.current = true;

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      save(value, title);
    }, AUTOSAVE_DELAY);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    isDirty.current = true;

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      save(content, value);
    }, AUTOSAVE_DELAY);
  };

  const handleManualSave = () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    save(content, title);
  };

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <Spinner label="Carregando capítulo..." />
        </div>
      </Layout>
    );
  }

  if (!chapter || !project) {
    return (
      <Layout>
        <p className="text-center text-gray-500 py-16">Capítulo não encontrado.</p>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-4">
            <Link
              to={`/projects/${project.id}`}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              ← {project.title}
            </Link>

            <div className="flex-1 min-w-0">
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={`Capítulo ${chapter.number}`}
                className="w-full text-sm font-medium text-gray-700 placeholder-gray-400 border-0 outline-none bg-transparent"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {saving ? (
                <span className="text-xs text-gray-400">Salvando...</span>
              ) : savedAt ? (
                <span className="text-xs text-gray-400">
                  Salvo às {savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : null}

              <Button size="sm" variant="secondary" onClick={handleManualSave} disabled={saving}>
                Salvar
              </Button>

              <Button
                size="sm"
                variant={showAnalysis ? "primary" : "secondary"}
                onClick={() => setShowAnalysis((v) => !v)}
              >
                IA
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 flex flex-col min-h-0 ${showAnalysis ? "border-r border-gray-200" : ""}`}>
          <TextEditor
            value={content}
            onChange={handleContentChange}
            placeholder={`Escreva o capítulo ${chapter.number} aqui...`}
          />
        </div>

        {showAnalysis && (
          <div className="w-96 shrink-0 overflow-y-auto bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Análise com IA</h3>
            <AnalysisPanel projectId={project.id} chapter={chapter} />
          </div>
        )}
      </div>
    </div>
  );
}
