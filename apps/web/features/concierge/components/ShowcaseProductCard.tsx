"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useBag } from "@/app/(customer)/BagContext";
import type { Product } from "./types";

export function ShowcaseProductCard({
  product,
  append,
}: {
  product: Product;
  append: (message: { role: "user"; content: string }) => void;
}) {
  const { addToBag } = useBag();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const stockMap = product.stockBySize || {};
  const availableSizes = product.sizes.filter((size) => {
    if (Object.keys(stockMap).length > 0) {
      return (stockMap[size] ?? 0) > 0;
    }
    return true;
  });

  const isOutOfStock = availableSizes.length === 0;

  // Auto-select size if there's only one size available
  useEffect(() => {
    if (availableSizes.length === 1) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size first.");
      return;
    }

    addToBag({
      id: product.id,
      sku: product.sku,
      title: product.title,
      price: product.price,
      size: selectedSize,
      material: "Atelier Sourced Fiber",
      category: product.category,
      imageUrl: product.imageUrl,
    });

    setAdded(true);
    toast.success(`Added ${product.title} (${selectedSize}) to your bag.`);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group w-full bg-surface-white border border-muted-zinc/80 hover:border-obsidian-velvet/50 rounded-lg overflow-hidden transition-all duration-300 flex flex-col shadow-sm">
      <div className="relative aspect-[4/5] bg-warm-linen/30 overflow-hidden">
        <img
          src={product.imageUrl || "/product_overshirt.png"}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="p-3 flex flex-col flex-1">
        <span className="font-sans text-[7px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block truncate">
          {product.brand}
        </span>
        <h4 className="font-serif text-[11px] font-medium text-obsidian-velvet leading-snug line-clamp-2 mt-0.5">
          {product.title}
        </h4>

        {/* Inline Size Selector */}
        <div className="my-2.5 flex-1">
          {isOutOfStock ? (
            <span className="text-[7.5px] text-red-500 uppercase tracking-widest font-bold block mt-1">
              Out of stock
            </span>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex flex-wrap gap-1">
                {availableSizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  const qtyLeft = stockMap[sz];
                  const isLow = qtyLeft !== undefined && qtyLeft > 0 && qtyLeft < 5;
                  
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-obsidian-velvet text-surface-white border-obsidian-velvet shadow-sm"
                          : "bg-surface-white text-obsidian-velvet/60 border-muted-zinc/60 hover:border-obsidian-velvet/40"
                      }`}
                      title={isLow ? `${qtyLeft} left` : undefined}
                    >
                      {sz}
                      {isLow && <span className="text-[6px] text-amber-500 ml-0.5 font-sans">*</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-muted-zinc/20 gap-2">
          <span className="font-sans text-[11px] font-bold text-obsidian-velvet">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || !selectedSize}
              title={isOutOfStock ? "Out of stock" : !selectedSize ? "Select a size" : "Add to bag"}
              className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer text-[11px] font-bold ${
                isOutOfStock || !selectedSize
                  ? "border-muted-zinc bg-warm-linen/10 text-obsidian-velvet/20 cursor-not-allowed"
                  : added
                    ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                    : "border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/55 hover:text-obsidian-velvet bg-surface-white"
              }`}
            >
              {added ? (
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-2">
            {product.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="bg-warm-linen/80 border border-muted-zinc/25 px-1 py-px rounded text-[6px] font-medium uppercase text-obsidian-velvet/40"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
