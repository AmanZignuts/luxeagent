"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBag } from "@/app/(customer)/BagContext";
import type { StagedLookItem } from "./types";

export function LookBook({
  occasion,
  colorPalette,
  look,
  totalPrice,
}: {
  occasion: string;
  colorPalette?: string;
  look: StagedLookItem[];
  totalPrice: number;
}) {
  const { addToBag, setIsBagDrawerOpen } = useBag();
  const [dispatched, setDispatched] = useState(false);

  const handleDispatchOutfit = () => {
    look.forEach((item) => {
      addToBag({
        id: item.id,
        sku: item.sku,
        title: item.title,
        price: item.price,
        size: "M", // Default
        material: "Bespoke Curation Fiber",
        category: item.category,
        imageUrl: item.imageUrl,
      });
    });

    setDispatched(true);
    setTimeout(() => setDispatched(false), 2500);

    toast.success(`${occasion} look added to your bag.`, {
      action: {
        label: "Open bag",
        onClick: () => setIsBagDrawerOpen(true),
      },
    });
  };

  return (
    <div className="w-full max-w-md bg-surface-white border border-muted-zinc rounded-xl p-4 font-sans space-y-4 shadow-none">
      <div className="flex justify-between items-start border-b border-muted-zinc/40 pb-3">
        <div>
          <span className="text-[8px] font-bold tracking-widest text-obsidian-velvet/40 uppercase block">
            Generative Editorial Staging
          </span>
          <h3 className="font-serif text-sm font-semibold text-obsidian-velvet mt-1 capitalize">
            The {occasion} Staged Look
          </h3>
          {colorPalette && (
            <span className="text-[8px] font-semibold text-obsidian-velvet/50 uppercase tracking-wide mt-0.5 block">
              Palette: {colorPalette}
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-[8px] font-bold text-obsidian-velvet/40 uppercase block">
            Look Price
          </span>
          <span className="text-[12px] font-bold text-obsidian-velvet">
            ${totalPrice}
          </span>
        </div>
      </div>

      {/* Grid of staged items */}
      <div className="grid grid-cols-2 gap-3">
        {look.map((item) => (
          <div
            key={item.id}
            className="border border-muted-zinc/60 rounded-lg p-2 flex items-center gap-3 bg-warm-linen/10"
          >
            {/* Small image preview */}
            <div className="w-10 h-12 bg-warm-linen/30 border border-muted-zinc/30 rounded overflow-hidden flex-shrink-0">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Metadata */}
            <div className="min-w-0 flex-1">
              <h4 className="font-serif text-[8.5px] font-bold text-obsidian-velvet truncate">
                {item.title}
              </h4>
              <span className="text-[7px] font-bold uppercase text-obsidian-velvet/40 tracking-wider mt-0.5 block truncate">
                {item.category}
              </span>
              <span className="text-[8px] font-bold text-obsidian-velvet mt-1 block">
                ${item.price}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dispatch Action button */}
      <button
        type="button"
        disabled={dispatched}
        onClick={handleDispatchOutfit}
        className={`w-full font-sans font-bold text-[9px] uppercase tracking-wider rounded-md py-3 transition-all duration-200 border cursor-pointer text-center ${
          dispatched
            ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
            : "bg-obsidian-velvet border-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90"
        }`}
      >
        {dispatched ? "Outfit Coordinates Dispatched" : "Dispatch Look Coordinates to Bag"}
      </button>
    </div>
  );
}
