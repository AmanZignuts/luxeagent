"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBag } from "@/app/(customer)/BagContext";
import type { ComparisonProduct } from "./types";

export function ProductComparisonCard({
  productA,
  productB,
}: {
  productA: ComparisonProduct;
  productB: ComparisonProduct;
  append: (message: { role: "user"; content: string }) => void;
}) {
  const { addToBag } = useBag();
  const [picked, setPicked] = useState<"A" | "B" | null>(null);

  const ATTRIBUTES = [
    { label: "Price", aVal: `₹${productA.price.toLocaleString()}`, bVal: `₹${productB.price.toLocaleString()}` },
    { label: "Category", aVal: productA.category, bVal: productB.category },
    { label: "Brand", aVal: productA.brand, bVal: productB.brand },
    { label: "Material", aVal: productA.material ?? "—", bVal: productB.material ?? "—" },
    { label: "Colors", aVal: productA.colors.slice(0, 2).join(", ") || "—", bVal: productB.colors.slice(0, 2).join(", ") || "—" },
    { label: "Sizes", aVal: productA.sizes.join(", ") || "—", bVal: productB.sizes.join(", ") || "—" },
  ];

  const handlePick = (product: ComparisonProduct, side: "A" | "B") => {
    addToBag({
      id: product.id,
      sku: product.sku,
      title: product.title,
      price: product.price,
      size: product.sizes?.[0] ?? "M",
      material: product.material ?? "Atelier Sourced Fiber",
      category: product.category,
      imageUrl: product.imageUrl,
    });
    setPicked(side);
    toast.success(`Added ${product.title} to your bag.`);
  };

  return (
    <div className="w-full bg-surface-white border border-muted-zinc rounded-2xl overflow-hidden font-sans">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-muted-zinc/40 bg-warm-linen/20">
        <span className="text-[7.5px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block">
          Side-by-Side Comparison
        </span>
        <h3 className="font-serif text-sm font-light text-obsidian-velvet mt-0.5">
          Which speaks to you?
        </h3>
      </div>

      {/* Images */}
      <div className="grid grid-cols-2 divide-x divide-muted-zinc/40">
        {[{ p: productA, side: "A" as const }, { p: productB, side: "B" as const }].map(({ p, side }) => (
          <div key={p.id} className={`relative transition-all duration-300 ${picked === side ? "ring-2 ring-inset ring-obsidian-velvet" : ""}`}>
            <div className="aspect-[3/4] relative overflow-hidden bg-warm-linen/20">
              <img
                src={p.imageUrl || "/product_overshirt.png"}
                alt={p.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {picked === side && (
                <div className="absolute inset-0 bg-obsidian-velvet/10 flex items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-obsidian-velvet text-surface-white flex items-center justify-center text-sm font-bold">✓</span>
                </div>
              )}
            </div>
            <div className="px-3 py-2.5">
              <span className="text-[7px] font-bold uppercase tracking-widest text-obsidian-velvet/30 block">{p.brand}</span>
              <h4 className="font-serif text-[10px] font-semibold text-obsidian-velvet line-clamp-2 leading-tight mt-0.5">{p.title}</h4>
              <span className="font-sans text-[10px] font-bold text-obsidian-velvet mt-1 block">₹{p.price.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Attributes Table */}
      <div className="border-t border-muted-zinc/40 divide-y divide-muted-zinc/20">
        {ATTRIBUTES.map((attr) => (
          <div key={attr.label} className="grid grid-cols-[1fr_80px_1fr] items-center text-[8.5px] font-sans">
            <span className="px-3 py-2 text-obsidian-velvet/70 font-semibold">{attr.aVal}</span>
            <span className="text-center text-[7.5px] font-bold uppercase tracking-wider text-obsidian-velvet/30 border-x border-muted-zinc/20 py-2">
              {attr.label}
            </span>
            <span className="px-3 py-2 text-obsidian-velvet/70 font-semibold text-right">{attr.bVal}</span>
          </div>
        ))}
      </div>

      {/* Pick Buttons */}
      <div className="grid grid-cols-2 divide-x divide-muted-zinc/40 border-t border-muted-zinc/40">
        {[{ p: productA, side: "A" as const, label: "Choose A" }, { p: productB, side: "B" as const, label: "Choose B" }].map(({ p, side, label }) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePick(p, side)}
            disabled={!!picked}
            className={`py-3 font-sans font-bold text-[8px] uppercase tracking-wider transition-all cursor-pointer border-none ${
              picked === side
                ? "bg-obsidian-velvet text-surface-white"
                : picked
                ? "bg-warm-linen/20 text-obsidian-velvet/30 cursor-not-allowed"
                : "bg-surface-white text-obsidian-velvet hover:bg-warm-linen/30"
            }`}
          >
            {picked === side ? "✓ Selected" : label}
          </button>
        ))}
      </div>
    </div>
  );
}
