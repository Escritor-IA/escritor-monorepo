import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GoogleLogin } from "@react-oauth/google";
import { ConfirmDialog } from "@/components/UI/ConfirmDialog";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

// Matches .btn-lg's height (46px) so the Google button lines up with "Entrar"/"Criar conta".
const BUTTON_HEIGHT = 46;

export function GoogleAuthBlock() {
  const { t } = useTranslation();
  const { handleGoogleSuccess, handleGoogleError, linkEmail, linking, confirmLink, cancelLink, error } =
    useGoogleAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{t("auth.google.or_divider")}</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <div
        ref={containerRef}
        style={{
          height: BUTTON_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: 999,
        }}
      >
        {width > 0 && (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            shape="pill"
            size="large"
            theme="outline"
            text="continue_with"
            logo_alignment="center"
            width={width}
          />
        )}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: "var(--red)", background: "var(--red-wash)", padding: "10px 12px", borderRadius: 8, marginTop: 12 }}>
          {error}
        </p>
      )}

      {linkEmail && (
        <ConfirmDialog
          title={t("confirm.link_google_title")}
          description={t("confirm.link_google_description", { email: linkEmail })}
          confirmLabel={t("confirm.link_google_confirm")}
          cancelLabel={t("confirm.link_google_cancel")}
          loading={linking}
          onConfirm={confirmLink}
          onCancel={cancelLink}
        />
      )}
    </>
  );
}
