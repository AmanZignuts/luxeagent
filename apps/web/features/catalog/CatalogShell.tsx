"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input, Combobox } from "@/components/ui";
import Select, { components } from "react-select";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CatalogProduct {
  id: string;
  sku: string;
  title: string;
  price: number;
  material: string;
  category: string;
  rawCategory: string;
  imageUrl: string;
  inStock: boolean;
  sizes: string[];
  gender?: string;
  tags: string[];
  description: string;
}

export interface ActiveFilters {
  q: string;
  cats: string[];
  sizes: string[];
  inStockOnly: boolean;
  priceMin: number | null;
  priceMax: number | null;
  gender: string | null;
  sortBy: string;
}

interface Props {
  products: CatalogProduct[];
  categories: string[];
  sizes: string[];
  activeFilters: ActiveFilters;
}

// ── ProductCard ──────────────────────────────────────────────────────────────

const ProductCard = React.memo(({ product }: { product: CatalogProduct }) => (
  <div
    className="w-full flex"
    style={{ transition: "transform 0.2s ease" }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
  >
    <Link
      href={`/pdp/${product.id}`}
      className="bg-surface-white border border-muted-zinc rounded-xl shadow-none hover:border-obsidian-velvet transition-colors duration-300 group flex flex-row gap-4 p-4 h-36 items-center sm:flex-col sm:justify-between sm:h-[400px] sm:p-6 w-full"
    >
      <div className="relative border border-muted-zinc/40 rounded-lg overflow-hidden h-28 w-28 shrink-0 sm:w-full sm:h-auto sm:flex-1 sm:min-h-[180px]">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
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
          <div className="hidden sm:inline-block mt-2 bg-warm-linen/40 border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/60 uppercase">
            Sizes: {product.sizes?.length > 0 ? product.sizes.join(", ") : "M"}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 sm:mt-4">
          <span className="sm:hidden bg-warm-linen/40 border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/60 uppercase">
            Sizes: {product.sizes?.length > 0 ? product.sizes.slice(0, 3).join(",") + (product.sizes.length > 3 ? "..." : "") : "M"}
          </span>
          <span className="font-sans text-xs sm:text-sm font-bold text-obsidian-velvet">
            ${product.price}
          </span>
        </div>
      </div>
    </Link>
  </div>
));
ProductCard.displayName = "ProductCard";

// ── react-select styling & custom components ───────────────────────────────

const selectCustomStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: "var(--color-surface-white, #FFFFFF)",
    borderColor: state.isFocused ? "#09090B" : "#E4E4E7",
    boxShadow: "none",
    borderRadius: "0.375rem",
    paddingLeft: "0.5rem",
    paddingRight: "2.5rem", // leave space for absolute search button
    height: "2.25rem", // ~36px
    minHeight: "2.25rem",
    fontFamily: "var(--font-sans), sans-serif",
    fontSize: "0.75rem",
    "&:hover": {
      borderColor: "#09090B"
    }
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    padding: "0"
  }),
  input: (provided: any) => ({
    ...provided,
    margin: "0",
    color: "#09090B"
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "rgba(9, 9, 11, 0.4)"
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E4E4E7",
    borderRadius: "0.375rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    zIndex: 99,
    overflow: "hidden"
  }),
  menuList: (provided: any) => ({
    ...provided,
    padding: "0"
  })
};

