"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  sku: string;
  title: string;
  price: number;
  material: string;
  category: string;
  rawCategory?: string;
  imageUrl: string;
  inStock: boolean;
  sizes: string[];
  gender?: string;
  tags?: string[];
  description?: string;
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
    <div className="w-full flex group/card" style={{ transition: "transform 0.2s ease" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
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
    </div>
  );
});
ProductCard.displayName = "ProductCard";

// Skeleton card shown while loading products
const ProductCardSkeleton = () => (
  <div className="w-full flex">
    <div className="bg-surface-white border border-muted-zinc rounded-xl flex flex-row gap-4 p-4 h-36 items-center sm:flex-col sm:h-[400px] sm:p-6 w-full animate-pulse">
      {/* Image placeholder */}
      <div className="bg-muted-zinc/30 rounded-lg h-28 w-28 shrink-0 sm:w-full sm:flex-1 sm:min-h-[180px]" />
      {/* Text placeholders */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full sm:h-auto sm:w-full space-y-2">
        <div className="space-y-2">
          <div className="h-2 bg-muted-zinc/30 rounded w-3/4" />
          <div className="h-3.5 bg-muted-zinc/40 rounded w-full" />
          <div className="h-2 bg-muted-zinc/20 rounded w-1/2" />
          <div className="hidden sm:block h-5 bg-muted-zinc/20 rounded w-24 mt-2" />
        </div>
        <div className="h-4 bg-muted-zinc/30 rounded w-16" />
      </div>
    </div>
  </div>
);

const CATALOG_STOP_WORDS = new Set([
  "find", "show", "me", "the", "a", "an", "for", "and", "with", "under", "below",
  "above", "over", "less", "than", "more", "upto", "max", "min", "please", "looking",
  "want", "need", "get", "give", "some", "any", "our", "catalog", "from", "in", "at",
  "to", "of", "rupees", "inr", "rs", "product", "products", "garment", "garments",
  "search", "recommend", "suggest", "anything", "something", "everything", "all",
  "item", "items", "piece", "pieces", "selection", "selections", "clothing", "clothes",
  "apparel", "fashion", "wear", "wears", "collection", "collections", "outfit", "outfits",
  "look", "looks", "style", "styles"
]);

function CatalogListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [allDbProducts, setAllDbProducts] = useState<Product[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isDbEmpty, setIsDbEmpty] = useState(false);

  // Dynamic filter lists compiled from database products
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [sizesList, setSizesList] = useState<string[]>(["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"]);

  // Active Filter States — all derived from URL search params for back-nav persistence
  // useMemo stabilizes array references so useEffect deps don't trigger infinite loops
  const selectedCategories = useMemo(
    () => searchParams.getAll("cat"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString()]
  );
  const selectedSizes = useMemo(
    () => searchParams.getAll("size"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString()]
  );
  const inStockOnly = searchParams.get("inStock") === "1";
  const sortBy = (searchParams.get("sort") || "featured") as "featured" | "price-low" | "price-high";
  const rawSearchQuery = searchParams.get("q") || "";
  const searchQuery = useMemo(() => {
    if (!rawSearchQuery) return "";
    return rawSearchQuery
      .replace(/[₹$]/g, " ")
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9-]/g, ""))
      .filter((t) => t.length > 0 && !CATALOG_STOP_WORDS.has(t) && isNaN(Number(t)))
      .join(" ");
  }, [rawSearchQuery]);
  
  const priceMin = useMemo(() => {
    const val = searchParams.get("priceMin");
    return val ? Number(val) : null;
  }, [searchParams]);

  const priceMax = useMemo(() => {
    const val = searchParams.get("priceMax");
    return val ? Number(val) : null;
  }, [searchParams]);

  const gender = useMemo(() => {
    return searchParams.get("gender");
  }, [searchParams]);
  // Autocomplete Search States
  // searchQueryInput = live typing value (for dropdown suggestions only)
  // searchQuery (from URL) = what actually filters the product grid
  const [searchQueryInput, setSearchQueryInput] = useState(rawSearchQuery);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

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
              material: p.material_composition || "",
              category: p.category ? capitalize(p.category) : "Ready-to-Wear",
              rawCategory: p.category || "",
              imageUrl: (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : "/product_overshirt.png",
              inStock: totalStock > 0,
              sizes: p.sizes || ["M"],
              gender: p.gender || undefined,
              tags: p.tags || [],
              description: p.description || ""
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
          setAllDbProducts(dbMapped);
        } else {
          setIsDbEmpty(true);
          setCategoriesList(["ready-to-wear", "custom-fit", "evening-wear"]);
        }
      } catch (err) {
        console.error("Failed to load catalog products from Supabase:", err);
        setIsDbEmpty(true);
        setCategoriesList(["ready-to-wear", "custom-fit", "evening-wear"]);
      } finally {
        setInitialLoading(false);
        setLoadingProducts(false);
      }
    }
    fetchFilterOptions();
  }, []);

  // Sync input when URL changes externally (back/forward navigation or external link)
  // Always reflect what's in the URL — clears stale typed-but-uncommitted values
  useEffect(() => {
    setSearchQueryInput(rawSearchQuery);
    // Also close any open dropdown when returning to this page
    setAutocompleteSuggestions([]);
    setIsSearchFocused(false);
    setActiveSuggestionIndex(-1);
  }, [rawSearchQuery, pathname]);

  // Helper: commit the current input value to the URL (which triggers grid filter)
  const commitSearchToUrl = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // 4. Client-side autocomplete suggestions
  useEffect(() => {
    if (!searchQueryInput.trim()) {
      setAutocompleteSuggestions([]);
      return;
    }

    const handler = setTimeout(() => {
      const query = searchQueryInput.toLowerCase().trim();
      if (!query) {
        setAutocompleteSuggestions([]);
        return;
      }
      const sourceList = isDbEmpty ? STATIC_CATALOG : allDbProducts;
      const suggestions = sourceList.filter((p) => {
        // Match on title, SKU, category, tags, description — NOT the material fallback
        if (p.title.toLowerCase().includes(query)) return true;
        if (p.sku.toLowerCase().includes(query)) return true;
        if (p.category.toLowerCase().includes(query)) return true;
        if (p.rawCategory && p.rawCategory.toLowerCase().includes(query)) return true;
        if (p.description && p.description.toLowerCase().includes(query)) return true;
        if (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(query))) return true;
        // Only match material if it's a non-empty real value
        if (p.material && p.material.trim().length > 0 && p.material.toLowerCase().includes(query)) return true;
        return false;
      });
      setAutocompleteSuggestions(suggestions.slice(0, 5));
    }, 250);

    return () => clearTimeout(handler);
  }, [searchQueryInput, allDbProducts, isDbEmpty]);

  // Reset active suggestion index when suggestions or input changes
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [searchQueryInput, autocompleteSuggestions]);

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

  // Helper to update URL params
  const updateParam = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      params.delete(key);
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else if (value !== null) {
        params.set(key, value);
      }
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Toggle handlers — write to URL
  const handleCategoryToggle = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat];
    updateParam({ cat: next });
  };

  const handleSizeToggle = (sz: string) => {
    const next = selectedSizes.includes(sz)
      ? selectedSizes.filter(s => s !== sz)
      : [...selectedSizes, sz];
    updateParam({ size: next });
  };

  const handleResetFilters = () => {
    setSearchQueryInput("");
    setPendingCategories([]);
    setPendingSizes([]);
    setPendingInStockOnly(false);
    router.replace(pathname, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (autocompleteSuggestions.length > 0) {
        setActiveSuggestionIndex((prevIndex) =>
          prevIndex < autocompleteSuggestions.length - 1 ? prevIndex + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (autocompleteSuggestions.length > 0) {
        setActiveSuggestionIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : autocompleteSuggestions.length - 1
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < autocompleteSuggestions.length) {
        // Commit the typed query to URL first so back-navigation restores it
        const selectedItem = autocompleteSuggestions[activeSuggestionIndex];
        commitSearchToUrl(searchQueryInput);
        router.push(`/pdp/${selectedItem.id}`);
      } else {
        // Commit typed text to URL → filters the grid
        commitSearchToUrl(searchQueryInput);
      }
      setIsSearchFocused(false);
      setAutocompleteSuggestions([]);
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      // Dismiss dropdown without filtering
      setIsSearchFocused(false);
      setAutocompleteSuggestions([]);
      e.currentTarget.blur();
    }
  };


  // Synchronous client-side filtration based on allDbProducts
  const derivedProducts = (isDbEmpty ? STATIC_CATALOG : allDbProducts)
    .map((product) => {
      let searchScore = 0;
      let matchesSearch = true;

      if (searchQuery) {
        const searchTerms = searchQuery.toLowerCase().split(/\s+/);
        searchTerms.forEach((term) => {
          const matched =
            product.title.toLowerCase().includes(term) ||
            (product.description && product.description.toLowerCase().includes(term)) ||
            (product.tags && product.tags.some(tag => tag.toLowerCase().includes(term))) ||
            product.sku.toLowerCase().includes(term) ||
            product.material.toLowerCase().includes(term) ||
            (product.rawCategory && product.rawCategory.toLowerCase().includes(term)) ||
            product.category.toLowerCase().includes(term);
          if (matched) {
            searchScore += 1;
          }
        });
        matchesSearch = searchScore > 0;
      }

      return { product, searchScore, matchesSearch };
    })
    .filter(({ matchesSearch, product }) => {
      if (!matchesSearch) return false;

      const matchesCategory =
        selectedCategories.length === 0 || 
        selectedCategories.includes(product.rawCategory ?? product.category.toLowerCase().replace(/ /g, "-"));

      const matchesSize =
        selectedSizes.length === 0 ||
        product.sizes.some(sz => selectedSizes.includes(sz));

      const matchesStock = !inStockOnly || product.inStock;

      const matchesPriceMin = priceMin === null || isNaN(priceMin) || product.price >= priceMin;
      const matchesPriceMax = priceMax === null || isNaN(priceMax) || product.price <= priceMax;

      const matchesGender = !gender || !product.gender || product.gender.toLowerCase() === gender.toLowerCase();

      return (
        matchesCategory &&
        matchesSize &&
        matchesStock &&
        matchesPriceMin &&
        matchesPriceMax &&
        matchesGender
      );
    })
    .sort((a, b) => {
      if (searchQuery && b.searchScore !== a.searchScore) {
        return b.searchScore - a.searchScore;
      }
      if (sortBy === "price-low") return a.product.price - b.product.price;
      if (sortBy === "price-high") return b.product.price - a.product.price;
      return 0;
    })
    .map(({ product }) => product);

  const finalDisplayProducts = derivedProducts;

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
              {(priceMin !== null || priceMax !== null) && (
                <div className="flex items-center gap-1.5 bg-warm-linen border border-muted-zinc/60 px-2.5 py-1 rounded-full text-[9px] font-sans font-bold text-obsidian-velvet/60 uppercase">
                  <span>
                    Price: {priceMin !== null ? `₹${priceMin}` : ""} - {priceMax !== null ? `₹${priceMax}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete("priceMin");
                      params.delete("priceMax");
                      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                    }}
                    className="hover:text-amber-800 transition-colors font-sans font-bold text-[9px] border-none bg-transparent cursor-pointer ml-1"
                  >
                    ✕
                  </button>
                </div>
              )}
              {gender && (
                <div className="flex items-center gap-1.5 bg-warm-linen border border-muted-zinc/60 px-2.5 py-1 rounded-full text-[9px] font-sans font-bold text-obsidian-velvet/60 uppercase">
                  <span>
                    Gender: {gender}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete("gender");
                      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                    }}
                    className="hover:text-amber-800 transition-colors font-sans font-bold text-[9px] border-none bg-transparent cursor-pointer ml-1"
                  >
                    ✕
                  </button>
                </div>
              )}
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
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search… press Enter to filter"
                  value={searchQueryInput}
                  onChange={(e) => setSearchQueryInput(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-surface-white border border-muted-zinc rounded-md pl-3 pr-16 py-2 text-xs font-sans text-obsidian-velvet placeholder-obsidian-velvet/40 focus:outline-none focus:border-obsidian-velvet transition-colors"
                />
                <div className="absolute right-1 flex items-center gap-1">
                  {/* Clear button — only shown when a search is actively filtering the grid */}
                  {rawSearchQuery && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchQueryInput("");
                        commitSearchToUrl("");
                        setAutocompleteSuggestions([]);
                      }}
                      className="w-5 h-5 flex items-center justify-center text-obsidian-velvet/40 hover:text-obsidian-velvet transition-colors rounded"
                      title="Clear search filter"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {/* Enter key hint / submit button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commitSearchToUrl(searchQueryInput);
                      setIsSearchFocused(false);
                      setAutocompleteSuggestions([]);
                    }}
                    className="h-6 px-1.5 flex items-center justify-center bg-obsidian-velvet/8 hover:bg-obsidian-velvet/15 rounded text-obsidian-velvet/50 hover:text-obsidian-velvet transition-colors border border-muted-zinc/40"
                    title="Search (Enter)"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-6-6m0 0A7 7 0 1 0 9 3a7 7 0 0 0 6 12Z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Suggestions Dropdown — quick navigation to PDP, does NOT filter the grid */}
              {isSearchFocused && autocompleteSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-surface-white border border-muted-zinc shadow-lg rounded-md z-50 overflow-hidden max-h-60 overflow-y-auto">
                  <div className="px-3 py-1.5 border-b border-muted-zinc/20 flex items-center justify-between">
                    <span className="font-sans text-[8px] uppercase tracking-widest text-obsidian-velvet/35 font-bold">Quick Navigate</span>
                    <span className="font-sans text-[8px] text-obsidian-velvet/30">Press Enter to filter catalog</span>
                  </div>
                  {autocompleteSuggestions.map((item, idx) => (
                    <Link
                      key={item.id}
                      href={`/pdp/${item.id}`}
                      onClick={() => {
                        // Commit typed query to URL before navigating so back-nav restores it
                        commitSearchToUrl(searchQueryInput);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 transition-colors border-b border-muted-zinc/10 last:border-none ${
                        idx === activeSuggestionIndex
                          ? "bg-tint-champagne/70 font-semibold"
                          : "hover:bg-tint-champagne/40"
                      }`}
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
                          {item.sku}{item.material ? ` — ${item.material}` : ""}
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
              onChange={(e) => updateParam({ sort: e.target.value === "featured" ? null : e.target.value })}
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
                onChange={() => updateParam({ inStock: inStockOnly ? null : "1" })}
                className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>
          </div>

        </aside>

        {/* Scrollable Products Grid (Right side, spans 9 cols on desktop) */}
        <section className="col-span-12 lg:col-span-9 pb-20">
          
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
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
              {finalDisplayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
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
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete("cat");
                  params.delete("size");
                  if (pendingInStockOnly) params.set("inStock", "1"); else params.delete("inStock");
                  pendingCategories.forEach(c => params.append("cat", c));
                  pendingSizes.forEach(s => params.append("size", s));
                  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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

export default function CatalogListingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
          <span className="font-serif text-sm text-obsidian-velvet/40 tracking-wider uppercase">
            Loading Catalog...
          </span>
        </div>
      }
    >
      <CatalogListingContent />
    </Suspense>
  );
}
