"use client";

import React from "react";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  categories: string[];
  sizes: string[];
  pendingCategories: string[];
  pendingSizes: string[];
  pendingInStockOnly: boolean;
  capitalize: (str: string) => string;
  onClose: () => void;
  onApply: () => void;
  onClearPending: () => void;
  onPendingCategoryToggle: (cat: string) => void;
  onPendingSizeToggle: (sz: string) => void;
  onPendingInStockToggle: () => void;
}

export function MobileFilterDrawer({
  isOpen,
  categories,
  sizes,
  pendingCategories,
  pendingSizes,
  pendingInStockOnly,
  capitalize,
  onClose,
  onApply,
  onClearPending,
  onPendingCategoryToggle,
  onPendingSizeToggle,
  onPendingInStockToggle,
}: MobileFilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="lg:hidden fixed inset-0 bg-obsidian-velvet/10 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
      />
      <div className="lg:hidden fixed left-0 top-0 h-full w-80 max-w-full bg-surface-white border-r border-muted-zinc z-50 p-6 flex flex-col justify-between shadow-lg animate-in slide-in-from-left duration-300">
        <div className="flex flex-col flex-1 overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-muted-zinc/60 pb-4 mb-5">
            <div>
              <span className="font-sans text-[9px] tracking-widest uppercase text-obsidian-velvet/40 block mb-0.5">Configure</span>
              <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">Filter Garments</h3>
            </div>
            <button type="button" onClick={onClose} className="w-6 h-6 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet flex items-center justify-center font-sans text-xs rounded transition-colors cursor-pointer">✕</button>
          </div>

          <div className="space-y-6">
            {categories.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">Category</span>
                <div className="space-y-1.5">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pendingCategories.includes(cat)}
                        onChange={() => onPendingCategoryToggle(cat)}
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
                        checked={pendingSizes.includes(sz)}
                        onChange={() => onPendingSizeToggle(sz)}
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
                  checked={pendingInStockOnly}
                  onChange={onPendingInStockToggle}
                  className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-muted-zinc/60 pt-4 space-y-2 bg-surface-white">
          <button type="button" onClick={onApply} className="w-full bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90 font-sans font-semibold text-xs rounded-md py-2.5 transition-colors cursor-pointer border-none">
            Apply Filters
          </button>
          <button type="button" onClick={onClearPending} className="w-full bg-surface-white border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet font-sans font-semibold text-xs rounded-md py-2.5 transition-colors cursor-pointer">
            Clear All Pending
          </button>
        </div>
      </div>
    </>
  );
}
