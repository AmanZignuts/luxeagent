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
    sizes: ["S", "M", "L", "XL"]
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
    sizes: ["S", "M", "L"]
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
    sizes: ["XS", "S", "M", "L", "XL"]
  }
};

export default function ProductDetailPage() {
  const params = useParams();
  const itemId = params.itemId as string;

  const { bagItems, addToBag, setIsBagDrawerOpen } = useBag();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundTriggered, setNotFoundTriggered] = useState(false);

  const [activeSize, setActiveSize] = useState<string>("M");
  const [isAdding, setIsAdding] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<"details" | "sourcing" | null>("details");

  const isAlreadyInBag = product
    ? bagItems.some((item) => item.id === product.id && item.size === activeSize)
    : false;

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
            sizes: data.sizes && data.sizes.length > 0 ? data.sizes : ["S", "M", "L", "XL"]
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
      });
      toast.success(`Added ${product.title} (${activeSize}) to capsule bag.`);
    }, 800);
  };

  const handleButtonClick = () => {
    if (isAlreadyInBag) {
      setIsBagDrawerOpen(true);
    } else {
      handleAdd();
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    router.push(`/checkout?productId=${product.id}&size=${activeSize}`);
  };

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
                ${product.price}
              </span>
              <span className="bg-surface-white border border-muted-zinc px-3 py-1 rounded-sm text-[10px] font-sans font-semibold tracking-wider text-obsidian-velvet/60 uppercase">
                Ready to Order
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
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setActiveSize(size)}
                  className={`w-11 h-11 border rounded-md font-sans text-xs font-semibold flex items-center justify-center transition-all ${
                    activeSize === size
                      ? "bg-obsidian-velvet border-obsidian-velvet text-surface-white"
                      : "border-muted-zinc bg-surface-white hover:border-obsidian-velvet/60 text-obsidian-velvet"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Bag and Buy Now Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={isAdding}
              className={`flex-1 font-sans font-semibold text-xs uppercase tracking-wider rounded-md py-3.5 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-3 shadow-none ${
                isAlreadyInBag
                  ? "border border-obsidian-velvet bg-transparent text-obsidian-velvet hover:bg-obsidian-velvet/5"
                  : "bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90"
              }`}
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 rounded-full border-t border-r border-surface-white animate-spin" />
                  <span>Adding...</span>
                </>
              ) : isAlreadyInBag ? (
                <span>View Bag</span>
              ) : (
                <span>Add to Bag</span>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex-1 border border-muted-zinc bg-surface-white text-obsidian-velvet hover:border-obsidian-velvet font-sans font-semibold text-xs uppercase tracking-wider rounded-md py-3.5 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
