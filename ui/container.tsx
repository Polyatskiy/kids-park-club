import React from "react";

export function Container({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-6xl mx-auto px-4 md:px-6 ${className}`}>
      {children}
    </div>
  );
}
