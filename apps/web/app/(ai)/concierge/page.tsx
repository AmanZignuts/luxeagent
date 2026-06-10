"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, convertFileListToFileUIParts } from "ai";
import { toast } from "sonner";
import { isQuotaError } from "@/lib/ai/quota";
import { isConciergeFollowUpMessage } from "@/lib/ai/concierge-followup";
import { useBag } from "../../(customer)/BagContext";
import {
  SizePicker,
  LookBook,
  OrderStatusComponent,
  AddToBagConfirmComponent,
  StyleProfileComponent,
  OutfitBuilder,
  ProductComparisonCard,
  ShowcaseProductGrid,
  stagedLookItemToProduct,
  type ShowcaseGridVariant,
  type Product,
  type StagedLookItem,
  type ComparisonProduct,
} from "./components";
import { ConciergeBagDrawer } from "./ConciergeBagDrawer";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShowcaseState =
  | { kind: "idle" }
  | { kind: "thinking" }
  | {
      kind: "product_carousel";
      products: Product[];
      query?: string;
      emptyMessage?: string;
      appliedFiltersLabel?: string;
    }
  | { kind: "personalized_carousel"; products: Product[] }
  | {
      kind: "size_picker";
      productId: string;
      title: string;
      sku: string;
      price: number;
      imageUrl?: string;
      category?: string;
      stockBySize: Record<string, number>;
      availableSizes: { size: string; qty: number }[];
      totalStock: number;
      isLowStock: boolean;
      returnTo?: SizePickerReturnState;
    }
  | { kind: "lookbook"; occasion: string; colorPalette?: string; look: StagedLookItem[]; totalPrice: number }
  | {
      kind: "outfit_builder";
      occasion: string;
      colorPalette?: string;
      look: StagedLookItem[];
      totalPrice: number;
      totalBudgetMax?: number | null;
      emptyMessage?: string;
    }
  | { kind: "product_comparison"; productA: ComparisonProduct; productB: ComparisonProduct }
  | { kind: "image_search_result"; imageDescription?: string; products: Product[] }
  | { kind: "occasion_recommendation"; occasion: string; products: Product[] }
  | { kind: "order_status"; orders: { id: string; status: string; total: number; itemCount: number; createdAt: string; trackingNumber?: string }[] }
  | { kind: "style_profile"; displayName?: string; styleTokens: string[]; preferredSize?: string; budgetMin?: number; budgetMax?: number; preferredColors?: string[]; preferredCategories?: string[] }
  | { kind: "add_to_bag"; item: { productId: string; sku: string; title: string; size: string; price: number; imageUrl?: string }; message: string };

const QUICK_PROMPTS = [
  { label: "Quiet Luxury", query: "Show me quiet luxury essentials" },
  { label: "Summer Dresses", query: "Find summer dresses" },
  { label: "Office Edit", query: "Recommend an office wardrobe" },
  { label: "Wedding Guest", query: "Build a wedding guest outfit" },
  { label: "Resort Wear", query: "Stage resort linen coordinates" },
  { label: "Evening Silk", query: "Recommend evening silk combinations" },
];

type ProductGridShowcase =
  | Extract<ShowcaseState, { kind: "product_carousel" }>
  | Extract<ShowcaseState, { kind: "personalized_carousel" }>
  | Extract<ShowcaseState, { kind: "occasion_recommendation" }>
  | Extract<ShowcaseState, { kind: "image_search_result" }>;

function isProductGridShowcase(state: ShowcaseState): state is ProductGridShowcase {
  return (
    state.kind === "product_carousel" ||
    state.kind === "personalized_carousel" ||
    state.kind === "occasion_recommendation" ||
    state.kind === "image_search_result"
  );
}

type SizePickerReturnState = ProductGridShowcase | Extract<ShowcaseState, { kind: "outfit_builder" }>;

function canReturnFromSizePicker(state: ShowcaseState): state is SizePickerReturnState {
  return isProductGridShowcase(state) || state.kind === "outfit_builder";
}

