import { useState } from "react";
import type { Analysis, AnalysisType, Chapter } from "@/types";
import { ANALYSIS_LABELS, ANALYSIS_COSTS } from "@/types";
import { analysesApi } from "@/api/analyses";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/UI/Button";
import { Spinner } from "@/components/UI/Spinner";

interface AnalysisPanelProps {
  projectId: number;
  chapter?: Chapter | null;
  onCreditsUpdate?: (credits: number) => void;
}

const CHAPTER_REQUIRED: AnalysisType[] = [
  "local",
  "local_context",
  "reader_simulation",
  "creative_suggestion",
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
  const canRun =
    user &&
    user.credits_balance >= cost &&
    (!requiresChapter || !!chapter);

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
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Erro ao executar análise.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de análise</label>
        <div className="grid grid-cols-1 gap-2">
          {(Object.entries(ANALYSIS_LABELS) as [AnalysisType, string][]).map(([type, label]) => {
            const needsChapter = CHAPTER_REQUIRED.includes(type);
            const disabled = needsChapter && !chapter;
            return (
              <label
                key={type}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${selectedType === type ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"}
                  ${disabled ? "opacity-40 cursor-not-allowed" : ""}
                `}
              >
                <input
                  type="radio"
                  name="analysis_type"
                  value={type}
                  checked={selectedType === type}
                  onChange={() => !disabled && setSelectedType(type)}
                  disabled={disabled}
                  className="text-brand-600"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {selectedType === "creative_suggestion" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            O que você precisa?
          </label>
          <textarea
            value={creativeRequest}
            onChange={(e) => setCreativeRequest(e.target.value)}
            placeholder="Ex: Preciso de ideias para a virada do capítulo 3..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      )}

      {!chapter && requiresChapter && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          Selecione um capítulo para usar este tipo de análise.
        </p>
      )}

      {user && user.credits_balance < cost && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          Créditos insuficientes. Você tem {user.credits_balance} crédito(s) e esta análise custa {cost}.
        </p>
      )}

      <Button onClick={handleRun} loading={loading} disabled={!canRun || loading}>
        {loading ? "Analisando..." : `Executar análise · ${cost} crédito(s)`}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner label="A IA está analisando seu texto..." />
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
            <span className="text-sm font-medium text-brand-700">{result.analysis_type_display}</span>
            <span className="text-xs text-gray-500">{result.ai_model}</span>
          </div>
          <div className="px-4 py-4">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
              {result.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
