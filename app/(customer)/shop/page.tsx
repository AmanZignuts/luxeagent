"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  sku: string;
  title: string;
  price: number;
  material: string;
  imageUrl: string;
  category: string;
}

const STATIC_PRODUCTS: Product[] = [
  {
    id: "overshirt-1",
    sku: "LA-SH-039",
    title: "Linen Blend Overshirt",
    price: 380,
    material: "Linen Blend",
    category: "Ready-to-Wear",
    imageUrl: "/product_overshirt.png"
  },
  {
    id: "trouser-1",
    sku: "LA-TR-012",
    title: "Tailored Navy Trouser",
    price: 450,
    material: "Tailored Navy Wool",
    category: "Custom Fit",
    imageUrl: "/product_trouser.png"
  },
  {
    id: "dress-1",
    sku: "LA-DR-094",
    title: "Silk Crepe Slip Dress",
    price: 680,
    material: "Pure Silk Crepe",
    category: "Evening Wear",
    imageUrl: "/product_dress.png"
  }
];

// Animation containers
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function ShopFeedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const dbMapped: Product[] = data.map((p) => ({
            id: p.id,
            sku: p.sku,
            title: p.title,
            price: Number(p.price),
            material: p.material_composition || "Premium Sourced",
            category: p.category || "Ready-to-Wear",
            imageUrl: (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : "/product_overshirt.png"
          }));

          const merged = [...dbMapped];
          for (let i = merged.length; i < 3; i++) {
            merged.push(STATIC_PRODUCTS[i % STATIC_PRODUCTS.length]);
          }
          setProducts(merged);
        } else {
          setProducts(STATIC_PRODUCTS);
        }
      } catch (err) {
        console.error("Failed to load featured products:", err);
        setProducts(STATIC_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
        <span className="font-serif text-sm text-obsidian-velvet/40 tracking-wider uppercase">
          Loading Exhibition...
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-12"
    >
      {/* Editorial Title Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-muted-zinc/60 pb-8"
      >
        <div>
          <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block mb-2">
            Seasonal Exhibition
          </span>
          <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">
            Curated Collections
          </h1>
        </div>
        <p className="font-sans text-sm text-obsidian-velvet/60 max-w-sm leading-relaxed">
          Exclusively designed neutral tailoring, natural fibers, and structural geometries for the modern client capsule.
        </p>
      </motion.div>

      {/* Asymmetrical Bento Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Bento Card 1: Large 2/3 Width Campaign Spotlight */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.005 }}
          className="relative md:col-span-2 h-[420px] rounded-xl overflow-hidden border border-muted-zinc bg-[#D4C9BC] flex items-center justify-center group cursor-pointer"
        >
          <img
            alt="Resort Linen Couture Campaign"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
            src="/resort_spotlight.png"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-85 z-10 pointer-events-none" />

          {/* Floating Branding Identifier */}
          <div className="absolute top-8 left-8 z-20 text-white drop-shadow-sm">
            <span className="font-sans text-[10px] tracking-widest uppercase font-semibold opacity-70 block mb-1">Lookbook Capsule</span>
            <span className="font-serif text-lg tracking-normal">Atelier N° 3</span>
          </div>

          {/* Bottom-Left Translucent Label Tag */}
          <div className="absolute bottom-8 left-8 z-20">
            <div className="bg-surface-white/95 border border-muted-zinc backdrop-blur-sm px-4 py-2.5 rounded-sm text-xs font-sans font-semibold tracking-widest text-obsidian-velvet uppercase">
              ATELIER N° 3 — RESORT LINEN COUTURE
            </div>
          </div>
        </motion.div>

        {/* Bento Card 2: Standard Catalog Card (Linen Blend Overshirt) */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="block bg-surface-white border border-muted-zinc rounded-xl p-6 flex flex-col justify-between aspect-square md:aspect-auto md:h-[420px] shadow-none hover:border-obsidian-velvet transition-colors duration-300"
        >
          <Link href={`/pdp/${products[0].id}`} className="flex flex-col justify-between h-full w-full">
            <span className="font-sans text-[10px] tracking-widest uppercase text-obsidian-velvet/40 block mb-3">
              {products[0].category} — {products[0].sku}
            </span>

            <div className="flex-1 relative border border-muted-zinc/40 rounded-lg overflow-hidden min-h-[220px]">
              <img
                src={products[0].imageUrl}
                alt={products[0].title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <h3 className="font-serif text-lg font-medium text-obsidian-velvet">
                  {products[0].title}
                </h3>
                <p className="font-sans text-xs text-obsidian-velvet/50 mt-1">
                  {products[0].material}
                </p>
              </div>
              <span className="font-sans text-sm font-semibold text-obsidian-velvet">
                ${products[0].price}
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Bento Card 3: 1/3 Width AI Curated Suggestion card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.005 }}
          className="bg-tint-champagne border border-muted-zinc rounded-xl p-6 flex flex-col justify-between h-[360px] md:h-[400px] shadow-none relative overflow-hidden"
        >
          <svg className="absolute -right-10 -bottom-10 w-44 h-44 text-obsidian-velvet/5 opacity-5 z-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.813L9 9l.813 5.187L15 15l-5.187.813z" />
          </svg>

          <div className="z-10">
            <div className="flex items-center gap-2 mb-6">
              <span className="flex w-5 h-5 rounded-full border border-obsidian-velvet/20 bg-surface-white/60 items-center justify-center text-[10px] font-sans font-bold text-obsidian-velvet z-10">
                ✦
              </span>
              <span className="font-sans text-[10px] tracking-widest uppercase font-semibold text-obsidian-velvet/60">
                Concierge Recommendation
              </span>
            </div>

            <p className="font-serif text-xl font-light tracking-tight text-obsidian-velvet leading-relaxed">
              &quot;The {products[0].title} pairs seamlessly with your registered Minimalist Tailoring style profile. Select to view dynamic styling matches.&quot;
            </p>
          </div>

          <div className="z-10 pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("open-concierge"));
              }}
              className="w-full bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90 font-sans font-semibold text-xs rounded-md py-2.5 transition-all text-center block cursor-pointer border-none"
            >
              Analyze Styling Combinations
            </button>
          </div>
        </motion.div>

        {/* Bento Card 4: Standard Catalog Card (Tailored Navy Trouser) */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="block bg-surface-white border border-muted-zinc rounded-xl p-6 flex flex-col justify-between h-[360px] md:h-[400px] shadow-none hover:border-obsidian-velvet transition-colors duration-300"
        >
          <Link href={`/pdp/${products[1].id}`} className="flex flex-col justify-between h-full w-full">
            <span className="font-sans text-[10px] tracking-widest uppercase text-obsidian-velvet/40 block mb-3">
              {products[1].category} — {products[1].sku}
            </span>

            <div className="flex-1 relative border border-muted-zinc/40 rounded-lg overflow-hidden min-h-[160px]">
              <img
                src={products[1].imageUrl}
                alt={products[1].title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <h3 className="font-serif text-lg font-medium text-obsidian-velvet">
                  {products[1].title}
                </h3>
                <p className="font-sans text-xs text-obsidian-velvet/50 mt-1">
                  {products[1].material}
                </p>
              </div>
              <span className="font-sans text-sm font-semibold text-obsidian-velvet">
                ${products[1].price}
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Bento Card 5: Standard Catalog Card (Silk Crepe Slip Dress) */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="block bg-surface-white border border-muted-zinc rounded-xl p-6 flex flex-col justify-between h-[360px] md:h-[400px] shadow-none hover:border-obsidian-velvet transition-colors duration-300"
        >
          <Link href={`/pdp/${products[2].id}`} className="flex flex-col justify-between h-full w-full">
            <span className="font-sans text-[10px] tracking-widest uppercase text-obsidian-velvet/40 block mb-3">
              {products[2].category} — {products[2].sku}
            </span>

            <div className="flex-1 relative border border-muted-zinc/40 rounded-lg overflow-hidden min-h-[160px]">
              <img
                src={products[2].imageUrl}
                alt={products[2].title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <h3 className="font-serif text-lg font-medium text-obsidian-velvet">
                  {products[2].title}
                </h3>
                <p className="font-sans text-xs text-obsidian-velvet/50 mt-1">
                  {products[2].material}
                </p>
              </div>
              <span className="font-sans text-sm font-semibold text-obsidian-velvet">
                ${products[2].price}
              </span>
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Editorial Navigation Banner to Full Catalog */}
      <motion.div
        variants={itemVariants}
        className="border-t border-muted-zinc/60 pt-12 text-center space-y-6"
      >
        <div className="max-w-md mx-auto space-y-2">
          <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block">
            Exclusive Collection
          </span>
          <h2 className="font-serif text-3xl font-light tracking-tight text-obsidian-velvet">
            Explore All Tailored Pieces
          </h2>
          <p className="font-sans text-xs text-obsidian-velvet/60 leading-relaxed">
            Browse our entire range of natural fiber garments, select custom sizes, and apply bespoke fit adjustments in our full product catalog.
          </p>
        </div>
        <div>
          <Link
            href="/shop/catalog"
            className="inline-flex items-center gap-2 bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90 font-sans font-semibold text-xs rounded-md px-8 py-3.5 tracking-wider uppercase transition-all duration-200 cursor-pointer"
          >
            <span>✦ View Full Product Catalog</span>
            <span className="text-[10px]">→</span>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
