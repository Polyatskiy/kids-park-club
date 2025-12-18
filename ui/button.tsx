"use client";

import React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent " +
    "disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] px-4 py-2 shadow-soft";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
    secondary:
      "bg-surface text-muted-foreground border border-border hover:bg-surface-muted",
    ghost:
      "bg-transparent text-slate-900 hover:bg-surface-muted border border-transparent",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95",
  };

  return (
    <button
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
};
