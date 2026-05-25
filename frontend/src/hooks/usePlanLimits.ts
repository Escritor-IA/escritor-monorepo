import { useAuthStore } from "@/store/authStore";
import { ANALYSIS_MIN_PLAN, PROFILE_MIN_PLAN, PLAN_LABELS } from "@/types";
import type { AnalysisType } from "@/types";

type Plan = "free" | "basic" | "premium";

const PLAN_RANK: Record<Plan, number> = { free: 0, basic: 1, premium: 2 };

const CHAPTER_WORD_LIMIT: Record<Plan, number | null> = {
  free: 5_000,
  basic: 15_000,
  premium: null,
};

const WEEKLY_SIM_LIMIT: Record<Plan, number | null> = {
  free: 2,
  basic: null,
  premium: null,
};

export function usePlanLimits() {
  const plan: Plan = useAuthStore((s) => s.user?.user_plan.plan ?? "free");
  const rank = PLAN_RANK[plan];

  const isAnalysisTypeAllowed = (type: AnalysisType): boolean => {
    const min = ANALYSIS_MIN_PLAN[type];
    return !min || rank >= PLAN_RANK[min];
  };

  const isProfileAllowed = (slug: string): boolean => {
    const min = PROFILE_MIN_PLAN[slug] ?? "free";
    return rank >= PLAN_RANK[min as Plan];
  };

  // Returns the minimum plan name needed, or null if already allowed
  const minPlanForAnalysis = (type: AnalysisType): string | null => {
    const min = ANALYSIS_MIN_PLAN[type];
    if (!min || rank >= PLAN_RANK[min]) return null;
    return PLAN_LABELS[min];
  };

  const minPlanForProfile = (slug: string): string | null => {
    const min = (PROFILE_MIN_PLAN[slug] ?? "free") as Plan;
    if (rank >= PLAN_RANK[min]) return null;
    return PLAN_LABELS[min];
  };

  return {
    plan,
    planLabel: PLAN_LABELS[plan],
    chapterWordLimit: CHAPTER_WORD_LIMIT[plan],
    weeklySimLimit: WEEKLY_SIM_LIMIT[plan],
    isAnalysisTypeAllowed,
    isProfileAllowed,
    minPlanForAnalysis,
    minPlanForProfile,
  };
}
