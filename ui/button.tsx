"use client";

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className = "",
  ...props
}) => {
  const base =
    "px-4 py-2 rounded-2xl text-sm font-semibold transition shadow-sm active:scale-95";
  const variants: Record<string, string> = {
    primary: "bg-primary text-gray-900 hover:opacity-90",
    secondary: "bg-secondary text-gray-900 hover:opacity-90",
    ghost: "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
};
