import React from "react";

/**
 * Clean desaturated luxury circular spinner
 */
export function Spinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-[1.2px]",
    md: "w-8 h-8 border-[1.5px]",
    lg: "w-12 h-12 border-2",
  };

  return (
    <div
      className={`rounded-full border-[#E4E4E7] border-t-[#09090B] animate-spin ${sizeClasses[size]} ${className}`}
    />
  );
}

/**
 * Animated Shimmer wrapper
 */
export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-neutral-200/50 rounded-md ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </div>
  );
}

/**
 * Product card skeleton loader
 */
export function CardSkeleton() {
  return (
    <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-xl p-6 flex flex-col justify-between h-[400px]">
      <Shimmer className="w-full h-auto flex-1 min-h-[180px] rounded-lg" />
      <div className="mt-6 space-y-3">
        <Shimmer className="h-3 w-1/3" />
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Shimmer className="h-4 w-1/4" />
          <Shimmer className="h-5 w-1/6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Bento grid or list card horizontal skeleton loader (for mobile/list views)
 */
export function HorizontalCardSkeleton() {
  return (
    <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-xl p-4 flex flex-row gap-4 h-36 items-center w-full">
      <Shimmer className="w-28 h-28 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3 w-1/4" />
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <Shimmer className="h-3 w-1/5" />
          <Shimmer className="h-4 w-1/6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Row skeleton for tables or queues
 */
export function RowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-4 border-b border-[#E4E4E7]/60">
      <Shimmer className="h-10 w-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3.5 w-1/4" />
        <Shimmer className="h-3 w-1/2" />
      </div>
      <Shimmer className="h-8 w-20 rounded-md shrink-0" />
    </div>
  );
}

/**
 * Page level full-screen loader layout
 */
export function PageLoader({ title = "Loading Collection", subtitle = "Syncing with concierge parameters..." }) {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
      <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-xl p-12 max-w-md w-full flex flex-col items-center justify-center space-y-6 shadow-sm">
        <Spinner size="lg" />
        <div className="text-center space-y-2">
          <h3 className="font-serif text-xl font-light tracking-tight text-[#09090B]">
            {title}
          </h3>
          <p className="font-sans text-[10px] text-[#09090B]/40 tracking-wider uppercase font-semibold">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
