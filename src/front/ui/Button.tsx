import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  busy?: boolean;
}

export function Button({ variant = "primary", busy, disabled, children, className = "", ...rest }: Props) {
  return (
    <button className={`btn btn-${variant} ${className}`} disabled={disabled || busy} {...rest}>
      {busy ? "Un instant…" : children}
    </button>
  );
}
