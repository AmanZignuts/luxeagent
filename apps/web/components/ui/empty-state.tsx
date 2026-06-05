import React from "react";
import { Button } from "./button";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
  icon,
}: EmptyStateProps) {
  return (
    <div className="border border-dashed border-[#E4E4E7] rounded-xl p-16 text-center bg-[#FFFFFF]/40 max-w-lg mx-auto flex flex-col items-center justify-center space-y-4">
      {icon ? (
        <div className="text-[#09090B]/30">{icon}</div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#09090B]/40 font-serif text-lg">
          ✦
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-light tracking-tight text-[#09090B]">
          {title}
        </h3>
        <p className="font-sans text-xs text-[#09090B]/50 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {(actionLabel && (actionHref || onActionClick)) && (
        <div className="pt-2">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary" size="sm">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="primary" size="sm" onClick={onActionClick}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
