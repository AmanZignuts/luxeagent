"use client";

import React from "react";
import { useBag } from "@/app/(customer)/BagContext";

interface LookItem {
  id: string;
  sku: string;
  title: string;
  price: number;
  category: string;
  imageUrl?: string;
}

interface ProductOverviewModalProps {
  product: LookItem | null;
  onClose: () => void;
}

export function ProductOverviewModal({ product, onClose }: ProductOverviewModalProps) {
  const { addToBag } = useBag();

  if (!product) return null;

  const handleAddProductToBag = () => {
    addToBag({
      id: product.id,
      sku: product.sku,
      title: product.title,
      price: product.price,
      size: "M",
      material: "Atelier Sourced Fiber",
      category: product.category,
      imageUrl: product.imageUrl
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center animate-in fade-in duration-250">
      <div className="bg-surface-white border border-muted-zinc rounded-xl overflow-hidden shadow-2xl flex flex-col max-w-sm w-full mx-4 aspect-[3/4] animate-in zoom-in-95 duration-200 relative">
        
        {/* Top Left Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-surface-white/85 backdrop-blur-sm border border-muted-zinc/40 text-obsidian-velvet hover:bg-surface-white flex items-center justify-center font-bold transition-all cursor-pointer z-50 text-xs shadow-sm hover:scale-105 active:scale-95"
          title="Close overview"
        >
          ✕
        </button>

        {/* Top Right Wishlist Icon */}
        <button
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-white/85 backdrop-blur-sm border border-muted-zinc/40 text-obsidian-velvet hover:bg-surface-white flex items-center justify-center transition-all cursor-pointer z-50 text-sm shadow-sm hover:scale-105 active:scale-95"
          title="Add to wishlist"
        >
          ♡
        </button>

        {/* Image Curation Container */}
        <div className="flex-grow w-full h-full relative bg-warm-linen/10 overflow-hidden">
          <img
            src={product.imageUrl || "/product_overshirt.png"}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Bottom White Footer Bar */}
        <div className="bg-surface-white p-5 border-t border-muted-zinc/30 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-serif text-sm font-semibold text-obsidian-velvet truncate flex-1 leading-tight">
              {product.title}
            </h4>
            <span className="font-sans text-sm font-bold text-obsidian-velvet flex-shrink-0">
              ${product.price}
            </span>
          </div>

          <button
            onClick={handleAddProductToBag}
            className="w-full bg-obsidian-velvet hover:bg-obsidian-velvet/90 text-surface-white font-sans font-semibold text-xs tracking-wider uppercase py-3.5 rounded transition-all active:scale-[0.98] cursor-pointer shadow-md text-center border-none"
          >
            ADD TO BAG
          </button>
        </div>

      </div>
    </div>
  );
}
