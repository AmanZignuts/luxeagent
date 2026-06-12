"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Tooltip } from "react-tooltip";
import { toast } from "sonner";
import { useBag } from "@/app/(customer)/BagContext";
import type { StagedLookItem } from "./types";
import "react-tooltip/dist/react-tooltip.css";

export function OutfitBuilder({
  occasion,
  colorPalette,
  look,
  totalPrice,
  totalBudgetMax,
  emptyMessage,
  onSwapItem,
  swappingSku,
}: {
  occasion: string;
  colorPalette?: string;
  look: StagedLookItem[];
  totalPrice: number;
  totalBudgetMax?: number | null;
  emptyMessage?: string;
  onOpenSizes?: (item: StagedLookItem) => void;
  onSwapItem?: (item: StagedLookItem) => void;
  swappingSku?: string | null;
}) {
  const { addToBag } = useBag();
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [allAdded, setAllAdded] = useState(false);
  const [addingAll, setAddingAll] = useState(false);

  // Database available sizes state
  const [dbSizes, setDbSizes] = useState<Record<string, string[]>>({});
  const [loadingSizes, setLoadingSizes] = useState<Record<string, boolean>>({});
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  // Keep track of fetched IDs to avoid redundant calls
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Clean up states for removed items
    const currentIds = new Set(look.map((i) => i.id));
    fetchedIdsRef.current.forEach((id) => {
      if (!currentIds.has(id)) {
        fetchedIdsRef.current.delete(id);
        setDbSizes((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setSelectedSizes((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });

    look.forEach((item) => {
      // If sizes for this item are already loaded, loading, or fetched, skip!
      if (fetchedIdsRef.current.has(item.id)) {
        return;
      }

      fetchedIdsRef.current.add(item.id);
      setLoadingSizes((prev) => ({ ...prev, [item.id]: true }));

      fetch(`/api/inventory?sku=${encodeURIComponent(item.sku)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.type === "size_picker" && data.availableSizes) {
            const sizes = data.availableSizes.map((s: any) => s.size);
            setDbSizes((prev) => ({ ...prev, [item.id]: sizes }));
            if (sizes.length > 0) {
              setSelectedSizes((prev) => ({ ...prev, [item.id]: sizes[0] }));
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load inventory for " + item.sku, err);
          setDbSizes((prev) => ({ ...prev, [item.id]: [] }));
        })
        .finally(() => {
          setLoadingSizes((prev) => ({ ...prev, [item.id]: false }));
        });
    });
  }, [look]);

  const CATEGORY_LABELS: Record<string, string> = {
    tops: "Top",
    trousers: "Bottom",
    outerwear: "Layer",
    accessories: "Accessory",
    dresses: "Dress",
    footwear: "Footwear",
  };

  const CATEGORY_ICONS: Record<string, ReactNode> = {
    tops: (
      <svg className="w-4.5 h-4.5 text-obsidian-velvet/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l3 5-3 2v11H6V10L3 8l3-5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3a3 3 0 0 0 6 0" />
      </svg>
    ),
    trousers: (
      <svg className="w-4.5 h-4.5 text-obsidian-velvet/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8v18l-4-3-4-3V3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
      </svg>
    ),
    outerwear: (
      <svg className="w-4.5 h-4.5 text-obsidian-velvet/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14v18H5V3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14 M9 3v18 M15 3v18" />
      </svg>
    ),
    accessories: (
      <svg className="w-4.5 h-4.5 text-obsidian-velvet/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    dresses: (
      <svg className="w-4.5 h-4.5 text-obsidian-velvet/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6l3 7-2 11H8L6 10l3-7z" />
      </svg>
    ),
    footwear: (
      <svg className="w-4.5 h-4.5 text-obsidian-velvet/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h18c-1-5-3-6-7-6h-3L7 16H3v2z" />
      </svg>
    ),
  };

  const handleAddOne = (item: StagedLookItem) => {
    const size = selectedSizes[item.id];
    if (!size) {
      toast.error(`Please select a size for ${item.title} (or item is out of stock).`);
      return;
    }

    addToBag({
      id: item.id,
      sku: item.sku,
      title: item.title,
      price: item.price,
      size,
      material: "Atelier Sourced Fiber",
      category: item.category,
      imageUrl: item.imageUrl,
    });

    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    toast.success(`Added ${item.title} (${size}) to your bag.`);
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  const handleAddAll = async () => {
    setAddingAll(true);
    try {
      let addedCount = 0;
      for (const item of look) {
        const size = selectedSizes[item.id];
        if (!size) continue;
        addToBag({
          id: item.id,
          sku: item.sku,
          title: item.title,
          price: item.price,
          size,
          material: "Atelier Sourced Fiber",
          category: item.category,
          imageUrl: item.imageUrl,
        });
        addedCount += 1;
      }
      if (addedCount === 0) {
        toast.error("Please select available sizes for the pieces.");
        return;
      }
      setAllAdded(true);
      setTimeout(() => setAllAdded(false), 2500);
      toast.success(
        addedCount === look.length
          ? `Complete ${occasion} look added to your bag.`
          : `${addedCount} of ${look.length} pieces added.`,
        { description: "Open your bag from the header when you're ready." }
      );
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <div className="w-full bg-surface-white border border-muted-zinc rounded-2xl overflow-hidden font-sans shadow-none">
      {/* Header */}
      <div className="px-5 py-4 border-b border-muted-zinc/40 flex items-start justify-between">
        <div>
          <span className="text-[7.5px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block">
            Complete Look
          </span>
          <h3 className="font-serif text-base font-light text-obsidian-velvet mt-0.5 capitalize">
            The {occasion} Edit
          </h3>
          {colorPalette && (
            <span className="text-[8px] text-obsidian-velvet/40 font-semibold uppercase tracking-wide mt-0.5 block">
              Palette: {colorPalette}
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-[7.5px] font-bold uppercase tracking-wider text-obsidian-velvet/30 block">
            Total
            {totalBudgetMax != null && (
              <span className="font-normal text-obsidian-velvet/35">
                {" "}
                / ₹{totalBudgetMax.toLocaleString("en-IN")} max
              </span>
            )}
          </span>
          <span className="font-sans text-sm font-bold text-obsidian-velvet">
            ₹{totalPrice.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {emptyMessage && (
        <p className="px-5 py-2 font-sans text-[10px] text-obsidian-velvet/50 leading-relaxed border-b border-muted-zinc/30 bg-warm-linen/15">
          {emptyMessage}
        </p>
      )}
      {look.length > 0 && (
        <p className="px-5 py-2 font-sans text-[9px] text-obsidian-velvet/40 border-b border-muted-zinc/20">
          Select size inline & click <span className="font-bold uppercase tracking-wide">+</span> to add item ·{" "}
          <span className="font-bold uppercase tracking-wide">↻</span> refresh options
        </p>
      )}

      {/* Items */}
      <div className="divide-y divide-muted-zinc/30">
        {look.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/35 block mb-2">
              No pieces in budget
            </span>
            <p className="font-serif text-sm font-light text-obsidian-velvet/70 leading-relaxed">
              {emptyMessage ??
                "Nothing in our catalog fits this outfit budget. Try raising your limit."}
            </p>
          </div>
        ) : null}
        {look.map((item, idx) => {
          const isAdded = addedItems[item.id];
          const catKey = item.category?.toLowerCase().replace(/\s+/g, "");
          const sizesToRender = dbSizes[item.id] !== undefined ? dbSizes[item.id] : item.sizes;
          const isSizeLoading = sizesToRender === undefined || loadingSizes[item.id];

          return (
            <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-warm-linen/20 transition-colors group">
              {/* Step number + icon */}
              <div className="w-8 h-8 rounded-full border border-muted-zinc/60 flex items-center justify-center flex-shrink-0 bg-warm-linen/40">
                <span className="flex items-center justify-center">
                  {CATEGORY_ICONS[catKey ?? ""] ?? <span className="text-[10px] text-obsidian-velvet/40">{idx + 1}</span>}
                </span>
              </div>

              {/* Image */}
              <div className="w-10 h-12 rounded-lg bg-warm-linen/30 border border-muted-zinc/20 overflow-hidden flex-shrink-0">
                <img
                  src={item.imageUrl || "/product_overshirt.png"}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-[7px] font-bold uppercase tracking-widest text-obsidian-velvet/30 block">
                  {CATEGORY_LABELS[catKey ?? ""] ?? item.category}
                </span>
                <h4 className="font-serif text-[11px] font-semibold text-obsidian-velvet truncate leading-tight mt-0.5">
                  {item.title}
                </h4>
                <span className="text-[9px] font-bold text-obsidian-velvet/60 mt-0.5 block">
                  ₹{item.price.toLocaleString()}
                </span>

                {/* Inline size selector buttons */}
                <div className="h-[18px] mt-1.5 flex items-center">
                  {isSizeLoading ? null : sizesToRender.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sizesToRender.map((sz) => {
                        const currentSelected = selectedSizes[item.id] !== undefined
                          ? selectedSizes[item.id]
                          : (sizesToRender && sizesToRender.length > 0 ? sizesToRender[0] : undefined);
                        const isSelected = currentSelected === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            disabled={swappingSku === item.sku}
                            onClick={() => setSelectedSizes((prev) => ({ ...prev, [item.id]: sz }))}
                            className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border transition-all cursor-pointer h-[18px] flex items-center justify-center min-w-[24px] ${
                              isSelected
                                ? "bg-obsidian-velvet text-surface-white border-obsidian-velvet shadow-sm"
                                : "bg-surface-white text-obsidian-velvet/60 border-muted-zinc/60 hover:border-obsidian-velvet/40"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[8px] text-red-500 uppercase tracking-widest font-semibold block">Out of stock</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {onSwapItem && (
                  <button
                    type="button"
                    onClick={() => onSwapItem(item)}
                    disabled={swappingSku === item.sku}
                    className="w-7 h-7 rounded-full border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/45 hover:text-obsidian-velvet flex items-center justify-center text-[10px] cursor-pointer disabled:opacity-40 bg-surface-white"
                    data-tooltip-id="outfit-tooltip"
                    data-tooltip-content="Suggest another option"
                  >
                    {swappingSku === item.sku ? (
                      <svg className="animate-spin h-3.5 w-3.5 text-obsidian-velvet/60" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAddOne(item)}
                  className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                    isAdded
                      ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                      : "border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/50 hover:text-obsidian-velvet bg-surface-white"
                  }`}
                  data-tooltip-id="outfit-tooltip"
                  data-tooltip-content={isAdded ? "Added to styling bag" : "Add to styling bag"}
                >
                  {isAdded ? (
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
          );
        })}
      </div>

      {/* Add All CTA */}
      {look.length > 0 && (
      <div className="px-5 py-4 border-t border-muted-zinc/40 bg-warm-linen/20">
        <button
          type="button"
          onClick={handleAddAll}
          disabled={allAdded || addingAll}
          className={`w-full font-sans font-bold text-[9px] uppercase tracking-wider rounded-xl py-3 transition-all duration-200 cursor-pointer text-center border-none ${
            allAdded
              ? "bg-emerald-600 text-white"
              : "bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90 active:scale-[0.99]"
          }`}
        >
          {addingAll
            ? "Adding in-stock sizes…"
            : allAdded
              ? "✓ Complete Look Added to Bag"
              : "Add Complete Look to Bag"}
        </button>
      </div>
      )}
      <Tooltip id="outfit-tooltip" className="z-50" style={{ borderRadius: '6px', fontSize: '10px', padding: '6px 10px' }} />
    </div>
  );
}