const STYLE_CATEGORIES = [
  { label: "Dresses", icon: "✦" },
  { label: "Outerwear", icon: "◈" },
  { label: "Tops", icon: "◇" },
  { label: "Trousers", icon: "▽" },
  { label: "Accessories", icon: "○" },
];

function getToolResultChip(result: {
  type: string;
  products?: unknown[];
  title?: string;
  occasion?: string;
  orders?: unknown[];
  item?: { title?: string };
  empty?: boolean;
  emptyMessage?: string;
  appliedFilters?: { label?: string };
  look?: unknown[];
  totalPrice?: number;
  totalBudgetMax?: number | null;
}): { title: string; subtitle: string } {
  switch (result.type) {
    case "product_carousel":
      if (result.empty || (result.products?.length ?? 0) === 0) {
        return {
          title: "No exact matches",
          subtitle: result.emptyMessage ?? "Adjust filters in the styling panel",
        };
      }
      return {
        title: `${result.products?.length ?? 0} pieces curated`,
        subtitle: result.appliedFilters?.label
          ? `Filtered: ${result.appliedFilters.label}`
          : "Browse your edit in the styling panel",
      };
    case "personalized_carousel":
      return {
        title: `${result.products?.length ?? 0} picks for you`,
        subtitle: "Personalized selection is ready to view",
      };
    case "size_picker":
      return {
        title: result.title ? `Sizing · ${result.title}` : "Size & stock",
        subtitle: "Availability shown in the styling panel",
      };
    case "lookbook":
      return {
        title: result.occasion ? `${result.occasion} look` : "Look staged",
        subtitle: "Full lookbook is in the styling panel",
      };
    case "outfit_builder":
      if (result.empty || (result.look?.length ?? 0) === 0) {
        return {
          title: "No outfit in budget",
          subtitle: result.emptyMessage ?? "Adjust budget in the styling panel",
        };
      }
      return {
        title: result.occasion ? `Outfit · ${result.occasion}` : "Outfit built",
        subtitle:
          result.totalBudgetMax != null
            ? `₹${result.totalPrice ?? 0} of ₹${result.totalBudgetMax} max`
            : "Head-to-toe edit ready to explore",
      };
    case "product_comparison":
      return {
        title: "Comparison ready",
        subtitle: "Side-by-side view in the styling panel",
      };
    case "image_search_result":
      return {
        title: "Visual matches found",
        subtitle: "Similar pieces in the styling panel",
      };
    case "occasion_recommendation":
      return {
        title: result.occasion ? `${result.occasion} edit` : "Occasion picks",
        subtitle: "Curated for your moment",
      };
    case "order_status":
      return {
        title: `${result.orders?.length ?? 0} order${(result.orders?.length ?? 0) === 1 ? "" : "s"}`,
        subtitle: "Purchase history in the styling panel",
      };
    case "style_profile":
      return {
        title: "Style profile",
        subtitle: "Your preferences are loaded",
      };
    case "add_to_bag_confirm":
      return {
        title: result.item?.title ? `Added · ${result.item.title}` : "Added to bag",
        subtitle: "Open your bag anytime from the header",
      };
    default:
      return { title: "Ready", subtitle: "View in the styling panel" };
  }
}

