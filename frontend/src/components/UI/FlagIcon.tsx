import type { SupportedLanguage } from "@/i18n";

interface FlagProps {
  size?: number;
}

function FlagBR({ size = 18 }: FlagProps) {
  const h = Math.round(size * 0.7);
  return (
    <svg width={size} height={h} viewBox="0 0 20 14" style={{ display: "block", borderRadius: 2, flexShrink: 0 }}>
      <rect width="20" height="14" fill="#009B3A" />
      <polygon points="10,1.4 18.8,7 10,12.6 1.2,7" fill="#FEDF00" />
      <circle cx="10" cy="7" r="3.6" fill="#002776" />
      <path d="M6.6 5.8 Q10 4.6 13.4 5.8" stroke="white" strokeWidth="0.7" fill="none" />
    </svg>
  );
}

function FlagUS({ size = 18 }: FlagProps) {
  const h = Math.round(size * 0.7);
  return (
    <svg width={size} height={h} viewBox="0 0 20 14" style={{ display: "block", borderRadius: 2, flexShrink: 0 }}>
      <rect width="20" height="14" fill="#B22234" />
      {[0, 2, 4, 6, 8, 10, 12].map((y) => (
        <rect key={y} width="20" height="1.08" y={y + 1.08} fill="white" />
      ))}
      <rect width="8.5" height="7.6" fill="#3C3B6E" />
      {/* simplified stars hint */}
      {[1, 3, 5].map((row) =>
        [1.2, 2.8, 4.4, 6.0].map((col) => (
          <circle key={`${row}-${col}`} cx={col} cy={row} r="0.38" fill="white" />
        ))
      )}
      {[2, 4].map((row) =>
        [2.0, 3.6, 5.2].map((col) => (
          <circle key={`${row}-${col}`} cx={col} cy={row} r="0.38" fill="white" />
        ))
      )}
    </svg>
  );
}

function FlagFR({ size = 18 }: FlagProps) {
  const h = Math.round(size * 0.7);
  return (
    <svg width={size} height={h} viewBox="0 0 20 14" style={{ display: "block", borderRadius: 2, flexShrink: 0 }}>
      <rect width="20" height="14" fill="#ED2939" />
      <rect width="13.4" height="14" fill="white" />
      <rect width="6.7" height="14" fill="#002395" />
    </svg>
  );
}

function FlagES({ size = 18 }: FlagProps) {
  const h = Math.round(size * 0.7);
  return (
    <svg width={size} height={h} viewBox="0 0 20 14" style={{ display: "block", borderRadius: 2, flexShrink: 0 }}>
      <rect width="20" height="14" fill="#C60B1E" />
      <rect width="20" height="7" y="3.5" fill="#FFC400" />
    </svg>
  );
}

const FLAGS: Record<SupportedLanguage, (props: FlagProps) => JSX.Element> = {
  "pt-br": FlagBR,
  en: FlagUS,
  fr: FlagFR,
  es: FlagES,
};

interface FlagIconProps extends FlagProps {
  lang: SupportedLanguage;
}

export function FlagIcon({ lang, size = 18 }: FlagIconProps) {
  const Flag = FLAGS[lang];
  return Flag ? <Flag size={size} /> : null;
}
