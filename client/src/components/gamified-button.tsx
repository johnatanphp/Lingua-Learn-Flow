import { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface GamifiedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "accent" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
}

export function GamifiedButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: GamifiedButtonProps) {
  
  const baseClasses = "btn-3d font-display font-bold rounded-2xl flex items-center justify-center gap-2 overflow-hidden";
  
  const variants = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    success: "bg-success text-success-foreground",
    accent: "bg-accent text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "bg-card text-foreground border-2 border-border !border-b-[4px] hover:bg-muted"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
    xl: "px-10 py-5 text-xl"
  };

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed transform-none !border-b-0" : ""}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