function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function ConciergePageV2() {
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [chatId, setChatId] = useState("");

  useEffect(() => {
    setChatId(crypto.randomUUID());
  }, []);
  const [input, setInput] = useState("");
  const [showcase, setShowcase] = useState<ShowcaseState>({ kind: "idle" });
  const showcaseRef = useRef(showcase);
  const [sizePickerLoading, setSizePickerLoading] = useState(false);
  const pendingSizeReturnRef = useRef<SizePickerReturnState | null>(null);
  const [swappingOutfitSku, setSwappingOutfitSku] = useState<string | null>(null);
  /** While true, showcase stays on local size picker until user taps Back */
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
        }),
      }),
    [chatId]
  );

  const { messages, sendMessage, status, error, regenerate, clearError } = useChat({
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

  // Log error if present
  useEffect(() => {
    if (error) {
      console.error('[Concierge] useChat error:', error);
    }
  }, [error]);

  // Log messages updates
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
                sizes: data.item.sizes ?? [],
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

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Parse tool results to update showcase panel
  useEffect(() => {
    if (pinSizePickerRef.current) {
      return;
    }

    if (pinOutfitShowcaseRef.current) {
      return;
    }

    // If chat is reset/new, revert showcase to idle
    if (messages.length <= 1) {
      if (lastProcessedToolKeyRef.current !== null) {
        lastProcessedToolKeyRef.current = null;
        setShowcase({ kind: "idle" });
      }
      return;
    }

    // Check if the latest message has an active tool call in progress
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

    // Find the latest completed tool result in messages
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const toolParts = msg.parts?.filter(
        (p: any) => p.type === "dynamic-tool" || p.type?.startsWith("tool-")
      ) || [];

      for (let j = toolParts.length - 1; j >= 0; j--) {
        const part = toolParts[j] as any;
        if (part.state !== "output-available" && part.state !== "done") continue;
        const result = part.output;
        if (!result) continue;

        const key = `${msg.id}-${j}`;
        if (lastProcessedToolKeyRef.current === key) {
          // Already processed this tool result; do not overwrite showcase state.
          return;
        }

        lastProcessedToolKeyRef.current = key;

        if (result.type === "product_carousel") {
          setShowcase({
            kind: "product_carousel",
            products: result.products ?? [],
            query: result.query,
            emptyMessage: result.emptyMessage,
            appliedFiltersLabel: result.appliedFilters?.label,
          });
          return;
        }
        if (result.type === "personalized_carousel") {
          setShowcase({
            kind: "personalized_carousel",
            products: result.products,
          });
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
          setShowcase({ kind: "lookbook", occasion: result.occasion, colorPalette: result.colorPalette, look: result.look, totalPrice: result.totalPrice });
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

    // No tool result found — if was thinking, revert to idle
    if (lastProcessedToolKeyRef.current !== null) {
      lastProcessedToolKeyRef.current = null;
    }
    setShowcase((prev) => prev.kind === "thinking" ? { kind: "idle" } : prev);
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    await sendUserQuery(text);
    setInput("");
  };

  return (
    <div className="fixed inset-0 bg-warm-linen flex flex-col">

      {/* API Error Overlay */}
      {apiError && (
        <div className="absolute inset-0 z-[300] flex flex-col items-center justify-center bg-warm-linen/95 backdrop-blur-md transition-all animate-in fade-in duration-300">
          <div className="max-w-md w-full p-8 bg-surface-white border border-muted-zinc rounded-2xl shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-light text-obsidian-velvet tracking-tight mb-2">
              {apiError === "MISSING_API_KEY" ? "Missing API Key" : "Quota Exceeded / API Error"}
            </h2>
            <p className="font-sans text-xs text-obsidian-velvet/60 leading-relaxed mb-4">
              {apiError === "MISSING_API_KEY" 
                ? "Please configure your API key in the environment variables to continue using the AI Concierge."
                : "The AI Provider returned a quota limit or usage error. Please verify your billing/plan configuration (e.g. OpenAI billing dashboard, Google AI Studio, or Groq Cloud Console)."}
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

      {/* ── Header ─────────────────────────────────────────────────────── */}
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

      {/* ── Body: Split Panel ───────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ─── LEFT: Chat Panel ──────────────────────────────────────────── */}
        <div className="flex flex-col w-full lg:w-[480px] xl:w-[520px] flex-shrink-0 border-r border-muted-zinc bg-surface-white min-h-0">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0">
            {messages.map((message: any) => {
              // Support both standard AI SDK format (content) and custom parts format
              const text = message.content || 
                message.parts
                  ?.filter((p: any) => p.type === "text")
                  .map((p: any) => p.text)
                  .join("") || "";
              const hasToolParts = message.parts?.some(
                (p: any) => p.type === "dynamic-tool" || p.type?.startsWith("tool-")
              );

              return (
                <div key={message.id} className="space-y-2.5">
                  {/* Text bubble */}
                  {text && (
                    <div
                      className={`space-y-1 max-w-[88%] ${message.role === "user" ? "ml-auto" : ""}`}
                    >
                      <span className={`font-sans font-bold tracking-widest text-[7px] uppercase block ${message.role === "user" ? "text-right text-obsidian-velvet/30" : "text-obsidian-velvet/30"}`}>
                        {message.role === "assistant" ? "AI Concierge" : "You"}
                      </span>
                      <div
                        className={`px-4 py-3 rounded-2xl font-sans text-[11.5px] leading-relaxed whitespace-pre-wrap ${
                          message.role === "assistant"
                            ? "bg-warm-linen/60 text-obsidian-velvet/90 rounded-tl-sm"
                            : "bg-obsidian-velvet text-surface-white rounded-tr-sm ml-auto"
                        }`}
                      >
                        {parseMarkdown(text)}
                      </div>
                    </div>
                  )}

                  {/* Tool loading hint — only in chat panel */}
                  {hasToolParts && message.parts?.map((part: any, idx: number) => {
                    if (!part.type?.startsWith("tool-") && part.type !== "dynamic-tool") return null;
                    if (part.state === "output-available" || part.state === "done") {
                      const result = part.output;
                      if (!result) return null;
                      const chip = getToolResultChip(result);
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 pl-2.5 pr-3 py-2.5 bg-surface-white/90 border border-muted-zinc/50 rounded-xl max-w-[92%]"
                        >
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-tint-champagne text-[10px] text-obsidian-velvet/70">
                            ✓
                          </span>
                          <div className="min-w-0">
                            <p className="font-sans text-[10px] font-semibold text-obsidian-velvet leading-snug">
                              {chip.title}
                            </p>
                            <p className="font-sans text-[9px] text-obsidian-velvet/45 mt-0.5 leading-relaxed">
                              {chip.subtitle}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    // Loading
                    return (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 text-[9px] font-sans font-bold text-obsidian-velvet/40 uppercase tracking-wider">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/30 animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/30 animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/30 animate-bounce [animation-delay:300ms]" />
                        </div>
                        Curating...
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Streaming indicator */}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 px-4 py-3 bg-warm-linen/60 rounded-2xl rounded-tl-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/40 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/40 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex-shrink-0 px-4 pt-3 pb-0">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setInput(p.query);
                    sendUserQuery(p.query);
                    setInput("");
                  }}
                  disabled={isLoading}
                  className="flex-shrink-0 bg-warm-linen border border-muted-zinc/80 hover:border-obsidian-velvet hover:bg-tint-champagne/40 text-obsidian-velvet/70 font-sans font-bold text-[8px] uppercase tracking-wider px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-muted-zinc/60 p-4 bg-surface-white">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  disabled={!!apiError}
                  placeholder={apiError ? "API Error: Please resolve" : "Describe what you're looking for..."}
                  rows={1}
                  className="w-full bg-warm-linen/40 border border-muted-zinc focus:border-obsidian-velvet rounded-xl pl-4 pr-4 py-2.5 text-[11.5px] font-sans text-obsidian-velvet placeholder-obsidian-velvet/30 focus:outline-none transition-all resize-none overflow-hidden leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !!apiError}
                className="flex-shrink-0 w-9 h-9 bg-obsidian-velvet text-surface-white flex items-center justify-center rounded-xl hover:bg-obsidian-velvet/90 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </form>
            <p className="font-sans text-[7.5px] text-obsidian-velvet/25 uppercase tracking-widest mt-2 text-center">
              Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* ─── RIGHT: Showcase Panel ─────────────────────────────────────── */}
        <div className="hidden lg:flex flex-1 flex-col min-h-0 bg-warm-linen/30 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
            <div className="max-w-4xl mx-auto w-full min-h-full">

            {/* ── IDLE STATE ─────────────────────────────────────────── */}
            {showcase.kind === "idle" && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-500">
                {/* Top: Brand Header */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block">
                      Private Styling Suite
                    </span>
                    <h2 className="font-serif text-3xl font-light tracking-tight text-obsidian-velvet/80 leading-tight">
                      Your personal<br />fashion concierge.
                    </h2>
                    <p className="font-sans text-xs text-obsidian-velvet/40 leading-relaxed max-w-xs">
                      Ask me anything — a product search, an outfit for an occasion, or upload an image to find similar pieces.
                    </p>
                  </div>

                  {/* Style Category Pills */}
                  <div>
                    <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-3">
                      Browse by Category
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.label}
                          type="button"
                          onClick={() => {
                            const q = `Show me ${cat.label.toLowerCase()} from the catalog`;
                            sendUserQuery(q);
                          }}
                          className="flex items-center gap-2 bg-surface-white border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/70 hover:text-obsidian-velvet font-sans font-bold text-[9px] uppercase tracking-wider px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer hover:shadow-sm"
                        >
                          <span className="text-[10px]">{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Prompt Cards */}
                  <div>
                    <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-3">
                      Try a Prompt
                    </span>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                      {QUICK_PROMPTS.slice(0, 4).map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => sendUserQuery(p.query)}
                          className="text-left bg-surface-white border border-muted-zinc hover:border-obsidian-velvet/60 hover:bg-tint-champagne/20 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group"
                        >
                          <span className="font-serif text-sm font-light text-obsidian-velvet/80 block group-hover:text-obsidian-velvet transition-colors leading-snug">
                            "{p.query}"
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── THINKING STATE ──────────────────────────────────────── */}
            {showcase.kind === "thinking" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-obsidian-velvet/20 animate-pulse" />
                  <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-obsidian-velvet/30">
                    Curating your selection...
                  </span>
                </div>
                {/* Product card skeletons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-surface-white border border-muted-zinc rounded-lg p-2.5 animate-pulse max-w-[180px]" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="aspect-[4/5] w-full bg-warm-linen/60 rounded-md mb-2" />
                      <div className="space-y-2">
                        <div className="h-2 bg-obsidian-velvet/5 rounded w-2/3" />
                        <div className="h-3 bg-obsidian-velvet/8 rounded w-full" />
                        <div className="h-2 bg-obsidian-velvet/5 rounded w-1/2" />
                        <div className="h-7 bg-obsidian-velvet/5 rounded w-full mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── UNIFIED PRODUCT GRID (catalog / personalized / occasion / visual) ── */}
            {(showcase.kind === "product_carousel" ||
              showcase.kind === "personalized_carousel" ||
              showcase.kind === "occasion_recommendation" ||
              showcase.kind === "image_search_result") && (
              <div className="relative">
              {sizePickerLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface-white/70 backdrop-blur-[2px]">
                  <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-obsidian-velvet/40 animate-pulse">
                    Loading sizes…
                  </span>
                </div>
              )}
              <ShowcaseProductGrid
                products={showcase.products}
                append={append}
                onOpenSizes={openSizePickerForProduct}
                variant={
                  {
                    product_carousel: "catalog",
                    personalized_carousel: "personalized",
                    occasion_recommendation: "occasion",
                    image_search_result: "visual",
                  }[showcase.kind] as ShowcaseGridVariant
                }
                query={"query" in showcase ? showcase.query : undefined}
                occasion={"occasion" in showcase ? showcase.occasion : undefined}
                imageDescription={
                  "imageDescription" in showcase ? showcase.imageDescription : undefined
                }
                emptyMessage={
                  showcase.kind === "product_carousel"
                    ? showcase.emptyMessage
                    : undefined
                }
                appliedFiltersLabel={
                  showcase.kind === "product_carousel"
                    ? showcase.appliedFiltersLabel
                    : undefined
                }
              />
              </div>
            )}

            {/* ── SIZE PICKER ─────────────────────────────────────────── */}
            {showcase.kind === "size_picker" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm space-y-3">
                {showcase.returnTo && (
                  <button
                    type="button"
                    onClick={handleShowcaseBack}
                    className="font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet/50 hover:text-obsidian-velvet flex items-center gap-1.5 border-none bg-transparent cursor-pointer p-0"
                  >
                    <span aria-hidden>←</span> Back to results
                  </button>
                )}
                <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block">
                  Size & Inventory
                </span>
                <SizePicker
                  productId={showcase.productId}
                  title={showcase.title}
                  sku={showcase.sku}
                  price={showcase.price}
                  imageUrl={showcase.imageUrl}
                  category={showcase.category}
                  stockBySize={showcase.stockBySize}
                  availableSizes={showcase.availableSizes}
                  totalStock={showcase.totalStock}
                  isLowStock={showcase.isLowStock}
                  onBack={showcase.returnTo ? handleShowcaseBack : undefined}
                />
              </div>
            )}

            {/* ── LOOKBOOK ────────────────────────────────────────────── */}
            {showcase.kind === "lookbook" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg">
                <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-4">
                  Styled Look
                </span>
                <LookBook
                  occasion={showcase.occasion}
                  colorPalette={showcase.colorPalette}
                  look={showcase.look}
                  totalPrice={showcase.totalPrice}
                />
              </div>
            )}

            {/* ── OUTFIT BUILDER ───────────────────────────────────────── */}
            {showcase.kind === "outfit_builder" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg">
                <OutfitBuilder
                  occasion={showcase.occasion}
                  colorPalette={showcase.colorPalette}
                  look={showcase.look}
                  totalPrice={showcase.totalPrice}
                  totalBudgetMax={showcase.totalBudgetMax}
                  emptyMessage={showcase.emptyMessage}
                  onOpenSizes={openSizePickerForStagedItem}
                  onSwapItem={swapOutfitPiece}
                  swappingSku={swappingOutfitSku}
                />
              </div>
            )}

            {/* ── PRODUCT COMPARISON ───────────────────────────────────── */}
            {showcase.kind === "product_comparison" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg">
                <ProductComparisonCard
                  productA={showcase.productA}
                  productB={showcase.productB}
                  append={append}
                />
              </div>
            )}

            {/* ── ORDER STATUS ─────────────────────────────────────────── */}
            {showcase.kind === "order_status" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm">
                <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-4">
                  Purchase History
                </span>
                <OrderStatusComponent orders={showcase.orders} />
              </div>
            )}

            {/* ── STYLE PROFILE ─────────────────────────────────────────── */}
            {showcase.kind === "style_profile" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm">
                <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-4">
                  Your Style Profile
                </span>
                <StyleProfileComponent
                  displayName={showcase.displayName}
                  styleTokens={showcase.styleTokens}
                  preferredSize={showcase.preferredSize}
                  budgetMin={showcase.budgetMin}
                  budgetMax={showcase.budgetMax}
                  preferredColors={showcase.preferredColors}
                  preferredCategories={showcase.preferredCategories}
                />
              </div>
            )}

            {/* ── ADD TO BAG CONFIRM ──────────────────────────────────── */}
            {showcase.kind === "add_to_bag" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm">
                <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-4">
                  Added to Bag
                </span>
                <AddToBagConfirmComponent item={showcase.item} message={showcase.message} />
                <button
                  type="button"
                  onClick={openBag}
                  className="mt-4 w-full font-sans font-bold text-[9px] uppercase tracking-wider rounded-xl py-3 bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90 transition-all cursor-pointer text-center"
                >
                  View bag
                </button>
              </div>
            )}

            </div>
          </div>

          {/* Bag summary — bottom of showcase */}
          {bagCount > 0 && (
            <div className="flex-shrink-0 border-t border-muted-zinc/60 bg-surface-white/80 backdrop-blur-sm px-6 py-3">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div>
                  <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">
                    {bagCount} piece{bagCount > 1 ? "s" : ""} in your bag
                  </span>
                  <p className="font-serif text-sm font-light text-obsidian-velvet mt-0.5">
                    Review without leaving the concierge
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openBag}
                  className="bg-obsidian-velvet text-surface-white font-sans font-bold text-[9px] uppercase tracking-wider rounded-xl px-5 py-2.5 hover:bg-obsidian-velvet/90 active:scale-[0.98] transition-all cursor-pointer flex-shrink-0"
                >
                  Open bag
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConciergeBagDrawer />
    </div>
  );
}
