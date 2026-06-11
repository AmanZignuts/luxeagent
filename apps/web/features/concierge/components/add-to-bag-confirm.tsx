"use client";

import { useEffect, useRef } from "react";
import { useBag } from "@/app/(customer)/BagContext";

export function AddToBagConfirmComponent({
  item,
  message,
}: {
  item: {
    productId: string;
    sku: string;
    title: string;
    size: string;
    price: number;
    imageUrl?: string;
  };
  message: string;
}) {
  const { addToBag } = useBag();
  const addedRef = useRef(false);

  useEffect(() => {
    if (addedRef.current) return;
    addedRef.current = true;

    addToBag({
      id: item.productId,
      sku: item.sku,
      title: item.title,
      price: item.price,
      size: item.size,
      material: "Atelier Sourced Fiber",
      category: "Ready-to-Wear",
      imageUrl: item.imageUrl,
    });
  }, [addToBag, item]);

  return (
    <div className="w-full max-w-sm bg-surface-white border border-muted-zinc rounded-xl p-3.5 font-sans space-y-3 shadow-none">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-[9px] font-bold tracking-wider text-emerald-700 uppercase">
          Calibration Confirmed
        </span>
      </div>

      <div className="flex items-center gap-3 bg-emerald-50/20 border border-emerald-100/50 rounded-lg p-2.5">
        {item.imageUrl && (
          <div className="w-8 h-10 bg-warm-linen/30 border border-muted-zinc/20 rounded overflow-hidden flex-shrink-0">
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-serif text-[10px] font-semibold text-obsidian-velvet truncate">
            {item.title}
          </h4>
          <span className="text-[7.5px] font-bold uppercase text-obsidian-velvet/40 tracking-wider block mt-0.5">
            Size: {item.size} — SKU: {item.sku}
          </span>
          <span className="text-[9px] font-bold text-obsidian-velvet block mt-1">
            ${item.price}
          </span>
        </div>
      </div>

      <p className="text-[8px] font-semibold text-obsidian-velvet/50 italic leading-snug">
        &quot;{message}&quot;
      </p>
    </div>
  );
}
