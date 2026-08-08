import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { useI18n } from "../i18n/I18nContext";
import styles from "./AuthForm.module.css";

export function RegisterPage() {
  const { t } = useI18n();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

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
      await register(email, password, nickname);
      navigate("/", { replace: true });
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

  return (
    <PageContainer>
      <h1 style={{ textAlign: "center" }}>{t("auth.registerTitle")}</h1>
      <form className={styles.wrap} onSubmit={handleSubmit} noValidate>
        {error && <div className={styles.formError}>{error}</div>}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="reg-nickname">
            {t("auth.nickname")}
          </label>
          <input
            id="reg-nickname"
            className={styles.input}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="nickname"
            required
          />
          {fieldErrors.nickname?.map((m) => (
            <div key={m} className={styles.fieldError}>
              {m}
            </div>
          ))}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="reg-email">
            {t("auth.email")}
          </label>
          <input
            id="reg-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {fieldErrors.email?.map((m) => (
            <div key={m} className={styles.fieldError}>
              {m}
            </div>
          ))}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="reg-password">
            {t("auth.password")}
          </label>
          <input
            id="reg-password"
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
          <label className={styles.label} htmlFor="reg-password-confirm">
            {t("auth.passwordConfirm")}
          </label>
          <input
            id="reg-password-confirm"
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
          {submitting ? t("auth.registering") : t("auth.registerButton")}
        </RetroButton>
        <p className={styles.switchLine}>
          {t("auth.haveAccount")} <Link to="/login">{t("auth.goLogin")}</Link>
        </p>
      </form>
    </PageContainer>
  );
}
