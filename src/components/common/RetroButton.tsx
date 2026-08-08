import type { ButtonHTMLAttributes } from "react";
import styles from "./RetroButton.module.css";

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary";
  size?: "default" | "small";
  fullWidth?: boolean;
}

export function RetroButton({
  variant = "default",
  size = "default",
  fullWidth = false,
  className,
  ...rest
}: RetroButtonProps) {
  const classes = [
    styles.btn,
    variant === "primary" ? styles.primary : "",
    size === "small" ? styles.small : "",
    fullWidth ? styles.fullWidth : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <button type="button" className={classes} {...rest} />;
}
