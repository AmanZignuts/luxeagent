"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useBag } from "@/app/(customer)/BagContext";
import { createClient } from "@/lib/supabase/client";

interface ProductDetail {
  id: string;
  sku: string;
  title: string;
  price: number;
  material: string;
  category: string;
  description: string;
  construction: string;
  sourcing: string;
  imageUrls: string[];
  sizes: string[];
  stockBySize?: Record<string, number>;
}

const STATIC_CATALOG: Record<string, ProductDetail> = {
  "overshirt-1": {
    id: "overshirt-1",
    sku: "LA-SH-039",
    title: "Linen Blend Overshirt",
    price: 380,
    material: "Linen Blend (70% Organic Linen, 30% Fine Cotton)",
    category: "Atelier",
    description: "A relaxed-cut utility silhouette structured with a classic collar, drop shoulder seams, and raw-textured double patch pockets. Designed to serve as an atmospheric layering piece for transition seasons.",
    construction: "Hand-finished flat fell seams, reinforced stress-points, and natural mother-of-pearl buttons. Crafted in our local atelier with meticulous attention to clean interior structural lines.",
    sourcing: "Woven in Florence, Italy from organic raw linen fibers certified by global ecological standards. Bleached organically without toxic synthetic chemicals to preserve the natural linen beige texture.",
    imageUrls: ["/product_overshirt.png"],
    sizes: ["S", "M", "L", "XL"],
    stockBySize: { "S": 10, "M": 5, "L": 0, "XL": 3 }
  },
  "trouser-1": {
    id: "trouser-1",
    sku: "LA-TR-012",
    title: "Tailored Navy Trouser",
    price: 450,
    material: "100% Super-120s Virgin Wool",
    category: "Couture",
    description: "A high-rise, wide-leg trouser engineered with architectural double front pleats, sharp pressed creases, and a hidden secure waistband closure. Delivers a dramatic, elongated editorial silhouette.",
    construction: "Unfinished hems for custom tailoring adjustments, silk-lined waistband detailing, side seam pockets, and rear button-through welt pockets. Built using classic bespoke tailoring methodologies.",
    sourcing: "Virgin wool ethically sheared and spun at the heritage Biella mills in Northern Italy. Sourced exclusively from farms committed to animal welfare and sustainable grassland regeneration pastures.",
    imageUrls: ["/product_trouser.png"],
    sizes: ["S", "M", "L"],
    stockBySize: { "S": 8, "M": 0, "L": 4 }
  },
  "dress-1": {
    id: "dress-1",
    sku: "LA-DR-094",
    title: "Silk Crepe Slip Dress",
    price: 680,
    material: "100% Mulberry Silk Crepe de Chine",
    category: "Evening Wear",
    description: "A bias-cut evening slip dress that drapes naturally to trace a quiet fluid silhouette. Features a clean scoop back neck, delicate spaghetti shoulder straps, and a micro-rolled floor-grazing hem finish.",
    construction: "Fully lined with double-layered silk georgette panels, french seam interior finishing, and delicate, hand-applied strap anchoring loops to ensure architectural fluid drape stability.",
    sourcing: "Mulberry silk woven organically in heritage silk farms. Dyeds using natural botanical minerals to achieve our signature high-contrast deep obsidian ink shade with low carbon print footprint.",
    imageUrls: ["/product_dress.png"],
    sizes: ["XS", "S", "M", "L", "XL"],
    stockBySize: { "XS": 5, "S": 12, "M": 7, "L": 2, "XL": 4 }
  }
};

