"use client";

import { useState } from "react";
import { useBag } from "@/app/(customer)/BagContext";
import { OCCASION_META } from "./occasion-meta";
import type { Product } from "./types";

// Re-export extracted components for external consumer ease
export { ShowcaseProductCard } from "./ShowcaseProductCard";
export { ShowcaseProductGrid } from "./ShowcaseProductGrid";

export function ProductCarousel({
  products,
  append,
}: {
  products: Product[];
  append: (message: { role: "user"; content: string }) => void;
}) {
  return (
    <div className="w-full space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold tracking-widest text-obsidian-velvet/40 uppercase">
          Curated Catalog Coordinates
        </span>
        <span className="text-[8px] font-semibold text-obsidian-velvet/60">
          {products.length} items found
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 pr-2 scrollbar-thin">
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[200px] flex-shrink-0 bg-surface-white border border-muted-zinc rounded-xl p-3 flex flex-col justify-between hover:border-obsidian-velvet transition-all duration-300"
          >
            <div className="space-y-2">
              {/* Product Image */}
              <div className="relative aspect-[3/4] w-full bg-warm-linen/30 rounded-lg overflow-hidden border border-muted-zinc/20">
                <img
                  src={product.imageUrl || "/placeholder.png"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Brand & Price */}
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-bold tracking-wider uppercase text-obsidian-velvet/40 truncate max-w-[70%]">
                  {product.brand}
                </span>
                <span className="text-[10px] font-bold text-obsidian-velvet">
                  ${product.price}
                </span>
              </div>

              {/* Title */}
              <h4 className="font-serif text-[11px] font-semibold text-obsidian-velvet leading-tight line-clamp-1">
                {product.title}
              </h4>

              {/* Category & Tags */}
              <div className="flex flex-wrap gap-1">
                <span className="bg-warm-linen border border-muted-zinc/40 px-1.5 py-0.5 rounded-sm text-[7px] font-bold uppercase text-obsidian-velvet/60">
                  {product.category}
                </span>
                {product.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="bg-zinc-50 border border-muted-zinc/30 px-1.5 py-0.5 rounded-sm text-[7px] font-medium text-obsidian-velvet/50"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Check Stock Action */}
            <button
              type="button"
              onClick={() =>
                append({
                  role: "user",
                  content: `Check inventory and available sizes for SKU: ${product.sku}`,
                })
              }
              className="w-full mt-3 bg-obsidian-velvet hover:bg-obsidian-velvet/90 text-surface-white text-[8px] font-bold uppercase tracking-wider py-2 rounded-md transition-all active:scale-[0.99] cursor-pointer text-center"
            >
              Select Size & Stock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** @deprecated Use ShowcaseProductGrid variant="occasion" instead */
export function OccasionRecommendation({
  occasion,
  products,
  append,
}: {
  occasion: string;
  products: Product[];
  append: (message: { role: "user"; content: string }) => void;
}) {
  const { addToBag } = useBag();
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const meta = OCCASION_META[occasion.toLowerCase()] ?? {
    emoji: "✦",
    palette: "Curated",
    description: "Hand-picked for your occasion.",
  };

  const handleAdd = (product: Product) => {
    addToBag({
      id: product.id,
      sku: product.sku,
      title: product.title,
      price: product.price,
      size: product.sizes?.[0] ?? "M",
      material: "Atelier Sourced Fiber",
      category: product.category,
      imageUrl: product.imageUrl,
    });
    setAdded((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [product.id]: false })), 2000);
  };

  return (
    <div className="w-full bg-surface-white border border-muted-zinc rounded-2xl overflow-hidden font-sans">
      {/* Occasion Header */}
      <div className="px-5 py-4 bg-tint-champagne/30 border-b border-muted-zinc/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-muted-zinc bg-surface-white flex items-center justify-center text-sm flex-shrink-0">
            {meta.emoji}
          </div>
          <div>
            <span className="text-[7.5px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block">
              Occasion Curation
            </span>
            <h3 className="font-serif text-base font-light text-obsidian-velvet capitalize mt-0.5">
              {occasion}
            </h3>
            <span className="text-[8px] font-semibold text-obsidian-velvet/40 uppercase tracking-wide">
              {meta.palette}
            </span>
          </div>
        </div>
        <p className="font-sans text-[10px] text-obsidian-velvet/50 leading-relaxed mt-3">
          {meta.description}
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {products.slice(0, 6).map((product) => (
          <div
            key={product.id}
            className="border border-muted-zinc/60 rounded-xl overflow-hidden bg-warm-linen/10 group"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-warm-linen/20">
              <img
                src={product.imageUrl || "/product_overshirt.png"}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-400"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => handleAdd(product)}
                className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full border shadow-sm flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer ${
                  added[product.id]
                    ? "bg-emerald-500 border-emerald-300 text-white"
                    : "bg-surface-white border-muted-zinc text-obsidian-velvet hover:border-obsidian-velvet"
                }`}
              >
                {added[product.id] ? "✓" : "+"}
              </button>
            </div>
            <div className="px-2.5 py-2 space-y-0.5">
              <h4 className="font-serif text-[9.5px] font-semibold text-obsidian-velvet line-clamp-1 leading-tight">
                {product.title}
              </h4>
              <span className="font-sans text-[8.5px] font-bold text-obsidian-velvet/60">
                ₹{product.price.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* View More */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => append({ role: "user", content: `Show me more ${occasion} outfit ideas` })}
          className="w-full border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/60 hover:text-obsidian-velvet font-sans font-bold text-[8px] uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer text-center bg-transparent"
        >
          Show More {occasion} Picks
        </button>
      </div>
    </div>
  );
}

export function ImageSearchResult({
  imageDescription,
  products,
  append,
}: {
  imageDescription?: string;
  products: Product[];
  append: (message: { role: "user"; content: string }) => void;
}) {
  const { addToBag } = useBag();
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const handleAdd = (product: Product) => {
    addToBag({
      id: product.id,
      sku: product.sku,
      title: product.title,
      price: product.price,
      size: product.sizes?.[0] ?? "M",
      material: "Atelier Sourced Fiber",
      category: product.category,
      imageUrl: product.imageUrl,
    });
    setAdded((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [product.id]: false })), 2000);
  };

  return (
    <div className="w-full bg-surface-white border border-muted-zinc rounded-2xl overflow-hidden font-sans">
      {/* Header */}
      <div className="px-5 py-4 border-b border-muted-zinc/40">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full border border-muted-zinc bg-warm-linen/40 flex items-center justify-center text-[10px]">
            ◎
          </div>
          <span className="text-[7.5px] font-bold tracking-widest uppercase text-obsidian-velvet/30">
            Visual Search Results
          </span>
        </div>
        {imageDescription && (
          <p className="font-sans text-[9.5px] text-obsidian-velvet/50 leading-relaxed italic">
            Detected: {imageDescription}
          </p>
        )}
      </div>

      {/* Mosaic Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.slice(0, 6).map((product, idx) => {
          // Match score — simulated based on position
          const matchScore = Math.max(95 - idx * 7, 60);
          return (
            <div key={product.id} className="group relative border border-muted-zinc/50 rounded-xl overflow-hidden bg-warm-linen/10 hover:border-obsidian-velvet/60 transition-all">
              <div className="aspect-[3/4] relative overflow-hidden bg-warm-linen/20">
                <img
                  src={product.imageUrl || "/product_overshirt.png"}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-400"
                  loading="lazy"
                />
                {/* Match score badge */}
                <div className="absolute top-1.5 left-1.5 bg-obsidian-velvet/80 text-surface-white text-[6.5px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                  {matchScore}% match
                </div>
                {/* Add button */}
                <button
                  type="button"
                  onClick={() => handleAdd(product)}
                  className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full border shadow-sm flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer ${
                    added[product.id]
                      ? "bg-emerald-500 border-emerald-300 text-white"
                      : "bg-surface-white border-muted-zinc text-obsidian-velvet hover:border-obsidian-velvet"
                  }`}
                >
                  {added[product.id] ? "✓" : "+"}
                </button>
              </div>
              <div className="px-2.5 py-2">
                <h4 className="font-serif text-[9px] font-semibold text-obsidian-velvet line-clamp-1">
                  {product.title}
                </h4>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-sans text-[8.5px] font-bold text-obsidian-velvet/70">
                    ₹{product.price.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => append({ role: "user", content: `Check sizes for ${product.title} (SKU: ${product.sku})` })}
                    className="text-[7px] font-bold uppercase tracking-wide text-obsidian-velvet/40 hover:text-obsidian-velvet transition-colors border-none bg-transparent cursor-pointer"
                  >
                    Sizes
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Refine Search */}
      <div className="px-4 pb-4 pt-0">
        <button
          type="button"
          onClick={() => append({ role: "user", content: "Refine this visual search — show me similar items in a different color or style" })}
          className="w-full border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/55 hover:text-obsidian-velvet font-sans font-bold text-[8px] uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer text-center bg-transparent"
        >
          Refine Visual Search
        </button>
      </div>
    </div>
  );
}
