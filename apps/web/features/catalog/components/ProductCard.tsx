"use client";

import React from "react";
import Link from "next/link";
import { CatalogProduct } from "../CatalogShell";

export const ProductCard = React.memo(({ product }: { product: CatalogProduct }) => (
  <div
    className="w-full flex"
    style={{ transition: "transform 0.2s ease" }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
  >
    <Link
      href={`/pdp/${product.id}`}
      className="bg-surface-white border border-muted-zinc rounded-xl shadow-none hover:border-obsidian-velvet transition-colors duration-300 group flex flex-row gap-4 p-4 h-36 items-center sm:flex-col sm:justify-between sm:h-[400px] sm:p-6 w-full"
    >
      <div className="relative border border-muted-zinc/40 rounded-lg overflow-hidden h-28 w-28 shrink-0 sm:w-full sm:h-auto sm:flex-1 sm:min-h-[180px]">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full sm:h-auto sm:w-full sm:mt-0">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <span className="font-sans text-[9px] sm:text-[10px] tracking-widest uppercase text-obsidian-velvet/40 truncate w-full">
              {product.category} — {product.sku}
            </span>
            {!product.inStock ? (
              <span className="bg-red-50 border border-red-200 text-red-700 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold uppercase tracking-wider shrink-0">
                Out of Stock
              </span>
            ) : null}
          </div>
          <h3 className="font-serif text-sm sm:text-base font-semibold text-obsidian-velvet truncate w-full" title={product.title}>
            {product.title}
          </h3>
          <p className="font-sans text-[10px] sm:text-xs text-obsidian-velvet/50 truncate w-full">
            {product.material}
          </p>
          <div className="hidden sm:inline-block mt-2 bg-warm-linen/40 border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/60 uppercase">
            Sizes: {product.sizes?.length > 0 ? product.sizes.join(", ") : "M"}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 sm:mt-4">
          <span className="sm:hidden bg-warm-linen/40 border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/60 uppercase">
            Sizes: {product.sizes?.length > 0 ? product.sizes.slice(0, 3).join(",") + (product.sizes.length > 3 ? "..." : "") : "M"}
          </span>
          <span className="font-sans text-xs sm:text-sm font-bold text-obsidian-velvet">
            ₹{product.price}
          </span>
        </div>
      </div>
    </Link>
  </div>
));
ProductCard.displayName = "ProductCard";
