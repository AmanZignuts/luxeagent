"use client";

import React from "react";

interface CatalogSidebarProps {
  categories: string[];
  sizes: string[];
  localCats: string[];
  localSizes: string[];
  localInStockOnly: boolean;
  capitalize: (str: string) => string;
  onCategoryToggle: (cat: string) => void;
  onSizeToggle: (sz: string) => void;
  onInStockToggle: () => void;
  onUpdateParam: (updates: Record<string, string | string[] | null>) => void;
  localPriceMin: number | null;
  localPriceMax: number | null;
}

export function CatalogSidebar({
  categories,
  sizes,
  localCats,
  localSizes,
  localInStockOnly,
  capitalize,
  onCategoryToggle,
  onSizeToggle,
  onInStockToggle,
}: CatalogSidebarProps) {
  return (
    <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-[7.5rem] max-h-[calc(100vh-9.5rem)] overflow-y-auto pr-4 pb-10 space-y-6 select-none scrollbar-thin lg:border-r lg:border-muted-zinc/40">
      {categories.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">Category</span>
          <div className="space-y-1.5">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localCats.includes(cat)}
                  onChange={() => onCategoryToggle(cat)}
                  className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                />
                <span>{capitalize(cat)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-muted-zinc/40">
          <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">Standard Fit Size</span>
          <div className="grid grid-cols-2 gap-2">
            {sizes.map((sz) => (
              <label key={sz} className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSizes.includes(sz)}
                  onChange={() => onSizeToggle(sz)}
                  className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                />
                <span>Size {sz}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-muted-zinc/40">
        <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">Availability</span>
        <label className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
          <input
            type="checkbox"
            checked={localInStockOnly}
            onChange={onInStockToggle}
            className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </aside>
  );
}
