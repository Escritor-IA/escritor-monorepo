import type { Currency } from "./utils/currency";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type PlanCurrencyPrices = Record<Currency, number>;

export interface PlanPricesResponse {
  prices: Record<"basic" | "premium", PlanCurrencyPrices>;
  detected_currency: Currency;
}

export async function getPlanPrices(): Promise<PlanPricesResponse> {
  const response = await fetch(`${API_URL}/api/payments/plan-prices/`);
  if (!response.ok) throw new Error("Failed to fetch plan prices");
  return response.json();
}
