"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBag } from "@/app/(customer)/BagContext";

export function SizePicker({
  productId,
  title,
  sku,
  price,
  imageUrl,
  category,
  stockBySize,
  availableSizes,
  onBack,
}: {
  productId: string;
  title: string;
  sku: string;
  price: number;
  imageUrl?: string;
  category?: string;
  stockBySize: Record<string, number>;
  availableSizes: { size: string; qty: number }[];
  totalStock: number;
  isLowStock: boolean;
  onBack?: () => void;
}) {
  const { addToBag, setIsBagDrawerOpen } = useBag();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToBag = () => {
    if (!selectedSize) return;
    const qtyAvailable = stockBySize[selectedSize] ?? 0;
    if (qtyAvailable <= 0) return;

    addToBag({
      id: productId,
      sku,
      title,
      price,
      size: selectedSize,
      material: "Atelier Sourced Fiber",
      category: category ?? "Ready-to-Wear",
      imageUrl: imageUrl ?? "",
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2500);

    toast.success(`Added to bag · ${title}`, {
      description: `Size ${selectedSize}`,
      action: {
        label: "Open bag",
        onClick: () => setIsBagDrawerOpen(true),
      },
    });
  };

  const sizeOptions =
    availableSizes.length > 0
      ? availableSizes.map((s) => s.size)
      : ["XS", "S", "M", "L", "XL"];

  return (
    <div className="w-full max-w-sm bg-surface-white border border-muted-zinc rounded-xl p-4 font-sans space-y-4">
      <div>
        <span className="text-[8px] font-bold tracking-widest text-obsidian-velvet/40 uppercase block">
          Real-Time Calibration Suite
        </span>
        <h3 className="font-serif text-sm font-semibold text-obsidian-velvet mt-1">
          {title}
        </h3>
        <span className="text-[8.5px] font-medium text-obsidian-velvet/50 mt-0.5 block">
          SKU: {sku}
        </span>
      </div>

      {/* Sizing grid */}
      <div className="space-y-2">
        <label className="block text-[8px] font-bold tracking-wider text-obsidian-velvet uppercase">
          Select Custom Size Fit
        </label>
        <div className="grid grid-cols-5 gap-2">
          {sizeOptions.map((size) => {
            const stock = stockBySize[size] ?? 0;
            const isAvailable = stock > 0;
            const isSelected = selectedSize === size;

            return (
              <button
                key={size}
                type="button"
                disabled={!isAvailable}
                onClick={() => setSelectedSize(size)}
                className={`h-10 border rounded flex flex-col justify-center items-center transition-all cursor-pointer relative ${
                  !isAvailable
                    ? "bg-zinc-50 border-muted-zinc/30 text-obsidian-velvet/20 cursor-not-allowed line-through"
                    : isSelected
                    ? "border-obsidian-velvet bg-obsidian-velvet text-surface-white ring-1 ring-obsidian-velvet"
                    : "border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet"
                }`}
              >
                <span className="text-[10px] font-bold leading-none">{size}</span>
                {isAvailable && (
                  <span
                    className={`text-[6px] mt-1 font-semibold leading-none ${
                      isSelected ? "text-white/70" : "text-obsidian-velvet/40"
                    }`}
                  >
                    {stock} left
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Low stock warning */}
      {selectedSize && (stockBySize[selectedSize] ?? 0) < 5 && (
        <div className="bg-red-50/50 border border-red-200/50 rounded p-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[8px] font-bold text-red-700 uppercase tracking-wide">
            Low Stock: Only {stockBySize[selectedSize]} pieces remaining in this size segment.
          </span>
        </div>
      )}

      {/* Add to Bag trigger */}
      <button
        type="button"
        disabled={!selectedSize || isAdded}
        onClick={handleAddToBag}
        className={`w-full font-sans font-bold text-[9px] uppercase tracking-wider rounded-md py-3 transition-all duration-200 border cursor-pointer text-center ${
          isAdded
            ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
            : !selectedSize
            ? "bg-warm-linen/30 border-muted-zinc/40 text-obsidian-velvet/30 cursor-not-allowed"
            : "bg-obsidian-velvet border-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90"
        }`}
      >
        {isAdded ? "Added to Curation Bag" : "Add Size Fit to Bag"}
      </button>

      {isAdded && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet/55 hover:text-obsidian-velvet border border-muted-zinc rounded-md py-2.5 transition-colors cursor-pointer bg-surface-white"
        >
          Choose another piece
        </button>
      )}
    </div>
  );
}
