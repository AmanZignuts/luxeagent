"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useBag } from "@/app/(customer)/BagContext";
import { OCCASION_META } from "./occasion-meta";
import type { Product, ShowcaseGridVariant } from "./types";

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
            <div className="flex flex-wrap gap-1 mt-1">
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

export function ShowcaseProductGrid({
  products,
  append,
  onOpenSizes,
  variant,
  query,
  occasion,
  imageDescription,
  emptyMessage,
  appliedFiltersLabel,
  totalFound,
  appliedFilters,
}: {
  products: Product[];
  append: (message: { role: "user"; content: string }) => void;
  onOpenSizes?: (product: Product) => void;
  variant: ShowcaseGridVariant;
  query?: string;
  occasion?: string;
  imageDescription?: string;
  emptyMessage?: string;
  appliedFiltersLabel?: string;
  totalFound?: number;
  appliedFilters?: {
    category?: string;
    priceMin?: number | null;
    priceMax?: number | null;
    gender?: string;
  };
}) {
  const occasionKey = occasion?.toLowerCase() ?? "";
  const occasionMeta = OCCASION_META[occasionKey] ?? {
    emoji: "✦",
    palette: "Curated",
    description: "Hand-picked for your occasion.",
  };

  const label =
    variant === "catalog"
      ? "Curated Selection"
      : variant === "personalized"
        ? "Personalized Selection"
        : variant === "occasion"
          ? "Occasion Curation"
          : "Visual Search";

  const headline =
    query != null && query.length > 0
      ? `"${query}"`
      : variant === "occasion" && occasion
        ? `"${occasion.charAt(0).toUpperCase() + occasion.slice(1)}"`
        : variant === "visual"
          ? '"Visual matches"'
          : variant === "personalized"
            ? '"Curated for you"'
            : undefined;

  const filtersLine =
    appliedFiltersLabel ??
    (variant === "occasion" && occasion
      ? `${occasionMeta.palette} · ${occasionMeta.description}`
      : variant === "visual" && imageDescription
        ? imageDescription
        : undefined);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-1">
            {label}
          </span>
          {headline && (
            <h3 className="font-serif text-lg font-light text-obsidian-velvet/80 tracking-tight line-clamp-2">
              {headline}
            </h3>
          )}
          {filtersLine && products.length > 0 && (
            <p className="font-sans text-[9px] text-obsidian-velvet/40 uppercase tracking-wide mt-1.5 line-clamp-2">
              {variant === "occasion" || variant === "visual"
                ? filtersLine
                : `Filters: ${filtersLine}`}
            </p>
          )}
        </div>
        <span className="font-sans text-[8px] font-bold text-obsidian-velvet/30 uppercase tracking-wider flex-shrink-0 pt-1">
          {products.length === 0
            ? "No matches"
            : totalFound !== undefined && totalFound > products.length
              ? `${products.length} of ${totalFound} pieces`
              : `${products.length} pieces`}
        </span>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-muted-zinc bg-warm-linen/20 px-6 py-10 text-center max-w-lg">
          <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/35 block mb-2">
            No exact matches
          </span>
          <p className="font-serif text-base font-light text-obsidian-velvet/75 leading-relaxed">
            {emptyMessage ??
              "Nothing in our catalog matches those criteria. Try a different category or budget."}
          </p>
          {query && (
            <p className="font-sans text-[10px] text-obsidian-velvet/40 mt-3 italic">
              &ldquo;{query}&rdquo;
            </p>
          )}
          <button
            type="button"
            onClick={() =>
              append({
                role: "user",
                content: "What dresses do you have closest to my budget?",
              })
            }
            className="mt-5 font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet/55 hover:text-obsidian-velvet border border-muted-zinc px-4 py-2 rounded-full bg-surface-white cursor-pointer transition-colors"
          >
            Suggest nearest options
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {products.map((product) => (
            <ShowcaseProductCard
              key={product.id}
              product={product}
              append={append}
            />
          ))}
        </div>
      )}

      {variant === "catalog" && totalFound !== undefined && totalFound > products.length && (
        <div className="pt-2">
          <Link
            href={(() => {
              const params = new URLSearchParams();
              if (query) params.set("q", query);
              if (appliedFilters) {
                if (appliedFilters.category) params.set("cat", appliedFilters.category);
                if (appliedFilters.priceMin !== undefined && appliedFilters.priceMin !== null) params.set("priceMin", String(appliedFilters.priceMin));
                if (appliedFilters.priceMax !== undefined && appliedFilters.priceMax !== null) params.set("priceMax", String(appliedFilters.priceMax));
                if (appliedFilters.gender) params.set("gender", appliedFilters.gender);
              }
              return `/shop/catalog?${params.toString()}`;
            })()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/55 hover:text-obsidian-velvet font-sans font-bold text-[8px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all cursor-pointer bg-surface-white/60 hover:shadow-sm"
          >
            See More in Catalog ({totalFound - products.length} more pieces)
          </Link>
        </div>
      )}

      {variant === "occasion" && occasion && (
        <button
          type="button"
          onClick={() =>
            append({
              role: "user",
              content: `Show me more ${occasion} outfit ideas`,
            })
          }
          className="w-full max-w-xs border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/55 hover:text-obsidian-velvet font-sans font-bold text-[8px] uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer bg-surface-white/60"
        >
          More {occasion} picks
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT 2: SizePicker
// ─────────────────────────────────────────────────────────────────────

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
  const meta = OCCASION_META[occasion.toLowerCase()] ?? { emoji: "✦", palette: "Curated", description: "Hand-picked for your occasion." };

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
          className="w-full border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/50 hover:text-obsidian-velvet font-sans font-bold text-[8px] uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer text-center bg-transparent"
        >
          Refine Visual Search
        </button>
      </div>
    </div>
  );
}
