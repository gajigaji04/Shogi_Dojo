import { useState } from "react";
import type { FormEvent } from "react";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { RetroPanel } from "../components/common/RetroPanel";
import { api, ApiError } from "../api/client";
import { useI18n } from "../i18n/I18nContext";
import styles from "./AuthForm.module.css";

export function ContactPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post("/api/contact", { name, email, subject, message });
      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setFormError(err instanceof ApiError ? err.message : t("errors.illegalMove"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <h1 style={{ textAlign: "center" }}>{t("contact.title")}</h1>

      {success && (
        <div style={{ maxWidth: "420px", margin: "0 auto 24px" }}>
          <RetroPanel title={t("contact.successTitle")}>
            <p style={{ margin: 0 }}>{t("contact.successBody")}</p>
          </RetroPanel>
        </div>
      )}

      <form className={styles.wrap} onSubmit={handleSubmit} noValidate>
        {formError && <div className={styles.formError}>{formError}</div>}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-name">
            {t("contact.name")}
          </label>
          <input id="contact-name" className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
          {fieldErrors.name?.map((m) => (
            <div key={m} className={styles.fieldError}>
              {m}
            </div>
          ))}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-email">
            {t("contact.email")}
          </label>
          <input
            id="contact-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {fieldErrors.email?.map((m) => (
            <div key={m} className={styles.fieldError}>
              {m}
            </div>
          ))}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-subject">
            {t("contact.subject")}
          </label>
          <input
            id="contact-subject"
            className={styles.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          {fieldErrors.subject?.map((m) => (
            <div key={m} className={styles.fieldError}>
              {m}
            </div>
          ))}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-message">
            {t("contact.message")}
          </label>
          <textarea
            id="contact-message"
            className={styles.input}
            style={{ minHeight: "140px", resize: "vertical" }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          {fieldErrors.message?.map((m) => (
            <div key={m} className={styles.fieldError}>
              {m}
            </div>
          ))}
        </div>
        <RetroButton type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? t("contact.submitting") : t("contact.submit")}
        </RetroButton>
      </form>
    </PageContainer>
  );
}
