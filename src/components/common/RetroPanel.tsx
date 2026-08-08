import type { ReactNode } from "react";
import styles from "./RetroPanel.module.css";

interface RetroPanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function RetroPanel({ title, children, className }: RetroPanelProps) {
  return (
    <section className={[styles.panel, className ?? ""].join(" ").trim()}>
      {title && <div className={styles.title}>{title}</div>}
      {children}
    </section>
  );
}
