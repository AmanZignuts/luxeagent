"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useBag } from "../../(customer)/BagContext";

// ─────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  title: string;
  sku: string;
  price: number;
  category: string;
  tags: string[];
  imageUrl: string;
  imageUrls: string[];
  colors: string[];
  sizes: string[];
  stockBySize: Record<string, number>;
  brand: string;
  description?: string;
  rrfScore?: number;
}

export interface StagedLookItem {
  id: string;
  title: string;
  sku: string;
  price: number;
  category: string;
  imageUrl: string;
  colors: string[];
  sizes?: string[];
  brand?: string;
  tags?: string[];
}

export function stagedLookItemToProduct(item: StagedLookItem): Product {
  return {
    id: item.id,
    title: item.title,
    sku: item.sku,
    price: item.price,
    category: item.category,
    tags: item.tags ?? [],
    imageUrl: item.imageUrl,
    imageUrls: item.imageUrl ? [item.imageUrl] : [],
    colors: item.colors ?? [],
    sizes: item.sizes ?? [],
    stockBySize: {},
    brand: item.brand ?? "LuxeLabel",
  };
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT 1: ProductCarousel
// ─────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────
// Unified showcase grid (catalog, personalized, occasion, visual search)
// ─────────────────────────────────────────────────────────────────────

export const OCCASION_META: Record<
  string,
  { emoji: string; palette: string; description: string }
> = {
  wedding: {
    emoji: "✦",
    palette: "Ivory & Blush",
    description: "Refined elegance for the ceremony and reception.",
  },
  office: {
    emoji: "◈",
    palette: "Neutral & Structured",
    description: "Polished coordinates for a commanding presence.",
  },
  vacation: {
    emoji: "○",
    palette: "Linen & Sand",
    description: "Effortless resort dressing for sun-drenched days.",
  },
  "date night": {
    emoji: "◇",
    palette: "Midnight & Silk",
    description: "Sophisticated evening pieces with tactile depth.",
  },
  party: {
    emoji: "▽",
    palette: "Jewel & Metallic",
    description: "Statement dressing for celebrations and events.",
  },
  casual: {
    emoji: "◉",
    palette: "Earth & Natural",
    description: "Relaxed luxury for everyday effortlessness.",
  },
};

export type ShowcaseGridVariant = "catalog" | "personalized" | "occasion" | "visual";

export function ShowcaseProductCard({
  product,
  append,
  onOpenSizes,
}: {
  product: Product;
  append: (message: { role: "user"; content: string }) => void;
  onOpenSizes?: (product: Product) => void;
}) {
  const [added, setAdded] = useState(false);

  const handleAddClick = () => {
    if (onOpenSizes) {
      onOpenSizes(product);
      return;
    }
    setAdded(true);
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
        <h4 className="font-serif text-[11px] font-medium text-obsidian-velvet leading-snug line-clamp-2 mt-0.5 flex-1">
          {product.title}
        </h4>
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="font-sans text-[11px] font-bold text-obsidian-velvet">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() =>
                onOpenSizes
                  ? onOpenSizes(product)
                  : append({
                      role: "user",
                      content: `Check inventory for SKU: ${product.sku}`,
                    })
              }
              className="font-sans text-[7px] font-bold uppercase tracking-wider text-obsidian-velvet/45 hover:text-obsidian-velvet transition-colors border-none bg-transparent cursor-pointer whitespace-nowrap"
            >
              Sizes
            </button>
            <button
              type="button"
              onClick={handleAddClick}
              title={onOpenSizes ? "Pick size & add" : "Add to bag"}
              className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer text-[11px] font-bold ${
                added
                  ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                  : "border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/55 hover:text-obsidian-velvet bg-surface-white"
              }`}
            >
              {added ? "✓" : "+"}
            </button>
          </div>
        </div>
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-1">
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
          {products.length === 0 ? "No matches" : `${products.length} pieces`}
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
              onOpenSizes={onOpenSizes}
            />
          ))}
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
export function SizePicker({
  productId,
  title,
  sku,
  price,
  imageUrl,
  category,
  stockBySize,
  availableSizes,
  totalStock,
  isLowStock,
  onBack,
}: {
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
  onBack?: () => void;
}) {
  const { addToBag, setIsBagDrawerOpen } = useBag();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToBag = () => {
    if (!selectedSize) return;
    const qtyAvailable = stockBySize[selectedSize] ?? 0;
    if (qtyAvailable <= 0) return;

    addToBag({
      id: productId,
      sku,
      title,
      price,
      size: selectedSize,
      material: "Atelier Sourced Fiber",
      category: category ?? "Ready-to-Wear",
      imageUrl: imageUrl ?? "",
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2500);

    toast.success(`Added to bag · ${title}`, {
      description: `Size ${selectedSize}`,
      action: {
        label: "Open bag",
        onClick: () => setIsBagDrawerOpen(true),
      },
    });
  };

  const sizeOptions =
    availableSizes.length > 0
      ? availableSizes.map((s) => s.size)
      : ["XS", "S", "M", "L", "XL"];

  return (
    <div className="w-full max-w-sm bg-surface-white border border-muted-zinc rounded-xl p-4 font-sans space-y-4">
      <div>
        <span className="text-[8px] font-bold tracking-widest text-obsidian-velvet/40 uppercase block">
          Real-Time Calibration Suite
        </span>
        <h3 className="font-serif text-sm font-semibold text-obsidian-velvet mt-1">
          {title}
        </h3>
        <span className="text-[8.5px] font-medium text-obsidian-velvet/50 mt-0.5 block">
          SKU: {sku}
        </span>
      </div>

      {/* Sizing grid */}
      <div className="space-y-2">
        <label className="block text-[8px] font-bold tracking-wider text-obsidian-velvet uppercase">
          Select Custom Size Fit
        </label>
        <div className="grid grid-cols-5 gap-2">
          {sizeOptions.map((size) => {
            const stock = stockBySize[size] ?? 0;
            const isAvailable = stock > 0;
            const isSelected = selectedSize === size;

            return (
              <button
                key={size}
                type="button"
                disabled={!isAvailable}
                onClick={() => setSelectedSize(size)}
                className={`h-10 border rounded flex flex-col justify-center items-center transition-all cursor-pointer relative ${
                  !isAvailable
                    ? "bg-zinc-50 border-muted-zinc/30 text-obsidian-velvet/20 cursor-not-allowed line-through"
                    : isSelected
                    ? "border-obsidian-velvet bg-obsidian-velvet text-surface-white ring-1 ring-obsidian-velvet"
                    : "border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet"
                }`}
              >
                <span className="text-[10px] font-bold leading-none">{size}</span>
                {isAvailable && (
                  <span
                    className={`text-[6px] mt-1 font-semibold leading-none ${
                      isSelected ? "text-white/70" : "text-obsidian-velvet/40"
                    }`}
                  >
                    {stock} left
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Low stock warning */}
      {selectedSize && (stockBySize[selectedSize] ?? 0) < 5 && (
        <div className="bg-red-50/50 border border-red-200/50 rounded p-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[8px] font-bold text-red-700 uppercase tracking-wide">
            Low Stock: Only {stockBySize[selectedSize]} pieces remaining in this size segment.
          </span>
        </div>
      )}

      {/* Add to Bag trigger */}
      <button
        type="button"
        disabled={!selectedSize || isAdded}
        onClick={handleAddToBag}
        className={`w-full font-sans font-bold text-[9px] uppercase tracking-wider rounded-md py-3 transition-all duration-200 border cursor-pointer text-center ${
          isAdded
            ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
            : !selectedSize
            ? "bg-warm-linen/30 border-muted-zinc/40 text-obsidian-velvet/30 cursor-not-allowed"
            : "bg-obsidian-velvet border-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90"
        }`}
      >
        {isAdded ? "Added to Curation Bag" : "Add Size Fit to Bag"}
      </button>

      {isAdded && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet/55 hover:text-obsidian-velvet border border-muted-zinc rounded-md py-2.5 transition-colors cursor-pointer bg-surface-white"
        >
          Choose another piece
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT 3: LookBook
// ─────────────────────────────────────────────────────────────────────
export function LookBook({
  occasion,
  colorPalette,
  look,
  totalPrice,
}: {
  occasion: string;
  colorPalette?: string;
  look: StagedLookItem[];
  totalPrice: number;
}) {
  const { addToBag, setIsBagDrawerOpen } = useBag();
  const [dispatched, setDispatched] = useState(false);

  const handleDispatchOutfit = () => {
    look.forEach((item) => {
      addToBag({
        id: item.id,
        sku: item.sku,
        title: item.title,
        price: item.price,
        size: "M", // Default
        material: "Bespoke Curation Fiber",
        category: item.category,
        imageUrl: item.imageUrl,
      });
    });

    setDispatched(true);
    setTimeout(() => setDispatched(false), 2500);

    toast.success(`${occasion} look added to your bag.`, {
      action: {
        label: "Open bag",
        onClick: () => setIsBagDrawerOpen(true),
      },
    });
  };

  return (
    <div className="w-full max-w-md bg-surface-white border border-muted-zinc rounded-xl p-4 font-sans space-y-4 shadow-none">
      <div className="flex justify-between items-start border-b border-muted-zinc/40 pb-3">
        <div>
          <span className="text-[8px] font-bold tracking-widest text-obsidian-velvet/40 uppercase block">
            Generative Editorial Staging
          </span>
          <h3 className="font-serif text-sm font-semibold text-obsidian-velvet mt-1 capitalize">
            The {occasion} Staged Look
          </h3>
          {colorPalette && (
            <span className="text-[8px] font-semibold text-obsidian-velvet/50 uppercase tracking-wide mt-0.5 block">
              Palette: {colorPalette}
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-[8px] font-bold text-obsidian-velvet/40 uppercase block">
            Look Price
          </span>
          <span className="text-[12px] font-bold text-obsidian-velvet">
            ${totalPrice}
          </span>
        </div>
      </div>

      {/* Grid of staged items */}
      <div className="grid grid-cols-2 gap-3">
        {look.map((item) => (
          <div
            key={item.id}
            className="border border-muted-zinc/60 rounded-lg p-2 flex items-center gap-3 bg-warm-linen/10"
          >
            {/* Small image preview */}
            <div className="w-10 h-12 bg-warm-linen/30 border border-muted-zinc/30 rounded overflow-hidden flex-shrink-0">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Metadata */}
            <div className="min-w-0 flex-1">
              <h4 className="font-serif text-[8.5px] font-bold text-obsidian-velvet truncate">
                {item.title}
              </h4>
              <span className="text-[7px] font-bold uppercase text-obsidian-velvet/40 tracking-wider mt-0.5 block truncate">
                {item.category}
              </span>
              <span className="text-[8px] font-bold text-obsidian-velvet mt-1 block">
                ${item.price}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dispatch Action button */}
      <button
        type="button"
        disabled={dispatched}
        onClick={handleDispatchOutfit}
        className={`w-full font-sans font-bold text-[9px] uppercase tracking-wider rounded-md py-3 transition-all duration-200 border cursor-pointer text-center ${
          dispatched
            ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
            : "bg-obsidian-velvet border-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90"
        }`}
      >
        {dispatched ? "Outfit Coordinates Dispatched" : "Dispatch Look Coordinates to Bag"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT 4: OrderStatus
// ─────────────────────────────────────────────────────────────────────
export function OrderStatusComponent({
  orders,
}: {
  orders: {
    id: string;
    status: string;
    total: number;
    itemCount: number;
    createdAt: string;
    trackingNumber?: string;
  }[];
}) {
  return (
    <div className="w-full max-w-sm bg-surface-white border border-muted-zinc rounded-xl p-4 font-sans space-y-3">
      <div>
        <span className="text-[8px] font-bold tracking-widest text-obsidian-velvet/40 uppercase block">
          Client Purchase History
        </span>
        <h3 className="font-serif text-sm font-semibold text-obsidian-velvet mt-1">
          Recent Staged Orders
        </h3>
      </div>

      <div className="space-y-2.5">
        {orders.length === 0 ? (
          <p className="text-[10px] text-obsidian-velvet/60 italic py-2">
            No recent purchase history registered under this identity code.
          </p>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="border border-muted-zinc/60 rounded-lg p-3 bg-warm-linen/10 space-y-1.5"
            >
              <div className="flex justify-between items-center text-[8px] font-sans font-bold">
                <span className="text-obsidian-velvet/50 truncate max-w-[60%]">
                  ID: {o.id.substring(0, 13).toUpperCase()}...
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-sm uppercase tracking-wider text-[7px] ${
                    o.status === "CONFIRMED" || o.status === "DELIVERED"
                      ? "bg-emerald-50 border border-emerald-300 text-emerald-700"
                      : "bg-amber-50 border border-amber-300 text-amber-700"
                  }`}
                >
                  {o.status}
                </span>
              </div>

              <div className="flex justify-between items-center text-[10px] font-bold text-obsidian-velvet">
                <span>{o.itemCount} Curation Items</span>
                <span>${o.total}</span>
              </div>

              {o.trackingNumber && (
                <div className="pt-1.5 border-t border-muted-zinc/20 flex justify-between items-center text-[7.5px] font-bold tracking-wide text-obsidian-velvet/50">
                  <span>TRACKING CODE:</span>
                  <span className="text-obsidian-velvet">{o.trackingNumber}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT 5: AddToBagConfirm
// ─────────────────────────────────────────────────────────────────────
export function AddToBagConfirmComponent({
  item,
  message,
}: {
  item: {
    productId: string;
    sku: string;
    title: string;
    size: string;
    price: number;
    imageUrl?: string;
  };
  message: string;
}) {
  const { addToBag } = useBag();
  const addedRef = React.useRef(false);

  React.useEffect(() => {
    if (addedRef.current) return;
    addedRef.current = true;

    addToBag({
      id: item.productId,
      sku: item.sku,
      title: item.title,
      price: item.price,
      size: item.size,
      material: "Atelier Sourced Fiber",
      category: "Ready-to-Wear",
      imageUrl: item.imageUrl,
    });
  }, [addToBag, item]);

  return (
    <div className="w-full max-w-sm bg-surface-white border border-muted-zinc rounded-xl p-3.5 font-sans space-y-3 shadow-none">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-[9px] font-bold tracking-wider text-emerald-700 uppercase">
          Calibration Confirmed
        </span>
      </div>

      <div className="flex items-center gap-3 bg-emerald-50/20 border border-emerald-100/50 rounded-lg p-2.5">
        {item.imageUrl && (
          <div className="w-8 h-10 bg-warm-linen/30 border border-muted-zinc/20 rounded overflow-hidden flex-shrink-0">
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-serif text-[10px] font-semibold text-obsidian-velvet truncate">
            {item.title}
          </h4>
          <span className="text-[7.5px] font-bold uppercase text-obsidian-velvet/40 tracking-wider block mt-0.5">
            Size: {item.size} — SKU: {item.sku}
          </span>
          <span className="text-[9px] font-bold text-obsidian-velvet block mt-1">
            ${item.price}
          </span>
        </div>
      </div>

      <p className="text-[8px] font-semibold text-obsidian-velvet/50 italic leading-snug">
        &quot;{message}&quot;
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT 6: StyleProfileComponent
// ─────────────────────────────────────────────────────────────────────
export function StyleProfileComponent({
  displayName,
  styleTokens,
  preferredSize,
  budgetMin,
  budgetMax,
  preferredColors,
  preferredCategories,
}: {
  displayName?: string;
  styleTokens: string[];
  preferredSize?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredColors?: string[];
  preferredCategories?: string[];
}) {
  return (
    <div className="w-full max-w-sm bg-surface-white border border-muted-zinc rounded-xl p-4 font-sans space-y-3">
      <div>
        <span className="text-[8px] font-bold tracking-widest text-obsidian-velvet/40 uppercase block">
          Client Persona Calibration
        </span>
        <h3 className="font-serif text-sm font-semibold text-obsidian-velvet mt-1">
          {displayName ? `${displayName}'s Style File` : "Style Calibration File"}
        </h3>
      </div>

      <div className="space-y-2 text-[9px] font-sans">
        {/* Style Tokens */}
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-obsidian-velvet/40 block">
            Aesthetic Core Badges:
          </span>
          <div className="flex flex-wrap gap-1">
            {styleTokens.map((t) => (
              <span
                key={t}
                className="bg-warm-linen border border-muted-zinc/80 px-2 py-0.5 rounded-sm font-bold text-obsidian-velvet uppercase tracking-wide"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Fit preferences */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <span className="font-bold uppercase tracking-wider text-obsidian-velvet/40 block">
              Sizing Calibration:
            </span>
            <span className="text-obsidian-velvet font-semibold mt-0.5 block">
              {preferredSize || "M (Default)"}
            </span>
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider text-obsidian-velvet/40 block">
              Budget Boundaries:
            </span>
            <span className="text-obsidian-velvet font-semibold mt-0.5 block">
              ${budgetMin ?? 0} — ${budgetMax ?? 10000}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT 7: OutfitBuilder
// Full head-to-toe look — each item can be individually added to bag
// ─────────────────────────────────────────────────────────────────────
export function OutfitBuilder({
  occasion,
  colorPalette,
  look,
  totalPrice,
  totalBudgetMax,
  emptyMessage,
  onOpenSizes,
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

  const CATEGORY_LABELS: Record<string, string> = {
    tops: "Top",
    trousers: "Bottom",
    outerwear: "Layer",
    accessories: "Accessory",
    dresses: "Dress",
    footwear: "Footwear",
  };

  const CATEGORY_ICONS: Record<string, string> = {
    tops: "◇",
    trousers: "▽",
    outerwear: "◈",
    accessories: "○",
    dresses: "✦",
    footwear: "◉",
  };

  const handleAddOne = (item: StagedLookItem) => {
    if (onOpenSizes) {
      onOpenSizes(item);
      return;
    }
  };

  const handleAddAll = async () => {
    if (!onOpenSizes) return;
    setAddingAll(true);
    try {
      const { firstInStockSize } = await import("@/lib/ai/inventory-utils");
      let addedCount = 0;
      for (const item of look) {
        const res = await fetch(
          `/api/inventory?sku=${encodeURIComponent(item.sku)}`
        );
        const data = await res.json();
        if (data.type !== "size_picker") continue;
        const size = firstInStockSize(
          data.stockBySize as Record<string, number>,
          item.sizes
        );
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
        toast.error("No in-stock sizes found for this look. Pick sizes per piece.");
        return;
      }
      setAllAdded(true);
      setTimeout(() => setAllAdded(false), 2500);
      toast.success(
        addedCount === look.length
          ? `Complete ${occasion} look added to your bag.`
          : `${addedCount} of ${look.length} pieces added (in-stock sizes).`,
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
      {look.length > 0 && onOpenSizes && (
        <p className="px-5 py-2 font-sans text-[9px] text-obsidian-velvet/40 border-b border-muted-zinc/20">
          <span className="font-bold uppercase tracking-wide">+</span> pick your size before adding ·{" "}
          <span className="font-bold uppercase tracking-wide">↻</span> suggest another option for that slot
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
          return (
            <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-warm-linen/20 transition-colors group">
              {/* Step number + icon */}
              <div className="w-8 h-8 rounded-full border border-muted-zinc/60 flex items-center justify-center flex-shrink-0 bg-warm-linen/40">
                <span className="text-[10px] text-obsidian-velvet/40">
                  {CATEGORY_ICONS[catKey ?? ""] ?? (idx + 1)}
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
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {onSwapItem && (
                  <button
                    type="button"
                    onClick={() => onSwapItem(item)}
                    disabled={swappingSku === item.sku}
                    className="w-7 h-7 rounded-full border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/45 hover:text-obsidian-velvet flex items-center justify-center text-[10px] cursor-pointer disabled:opacity-40 bg-surface-white"
                    title="Suggest another option"
                  >
                    {swappingSku === item.sku ? "…" : "↻"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAddOne(item)}
                  className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer text-[10px] font-bold ${
                    isAdded
                      ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                      : "border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/50 hover:text-obsidian-velvet bg-surface-white"
                  }`}
                  title="Pick size & add"
                >
                  {isAdded ? "✓" : "+"}
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT 8: OccasionRecommendation
// Curated picks by occasion with badge + description
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

// ─────────────────────────────────────────────────────────────────────
// COMPONENT 9: ProductComparisonCard
// Side-by-side A vs B comparison
// ─────────────────────────────────────────────────────────────────────
export interface ComparisonProduct {
  id: string;
  title: string;
  sku: string;
  price: number;
  category: string;
  imageUrl: string;
  brand: string;
  material?: string;
  colors: string[];
  sizes: string[];
  tags: string[];
  description?: string;
}

export function ProductComparisonCard({
  productA,
  productB,
  append,
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

// ─────────────────────────────────────────────────────────────────────
// COMPONENT 10: ImageSearchResult
// Shows visually similar products after an image upload
// ─────────────────────────────────────────────────────────────────────
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
