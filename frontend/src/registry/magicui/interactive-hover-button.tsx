import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  dotColor?: string;
  hoverBgColor?: string;
  icon?: React.ReactNode;
  hoverIcon?: React.ReactNode;
  hideArrow?: boolean;
}

export function InteractiveHoverButton({
  children,
  text,
  className,
  icon,
  hoverIcon,
  hideArrow = false,
  ...props
}: InteractiveHoverButtonProps) {
  const content = children || text;

  return (
    <button
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-xl border border-sky-400/40 dark:border-sky-600/40 bg-white dark:bg-slate-900/90 py-2 px-4 sm:px-5 text-center text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-300 hover:border-sky-500 hover:shadow-md hover:shadow-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed select-none",
        className
      )}
      {...props}
    >
      {/* Resting State with Blue Dot / Icon */}
      <div className="flex items-center justify-center gap-2">
        {icon ? (
          <span className="shrink-0 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </span>
        ) : (
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 to-ocean-600 transition-all duration-500 ease-out group-hover:scale-[100.8]" />
        )}
        <span className="inline-block transition-all duration-300 ease-out group-hover:translate-x-12 group-hover:opacity-0 whitespace-nowrap">
          {content}
        </span>
      </div>

      {/* Hover State: Slide-in White Text + Icon on Blue Background */}
      <div className="absolute inset-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-ocean-600 text-white opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 font-bold whitespace-nowrap">
        {hoverIcon ? (
          <span className="shrink-0">{hoverIcon}</span>
        ) : null}
        <span>{content}</span>
        {!hideArrow && !hoverIcon && (
          <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
        )}
      </div>
    </button>
  );
}

