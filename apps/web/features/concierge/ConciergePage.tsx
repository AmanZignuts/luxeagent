"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, convertFileListToFileUIParts } from "ai";
import { toast } from "sonner";
import { isConciergeFollowUpMessage } from "@/lib/ai/concierge-followup";
import { useBag } from "@/app/(customer)/BagContext";
import {
  stagedLookItemToProduct,
  type Product,
  type StagedLookItem,
} from "@/features/concierge/components";
import { ConciergeBagDrawer } from "@/app/(ai)/concierge/ConciergeBagDrawer";
import { ChatPanel } from "./components/ChatPanel";
import { ShowcasePanel } from "./components/ShowcasePanel";
import { ShowcaseState, SizePickerReturnState, canReturnFromSizePicker } from "./types";

export default function ConciergePageV2() {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatId, setChatId] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  useEffect(() => {
    setChatId(crypto.randomUUID());
  }, []);
  const [input, setInput] = useState("");
  const [showcase, setShowcase] = useState<ShowcaseState>({ kind: "idle" });
  const [isMobileShowcaseOpen, setIsMobileShowcaseOpen] = useState(false);

  useEffect(() => {
    if (showcase.kind !== "idle" && showcase.kind !== "thinking") {
      setIsMobileShowcaseOpen(true);
    }
  }, [showcase]);

  const showcaseRef = useRef(showcase);
  const [sizePickerLoading, setSizePickerLoading] = useState(false);
  const pendingSizeReturnRef = useRef<SizePickerReturnState | null>(null);
  const [swappingOutfitSku, setSwappingOutfitSku] = useState<string | null>(null);
  const pinSizePickerRef = useRef(false);
  const pinOutfitShowcaseRef = useRef(false);
  const lastProcessedToolKeyRef = useRef<string | null>(null);
  const [apiError, setApiError] = useState<"MISSING_API_KEY" | "QUOTA_EXCEEDED" | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  const { bagItems, setIsBagDrawerOpen } = useBag();
  const bagCount = bagItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const openBag = () => setIsBagDrawerOpen(true);

  const chatTransport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          chatId,
          imageBase64: imageBase64 || undefined,
        }),
      }),
    [chatId, imageBase64]
  );

  const { messages, sendMessage, status, error } = useChat({
    id: chatId,
    transport: chatTransport,
    messages: [
      {
        id: "init-1",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Welcome. Your private styling suite is ready. Tell me what you're looking for — a specific occasion, a mood, a piece you've seen — and I'll curate something exceptional for you.",
          },
        ],
      },
    ],
    onError: (err) => {
      console.error("[Concierge] Chat error:", err);
      const msg = err.message || String(err);
      setApiErrorMessage(msg);
      if (msg.includes("MISSING_API_KEY")) {
        setApiError("MISSING_API_KEY");
      } else {
        setApiError("QUOTA_EXCEEDED");
      }
    },
    onFinish: ({ message }) => {
      console.log("[Concierge] Message finished:", message);
    },
  });

  useEffect(() => {
    if (error) {
      console.error('[Concierge] useChat error:', error);
    }
  }, [error]);

  useEffect(() => {
    console.log('[Concierge] Messages updated:', messages.length, messages);
  }, [messages]);

  const isLoading = status === "submitted" || status === "streaming";

  const sendUserQuery = useCallback(
    (text: string) => {
      if (!isConciergeFollowUpMessage(text)) {
        pinOutfitShowcaseRef.current = false;
        pinSizePickerRef.current = false;
      }
      sendMessage({ text });
    },
    [sendMessage]
  );

  const append = useCallback(
    (msg: { role: "user"; content: string }) => {
      sendUserQuery(msg.content);
    },
    [sendUserQuery]
  );

  const handleShowcaseBack = useCallback(() => {
    pinSizePickerRef.current = false;
    setShowcase((prev) => {
      if (prev.kind === "size_picker" && prev.returnTo) {
        if (prev.returnTo.kind === "outfit_builder") {
          pinOutfitShowcaseRef.current = true;
        }
        return prev.returnTo;
      }
      return { kind: "idle" };
    });
  }, []);

  const openSizePickerForProduct = useCallback(
    async (product: Product) => {
      setShowcase((prev) => {
        if (canReturnFromSizePicker(prev)) {
          pendingSizeReturnRef.current = prev;
        }
        return prev;
      });

      setSizePickerLoading(true);
      try {
        const res = await fetch(
          `/api/inventory?sku=${encodeURIComponent(product.sku)}`
        );
        const data = await res.json();

        if (data.type !== "size_picker") {
          toast.error("Sizing unavailable for this piece right now.");
          return;
        }

        const returnTo = pendingSizeReturnRef.current ?? undefined;
        pendingSizeReturnRef.current = null;

        pinSizePickerRef.current = true;
        setShowcase({
          kind: "size_picker",
          productId: data.productId,
          title: data.title,
          sku: data.sku,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          stockBySize: data.stockBySize,
          availableSizes: data.availableSizes,
          totalStock: data.totalStock,
          isLowStock: data.isLowStock,
          returnTo,
        });
      } catch {
        toast.error("Could not load inventory. Please try again.");
      } finally {
        setSizePickerLoading(false);
      }
    },
    []
  );

  const openSizePickerForStagedItem = useCallback(
    (item: StagedLookItem) => {
      void openSizePickerForProduct(stagedLookItemToProduct(item));
    },
    [openSizePickerForProduct]
  );

  useEffect(() => {
    showcaseRef.current = showcase;
  }, [showcase]);

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
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      (p: any) => (p.type === "dynamic-tool" || p.type?.startsWith("tool-")) && p.state !== "output-available" && p.state !== "done"
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
      const toolParts = msg.parts?.filter(
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
        const lastCarouselIdx = toolParts.lastIndexOf(carouselParts[carouselParts.length - 1]);
        const key = `${msg.id}-${lastCarouselIdx}`;
        if (lastProcessedToolKeyRef.current === key) return;
        lastProcessedToolKeyRef.current = key;

        // Merge all carousel products and sum totalFound
        const mergedProducts = carouselParts.flatMap((p: any) => p.output.products ?? []);
        const mergedTotalFound = carouselParts.reduce(
          (sum: number, p: any) => sum + (p.output.totalFound ?? (p.output.products?.length ?? 0)),
          0
        );
        const firstResult = (carouselParts[0] as any).output;

        setShowcase({
          kind: "product_carousel",
          products: mergedProducts,
          query: firstResult.query,
          emptyMessage: firstResult.emptyMessage,
          appliedFiltersLabel: carouselParts.length > 1 ? undefined : firstResult.appliedFilters?.label,
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
            const returnTo = prev.kind === "size_picker" && prev.returnTo ? prev.returnTo : canReturnFromSizePicker(prev) ? prev : pendingSizeReturnRef.current ?? undefined;
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
          setShowcase({ kind: "lookbook", occasion: result.occasion, colorPalette: result.colorPalette, look: result.look, totalPrice: result.totalPrice });
          return;
        }
        if (result.type === "outfit_builder") {
          pinOutfitShowcaseRef.current = true;
          setShowcase({ kind: "outfit_builder", occasion: result.occasion, colorPalette: result.colorPalette, look: result.look ?? [], totalPrice: result.totalPrice ?? 0, totalBudgetMax: result.totalBudgetMax, emptyMessage: result.emptyMessage });
          return;
        }
        if (result.type === "product_comparison") {
          setShowcase({ kind: "product_comparison", productA: result.productA, productB: result.productB });
          return;
        }
        if (result.type === "image_search_result") {
          setShowcase({ kind: "image_search_result", imageDescription: result.imageDescription, products: result.products });
          return;
        }
        if (result.type === "occasion_recommendation") {
          setShowcase({ kind: "occasion_recommendation", occasion: result.occasion, products: result.products });
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
          setShowcase({ kind: "style_profile", displayName: result.displayName, styleTokens: result.styleTokens, preferredSize: result.preferredSize, budgetMin: result.budgetMin, budgetMax: result.budgetMax, preferredColors: result.preferredColors, preferredCategories: result.preferredCategories });
          return;
        }
      }
    }

    if (lastProcessedToolKeyRef.current !== null) {
      lastProcessedToolKeyRef.current = null;
    }
    setShowcase((prev) => prev.kind === "thinking" ? { kind: "idle" } : prev);
  }, [messages]);

  const handleImageFile = useCallback((file: File) => {
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WEBP)");
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      toast.error("Image file size must be less than 5MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl); // Store base64 for server-side image fingerprinting
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text && !imagePreview) return;

    if (text.length > 500) {
      toast.error("Message exceeds the 500-character limit.");
      return;
    }

    if (imageFile) {
      const fileList = new DataTransfer();
      fileList.items.add(imageFile);
      const fileParts = await convertFileListToFileUIParts(fileList.files);
      await sendMessage({
        text: `[Image Upload] ${text || "Find me products similar to this image — analyze the style, color, and garment type"}`,
        files: fileParts,
      });
      setImageFile(null);
      setImagePreview(null);
      // Clear imageBase64 after a short delay so the transport picks it up for this request
      setTimeout(() => setImageBase64(null), 1000);
    } else {
      await sendUserQuery(text);
    }
    setInput("");
  };

  return (
    <div className="fixed inset-0 bg-warm-linen flex flex-col">
      {apiError && (
        <div className="absolute inset-0 z-[300] flex flex-col items-center justify-center bg-warm-linen/95 backdrop-blur-md transition-all animate-in fade-in duration-300">
          <div className="max-w-md w-full p-8 bg-surface-white border border-muted-zinc rounded-2xl shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-light text-obsidian-velvet tracking-tight mb-2">
              {apiError === "MISSING_API_KEY" ? "Service Configuration Issue" : "Service Temporarily Unavailable"}
            </h2>
            <p className="font-sans text-xs text-obsidian-velvet/60 leading-relaxed mb-4">
              {apiError === "MISSING_API_KEY" 
                ? "The styling room is experiencing a setup issue. Please contact support or try again later."
                : "The styling room is experiencing high volume or a connection issue. Please return to the shop and try again in a few moments."}
            </p>
            {apiErrorMessage && (
              <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-xl text-left max-h-[160px] overflow-y-auto">
                <p className="font-mono text-[10px] text-red-600 break-words leading-relaxed">
                  {apiErrorMessage}
                </p>
              </div>
            )}
            <Link
              href="/shop"
              className="inline-block w-full font-sans font-bold text-[10px] uppercase tracking-wider rounded-xl py-3.5 bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90 transition-all"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
      )}

      <header className="flex-shrink-0 bg-surface-white/90 backdrop-blur-md border-b border-muted-zinc flex items-center justify-between px-6 h-14 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/shop"
            className="flex items-center gap-1.5 text-obsidian-velvet/50 hover:text-obsidian-velvet transition-colors font-sans text-[9px] font-bold uppercase tracking-widest group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform duration-200 inline-block">←</span>
            <span>Shop</span>
          </Link>
          <div className="w-px h-3 bg-muted-zinc" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-serif text-base font-light tracking-tight text-obsidian-velvet">✦ AI Concierge</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Mobile Styling Suite Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileShowcaseOpen(!isMobileShowcaseOpen)}
            className="lg:hidden relative flex items-center gap-1.5 text-obsidian-velvet/70 hover:text-obsidian-velvet transition-colors cursor-pointer border border-muted-zinc bg-surface-white px-2.5 py-1.5 rounded-lg text-[8px] font-sans font-bold uppercase tracking-wider shadow-none"
          >
            <span>✦ Styling Suite</span>
            {showcase.kind !== "idle" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse absolute -top-0.5 -right-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={openBag}
            className="relative flex items-center text-obsidian-velvet/70 hover:text-obsidian-velvet transition-colors cursor-pointer border-none bg-transparent p-1"
            aria-label="Open shopping bag"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
            {bagCount > 0 && (
              <span className="flex w-4 h-4 rounded-full bg-obsidian-velvet text-surface-white text-[7px] items-center justify-center font-bold absolute -top-1 -right-1">
                {bagCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <ChatPanel 
          messages={messages}
          isLoading={isLoading}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          sendUserQuery={sendUserQuery}
          apiError={apiError}
          chatEndRef={chatEndRef}
          fileInputRef={fileInputRef}
          imagePreview={imagePreview}
          onClearImage={() => {
            setImagePreview(null);
            setImageFile(null);
          }}
          onImageFileSelect={handleImageFile}
        />
        <ShowcasePanel 
          showcase={showcase}
          sizePickerLoading={sizePickerLoading}
          handleShowcaseBack={handleShowcaseBack}
          openSizePickerForProduct={openSizePickerForProduct}
          append={append}
          openSizePickerForStagedItem={openSizePickerForStagedItem}
          swapOutfitPiece={swapOutfitPiece}
          swappingOutfitSku={swappingOutfitSku}
          sendUserQuery={sendUserQuery}
          bagCount={bagCount}
          openBag={openBag}
          onUploadClick={() => fileInputRef.current?.click()}
        />

        {/* Mobile Showcase Drawer Overlay */}
        {isMobileShowcaseOpen && (
          <>
            {/* Backdrop Mask */}
            <div
              onClick={() => setIsMobileShowcaseOpen(false)}
              className="lg:hidden fixed inset-0 bg-obsidian-velvet/30 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
            />

            {/* Bottom Sheet Drawer (95% height) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[95vh] bg-warm-linen rounded-t-2xl z-50 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
              {/* Elegant Drag Handle Indicator */}
              <div className="flex-shrink-0 w-full pt-2 bg-surface-white">
                <div className="w-10 h-1 bg-obsidian-velvet/15 rounded-full mx-auto" />
              </div>

              {/* Header for mobile styling suite */}
              <header className="flex-shrink-0 bg-surface-white border-b border-muted-zinc/60 flex items-center justify-between px-6 pb-3 pt-1.5 h-12">
                <span className="font-serif text-sm font-semibold tracking-tight text-obsidian-velvet">✦ Styling Suite</span>
                <button
                  type="button"
                  onClick={() => setIsMobileShowcaseOpen(false)}
                  className="w-14 h-7 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet flex items-center justify-center font-sans text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer bg-surface-white"
                >
                  Close
                </button>
              </header>
              
              {/* Mobile Showcase Content wrapper */}
              <div className="flex-1 overflow-hidden relative">
                <ShowcasePanel 
                  showcase={showcase}
                  sizePickerLoading={sizePickerLoading}
                  handleShowcaseBack={handleShowcaseBack}
                  openSizePickerForProduct={openSizePickerForProduct}
                  append={append}
                  openSizePickerForStagedItem={openSizePickerForStagedItem}
                  swapOutfitPiece={swapOutfitPiece}
                  swappingOutfitSku={swappingOutfitSku}
                  sendUserQuery={sendUserQuery}
                  bagCount={bagCount}
                  openBag={openBag}
                  isMobile={true}
                  onUploadClick={() => fileInputRef.current?.click()}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <ConciergeBagDrawer />
    </div>
  );
}
