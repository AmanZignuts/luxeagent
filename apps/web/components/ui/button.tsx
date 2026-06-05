import React from "react";
import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  // Styling according to Design Spec
  const baseStyle =
    "font-sans font-semibold tracking-wider uppercase rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-obsidian-velvet/50 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer";

  const variants = {
    primary: "bg-[#09090B] text-[#FFFFFF] hover:bg-[#09090B]/90 border border-[#09090B]",
    secondary: "bg-[#F2EBD9] text-[#09090B] hover:bg-[#F2EBD9]/80 border border-[#F2EBD9]",
    outline: "bg-transparent text-[#09090B] border border-[#E4E4E7] hover:border-[#09090B]",
    ghost: "bg-transparent text-[#09090B]/75 hover:text-[#09090B] hover:bg-[#FAF0E6]/50",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-[10px]",
    md: "px-6 py-3 text-xs",
    lg: "px-8 py-4 text-sm rounded-xl", // container boundary corners rounded-xl (16px) for larger buttons
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.985 }}
      type={type}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...(props as any)}
    >
      {loading && (
        <div className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin" />
      )}
      {children}
    </motion.button>
  );
}
