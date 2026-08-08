import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useI18n } from "../../i18n/I18nContext";
import { RetroPanel } from "./RetroPanel";
import { RetroButton } from "./RetroButton";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (status === "loading") {
    return <p style={{ textAlign: "center", color: "var(--ink-500)", padding: "48px 0" }}>{t("common.loading")}</p>;
  }

  if (status === "unauthenticated") {
    return (
      <RetroPanel title={t("auth.loginRequiredTitle")}>
        <p>{t("auth.loginRequiredBody")}</p>
        <Link to="/login" state={{ from: location.pathname }}>
          <RetroButton variant="primary">{t("auth.loginButton")}</RetroButton>
        </Link>
      </RetroPanel>
    );
  }

  return <>{children}</>;
}
