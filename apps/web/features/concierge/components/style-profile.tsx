"use client";

export function StyleProfileComponent({
  displayName,
  styleTokens,
  preferredSize,
  budgetMin,
  budgetMax,
}: {
  displayName?: string;
  styleTokens: string[];
  preferredSize?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredColors?: string[];
  preferredCategories?: string[];
}) {
  return (
    <div className="w-full max-w-sm bg-surface-white border border-muted-zinc rounded-xl p-4 font-sans space-y-3">
      <div>
        <span className="text-[8px] font-bold tracking-widest text-obsidian-velvet/40 uppercase block">
          Client Persona Calibration
        </span>
        <h3 className="font-serif text-sm font-semibold text-obsidian-velvet mt-1">
          {displayName ? `${displayName}'s Style File` : "Style Calibration File"}
        </h3>
      </div>

      <div className="space-y-2 text-[9px] font-sans">
        {/* Style Tokens */}
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-obsidian-velvet/40 block">
            Aesthetic Core Badges:
          </span>
          <div className="flex flex-wrap gap-1">
            {styleTokens.map((t) => (
              <span
                key={t}
                className="bg-warm-linen border border-muted-zinc/80 px-2 py-0.5 rounded-sm font-bold text-obsidian-velvet uppercase tracking-wide"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Fit preferences */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <span className="font-bold uppercase tracking-wider text-obsidian-velvet/40 block">
              Sizing Calibration:
            </span>
            <span className="text-obsidian-velvet font-semibold mt-0.5 block">
              {preferredSize || "M (Default)"}
            </span>
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider text-obsidian-velvet/40 block">
              Budget Boundaries:
            </span>
            <span className="text-obsidian-velvet font-semibold mt-0.5 block">
              ${budgetMin ?? 0} — ${budgetMax ?? 10000}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
