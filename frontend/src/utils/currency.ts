export type Currency = "brl" | "usd" | "eur";

export const CURRENCY_SYMBOL: Record<Currency, string> = { brl: "R$", usd: "$", eur: "€" };

// Mirrors the mapping in frontend/src/i18n/index.ts (normalizeLanguage/LOCALE_MAP).
export function currencyForLanguage(language: string): Currency {
  if (language.startsWith("en")) return "usd";
  if (language.startsWith("fr") || language.startsWith("es")) return "eur";
  return "brl";
}

export function formatPrice(cents: number, currency: Currency): string {
  return (cents / 100).toLocaleString(currency === "brl" ? "pt-BR" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
