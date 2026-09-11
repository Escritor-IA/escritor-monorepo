import client from "./client";
import type { Currency } from "@/utils/currency";

export type PlanCurrencyPrices = Record<Currency, number>;

export interface PlanPricesResponse {
  prices: Record<"basic" | "premium", PlanCurrencyPrices>;
  detected_currency: Currency;
}

export const paymentsApi = {
  getPlanPrices: () =>
    client.get<PlanPricesResponse>("/payments/plan-prices/"),

  createCheckoutSession: (plan: "basic" | "premium") =>
    client.post<{ url: string }>("/payments/create-checkout-session/", { plan }),

  changePlan: (plan: "basic" | "premium") =>
    client.post<{ status: string }>("/payments/change-plan/", { plan }),

  cancelSubscription: () =>
    client.post<{ status: string; cancel_at: number | null }>("/payments/cancel-subscription/"),
};
