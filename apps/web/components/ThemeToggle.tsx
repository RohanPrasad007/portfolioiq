"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/app/providers";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.div
      onClick={toggleTheme}
      className="relative flex items-center h-9 w-[72px] p-1 bg-surface-variant/10 dark:bg-surface-variant/5 rounded-full border border-border-subtle dark:border-border-subtle cursor-pointer select-none"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {/* Sliding Active Pill */}
      <motion.div
        className={`absolute top-[3px] bottom-[3px] left-[3px] w-[31px] rounded-full z-0 transition-colors duration-200 ${
          theme === "dark"
            ? "bg-primary shadow-[0_0_12px_rgba(68,80,183,0.4)]"
            : "bg-white shadow-sm border border-black/5"
        }`}
        animate={{
          x: theme === "dark" ? 35 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 28,
        }}
      />

      {/* Sun Icon */}
      <div className="flex-1 flex items-center justify-center h-full z-10">
        <motion.span
          className={`material-symbols-outlined text-[18px] transition-colors duration-200 ${
            theme === "light"
              ? "text-on-surface font-semibold"
              : "text-on-surface-variant/50 dark:text-surface-variant/45"
          }`}
          animate={{
            scale: theme === "light" ? 1.08 : 0.85,
            rotate: theme === "light" ? 0 : -45,
          }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 25,
          }}
        >
          light_mode
        </motion.span>
      </div>

      {/* Moon Icon */}
      <div className="flex-1 flex items-center justify-center h-full z-10">
        <motion.span
          className={`material-symbols-outlined text-[18px] transition-colors duration-200 ${
            theme === "dark"
              ? "text-white font-semibold"
              : "text-on-surface-variant/50 dark:text-surface-variant/45"
          }`}
          animate={{
            scale: theme === "dark" ? 1.08 : 0.85,
            rotate: theme === "dark" ? 0 : 15,
          }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 25,
          }}
        >
          dark_mode
        </motion.span>
      </div>
    </motion.div>
  );
}
