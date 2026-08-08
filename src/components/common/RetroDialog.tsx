import { useEffect } from "react";
import type { ReactNode } from "react";
import styles from "./RetroDialog.module.css";

interface RetroDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  onClose?: () => void;
}

export function RetroDialog({ open, title, children, actions, onClose }: RetroDialogProps) {
  useEffect(() => {
    if (!open || !onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="retro-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="retro-dialog-title" className={styles.title}>
          {title}
        </div>
        {children && <div className={styles.body}>{children}</div>}
        <div className={styles.actions}>{actions}</div>
      </div>
    </div>
  );
}
