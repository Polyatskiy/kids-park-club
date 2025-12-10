import React from "react";

export function Card({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-4 backdrop-blur-md bg-white/25 border border-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${className}`}
    >
      {children}
    </div>
  );
}
