"use client";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Check, X } from "lucide-react";

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  state?: ButtonState;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Button = ({ 
  className, 
  children, 
  state = 'idle', 
  onClick,
  disabled,
  ...props 
}: ButtonProps) => {
  const isLoading = state === 'loading';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  return (
    <button
      className={cn(
        "relative flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]",
        // State colors
        isSuccess && "bg-green-600 text-white hover:bg-green-700",
        isError && "bg-red-600 text-white hover:bg-red-700",
        // Default style if idle/loading (can be overridden by className)
        (state === 'idle' || state === 'loading') && className,
        // Loading specific overrides
        isLoading && "cursor-wait opacity-90",
        className
      )}
      onClick={onClick}
      disabled={isLoading || disabled}
      {...props}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {isLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Loader2 className="h-5 w-5 animate-spin" />
          </motion.div>
        )}
        {isSuccess && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Check className="h-5 w-5" />
          </motion.div>
        )}
        {isError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <X className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>

      <span>{children}</span>
    </button>
  );
};
