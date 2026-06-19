"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Combobox } from "@/components/ui";
import Select from "react-select";
import { toast } from "sonner";
import { ProductCard } from "./components/ProductCard";
import { CatalogSidebar } from "./components/CatalogSidebar";
import { MobileFilterDrawer } from "./components/MobileFilterDrawer";
import { selectCustomStyles, selectCustomComponents } from "./components/SearchSelect";

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

  // Synchronize local states with server-driven activeFilters
  useEffect(() => {
    setLocalCats(activeFilters.cats);
    setLocalSizes(activeFilters.sizes);
    setLocalInStockOnly(activeFilters.inStockOnly);
    setLocalSortBy(activeFilters.sortBy);
    setLocalPriceMin(activeFilters.priceMin);
    setLocalPriceMax(activeFilters.priceMax);
    setLocalGender(activeFilters.gender);
  }, [activeFilters]);

  useEffect(() => {
    setSearchQueryInput(activeFilters.q);
  }, [activeFilters.q, pathname]);

  // Autocomplete suggestions
  useEffect(() => {
    const query = searchQueryInput.trim();
    if (!query) { setAutocompleteSuggestions([]); setIsSuggestionsLoading(false); return; }
    setIsSuggestionsLoading(true);
    const controller = new AbortController();
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setAutocompleteSuggestions((data.suggestions || []).map((item: any) => ({ value: item.id, label: item.title, product: item })));
        }
      } catch (err: any) {
        if (err.name !== "AbortError") { console.error("Autocomplete fetch error", err); toast.error("Failed to load search suggestions"); }
      } finally { setIsSuggestionsLoading(false); }
    }, 250);
    return () => { clearTimeout(handler); controller.abort(); };
  }, [searchQueryInput]);

  // Mobile filter drawer
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [pendingSizes, setPendingSizes] = useState<string[]>([]);
  const [pendingInStockOnly, setPendingInStockOnly] = useState(false);

  useEffect(() => {
    if (isFilterDrawerOpen) { setPendingCategories(localCats); setPendingSizes(localSizes); setPendingInStockOnly(localInStockOnly); }
  }, [isFilterDrawerOpen, localCats, localSizes, localInStockOnly]);

  useEffect(() => {
    document.body.style.overflow = isFilterDrawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isFilterDrawerOpen]);

  // ── URL helpers ──────────────────────────────────────────────────────────────

  const updateParam = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      params.delete(key);
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else if (value !== null) params.set(key, value);
    }
    startTransition(() => { router.push(`${pathname}?${params.toString()}`, { scroll: false }); });
  };

  const commitSearchToUrl = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value.trim()); else params.delete("q");
    startTransition(() => { router.push(`${pathname}?${params.toString()}`, { scroll: false }); });
  };

  const handleResetFilters = () => {
    setSearchQueryInput(""); setLocalCats([]); setLocalSizes([]); setLocalInStockOnly(false);
    setLocalSortBy("featured"); setLocalPriceMin(null); setLocalPriceMax(null); setLocalGender(null);
    startTransition(() => { router.push(pathname, { scroll: false }); });
  };

  const handleCategoryToggle = (cat: string) => {
    const next = localCats.includes(cat) ? localCats.filter((c) => c !== cat) : [...localCats, cat];
    setLocalCats(next); updateParam({ cat: next });
  };

  const handleSizeToggle = (sz: string) => {
    const next = localSizes.includes(sz) ? localSizes.filter((s) => s !== sz) : [...localSizes, sz];
    setLocalSizes(next); updateParam({ size: next });
  };

  const applyMobileFilters = () => {
    setLocalCats(pendingCategories); setLocalSizes(pendingSizes); setLocalInStockOnly(pendingInStockOnly);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cat"); params.delete("size");
    if (pendingInStockOnly) params.set("inStock", "1"); else params.delete("inStock");
    pendingCategories.forEach((c) => params.append("cat", c));
    pendingSizes.forEach((s) => params.append("size", s));
    startTransition(() => { router.push(`${pathname}?${params.toString()}`, { scroll: false }); });
    setIsFilterDrawerOpen(false);
  };

  return (
    <div className="space-y-10">
      {/* Editorial Title Header */}
      <div className="border-b border-muted-zinc/60 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block mb-2">Seasonal Exhibition</span>
          <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">Product Catalog</h1>
        </div>
        <div className="text-xs font-sans font-semibold uppercase tracking-wider">
          <Link href="/shop" className="border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet bg-surface-white px-4 py-2.5 rounded-md transition-colors">
            ← View Lookbook Campaigns
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-16 bg-warm-linen z-30 pt-4 pb-3 border-b border-muted-zinc/40 select-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between lg:justify-start gap-3 w-full lg:w-auto lg:pr-4 lg:border-r lg:border-muted-zinc/40 lg:min-h-9">
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline font-serif text-lg font-light tracking-tight text-obsidian-velvet">Filters</span>
              <button type="button" onClick={() => setIsFilterDrawerOpen(true)} className="lg:hidden flex items-center gap-2 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet bg-surface-white px-3 py-1.5 rounded-md text-xs font-sans font-semibold uppercase tracking-wider transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
                <span>Configure Filters</span>
              </button>
              <button type="button" onClick={handleResetFilters} className="font-sans text-[9px] uppercase tracking-widest text-amber-700 hover:text-amber-800 font-bold border-none bg-transparent cursor-pointer">Reset All</button>
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
            <span className="lg:hidden font-sans text-[9px] tracking-widest uppercase font-bold text-obsidian-velvet/40">{products.length} unique garments</span>
          </div>

          <div className="flex-1 flex items-center justify-between gap-3 w-full lg:w-auto min-w-0 lg:min-h-9">
            <span className="hidden lg:inline font-sans text-[9px] tracking-widest uppercase font-bold text-obsidian-velvet/40">Showing {products.length} unique garments</span>
            <div className="flex-1 min-w-0 lg:max-w-xs relative z-40">
              <div className="relative flex items-center">
                <Select
                  options={autocompleteSuggestions}
                  isLoading={isSuggestionsLoading}
                  inputValue={searchQueryInput}
                  onInputChange={(val, { action }) => { if (action === "input-change") setSearchQueryInput(val); }}
                  onChange={(option: any) => { if (option) router.push(`/pdp/${option.value}`); }}
                  filterOption={() => true}
                  onKeyDown={(e: any) => { if (e.key === "Enter") commitSearchToUrl(searchQueryInput); }}
                  placeholder="Search… press Enter"
                  styles={selectCustomStyles}
                  components={selectCustomComponents}
                  className="w-full"
                  value={null}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                  {searchQueryInput && (
                    <button type="button" onClick={() => { setSearchQueryInput(""); commitSearchToUrl(""); }} className="w-5 h-5 flex items-center justify-center text-obsidian-velvet/40 hover:text-obsidian-velvet transition-colors rounded cursor-pointer border-none bg-transparent">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                  <button type="button" onClick={() => commitSearchToUrl(searchQueryInput)} className="h-6 px-1.5 flex items-center justify-center bg-obsidian-velvet/8 hover:bg-obsidian-velvet/15 rounded text-obsidian-velvet/50 hover:text-obsidian-velvet transition-colors border border-muted-zinc/40 cursor-pointer">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-6-6m0 0A7 7 0 1 0 9 3a7 7 0 0 0 6 12Z" /></svg>
                  </button>
                </div>
              </div>
            </div>
            <Combobox
              options={[{ label: "Sort: Featured", value: "featured" }, { label: "Price: Low to High", value: "price-low" }, { label: "Price: High to Low", value: "price-high" }]}
              value={localSortBy}
              onChange={(val) => { setLocalSortBy(val); updateParam({ sort: val === "featured" ? null : val }); }}
              className="bg-surface-white border-muted-zinc px-3 py-1.5 text-xs w-auto min-w-[150px] h-9 flex items-center justify-between"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        <CatalogSidebar
          categories={categories}
          sizes={sizes}
          localCats={localCats}
          localSizes={localSizes}
          localInStockOnly={localInStockOnly}
          localPriceMin={localPriceMin}
          localPriceMax={localPriceMax}
          capitalize={capitalize}
          onCategoryToggle={handleCategoryToggle}
          onSizeToggle={handleSizeToggle}
          onInStockToggle={() => { const next = !localInStockOnly; setLocalInStockOnly(next); updateParam({ inStock: next ? "1" : null }); }}
          onUpdateParam={updateParam}
        />

        <section className="col-span-12 lg:col-span-9 pb-20">
          {isPending ? (
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
              <p className="font-sans text-xs text-obsidian-velvet/40">Reset your sidebar metrics or adjust your search to discover premium tailoring pieces.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (<ProductCard key={product.id} product={product} />))}
            </div>
          )}
        </section>
      </div>

      <MobileFilterDrawer
        isOpen={isFilterDrawerOpen}
        categories={categories}
        sizes={sizes}
        pendingCategories={pendingCategories}
        pendingSizes={pendingSizes}
        pendingInStockOnly={pendingInStockOnly}
        capitalize={capitalize}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={applyMobileFilters}
        onClearPending={() => { setPendingCategories([]); setPendingSizes([]); setPendingInStockOnly(false); }}
        onPendingCategoryToggle={(cat) => setPendingCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])}
        onPendingSizeToggle={(sz) => setPendingSizes((prev) => prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz])}
        onPendingInStockToggle={() => setPendingInStockOnly(!pendingInStockOnly)}
      />
    </div>
  );
}
