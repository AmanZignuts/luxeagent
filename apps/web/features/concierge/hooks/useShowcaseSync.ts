"use client";

import { useEffect } from "react";
import { ShowcaseState, SizePickerReturnState, canReturnFromSizePicker } from "../types";

interface UseShowcaseSyncProps {
  messages: any[];
  setShowcase: React.Dispatch<React.SetStateAction<ShowcaseState>>;
  pinSizePickerRef: React.MutableRefObject<boolean>;
  pinOutfitShowcaseRef: React.MutableRefObject<boolean>;
  pendingSizeReturnRef: React.MutableRefObject<SizePickerReturnState | null>;
  lastProcessedToolKeyRef: React.MutableRefObject<string | null>;
}

export function useShowcaseSync({
  messages,
  setShowcase,
  pinSizePickerRef,
  pinOutfitShowcaseRef,
  pendingSizeReturnRef,
  lastProcessedToolKeyRef,
}: UseShowcaseSyncProps) {
  useEffect(() => {
    if (pinSizePickerRef.current) return;
    if (pinOutfitShowcaseRef.current) return;

    if (messages.length <= 1) {
      if (lastProcessedToolKeyRef.current !== null) {
        lastProcessedToolKeyRef.current = null;
        setShowcase({ kind: "idle" });
      }
      return;
    }

    const latestMessage = messages[messages.length - 1];
    const hasActiveToolCall = latestMessage?.parts?.some(
      (p: any) =>
        (p.type === "dynamic-tool" || p.type?.startsWith("tool-")) &&
        p.state !== "output-available" &&
        p.state !== "done"
    );

    if (hasActiveToolCall) {
      if (lastProcessedToolKeyRef.current !== "thinking") {
        lastProcessedToolKeyRef.current = "thinking";
        setShowcase({ kind: "thinking" });
      }
      return;
    }

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const toolParts =
        msg.parts?.filter(
          (p: any) => p.type === "dynamic-tool" || p.type?.startsWith("tool-")
        ) || [];

      // Collect ALL completed product_carousel results from this message
      // so that multiple catalog_search calls in the same turn are merged.
      const carouselParts = toolParts.filter((p: any) => {
        if (p.state !== "output-available" && p.state !== "done") return false;
        return p.output?.type === "product_carousel";
      });

      if (carouselParts.length > 0) {
        // Use the index of the last carousel part as the dedup key
        const lastCarouselIdx = toolParts.lastIndexOf(
          carouselParts[carouselParts.length - 1]
        );
        const key = `${msg.id}-${lastCarouselIdx}`;
        if (lastProcessedToolKeyRef.current === key) return;
        lastProcessedToolKeyRef.current = key;

        // Merge all carousel products and sum totalFound
        const mergedProducts = carouselParts.flatMap(
          (p: any) => p.output.products ?? []
        );
        const mergedTotalFound = carouselParts.reduce(
          (sum: number, p: any) =>
            sum + (p.output.totalFound ?? (p.output.products?.length ?? 0)),
          0
        );
        const firstResult = (carouselParts[0] as any).output;

        setShowcase({
          kind: "product_carousel",
          products: mergedProducts,
          query: firstResult.query,
          emptyMessage: firstResult.emptyMessage,
          appliedFiltersLabel:
            carouselParts.length > 1 ? undefined : firstResult.appliedFilters?.label,
          totalFound: mergedTotalFound,
          appliedFilters: firstResult.appliedFilters,
        });
        return;
      }

      for (let j = toolParts.length - 1; j >= 0; j--) {
        const part = toolParts[j] as any;
        if (part.state !== "output-available" && part.state !== "done") continue;
        const result = part.output;
        if (!result) continue;
        if (result.type === "product_carousel") continue; // already handled above

        const key = `${msg.id}-${j}`;
        if (lastProcessedToolKeyRef.current === key) return;

        lastProcessedToolKeyRef.current = key;
        if (result.type === "personalized_carousel") {
          setShowcase({ kind: "personalized_carousel", products: result.products });
          return;
        }
        if (result.type === "size_picker") {
          setShowcase((prev) => {
            const returnTo =
              prev.kind === "size_picker" && prev.returnTo
                ? prev.returnTo
                : canReturnFromSizePicker(prev)
                ? prev
                : pendingSizeReturnRef.current ?? undefined;
            pendingSizeReturnRef.current = null;
            return {
              kind: "size_picker",
              productId: result.productId,
              title: result.title,
              sku: result.sku,
              price: prev.kind === "size_picker" ? prev.price : 0,
              imageUrl: prev.kind === "size_picker" ? prev.imageUrl : undefined,
              category: prev.kind === "size_picker" ? prev.category : undefined,
              stockBySize: result.stockBySize,
              availableSizes: result.availableSizes,
              totalStock: result.totalStock,
              isLowStock: result.isLowStock,
              returnTo,
            };
          });
          return;
        }
        if (result.type === "lookbook") {
          setShowcase({
            kind: "lookbook",
            occasion: result.occasion,
            colorPalette: result.colorPalette,
            look: result.look,
            totalPrice: result.totalPrice,
          });
          return;
        }
        if (result.type === "outfit_builder") {
          pinOutfitShowcaseRef.current = true;
          setShowcase({
            kind: "outfit_builder",
            occasion: result.occasion,
            colorPalette: result.colorPalette,
            look: result.look ?? [],
            totalPrice: result.totalPrice ?? 0,
            totalBudgetMax: result.totalBudgetMax,
            emptyMessage: result.emptyMessage,
          });
          return;
        }
        if (result.type === "product_comparison") {
          setShowcase({
            kind: "product_comparison",
            productA: result.productA,
            productB: result.productB,
          });
          return;
        }
        if (result.type === "image_search_result") {
          setShowcase({
            kind: "image_search_result",
            imageDescription: result.imageDescription,
            products: result.products,
          });
          return;
        }
        if (result.type === "occasion_recommendation") {
          setShowcase({
            kind: "occasion_recommendation",
            occasion: result.occasion,
            products: result.products,
          });
          return;
        }
        if (result.type === "order_status") {
          setShowcase({ kind: "order_status", orders: result.orders });
          return;
        }
        if (result.type === "add_to_bag_confirm") {
          setShowcase({ kind: "add_to_bag", item: result.item, message: result.message });
          return;
        }
        if (result.type === "style_profile") {
          setShowcase({
            kind: "style_profile",
            displayName: result.displayName,
            styleTokens: result.styleTokens,
            preferredSize: result.preferredSize,
            budgetMin: result.budgetMin,
            budgetMax: result.budgetMax,
            preferredColors: result.preferredColors,
            preferredCategories: result.preferredCategories,
          });
          return;
        }
      }
    }

    if (lastProcessedToolKeyRef.current !== null) {
      lastProcessedToolKeyRef.current = null;
    }
    setShowcase((prev) => (prev.kind === "thinking" ? { kind: "idle" } : prev));
  }, [messages, setShowcase, pinSizePickerRef, pinOutfitShowcaseRef, pendingSizeReturnRef, lastProcessedToolKeyRef]);
}
