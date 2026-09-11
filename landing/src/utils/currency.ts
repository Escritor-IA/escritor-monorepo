export type Currency = "brl" | "usd" | "eur";

export const CURRENCY_SYMBOL: Record<Currency, string> = { brl: "R$", usd: "$", eur: "€" };

export function formatPrice(cents: number, currency: Currency): string {
  return (cents / 100).toLocaleString(currency === "brl" ? "pt-BR" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