export default function ProductDetailPage() {
  const params = useParams();
  const itemId = params.itemId as string;

  const { bagItems, addToBag, removeFromBag, updateQuantity, setIsBagDrawerOpen } = useBag();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundTriggered, setNotFoundTriggered] = useState(false);

  const [activeSize, setActiveSize] = useState<string>("M");
  const [isAdding, setIsAdding] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<"details" | "sourcing" | null>("details");

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const bagItem = product
    ? bagItems.find((item) => item.id === product.id && item.size === activeSize)
    : undefined;
  const isAlreadyInBag = !!bagItem;
  const bagItemQty = Number(bagItem?.quantity) || 0;

  useEffect(() => {
    async function loadProductDetail() {
      try {
        const supabase = createClient();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);

        let query = supabase.from("products").select("*").eq("is_active", true);
        if (isUuid) {
          query = query.eq("id", itemId);
        } else {
          query = query.eq("sku", itemId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (data) {
          const aiMeta = (data.ai_metadata as any) || {};
          const details: ProductDetail = {
            id: data.id,
            sku: data.sku,
            title: data.title,
            price: Number(data.price) || 0,
            material: data.material_composition || "Selected Fiber",
            category: data.category
              ? data.category.charAt(0).toUpperCase() + data.category.slice(1)
              : "Atelier",
            description: data.description || "A meticulously tailored wardrobe piece designed for clean silhouettes and comfortable wear.",
            construction: aiMeta.construction || "Hand-finished flat fell seams, reinforced stress-points, and natural buttons. Crafted with meticulous attention to clean interior structural lines.",
            sourcing: aiMeta.sourcing || `Woven from fine ${data.material_composition || "textiles"} at certified heritage mills. Committed to eco-conscious luxury production.`,
            imageUrls: data.image_urls && data.image_urls.length > 0 ? data.image_urls : ["/product_overshirt.png"],
            sizes: data.sizes && data.sizes.length > 0 ? data.sizes : ["S", "M", "L", "XL"],
            stockBySize: (data.stock_by_size as Record<string, number>) || {}
          };
          setProduct(details);
          if (details.sizes.length > 0) {
            setActiveSize(details.sizes[0]);
          }
        } else {
          const fallback = STATIC_CATALOG[itemId];
          if (fallback) {
            setProduct(fallback);
            if (fallback.sizes.length > 0) {
              setActiveSize(fallback.sizes[0]);
            }
          } else {
            setNotFoundTriggered(true);
          }
        }
      } catch (err) {
        console.error("Failed to load product detail from Supabase:", err);
        const fallback = STATIC_CATALOG[itemId];
        if (fallback) {
          setProduct(fallback);
          if (fallback.sizes.length > 0) {
            setActiveSize(fallback.sizes[0]);
          }
        } else {
          setNotFoundTriggered(true);
        }
      } finally {
        setLoading(false);
      }
    }
    loadProductDetail();
  }, [itemId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
        <span className="font-serif text-sm text-obsidian-velvet/40 tracking-wider uppercase">
          Aligning Silhouette...
        </span>
      </div>
    );
  }

  if (notFoundTriggered || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="max-w-md space-y-2">
          <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block">Exhibition Error</span>
          <h1 className="font-serif text-3xl font-light tracking-tight text-obsidian-velvet">Garment Not Found</h1>
          <p className="font-sans text-xs text-obsidian-velvet/60 leading-relaxed">
            The requested designer SKU or product ID does not exist in our active atelier catalog. Return to catalog to explore coordinates.
          </p>
        </div>
        <div>
          <Link
            href="/shop/catalog"
            className="inline-flex items-center gap-2 bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90 font-sans font-semibold text-xs rounded-md px-6 py-3 tracking-wider uppercase transition-colors"
          >
            ← View Full Catalog
          </Link>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    if (!product) return;
    setIsAdding(true);
    setTimeout(() => {
      setIsAdding(false);
      addToBag({
        id: product.id,
        sku: product.sku,
        title: product.title,
        price: product.price,
        size: activeSize,
        material: product.material,
        category: product.category,
        imageUrl: product.imageUrls[0],
        stockBySize: product.stockBySize,
      });
      toast.success(`Added ${product.title} (${activeSize}) to capsule bag.`);
    }, 800);
  };


  const handleBuyNow = () => {
    if (!product) return;
    if (isLoggedIn) {
      router.push(`/checkout?productId=${product.id}&size=${activeSize}`);
    } else {
      window.dispatchEvent(
        new CustomEvent("open-auth", {
          detail: {
            pendingAction: () =>
              router.push(`/checkout?productId=${product.id}&size=${activeSize}`),
          },
        })
      );
    }
  };

  const selectedSizeStock = product?.stockBySize?.[activeSize] ?? 10;
  const isOutOfStock = selectedSizeStock <= 0;

  const primaryImage = product.imageUrls[0] || "/product_overshirt.png";

  return (
    <div className="space-y-8">
      {/* Return link */}
      <div>
        <button
          onClick={() => router.back()}
          className="font-sans text-[10px] tracking-widest uppercase text-obsidian-velvet/40 hover:text-obsidian-velvet transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          ← Go Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Product Detail Presentation */}
        <div className="order-2 lg:order-1 lg:col-span-5 space-y-8">
          <div className="border-b border-muted-zinc/60 pb-6">
            <span className="font-sans text-[10px] tracking-widest uppercase text-obsidian-velvet/40 block mb-2">
              {product.category} — {product.sku}
            </span>
            <h1 className="font-serif text-3xl font-light tracking-tight text-obsidian-velvet sm:text-4xl">
              {product.title}
            </h1>
            <div className="flex items-center justify-between mt-4">
              <span className="font-sans text-lg font-semibold text-obsidian-velvet">
                ₹{product.price}
              </span>
              <span className={`border px-3 py-1 rounded-sm text-[10px] font-sans font-semibold tracking-wider uppercase ${isOutOfStock ? 'bg-red-50 border-red-200 text-red-750' : 'bg-surface-white border-muted-zinc text-obsidian-velvet/60'}`}>
                {isOutOfStock ? 'Sold Out' : 'Ready to Order'}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="font-sans text-sm text-obsidian-velvet/70 leading-relaxed">
            {product.description}
          </p>

          {/* Material Composition */}
          <div className="bg-surface-white border border-muted-zinc rounded-xl p-5 space-y-1">
            <span className="font-sans text-[9px] tracking-wider uppercase font-semibold text-obsidian-velvet/40">
              Material Composition
            </span>
            <p className="font-sans text-xs font-semibold text-obsidian-velvet">
              {product.material}
            </p>
          </div>

          {/* Interactive Size Selector */}
          <div className="space-y-3">
            <span className="font-sans text-[10px] tracking-widest uppercase font-semibold text-obsidian-velvet/60 block">
              Select Workspace Fit
            </span>
            <div className="flex gap-2">
              {product.sizes.map((size) => {
                const stock = product.stockBySize?.[size] ?? 10;
                const outOfStock = stock <= 0;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setActiveSize(size)}
                    className={`w-11 h-11 border rounded-md font-sans text-xs font-semibold flex flex-col items-center justify-center transition-all relative ${
                      activeSize === size
                        ? "bg-obsidian-velvet border-obsidian-velvet text-surface-white"
                        : outOfStock
                        ? "border-muted-zinc/40 bg-zinc-50 text-obsidian-velvet/30 line-through opacity-70"
                        : "border-muted-zinc bg-surface-white hover:border-obsidian-velvet/60 text-obsidian-velvet"
                    }`}
                  >
                    <span className="leading-none">{size}</span>
                    <span className={`text-[7px] mt-0.5 leading-none ${activeSize === size ? "text-white/60" : "text-obsidian-velvet/40"}`}>
                      {outOfStock ? "0" : stock}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add to Bag / Quantity Counter / Buy Now */}
          <div className="flex gap-4">
            {isAlreadyInBag ? (
              /* ── Quantity Counter ─────────────────────────────────────── */
              <div className="flex-1 flex items-center gap-3">
                {/* Stepper pill */}
                <div className="flex items-center border border-obsidian-velvet rounded-md overflow-hidden h-[46px] bg-surface-white">
                  {/* Decrease / Delete button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!product) return;
                      if (bagItemQty <= 1) {
                        removeFromBag(product.id, activeSize);
                      } else {
                        updateQuantity(product.id, activeSize, -1);
                      }
                    }}
                    className="w-11 h-full flex items-center justify-center text-obsidian-velvet hover:bg-obsidian-velvet/5 transition-colors cursor-pointer border-r border-obsidian-velvet/20"
                    title={bagItemQty <= 1 ? "Remove from bag" : "Decrease quantity"}
                  >
                    {bagItemQty <= 1 ? (
                      /* Trash icon */
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    ) : (
                      /* Minus icon */
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                      </svg>
                    )}
                  </button>

                  {/* Quantity display */}
                  <span className="w-10 text-center font-sans text-sm font-semibold text-obsidian-velvet select-none">
                    {bagItemQty}
                  </span>

                  {/* Increase button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!product) return;
                      updateQuantity(product.id, activeSize, 1);
                    }}
                    className="w-11 h-full flex items-center justify-center text-obsidian-velvet hover:bg-obsidian-velvet/5 transition-colors cursor-pointer border-l border-obsidian-velvet/20"
                    title="Increase quantity"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>

                {/* View Bag shortcut */}
                <button
                  type="button"
                  onClick={() => setIsBagDrawerOpen(true)}
                  className="flex-1 border border-obsidian-velvet bg-transparent text-obsidian-velvet hover:bg-obsidian-velvet/5 font-sans font-semibold text-xs uppercase tracking-wider rounded-md py-3.5 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer h-[46px]"
                >
                  <span>View Bag</span>
                </button>
              </div>
            ) : (
              /* ── Add to Bag Button ────────────────────────────────────── */
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding || isOutOfStock}
                className={`flex-1 font-sans font-semibold text-xs uppercase tracking-wider rounded-md py-3.5 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-3 shadow-none ${
                  isOutOfStock
                    ? "bg-muted-zinc/40 text-obsidian-velvet/30 cursor-not-allowed border-none"
                    : "bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90"
                }`}
              >
                {isAdding ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-t border-r border-surface-white animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : isOutOfStock ? (
                  <span>Out of Stock</span>
                ) : (
                  <span>Add to Bag</span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`flex-1 border font-sans font-semibold text-xs uppercase tracking-wider rounded-md py-3.5 active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${
                isOutOfStock
                  ? "bg-zinc-50 border-muted-zinc/30 text-obsidian-velvet/20 cursor-not-allowed"
                  : "border-muted-zinc bg-surface-white text-obsidian-velvet hover:border-obsidian-velvet cursor-pointer"
              }`}
            >
              <span>Buy Now</span>
            </button>
          </div>

          {/* Details Accordions */}
          <div className="border border-muted-zinc rounded-xl overflow-hidden bg-surface-white">
            {/* Atelier Construction Details Accordion */}
            <div className="border-b border-muted-zinc/60">
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === "details" ? null : "details")}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-warm-linen/10 transition-colors"
              >
                <span className="font-sans text-xs font-semibold tracking-wider uppercase text-obsidian-velvet">
                  Atelier Construction Details
                </span>
                <span className="text-xs text-obsidian-velvet/60 font-semibold font-sans">
                  {activeAccordion === "details" ? "—" : "+"}
                </span>
              </button>
              {activeAccordion === "details" && (
                <div className="px-5 pb-5 pt-1 text-xs font-sans text-obsidian-velvet/70 leading-relaxed animate-in fade-in duration-200">
                  {product.construction}
                </div>
              )}
            </div>

            {/* Sustainability Notes Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === "sourcing" ? null : "sourcing")}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-warm-linen/10 transition-colors"
              >
                <span className="font-sans text-xs font-semibold tracking-wider uppercase text-obsidian-velvet">
                  Sustainability & Sourcing Notes
                </span>
                <span className="text-xs text-obsidian-velvet/60 font-semibold font-sans">
                  {activeAccordion === "sourcing" ? "—" : "+"}
                </span>
              </button>
              {activeAccordion === "sourcing" && (
                <div className="px-5 pb-5 pt-1 text-xs font-sans text-obsidian-velvet/70 leading-relaxed animate-in fade-in duration-200">
                  {product.sourcing}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Image Box */}
        <div className="order-1 lg:order-2 lg:col-span-7 flex flex-col justify-between bg-surface-white border border-muted-zinc rounded-xl p-8 h-[520px] lg:h-[680px] relative overflow-hidden shadow-none">
          {/* Subtle atmospheric linen shading in background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#FAF0E6]/10 to-[#09090B]/5 opacity-60 z-0 pointer-events-none" />

          {/* Title Header */}
          <div className="z-10 flex items-center justify-between border-b border-muted-zinc/60 pb-5">
            <div>
              <span className="font-sans text-[10px] tracking-widest uppercase text-obsidian-velvet/40 block mb-1">
                Capsule Presentation
              </span>
              <h2 className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet">
                Garment Presentation
              </h2>
            </div>
          </div>

          {/* Image Display */}
          <div className="z-10 flex-1 relative border border-muted-zinc/40 rounded-xl my-6 overflow-hidden group">
            <img
              src={primaryImage}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Bottom-Left Translucent Tag */}
            <div className="absolute bottom-6 left-6 z-20">
              <span className="bg-surface-white/95 border border-muted-zinc backdrop-blur-sm px-3 py-1.5 rounded-sm text-[9px] font-sans font-semibold tracking-widest text-obsidian-velvet uppercase">
                Garment View
              </span>
            </div>
          </div>

          {/* Text Details */}
          <div className="z-10 border-t border-muted-zinc/60 pt-5 space-y-2">
            <h3 className="font-serif text-xl font-light tracking-tight text-obsidian-velvet">
              {product.title}
            </h3>
            <p className="font-sans text-xs text-obsidian-velvet/60 leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
