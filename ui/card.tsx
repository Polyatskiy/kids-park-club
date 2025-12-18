import React from "react";
import { cn } from "@/lib/cn";

type CardVariant = "solid" | "glass";

export function Card({
  children,
  className = "",
  variant = "solid",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
}) {
  const base =
    "rounded-2xl p-4 transition-shadow shadow-soft border border-border bg-card text-card-foreground";

  const variants: Record<CardVariant, string> = {
    solid: "",
    glass:
      "backdrop-blur-xl bg-white/65 border-white/60 shadow-strong",
  };

  return (
    <div className={cn(base, variants[variant], className)}>
      {children}
    </div>
  );
}
