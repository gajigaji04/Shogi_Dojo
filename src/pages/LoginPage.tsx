import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { useI18n } from "../i18n/I18nContext";
import styles from "./AuthForm.module.css";

export function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.illegalMove"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <h1 style={{ textAlign: "center" }}>{t("auth.loginTitle")}</h1>
      <form className={styles.wrap} onSubmit={handleSubmit} noValidate>
        {error && <div className={styles.formError}>{error}</div>}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-email">
            {t("auth.email")}
          </label>
          <input
            id="login-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-password">
            {t("auth.password")}
          </label>
          <input
            id="login-password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <RetroButton type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? t("auth.loggingIn") : t("auth.loginButton")}
        </RetroButton>
        <p className={styles.switchLine}>
          {t("auth.noAccount")} <Link to="/register">{t("auth.goRegister")}</Link>
        </p>
      </form>
    </PageContainer>
  );
}
