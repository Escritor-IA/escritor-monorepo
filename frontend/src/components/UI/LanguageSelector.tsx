import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { SUPPORTED_LANGUAGES, type SupportedLanguage, normalizeLanguage } from "@/i18n";
import { FlagIcon } from "./FlagIcon";

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const { setLanguage, user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Normalize browser-reported codes like "pt-BR" → "pt-br" so the flag + label resolve correctly
  const current = normalizeLanguage(i18n.language ?? "pt-br");

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = async (lang: SupportedLanguage) => {
    setOpen(false);
    setLanguage(lang);
    if (user) {
      try {
        await authApi.updateLanguage(lang);
      } catch {
        // Silently fail — UI already updated locally
      }
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={t("language.selector_label")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          height: 28,
          padding: "0 10px",
          borderRadius: 999,
          border: "1px solid var(--card-edge)",
          background: open ? "var(--card)" : "transparent",
          color: "var(--ink-2)",
          fontSize: 12,
          fontFamily: "var(--mono)",
          cursor: "pointer",
          transition: "all .15s ease",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "var(--card)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
      >
        <FlagIcon lang={current} size={18} />
        <span style={{ textTransform: "uppercase" }}>{current.split("-")[0]}</span>
        <ChevronIcon expanded={open} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "var(--paper)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            overflow: "hidden",
            minWidth: 150,
            zIndex: 200,
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = lang === current;
            return (
              <button
                key={lang}
                onClick={() => handleSelect(lang)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "9px 14px",
                  fontSize: 13,
                  color: active ? "var(--ink)" : "var(--ink-2)",
                  background: active ? "var(--card)" : "transparent",
                  fontWeight: active ? 600 : 400,
                  textAlign: "left",
                  cursor: "pointer",
                  borderBottom: lang !== SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.length - 1] ? "1px solid var(--border)" : "none",
                  transition: "background .1s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--card)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <FlagIcon lang={lang} size={20} />
                <span>{t(`language.${lang}`)}</span>
                {active && (
                  <span style={{ marginLeft: "auto", color: "var(--green)" }}>
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: "transform .15s",
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
