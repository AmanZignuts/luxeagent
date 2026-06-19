"use client";

import React, { useState, useEffect } from "react";
import { OCCASION_META } from "./occasion-meta";
import { ShowcaseProductCard } from "./ShowcaseProductCard";
import type { Product, ShowcaseGridVariant } from "./types";

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
  const [displayLimit, setDisplayLimit] = useState(6);

  useEffect(() => {
    setDisplayLimit(6);
  }, [products, query, occasion]);

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
            : `${Math.min(displayLimit, products.length)} of ${totalFound ?? products.length} pieces`}
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
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.slice(0, displayLimit).map((product) => (
              <ShowcaseProductCard
                key={product.id}
                product={product}
                append={append}
              />
            ))}
          </div>
          {products.length > displayLimit ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 6)}
                className="font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet/55 hover:text-obsidian-velvet border border-muted-zinc px-4 py-2 rounded-full bg-surface-white cursor-pointer transition-colors"
              >
                ✦ Show more (+{products.length - displayLimit} remaining)
              </button>
            </div>
          ) : (
            totalFound !== undefined && totalFound > products.length && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() =>
                    append({
                      role: "user",
                      content: `Show me more products for "${headline?.replace(/"/g, '') || query || ''}"`,
                    })
                  }
                  className="font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet/55 hover:text-obsidian-velvet border border-muted-zinc px-4 py-2 rounded-full bg-surface-white cursor-pointer transition-colors"
                >
                  ✦ Search more pieces
                </button>
              </div>
            )
          )}
        </>
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
