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
import { MobileShowcaseDrawer } from "./components/MobileShowcaseDrawer";
import { ShowcaseState, SizePickerReturnState, canReturnFromSizePicker } from "./types";
import { useImageUpload } from "./hooks/useImageUpload";
import { useOutfitSwap } from "./hooks/useOutfitSwap";
import { useShowcaseSync } from "./hooks/useShowcaseSync";

export default function ConciergePageV2() {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatId, setChatId] = useState("");
  const {
    imagePreview,
    imageFile,
    imageBase64,
    handleImageFile,
    clearImage,
    setImageFile,
    setImagePreview,
    setImageBase64,
  } = useImageUpload();

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

  const { swappingOutfitSku, swapOutfitPiece } = useOutfitSwap({
    showcase,
    setShowcase,
    showcaseRef,
  });

  useShowcaseSync({
    messages,
    setShowcase,
    pinSizePickerRef,
    pinOutfitShowcaseRef,
    pendingSizeReturnRef,
    lastProcessedToolKeyRef,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text && !imagePreview) return;

    if (text.length > 500) {
      toast.error("Message exceeds the 500-character limit.");
      return;
    }

    // Clear input and image previews synchronously to prevent perceived UI lag
    setInput("");

    if (imageFile) {
      const activeFile = imageFile;
      
      // Clear image previews from UI immediately
      setImageFile(null);
      setImagePreview(null);

      const fileList = new DataTransfer();
      fileList.items.add(activeFile);

      // Trigger the file conversion and message sending in background
      void (async () => {
        try {
          const fileParts = await convertFileListToFileUIParts(fileList.files);
          await sendMessage({
            text: `[Image Upload] ${text || "Find me products similar to this image — analyze the style, color, and garment type"}`,
            files: fileParts,
          });
        } catch (err) {
          console.error("Failed to send visual search query:", err);
          toast.error("Failed to send visual search query.");
        } finally {
          // Delay clearing base64 data to ensure transport reads it
          setTimeout(() => setImageBase64(null), 1000);
        }
      })();
    } else {
      sendUserQuery(text);
    }
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
          onClearImage={clearImage}
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

        <MobileShowcaseDrawer
          isOpen={isMobileShowcaseOpen}
          onClose={() => setIsMobileShowcaseOpen(false)}
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
          fileInputRef={fileInputRef}
        />
      </div>

      <ConciergeBagDrawer />
    </div>
  );
}
