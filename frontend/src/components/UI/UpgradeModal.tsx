import { Modal } from "./Modal";
import { Button } from "./Button";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  requiredPlan: string;
  featureName: string;
}

interface PlanInfo {
  label: string;
  credits: string;
  wordLimit: string;
  profiles: string;
  simLimit: string;
  analyses: string;
}

const PLAN_INFO: Record<string, PlanInfo> = {
  Autor: {
    label: "Autor",
    credits: "60 créditos por mês",
    wordLimit: "Até 15.000 palavras por capítulo",
    profiles: "3 perfis de leitor (Luna, Rafael, Camila)",
    simLimit: "Simulações ilimitadas por semana",
    analyses: "Todas as análises desbloqueadas",
  },
  "Obra Completa": {
    label: "Obra Completa",
    credits: "150 créditos por mês",
    wordLimit: "Capítulos sem limite de palavras",
    profiles: "Todos os 6 perfis de leitor",
    simLimit: "Simulações ilimitadas",
    analyses: "Acesso total a todas as análises",
  },
};

export function UpgradeModal({ open, onClose, requiredPlan, featureName }: UpgradeModalProps) {
  const info = PLAN_INFO[requiredPlan];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recurso bloqueado"
      maxWidth={440}
      footer={
        <Button variant="primary" onClick={onClose}>
          Entendido
        </Button>
      }
    >
      {/* Lock badge + feature name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: "var(--paper-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink-3)",
        }}>
          <LockIcon />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: 1.3 }}>
            {featureName}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>
            Disponível a partir do plano{" "}
            <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{requiredPlan}</span>
          </div>
        </div>
      </div>

      {/* Plan badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "6px 14px", borderRadius: 999,
        background: "var(--mint-wash-soft)",
        color: "var(--green-deep)",
        fontSize: 12, fontWeight: 600,
        marginBottom: 16,
      }}>
        <StarIcon />
        Plano {info?.label ?? requiredPlan}
      </div>

      {/* Feature list */}
      {info && (
        <div style={{
          background: "var(--paper-2)",
          borderRadius: 10,
          padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {[
            info.credits,
            info.wordLimit,
            info.profiles,
            info.simLimit,
            info.analyses,
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ marginTop: 2, color: "var(--green)", flexShrink: 0 }}>
                <CheckIcon />
              </div>
              <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.45 }}>{item}</span>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 14, lineHeight: 1.5 }}>
        Entre em contato para fazer upgrade do seu plano e desbloquear todos os recursos.
      </p>
    </Modal>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
