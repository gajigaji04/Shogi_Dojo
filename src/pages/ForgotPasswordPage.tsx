import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { api, ApiError } from "../api/client";
import { useI18n } from "../i18n/I18nContext";
import styles from "./AuthForm.module.css";

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.illegalMove"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <PageContainer>
        <h1 style={{ textAlign: "center" }}>{t("auth.forgotPasswordTitle")}</h1>
        <div className={styles.wrap}>
          <p style={{ textAlign: "center", color: "var(--ink-700)" }}>{t("auth.forgotPasswordDone")}</p>
          <p className={styles.switchLine} style={{ textAlign: "center" }}>
            <Link to="/login">{t("auth.backToLogin")}</Link>
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 style={{ textAlign: "center" }}>{t("auth.forgotPasswordTitle")}</h1>
      <form className={styles.wrap} onSubmit={handleSubmit} noValidate>
        <p style={{ color: "var(--ink-700)", marginBottom: "var(--sp-4)" }}>{t("auth.forgotPasswordBody")}</p>
        {error && <div className={styles.formError}>{error}</div>}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="forgot-email">
            {t("auth.email")}
          </label>
          <input
            id="forgot-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <RetroButton type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? t("auth.forgotPasswordSending") : t("auth.forgotPasswordButton")}
        </RetroButton>
        <p className={styles.switchLine}>
          <Link to="/login">{t("auth.backToLogin")}</Link>
        </p>
      </form>
    </PageContainer>
  );
}
