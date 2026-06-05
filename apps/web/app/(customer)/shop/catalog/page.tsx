"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  sku: string;
  title: string;
  price: number;
  material: string;
  category: string;
  imageUrl: string;
  inStock: boolean;
  sizes: string[];
}

const STATIC_CATALOG: Product[] = [
  {
    id: "overshirt-1",
    sku: "LA-SH-039",
    title: "Linen Blend Overshirt",
    price: 380,
    material: "Linen Blend",
    category: "Ready-to-Wear",
    imageUrl: "/product_overshirt.png",
    inStock: true,
    sizes: ["S", "M", "L", "XL"]
  },
  {
    id: "trouser-1",
    sku: "LA-TR-012",
    title: "Tailored Navy Trouser",
    price: 450,
    material: "Tailored Navy Wool",
    category: "Custom Fit",
    imageUrl: "/product_trouser.png",
    inStock: true,
    sizes: ["S", "M", "L"]
  },
  {
    id: "dress-1",
    sku: "LA-DR-094",
    title: "Silk Crepe Slip Dress",
    price: 680,
    material: "Pure Silk Crepe",
    category: "Evening Wear",
    imageUrl: "/product_dress.png",
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL"]
  }
];

const ProductCard = React.memo(({ product }: { product: Product }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="w-full flex"
    >
      <Link
        href={`/pdp/${product.id}`}
        className="bg-surface-white border border-muted-zinc rounded-xl shadow-none hover:border-obsidian-velvet transition-colors duration-300 group flex flex-row gap-4 p-4 h-36 items-center sm:flex-col sm:justify-between sm:h-[400px] sm:p-6 w-full"
      >
        {/* Image Container: Left on mobile, Top on desktop */}
        <div className="relative border border-muted-zinc/40 rounded-lg overflow-hidden h-28 w-28 shrink-0 sm:w-full sm:h-auto sm:flex-1 sm:min-h-[180px]">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Text Details Container: Right on mobile, Bottom on desktop */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full sm:h-auto sm:w-full sm:mt-0">
          <div className="space-y-1 sm:space-y-2 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <span className="font-sans text-[9px] sm:text-[10px] tracking-widest uppercase text-obsidian-velvet/40 truncate w-full">
                {product.category} — {product.sku}
              </span>
              {!product.inStock ? (
                <span className="bg-red-50 border border-red-200 text-red-700 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold uppercase tracking-wider shrink-0">
                  Out of Stock
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline shrink-0">
                  ✦ Calibrated Fit
                </span>
              )}
            </div>

            <h3 className="font-serif text-sm sm:text-base font-semibold text-obsidian-velvet truncate w-full" title={product.title}>
              {product.title}
            </h3>
            <p className="font-sans text-[10px] sm:text-xs text-obsidian-velvet/50 truncate w-full">
              {product.material}
            </p>
            
            {/* Desktop Sizing Badge */}
            <div className="hidden sm:inline-block mt-2 bg-warm-linen/40 border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/60 uppercase">
              Sizes: {product.sizes && product.sizes.length > 0 ? product.sizes.join(", ") : "M"}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 sm:mt-4">
            {/* Mobile Sizing Badge */}
            <span className="sm:hidden bg-warm-linen/40 border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/60 uppercase">
              Sizes: {product.sizes && product.sizes.length > 0 ? product.sizes.slice(0, 3).join(",") + (product.sizes.length > 3 ? "..." : "") : "M"}
            </span>
            <span className="font-sans text-xs sm:text-sm font-bold text-obsidian-velvet">
              ${product.price}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
ProductCard.displayName = "ProductCard";

export default function CatalogListingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allDbProducts, setAllDbProducts] = useState<Product[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isDbEmpty, setIsDbEmpty] = useState(false);

  const isInitialRun = useRef(true);

  // Dynamic filter lists compiled from database products
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [sizesList, setSizesList] = useState<string[]>(["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"]);

  // Active Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high">("featured");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Autocomplete Search States
  const [searchQueryInput, setSearchQueryInput] = useState("");
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Mobile Filter Drawer States
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [pendingSizes, setPendingSizes] = useState<string[]>([]);
  const [pendingInStockOnly, setPendingInStockOnly] = useState(false);

  // Capitalization helper
  const capitalize = (str: string) => {
    if (!str) return "";
    return str.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  // 1. Fetch filter options once on mount
  useEffect(() => {
    async function fetchFilterOptions() {
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
          const dbMapped: Product[] = data.map((p) => {
            const stockMap = p.stock_by_size as Record<string, number> | null;
            const totalStock = stockMap ? Object.values(stockMap).reduce((a, b) => a + b, 0) : 0;
            return {
              id: p.id,
              sku: p.sku,
              title: p.title,
              price: Number(p.price) || 0,
              material: p.material_composition || "Selected Fiber",
              category: p.category ? capitalize(p.category) : "Ready-to-Wear",
              imageUrl: (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : "/product_overshirt.png",
              inStock: totalStock > 0,
              sizes: p.sizes || ["M"]
            };
          });

          // Compile categories using exact DB values
          const categories = Array.from(new Set(data.map(item => item.category).filter(Boolean))) as string[];
          
          setCategoriesList(categories);
          
          // Compile sizes
          const allSizes = Array.from(new Set(dbMapped.flatMap(item => item.sizes).filter(Boolean)));
          if (allSizes.length > 0) {
            setSizesList(allSizes.sort((a, b) => {
              const order = ["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"];
              return order.indexOf(a) - order.indexOf(b);
            }));
          }
          setIsDbEmpty(false);
          setProducts(dbMapped);
          setAllDbProducts(dbMapped);
        } else {
          setIsDbEmpty(true);
          setProducts(STATIC_CATALOG);
          setCategoriesList(["ready-to-wear", "custom-fit", "evening-wear"]);
        }
      } catch (err) {
        console.error("Failed to load catalog products from Supabase:", err);
        setIsDbEmpty(true);
        setProducts(STATIC_CATALOG);
        setCategoriesList(["ready-to-wear", "custom-fit", "evening-wear"]);
      } finally {
        setInitialLoading(false);
        setLoadingProducts(false);
      }
    }
    fetchFilterOptions();
  }, []);

  // 2. Fetch filtered products from Supabase
  useEffect(() => {
    if (initialLoading) return;

    if (isInitialRun.current) {
      isInitialRun.current = false;
      return;
    }

    async function fetchFiltered() {
      if (isDbEmpty) return;

      setLoadingProducts(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from("products")
          .select("*")
          .eq("is_active", true);

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,material_composition.ilike.%${searchQuery}%`);
        }

        if (selectedCategories.length > 0) {
          query = query.in("category", selectedCategories);
        }

        if (selectedSizes.length > 0) {
          query = query.overlaps("sizes", selectedSizes);
        }

        if (sortBy === "price-low") {
          query = query.order("price", { ascending: true });
        } else if (sortBy === "price-high") {
          query = query.order("price", { ascending: false });
        } else {
          query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;

        if (data) {
          const dbMapped: Product[] = data.map((p) => {
            const stockMap = p.stock_by_size as Record<string, number> | null;
            const totalStock = stockMap ? Object.values(stockMap).reduce((a, b) => a + b, 0) : 0;
            return {
              id: p.id,
              sku: p.sku,
              title: p.title,
              price: Number(p.price) || 0,
              material: p.material_composition || "Selected Fiber",
              category: p.category ? capitalize(p.category) : "Ready-to-Wear",
              imageUrl: (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : "/product_overshirt.png",
              inStock: totalStock > 0,
              sizes: p.sizes || ["M"]
            };
          });

          let finalProducts = dbMapped;
          if (inStockOnly) {
            finalProducts = dbMapped.filter((p) => p.inStock);
          }
          setProducts(finalProducts);
        }
      } catch (err) {
        console.error("Failed to load catalog products from Supabase:", err);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchFiltered();
  }, [searchQuery, selectedCategories, selectedSizes, inStockOnly, sortBy, initialLoading, isDbEmpty]);

  // 3. Debounce search query updates
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchQueryInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQueryInput]);

  // 4. Client-side autocomplete suggestions
  useEffect(() => {
    if (!searchQueryInput.trim()) {
      setAutocompleteSuggestions([]);
      return;
    }

    const handler = setTimeout(() => {
      const query = searchQueryInput.toLowerCase();
      const sourceList = isDbEmpty ? STATIC_CATALOG : allDbProducts;
      const suggestions = sourceList.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.material.toLowerCase().includes(query)
      );
      setAutocompleteSuggestions(suggestions.slice(0, 5));
    }, 250);

    return () => clearTimeout(handler);
  }, [searchQueryInput, allDbProducts, isDbEmpty]);

  // Sync active filters to pending filters when opening the drawer
  useEffect(() => {
    if (isFilterDrawerOpen) {
      setPendingCategories(selectedCategories);
      setPendingSizes(selectedSizes);
      setPendingInStockOnly(inStockOnly);
    }
  }, [isFilterDrawerOpen]);

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    if (isFilterDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterDrawerOpen]);

  // Toggle handlers for desktop (immediate application)
  const handleCategoryToggle = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const handleSizeToggle = (sz: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((item) => item !== sz) : [...prev, sz]
    );
  };

  const handleResetFilters = () => {
    setSearchQueryInput("");
    setSearchQuery("");
    setInStockOnly(false);
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSortBy("featured");
    // Clear pending drawer states too
    setPendingCategories([]);
    setPendingSizes([]);
    setPendingInStockOnly(false);
  };

  // Fallback filtration for static catalog
  const filteredStaticProducts = STATIC_CATALOG
    .filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.material.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(product.category.toLowerCase().replace(/ /g, "-"));

      const matchesSize =
        selectedSizes.length === 0 ||
        product.sizes.some(sz => selectedSizes.includes(sz));

      const matchesStock = !inStockOnly || product.inStock;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSize &&
        matchesStock
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0;
    });

  const finalDisplayProducts = isDbEmpty ? filteredStaticProducts : products;

  if (initialLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
        <span className="font-serif text-sm text-obsidian-velvet/40 tracking-wider uppercase">
          Assembling Catalog...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* Editorial Title Header */}
      <div className="border-b border-muted-zinc/60 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block mb-2">
            Seasonal Exhibition
          </span>
          <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">
            Product Catalog
          </h1>
        </div>
        <div className="text-xs font-sans font-semibold uppercase tracking-wider">
          <Link
            href="/shop"
            className="border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet bg-surface-white px-4 py-2.5 rounded-md transition-colors"
          >
            ← View Lookbook Campaigns
          </Link>
        </div>
      </div>

      {/* Sticky Header Bar for Filters & Sorting */}
      <div className="sticky top-16 bg-warm-linen z-30 pt-4 pb-3 border-b border-muted-zinc/40 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Left Side: Filter buttons / Reset */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 w-full sm:w-auto lg:pr-4 lg:border-r lg:border-muted-zinc/40">
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline font-serif text-lg font-light tracking-tight text-obsidian-velvet">
                Filters
              </span>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className="lg:hidden flex items-center gap-2 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet bg-surface-white px-3 py-1.5 rounded-md text-xs font-sans font-semibold uppercase tracking-wider transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                </svg>
                <span>Configure Filters</span>
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="font-sans text-[9px] uppercase tracking-widest text-amber-700 hover:text-amber-800 font-bold border-none bg-transparent cursor-pointer"
              >
                Reset All
              </button>
            </div>
            <span className="lg:hidden font-sans text-[9px] tracking-widest uppercase font-bold text-obsidian-velvet/40">
              {finalDisplayProducts.length} unique garments
            </span>
          </div>

          {/* Right Side: Count, Autocomplete Search, and Sort Dropdown */}
          <div className="flex-1 flex items-center justify-between gap-3 w-full sm:w-auto min-w-0">
            <span className="hidden lg:inline font-sans text-[9px] tracking-widest uppercase font-bold text-obsidian-velvet/40">
              Showing {finalDisplayProducts.length} unique garments
            </span>

            {/* Autocomplete Search input */}
            <div className="flex-1 min-w-0 max-w-[200px] sm:max-w-xs relative z-40">
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQueryInput}
                onChange={(e) => setSearchQueryInput(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full bg-surface-white border border-muted-zinc rounded-md px-3 py-2 text-xs font-sans text-obsidian-velvet placeholder-obsidian-velvet/40 focus:outline-none focus:border-obsidian-velvet transition-colors"
              />
              {/* Autocomplete Suggestions Dropdown */}
              {isSearchFocused && autocompleteSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-surface-white border border-muted-zinc shadow-lg rounded-md z-50 overflow-hidden max-h-60 overflow-y-auto">
                  {autocompleteSuggestions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/pdp/${item.id}`}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-tint-champagne/40 transition-colors border-b border-muted-zinc/10 last:border-none"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-8 h-8 rounded object-cover border border-muted-zinc/20 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-[11px] font-semibold text-obsidian-velvet truncate">
                          {item.title}
                        </p>
                        <p className="font-sans text-[8px] text-obsidian-velvet/50 uppercase tracking-wider truncate">
                          {item.sku} — {item.material}
                        </p>
                      </div>
                      <span className="font-sans text-[10px] font-bold text-obsidian-velvet shrink-0">
                        ${item.price}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "featured" | "price-low" | "price-high")}
              className="bg-surface-white border border-muted-zinc rounded-md px-3 py-1.5 text-xs font-sans text-obsidian-velvet focus:outline-none focus:border-obsidian-velvet cursor-pointer select-none"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Layout containing Filters Left & Products Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        
        {/* Sticky Filters Sidebar (Left side, spans 3 cols) - Desktop Only */}
        <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-[7.5rem] max-h-[calc(100vh-9.5rem)] overflow-y-auto pr-4 pb-10 space-y-6 select-none scrollbar-thin lg:border-r lg:border-muted-zinc/40">

          {/* Category Filter Checkboxes */}
          {categoriesList.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">
                Category
              </span>
              <div className="space-y-1.5">
                {categoriesList.map((cat) => (
                  <label key={cat} className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryToggle(cat)}
                      className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                    />
                    <span>{capitalize(cat)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Sizes Checkboxes */}
          {sizesList.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-muted-zinc/40">
              <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">
                Standard Fit Size
              </span>
              <div className="grid grid-cols-2 gap-2">
                {sizesList.map((sz) => (
                  <label key={sz} className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSizes.includes(sz)}
                      onChange={() => handleSizeToggle(sz)}
                      className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                    />
                    <span>Size {sz}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Stock Toggles */}
          <div className="space-y-2 pt-2 border-t border-muted-zinc/40">
            <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">
              Availability
            </span>
            <label className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={() => setInStockOnly(!inStockOnly)}
                className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>
          </div>

        </aside>

        {/* Scrollable Products Grid (Right side, spans 9 cols on desktop) */}
        <section className="col-span-12 lg:col-span-9 pb-20">
          
          {loadingProducts ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
              <span className="font-serif text-sm text-obsidian-velvet/40 tracking-wider uppercase animate-pulse">
                Calibrating Selection...
              </span>
            </div>
          ) : finalDisplayProducts.length === 0 ? (
            <div className="border border-dashed border-muted-zinc rounded-xl p-16 text-center bg-surface-white/40">
              <p className="font-serif text-lg text-obsidian-velvet/85 mb-1">
                No items match your active filters
              </p>
              <p className="font-sans text-xs text-obsidian-velvet/40">
                Reset your sidebar metrics or adjust your search to discover premium tailoring pieces.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {finalDisplayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </AnimatePresence>
            </div>
          )}

        </section>

      </div>

      {/* Mobile Filters Drawer */}
      {isFilterDrawerOpen && (
        <>
          {/* Backdrop Mask */}
          <div
            onClick={() => setIsFilterDrawerOpen(false)}
            className="lg:hidden fixed inset-0 bg-obsidian-velvet/10 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div className="lg:hidden fixed left-0 top-0 h-full w-80 max-w-full bg-surface-white border-r border-muted-zinc z-50 p-6 flex flex-col justify-between shadow-lg animate-in slide-in-from-left duration-300">
            <div className="flex flex-col flex-1 overflow-y-auto pr-1">
              
              <div className="flex items-center justify-between border-b border-muted-zinc/60 pb-4 mb-5">
                <div>
                  <span className="font-sans text-[9px] tracking-widest uppercase text-obsidian-velvet/40 block mb-0.5">
                    Configure
                  </span>
                  <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">
                    Filter Garments
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-6 h-6 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet flex items-center justify-center font-sans text-xs rounded transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Sidebar filter controls inside mobile drawer */}
              <div className="space-y-6">

                {/* Categories */}
                {categoriesList.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">
                      Category
                    </span>
                    <div className="space-y-1.5">
                      {categoriesList.map((cat) => (
                        <label key={cat} className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pendingCategories.includes(cat)}
                            onChange={() => {
                              setPendingCategories(prev =>
                                prev.includes(cat) ? prev.filter(item => item !== cat) : [...prev, cat]
                              );
                            }}
                            className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                          />
                          <span>{capitalize(cat)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {sizesList.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-muted-zinc/40">
                    <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">
                      Standard Fit Size
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {sizesList.map((sz) => (
                        <label key={sz} className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pendingSizes.includes(sz)}
                            onChange={() => {
                              setPendingSizes(prev =>
                                prev.includes(sz) ? prev.filter(item => item !== sz) : [...prev, sz]
                              );
                            }}
                            className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                          />
                          <span>Size {sz}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                <div className="space-y-2 pt-2 border-t border-muted-zinc/40">
                  <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">
                    Availability
                  </span>
                  <label className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pendingInStockOnly}
                      onChange={() => setPendingInStockOnly(!pendingInStockOnly)}
                      className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                    />
                    <span>In Stock Only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Apply and Clear buttons at the bottom of the drawer */}
            <div className="border-t border-muted-zinc/60 pt-4 space-y-2 bg-surface-white">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategories(pendingCategories);
                  setSelectedSizes(pendingSizes);
                  setInStockOnly(pendingInStockOnly);
                  setIsFilterDrawerOpen(false);
                }}
                className="w-full bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90 font-sans font-semibold text-xs rounded-md py-2.5 transition-colors cursor-pointer border-none"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingCategories([]);
                  setPendingSizes([]);
                  setPendingInStockOnly(false);
                }}
                className="w-full bg-surface-white border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet font-sans font-semibold text-xs rounded-md py-2.5 transition-colors cursor-pointer"
              >
                Clear All Pending
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
