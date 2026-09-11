import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { paymentsApi, type PlanCurrencyPrices } from "@/api/payments";
import { Button } from "@/components/UI/Button";
import { AuthShell } from "./Login";
import {
  CURRENCY_SYMBOL,
  currencyForLanguage,
  formatPrice,
  type Currency,
} from "@/utils/currency";

type PlanKey = "free" | "basic" | "premium";

const PLAN_ORDER: PlanKey[] = ["free", "basic", "premium"];

const PLAN_META: { key: PlanKey; highlight?: boolean }[] = [
  { key: "free" },
  { key: "basic", highlight: true },
  { key: "premium" },
];

export function SelectPlan() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";
  const isOnboarding = searchParams.get("onboarding") === "true";

  const currentPlan: PlanKey = (user?.user_plan?.plan as PlanKey) ?? "free";
  const hasSubscription = Boolean(user?.user_plan?.billing_cycle);

  const [selected, setSelected] = useState<PlanKey>(() => {
    if (currentPlan === "free") return "basic";
    if (currentPlan === "basic") return "premium";
    return "basic";
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prices, setPrices] = useState<Record<
    "basic" | "premium",
    PlanCurrencyPrices
  > | null>(null);
  const [detectedCurrency, setDetectedCurrency] = useState<Currency | null>(
    null,
  );

  useEffect(() => {
    paymentsApi
      .getPlanPrices()
      .then(({ data }) => {
        setPrices(data.prices);
        setDetectedCurrency(data.detected_currency);
      })
      .catch((err) => {
        console.error("Failed to load plan prices:", err);
        setPrices(null);
        setDetectedCurrency(null);
      });
  }, []);

  // detected_currency comes from server-side IP geolocation; falls back to
  // the user's declared language only if that lookup failed.
  const currency =
    detectedCurrency ??
    currencyForLanguage(user?.preferred_language ?? i18n.language);

  const isDowngrade =
    selected !== "free" &&
    PLAN_ORDER.indexOf(selected) < PLAN_ORDER.indexOf(currentPlan);

  const handleContinue = async () => {
    if (!isOnboarding && selected === currentPlan) return;
    setError("");
    setLoading(true);

    try {
      if (isOnboarding && selected === "free") {
        navigate("/dashboard");
        return;
      }

      // free user selecting a paid plan → new Stripe Checkout session
      if (!hasSubscription && selected !== "free") {
        const { data } = await paymentsApi.createCheckoutSession(
          selected as "basic" | "premium",
        );
        sessionStorage.setItem("checkout_plan", selected);
        window.location.href = data.url;
        return;
      }

      // paid user going back to free → cancel at period end
      if (hasSubscription && selected === "free") {
        await paymentsApi.cancelSubscription();
        navigate("/dashboard");
        return;
      }

      // paid user changing to a different paid plan → modify subscription
      if (hasSubscription && selected !== "free") {
        await paymentsApi.changePlan(selected as "basic" | "premium");
        sessionStorage.setItem("checkout_plan", selected);
        navigate("/checkout/processing");
        return;
      }

      navigate("/dashboard");
    } catch {
      setError(t("select_plan.change_error"));
      setLoading(false);
    }
  };

  const buttonLabel = () => {
    if (loading) return t("select_plan.changing");
    if (!isOnboarding && selected === currentPlan)
      return t("select_plan.current_plan");
    if (isOnboarding)
      return selected === "free"
        ? t("select_plan.continue_free")
        : t("select_plan.continue_paid");
    if (selected === "free") return t("select_plan.cancel_sub");
    if (!hasSubscription) return t("select_plan.continue_paid");
    if (isDowngrade) return t("select_plan.go_downgrade");
    return t("select_plan.go_upgrade");
  };

  return (
    <AuthShell
      eyebrow={t("select_plan.eyebrow")}
      title={
        <>
          {t("select_plan.title")}
          <br />
          <em style={{ fontStyle: "italic" }}>{t("select_plan.title_em")}</em>
        </>
      }
      sub={t("select_plan.sub")}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!isOnboarding && (
          <button
            type="button"
            onClick={() => {
              const prev = document.referrer;
              const isSameOrigin =
                prev && new URL(prev).origin === window.location.origin;
              if (isSameOrigin) navigate(-1);
              else navigate("/dashboard");
            }}
            style={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--ink-3)",
              padding: 0,
              marginBottom: 4,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Voltar
          </button>
        )}

        {canceled && (
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-3)",
              background: "var(--border)",
              padding: "10px 12px",
              borderRadius: 8,
            }}
          >
            {t("select_plan.canceled")}
          </p>
        )}

        {PLAN_META.map((p) => {
          const active = selected === p.key;
          const isCurrent = !isOnboarding && currentPlan === p.key;
          const features = t(`auth.register.plans.${p.key}.features`, {
            returnObjects: true,
          }) as string[];

          return (
            <button
              key={p.key}
              type="button"
              onClick={() => !isCurrent && setSelected(p.key)}
              style={{
                position: "relative",
                width: "100%",
                padding: "20px 22px",
                borderRadius: 12,
                cursor: isCurrent ? "default" : "pointer",
                textAlign: "left",
                transition: "border-color 0.15s, background 0.15s",
                border: isCurrent
                  ? "2px solid #1a1640"
                  : active
                    ? "2px solid var(--green)"
                    : p.highlight
                      ? "2px solid #1a1640"
                      : "2px solid var(--border)",
                background:
                  active && !isCurrent
                    ? "rgba(78,232,163,0.05)"
                    : "var(--paper)",
                color: "var(--ink)",
                opacity: isCurrent ? 0.85 : 1,
              }}
            >
              {p.highlight && !isCurrent && (
                <div
                  style={{
                    position: "absolute",
                    top: -11,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#1a1640",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "3px 12px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("auth.register.most_chosen")}
                </div>
              )}

              {isCurrent && (
                <div
                  style={{
                    position: "absolute",
                    top: -11,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--green)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "3px 12px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("select_plan.current_plan")}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color:
                        active && !isCurrent ? "var(--green)" : "var(--ink)",
                      marginBottom: 2,
                    }}
                  >
                    {t(`auth.register.plans.${p.key}.name`)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {t(`auth.register.plans.${p.key}.tagline`)}
                  </div>
                </div>

                <div
                  style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}
                >
                  <div
                    style={{ display: "flex", alignItems: "baseline", gap: 2 }}
                  >
                    <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                      {CURRENCY_SYMBOL[currency]}
                    </span>
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: "var(--ink)",
                      }}
                    >
                      {p.key === "free"
                        ? "0"
                        : prices
                          ? formatPrice(prices[p.key][currency], currency)
                          : "–"}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {t(`auth.register.plans.${p.key}.price_note`)}
                    </span>
                  </div>
                  {t(`auth.register.plans.${p.key}.annual_note`, "") && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ink-3)",
                        marginTop: 2,
                      }}
                    >
                      {t(`auth.register.plans.${p.key}.annual_note`)}
                    </div>
                  )}
                </div>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "14px 0 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                {Array.isArray(features) &&
                  features.map((f) => (
                    <li
                      key={f}
                      style={{
                        fontSize: 13,
                        color: "var(--ink-2)",
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--green)",
                          lineHeight: 1.5,
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
              </ul>
            </button>
          );
        })}

        {currency !== "brl" && (
          <p style={{ fontSize: 11, color: "var(--ink-3)" }}>
            {t("select_plan.price_disclaimer")}
          </p>
        )}

        {error && (
          <p
            style={{
              fontSize: 13,
              color: "var(--red)",
              background: "var(--red-wash)",
              padding: "10px 12px",
              borderRadius: 8,
            }}
          >
            {error}
          </p>
        )}

        <Button
          type="button"
          variant={selected === "free" && hasSubscription ? "ghost" : "primary"}
          size="lg"
          loading={loading}
          disabled={!isOnboarding && selected === currentPlan}
          onClick={handleContinue}
          style={{ marginTop: 4 }}
        >
          {buttonLabel()}
        </Button>
      </div>
    </AuthShell>
  );
}