const selectCustomComponents = {
  DropdownIndicator: () => null,
  IndicatorSeparator: () => null,
  Menu: (props: any) => {
    const { selectProps } = props;
    if (!selectProps.inputValue || selectProps.inputValue.trim().length === 0) {
      return null;
    }
    return <components.Menu {...props} />;
  },
  Option: (props: any) => {
    const { data, innerRef, innerProps, isFocused } = props;
    const item = data.product;
    return (
      <div
        ref={innerRef}
        {...innerProps}
        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors border-b border-muted-zinc/10 last:border-none ${
          isFocused ? "bg-tint-champagne/70 font-semibold" : "hover:bg-tint-champagne/40 bg-surface-white"
        }`}
      >
        <img src={item.imageUrl} alt={item.title} className="w-8 h-8 rounded object-cover border border-muted-zinc/20 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[11px] font-semibold text-obsidian-velvet truncate">{item.title}</p>
          <p className="font-sans text-[8px] text-obsidian-velvet/50 uppercase tracking-wider truncate">
            {item.sku}{item.material ? ` — ${item.material}` : ""}
          </p>
        </div>
        <span className="font-sans text-[10px] font-bold text-obsidian-velvet shrink-0">${item.price}</span>
      </div>
    );
  },
  LoadingMessage: () => (
    <div className="px-4 py-6 flex flex-col items-center justify-center gap-2 text-obsidian-velvet/45 select-none bg-surface-white">
      <svg className="animate-spin h-5 w-5 text-obsidian-velvet/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span className="font-sans text-[10px] tracking-wider uppercase font-bold text-obsidian-velvet/30">Searching garments...</span>
    </div>
  ),
  NoOptionsMessage: () => (
    <div className="px-4 py-3 text-center text-xs font-sans text-obsidian-velvet/40 bg-surface-white">
      No garments found
    </div>
  )
};

// ── Main Shell ───────────────────────────────────────────────────────────────

export default function CatalogShell({ products, categories, sizes, activeFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const capitalize = (str: string) => {
    if (!str) return "";
    return str.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  // Search input state — live typed value (dropdown only)
  const [searchQueryInput, setSearchQueryInput] = useState(activeFilters.q);

  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  // Local states for optimistic filtering updates
  const [localCats, setLocalCats] = useState<string[]>(activeFilters.cats);
  const [localSizes, setLocalSizes] = useState<string[]>(activeFilters.sizes);
  const [localInStockOnly, setLocalInStockOnly] = useState<boolean>(activeFilters.inStockOnly);
  const [localSortBy, setLocalSortBy] = useState<string>(activeFilters.sortBy);
  const [localPriceMin, setLocalPriceMin] = useState<number | null>(activeFilters.priceMin);
  const [localPriceMax, setLocalPriceMax] = useState<number | null>(activeFilters.priceMax);
  const [localGender, setLocalGender] = useState<string | null>(activeFilters.gender);

  // Synchronize local states with activeFilters from server
  useEffect(() => {
    setLocalCats(activeFilters.cats);
    setLocalSizes(activeFilters.sizes);
    setLocalInStockOnly(activeFilters.inStockOnly);
    setLocalSortBy(activeFilters.sortBy);
    setLocalPriceMin(activeFilters.priceMin);
    setLocalPriceMax(activeFilters.priceMax);
    setLocalGender(activeFilters.gender);
  }, [activeFilters]);

  // Fetch autocomplete suggestions server-side
  useEffect(() => {
    const query = searchQueryInput.trim();
    if (!query) {
      setAutocompleteSuggestions([]);
      setIsSuggestionsLoading(false);
      return;
    }

    setIsSuggestionsLoading(true);

    const controller = new AbortController();
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.suggestions || []).map((item: any) => ({
            value: item.id,
            label: item.title,
            product: item,
          }));
          setAutocompleteSuggestions(mapped);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Autocomplete fetch error", err);
          toast.error("Failed to load search suggestions");
        }
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [searchQueryInput]);

  // Mobile Filter Drawer
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [pendingSizes, setPendingSizes] = useState<string[]>([]);
  const [pendingInStockOnly, setPendingInStockOnly] = useState(false);

  // Keep input in sync with server-driven activeFilters (e.g. back/forward nav)
  useEffect(() => {
    setSearchQueryInput(activeFilters.q);
  }, [activeFilters.q, pathname]);

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (isFilterDrawerOpen) {
      setPendingCategories(localCats);
      setPendingSizes(localSizes);
      setPendingInStockOnly(localInStockOnly);
    }
  }, [isFilterDrawerOpen, localCats, localSizes, localInStockOnly]);

  // Lock scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isFilterDrawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isFilterDrawerOpen]);

  // ── URL helpers ─────────────────────────────────────────────────────────────

  const updateParam = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      params.delete(key);
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else if (value !== null) params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const commitSearchToUrl = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value.trim());
    else params.delete("q");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleResetFilters = () => {
    setSearchQueryInput("");
    setLocalCats([]);
    setLocalSizes([]);
    setLocalInStockOnly(false);
    setLocalSortBy("featured");
    setLocalPriceMin(null);
    setLocalPriceMax(null);
    setLocalGender(null);
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const handleCategoryToggle = (cat: string) => {
    const next = localCats.includes(cat)
      ? localCats.filter((c) => c !== cat)
      : [...localCats, cat];
    setLocalCats(next);
    updateParam({ cat: next });
  };

  const handleSizeToggle = (sz: string) => {
    const next = localSizes.includes(sz)
      ? localSizes.filter((s) => s !== sz)
      : [...localSizes, sz];
    setLocalSizes(next);
    updateParam({ size: next });
  };



  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10">

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
          <Link href="/shop" className="border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet bg-surface-white px-4 py-2.5 rounded-md transition-colors">
            ← View Lookbook Campaigns
          </Link>
        </div>
      </div>

      <div className="sticky top-16 bg-warm-linen z-30 pt-4 pb-3 border-b border-muted-zinc/40 select-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between lg:justify-start gap-3 w-full lg:w-auto lg:pr-4 lg:border-r lg:border-muted-zinc/40 lg:min-h-9">
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline font-serif text-lg font-light tracking-tight text-obsidian-velvet">Filters</span>
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
              {(localPriceMin !== null || localPriceMax !== null) && (
                <div className="flex items-center gap-1.5 bg-warm-linen border border-muted-zinc/60 px-2.5 py-1 rounded-full text-[9px] font-sans font-bold text-obsidian-velvet/60 uppercase">
                  <span>Price: {localPriceMin !== null ? `₹${localPriceMin}` : ""} - {localPriceMax !== null ? `₹${localPriceMax}` : ""}</span>
                  <button type="button" onClick={() => { setLocalPriceMin(null); setLocalPriceMax(null); updateParam({ priceMin: null, priceMax: null }); }} className="hover:text-amber-800 transition-colors font-bold text-[9px] border-none bg-transparent cursor-pointer ml-1">✕</button>
                </div>
              )}
              {localGender && (
                <div className="flex items-center gap-1.5 bg-warm-linen border border-muted-zinc/60 px-2.5 py-1 rounded-full text-[9px] font-sans font-bold text-obsidian-velvet/60 uppercase">
                  <span>Gender: {localGender}</span>
                  <button type="button" onClick={() => { setLocalGender(null); updateParam({ gender: null }); }} className="hover:text-amber-800 transition-colors font-bold text-[9px] border-none bg-transparent cursor-pointer ml-1">✕</button>
                </div>
              )}
            </div>
            <span className="lg:hidden font-sans text-[9px] tracking-widest uppercase font-bold text-obsidian-velvet/40">
              {products.length} unique garments
            </span>
          </div>

          {/* Right: Count + Search + Sort */}
          <div className="flex-1 flex items-center justify-between gap-3 w-full lg:w-auto min-w-0 lg:min-h-9">
            <span className="hidden lg:inline font-sans text-[9px] tracking-widest uppercase font-bold text-obsidian-velvet/40">
              Showing {products.length} unique garments
            </span>

            {/* Search input with react-select */}
            <div className="flex-1 min-w-0 lg:max-w-xs relative z-40">
              <div className="relative flex items-center">
                <Select
                  options={autocompleteSuggestions}
                  isLoading={isSuggestionsLoading}
                  inputValue={searchQueryInput}
                  onInputChange={(val, { action }) => {
                    if (action === "input-change") {
                      setSearchQueryInput(val);
                    }
                  }}
                  onChange={(option: any) => {
                    if (option) {
                      router.push(`/pdp/${option.value}`);
                    }
                  }}
                  filterOption={() => true}
                  onKeyDown={(e: any) => {
                    if (e.key === "Enter") {
                      commitSearchToUrl(searchQueryInput);
                    }
                  }}
                  placeholder="Search… press Enter"
                  styles={selectCustomStyles}
                  components={selectCustomComponents}
                  className="w-full"
                  value={null}
                />
                
                {/* Search control buttons */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                  {searchQueryInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQueryInput("");
                        commitSearchToUrl("");
                      }}
                      className="w-5 h-5 flex items-center justify-center text-obsidian-velvet/40 hover:text-obsidian-velvet transition-colors rounded cursor-pointer border-none bg-transparent"
                      title="Clear search filter"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      commitSearchToUrl(searchQueryInput);
                    }}
                    className="h-6 px-1.5 flex items-center justify-center bg-obsidian-velvet/8 hover:bg-obsidian-velvet/15 rounded text-obsidian-velvet/50 hover:text-obsidian-velvet transition-colors border border-muted-zinc/40 cursor-pointer"
                    title="Search (Enter)"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-6-6m0 0A7 7 0 1 0 9 3a7 7 0 0 0 6 12Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Sort */}
            <Combobox
              options={[
                { label: "Sort: Featured", value: "featured" },
                { label: "Price: Low to High", value: "price-low" },
                { label: "Price: High to Low", value: "price-high" },
              ]}
              value={localSortBy}
              onChange={(val) => {
                setLocalSortBy(val);
                updateParam({ sort: val === "featured" ? null : val });
              }}
              className="bg-surface-white border-muted-zinc px-3 py-1.5 text-xs w-auto min-w-[150px] h-9 flex items-center justify-between"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">

        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-[7.5rem] max-h-[calc(100vh-9.5rem)] overflow-y-auto pr-4 pb-10 space-y-6 select-none scrollbar-thin lg:border-r lg:border-muted-zinc/40">

          {categories.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">Category</span>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localCats.includes(cat)}
                      onChange={() => handleCategoryToggle(cat)}
                      className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                    />
                    <span>{capitalize(cat)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-muted-zinc/40">
              <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">Standard Fit Size</span>
              <div className="grid grid-cols-2 gap-2">
                {sizes.map((sz) => (
                  <label key={sz} className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSizes.includes(sz)}
                      onChange={() => handleSizeToggle(sz)}
                      className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                    />
                    <span>Size {sz}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-muted-zinc/40">
            <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">Availability</span>
            <label className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
              <input
                type="checkbox"
                checked={localInStockOnly}
                onChange={() => {
                  const next = !localInStockOnly;
                  setLocalInStockOnly(next);
                  updateParam({ inStock: next ? "1" : null });
                }}
                className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Products */}
        <section className="col-span-12 lg:col-span-9 pb-20">
          {isPending ? (
            /* ── Loading skeleton shown instantly on filter click ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-full flex">
                  <div className="bg-surface-white border border-muted-zinc rounded-xl flex flex-row gap-4 p-4 h-36 items-center sm:flex-col sm:h-[400px] sm:p-6 w-full animate-pulse">
                    <div className="bg-muted-zinc/30 rounded-lg h-28 w-28 shrink-0 sm:w-full sm:flex-1 sm:min-h-[180px]" />
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
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="border border-dashed border-muted-zinc rounded-xl p-16 text-center bg-surface-white/40">
              <p className="font-serif text-lg text-obsidian-velvet/85 mb-1">No items match your active filters</p>
              <p className="font-sans text-xs text-obsidian-velvet/40">
                Reset your sidebar metrics or adjust your search to discover premium tailoring pieces.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Mobile Filters Drawer */}
      {isFilterDrawerOpen && (
        <>
          <div
            onClick={() => setIsFilterDrawerOpen(false)}
            className="lg:hidden fixed inset-0 bg-obsidian-velvet/10 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
          />
          <div className="lg:hidden fixed left-0 top-0 h-full w-80 max-w-full bg-surface-white border-r border-muted-zinc z-50 p-6 flex flex-col justify-between shadow-lg animate-in slide-in-from-left duration-300">
            <div className="flex flex-col flex-1 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-muted-zinc/60 pb-4 mb-5">
                <div>
                  <span className="font-sans text-[9px] tracking-widest uppercase text-obsidian-velvet/40 block mb-0.5">Configure</span>
                  <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">Filter Garments</h3>
                </div>
                <button type="button" onClick={() => setIsFilterDrawerOpen(false)} className="w-6 h-6 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet flex items-center justify-center font-sans text-xs rounded transition-colors cursor-pointer">✕</button>
              </div>

              <div className="space-y-6">
                {categories.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">Category</span>
                    <div className="space-y-1.5">
                      {categories.map((cat) => (
                        <label key={cat} className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pendingCategories.includes(cat)}
                            onChange={() => setPendingCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])}
                            className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                          />
                          <span>{capitalize(cat)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {sizes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-muted-zinc/40">
                    <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">Standard Fit Size</span>
                    <div className="grid grid-cols-2 gap-2">
                      {sizes.map((sz) => (
                        <label key={sz} className="flex items-center gap-2.5 font-sans text-xs text-obsidian-velvet/80 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pendingSizes.includes(sz)}
                            onChange={() => setPendingSizes((prev) => prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz])}
                            className="w-3.5 h-3.5 border border-muted-zinc rounded accent-obsidian-velvet cursor-pointer"
                          />
                          <span>Size {sz}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-muted-zinc/40">
                  <span className="font-sans text-[9px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">Availability</span>
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

            <div className="border-t border-muted-zinc/60 pt-4 space-y-2 bg-surface-white">
               <button
                 type="button"
                 onClick={() => {
                   setLocalCats(pendingCategories);
                   setLocalSizes(pendingSizes);
                   setLocalInStockOnly(pendingInStockOnly);

                   const params = new URLSearchParams(searchParams.toString());
                   params.delete("cat");
                   params.delete("size");
                   if (pendingInStockOnly) params.set("inStock", "1"); else params.delete("inStock");
                   pendingCategories.forEach((c) => params.append("cat", c));
                   pendingSizes.forEach((s) => params.append("size", s));
                   startTransition(() => {
                     router.push(`${pathname}?${params.toString()}`, { scroll: false });
                   });
                   setIsFilterDrawerOpen(false);
                 }}
                 className="w-full bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90 font-sans font-semibold text-xs rounded-md py-2.5 transition-colors cursor-pointer border-none"
               >
                 Apply Filters
               </button>
               <button
                 type="button"
                 onClick={() => { setPendingCategories([]); setPendingSizes([]); setPendingInStockOnly(false); }}
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
