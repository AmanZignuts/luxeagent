"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ShowcaseState } from "../types";
import { StagedLookItem } from "../components";

interface UseOutfitSwapProps {
  showcase: ShowcaseState;
  setShowcase: React.Dispatch<React.SetStateAction<ShowcaseState>>;
  showcaseRef: React.MutableRefObject<ShowcaseState>;
}

export function useOutfitSwap({
  showcase,
  setShowcase,
  showcaseRef,
}: UseOutfitSwapProps) {
  const [swappingOutfitSku, setSwappingOutfitSku] = useState<string | null>(null);

  const swapOutfitPiece = useCallback(async (item: StagedLookItem) => {
    const current = showcaseRef.current;
    if (current.kind !== "outfit_builder") return;

    setSwappingOutfitSku(item.sku);
    try {
      const otherTotal = current.look
        .filter((i) => i.category !== item.category)
        .reduce((sum, i) => sum + i.price, 0);

      const res = await fetch("/api/outfit/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: item.category,
          occasion: current.occasion,
          colorPalette: current.colorPalette,
          excludeSkus: current.look.map((i) => i.sku),
          totalBudgetMax: current.totalBudgetMax ?? null,
          otherItemsTotal: otherTotal,
        }),
      });
      const data = await res.json();

      if (data.type !== "outfit_slot" || !data.item) {
        toast.error("No other option for this slot with your current filters.");
        return;
      }

      // Pre-fetch available sizes for the new item before completing the swap transition
      const invRes = await fetch(`/api/inventory?sku=${encodeURIComponent(data.item.sku)}`);
      const invData = await invRes.json();
      if (invData.type !== "size_picker" || !invData.availableSizes) {
        throw new Error("Inventory sizes unavailable for this suggestion.");
      }
      const availableSizes = invData.availableSizes.map((s: any) => s.size);

      setShowcase((prev) => {
        if (prev.kind !== "outfit_builder") return prev;
        const newLook = prev.look.map((i) =>
          i.category === item.category
            ? {
                id: data.item.id,
                title: data.item.title,
                sku: data.item.sku,
                price: data.item.price,
                category: data.item.category,
                imageUrl: data.item.imageUrl,
                colors: data.item.colors ?? [],
                sizes: availableSizes,
                brand: data.item.brand,
              }
            : i
        );
        return {
          ...prev,
          look: newLook,
          totalPrice: newLook.reduce((s, i) => s + i.price, 0),
        };
      });
      toast.success("Suggested another piece for this slot.");
    } catch {
      toast.error("Could not refresh this slot. Try again.");
    } finally {
      setSwappingOutfitSku(null);
    }
  }, [setShowcase, showcaseRef]);

  return {
    swappingOutfitSku,
    swapOutfitPiece,
  };
}
