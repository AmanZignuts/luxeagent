import React from "react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Unable to load data",
  description = "A connection error occurred. Please verify your connection and try again.",
  retryLabel = "Retry request",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="border border-red-100 rounded-xl p-12 text-center bg-[#FFFFFF] max-w-md mx-auto flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-lg font-bold">
        ✕
      </div>
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-light tracking-tight text-[#09090B]">
          {title}
        </h3>
        <p className="font-sans text-xs text-[#09090B]/50 leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onRetry} className="border-red-200 hover:border-red-400 text-red-600">
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
