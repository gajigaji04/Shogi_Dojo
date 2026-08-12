import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { api, ApiError } from "../api/client";
import { useI18n } from "../i18n/I18nContext";
import styles from "./AuthForm.module.css";

export function ResetPasswordPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <PageContainer>
        <h1 style={{ textAlign: "center" }}>{t("auth.resetPasswordInvalidTitle")}</h1>
        <div className={styles.wrap}>
          <p style={{ textAlign: "center", color: "var(--ink-700)" }}>{t("auth.resetPasswordInvalidBody")}</p>
          <p className={styles.switchLine} style={{ textAlign: "center" }}>
            <Link to="/forgot-password">{t("auth.forgotPasswordLink")}</Link>
          </p>
        </div>
      </PageContainer>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (password !== passwordConfirm) {
      setFieldErrors({ passwordConfirm: [t("auth.passwordMismatch")] });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.fieldErrors ? null : err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setError(t("errors.illegalMove"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <PageContainer>
        <h1 style={{ textAlign: "center" }}>{t("auth.resetPasswordDoneTitle")}</h1>
        <div className={styles.wrap}>
          <p style={{ textAlign: "center", color: "var(--ink-700)" }}>{t("auth.resetPasswordDoneBody")}</p>
          <p className={styles.switchLine} style={{ textAlign: "center" }}>
            <Link to="/login">{t("auth.backToLogin")}</Link>
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 style={{ textAlign: "center" }}>{t("auth.resetPasswordTitle")}</h1>
      <form className={styles.wrap} onSubmit={handleSubmit} noValidate>
        <p style={{ color: "var(--ink-700)", marginBottom: "var(--sp-4)" }}>{t("auth.resetPasswordBody")}</p>
        {error && <div className={styles.formError}>{error}</div>}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="reset-password">
            {t("auth.password")}
          </label>
          <input
            id="reset-password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          {fieldErrors.password?.map((m) => (
            <div key={m} className={styles.fieldError}>
              {m}
            </div>
          ))}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="reset-password-confirm">
            {t("auth.passwordConfirm")}
          </label>
          <input
            id="reset-password-confirm"
            type="password"
            className={styles.input}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          {fieldErrors.passwordConfirm?.map((m) => (
            <div key={m} className={styles.fieldError}>
              {m}
            </div>
          ))}
        </div>
        <RetroButton type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? t("auth.resetPasswordSubmitting") : t("auth.resetPasswordButton")}
        </RetroButton>
      </form>
    </PageContainer>
  );
}
