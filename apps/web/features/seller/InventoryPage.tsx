"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Modal, Button, Combobox, Input } from "@/components/ui";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

interface SkuRecord {
  id?: string;
  sku: string;
  title: string;
  category: string;
  stock: number;
  price: number;
  sourcing: string;
  material: string;
  status: "ACTIVE" | "PENDING" | "OUT_OF_STOCK";
  imageUrl?: string;
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1594938298299-1f4967a50fc4?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1550614000-4b95dd2449bb?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop"
];

const STATIC_CATALOG: SkuRecord[] = [
  {
    id: "static-1",
    sku: "LA-SH-039",
    title: "Linen Blend Overshirt",
    category: "Ready-to-Wear",
    stock: 45,
    price: 380,
    sourcing: "Florence, Italy",
    material: "70% Organic Linen, 30% Fine Cotton",
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop"
  },
  {
    id: "static-2",
    sku: "LA-TR-012",
    title: "Tailored Navy Trouser",
    category: "Couture",
    stock: 32,
    price: 450,
    sourcing: "Biella, Italy",
    material: "100% Super-120s Virgin Wool",
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1594938298299-1f4967a50fc4?w=200&h=200&fit=crop"
  },
  {
    id: "static-3",
    sku: "LA-DR-094",
    title: "Silk Crepe Slip Dress",
    category: "Evening Wear",
    stock: 18,
    price: 680,
    sourcing: "Florence, Italy",
    material: "100% Mulberry Silk Crepe",
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop"
  },
  {
    id: "static-4",
    sku: "LA-JK-005",
    title: "Double-Breasted Wool Blazer",
    category: "Couture",
    stock: 0,
    price: 950,
    sourcing: "Biella, Italy",
    material: "100% Recycled Cashmere Wool Blend",
    status: "OUT_OF_STOCK",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&h=200&fit=crop"
  },
  {
    id: "static-5",
    sku: "LA-SH-018",
    title: "Organic Silk Georgette Blouse",
    category: "Ready-to-Wear",
    stock: 12,
    price: 490,
    sourcing: "Florence, Italy",
    material: "100% Organic Silk Georgette",
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1550614000-4b95dd2449bb?w=200&h=200&fit=crop"
  }
];

export default function InventoryLedgerPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [categoriesList, setCategoriesList] = useState<string[]>([
    "ALL", "READY-TO-WEAR", "COUTURE", "EVENING WEAR", "DRESSES", "TOPS", "OUTERWEAR", "TROUSERS", "ACCESSORIES"
  ]);

  const [catalog, setCatalog] = useState<SkuRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Deletion Modal State
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Server-side Pagination States
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;

  // Reactivity & User Ref
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const userIdRef = React.useRef<string | null>(null);

  // Search Debouncer Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0); // Reset to first page on search query
    }, 450);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load distinct categories list dynamically from DB products
  useEffect(() => {
    let active = true;

    async function loadUniqueCategories() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("products")
          .select("category");

        if (data && active) {
          const unique = Array.from(
            new Set(data.map((p) => (p.category || "Ready-to-Wear").toUpperCase()))
          ).filter(Boolean);

          const merged = Array.from(new Set([
            "ALL", "READY-TO-WEAR", "COUTURE", "EVENING WEAR", "DRESSES", "TOPS", "OUTERWEAR", "TROUSERS", "ACCESSORIES", ...unique
          ]));
          setCategoriesList(merged);
        }
      } catch (e) {
        console.error("Failed to load unique categories from DB", e);
      }
    }
    loadUniqueCategories();

    return () => {
      active = false;
    };
  }, []);

  // Fetch catalog with active filters and pagination from Supabase server
  useEffect(() => {
    let active = true;
    setLoading(true);

    async function fetchCatalog() {
      try {
        const supabase = createClient();
        
        let userId = userIdRef.current;
        if (!userId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && active) {
            userId = user.id;
            userIdRef.current = user.id;
          }
        }

        let query = supabase
          .from("products")
          .select("*", { count: "exact" });

        if (userId) {
          query = query.or(`seller_id.eq.${userId},seller_id.is.null`);
        } else {
          query = query.is("seller_id", null);
        }

        if (debouncedSearch.trim() !== "") {
          const val = `%${debouncedSearch.trim()}%`;
          query = query.or(`title.ilike.${val},sku.ilike.${val},material_composition.ilike.${val}`);
        }

        if (selectedCategory !== "ALL") {
          query = query.ilike("category", selectedCategory);
        }

        const from = currentPage * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        if (!active) return;

        let dbProducts: SkuRecord[] = [];
        if (data && data.length > 0) {
          dbProducts = data.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            title: p.title,
            category: p.category || "Ready-to-Wear",
            stock: p.stock_by_size ? Object.values(p.stock_by_size).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number : 10,
            price: Number(p.price) || 0,
            sourcing: p.material_composition || "Premium Sourced",
            material: p.material_composition || "Selected Blend",
            status: "ACTIVE",
            imageUrl: p.image_urls && p.image_urls.length > 0
              ? p.image_urls[0]
              : FALLBACK_IMAGES[Math.abs((p.sku || p.id || "").split("").reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % FALLBACK_IMAGES.length]
          }));
        } else {
          // Fallback to static catalog only on page 0 if database is completely empty
          if (currentPage === 0 && debouncedSearch.trim() === "" && selectedCategory === "ALL") {
            dbProducts = STATIC_CATALOG;
          }
        }

        setCatalog(dbProducts);
        setTotalItems(count || dbProducts.length);
      } catch (e) {
        console.error("Failed to query catalog from Supabase", e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchCatalog();

    return () => {
      active = false;
    };
  }, [debouncedSearch, selectedCategory, currentPage, refreshTrigger]);

  const handleDelete = (id?: string) => {
    if (!id) return;
    if (id.startsWith("static-")) {
      toast.error("Cannot delete static placeholder items.");
      return;
    }
    setProductToDelete(id);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/delete?id=${productToDelete}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to delete product from server");
      }

      toast.success("Product deleted successfully");
      setProductToDelete(null);
      setRefreshTrigger((prev) => prev + 1); // Refresh the list reactively
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: SkuRecord["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "OUT_OF_STOCK":
        return "text-red-700 bg-red-50 border-red-200";
      case "PENDING":
        return "text-amber-700 bg-amber-50 border-amber-200";
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300 w-full max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="border-b border-muted-zinc/60 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block mb-2">
            Product Catalog
          </span>
          <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">
            Product Inventory
          </h1>
        </div>

        <div>
          <Link
            href="/seller/ingestion"
            className="bg-obsidian-velvet text-surface-white font-sans font-semibold text-xs rounded-md px-5 py-3 hover:bg-obsidian-velvet/90 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-none"
          >
            <span>✦ Import New Product</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search Console Panel */}
      <div className="bg-surface-white border border-muted-zinc rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKUs, materials, or sourcing..."
            className="py-2.5 text-xs"
          />
        </div>

        {/* Dynamic Category Dropdown Select */}
        <div className="w-full md:w-56">
          <Combobox
            options={categoriesList.map((c) => ({
              label: c === "ALL" ? "All Categories" : c,
              value: c,
            }))}
            value={selectedCategory}
            onChange={(v) => {
              setSelectedCategory(v);
              setCurrentPage(0);
            }}
          />
        </div>
      </div>

      {/* ── Mobile Card List (< md) ─────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-surface-white border border-muted-zinc rounded-xl p-10 flex flex-col items-center gap-3">
            <div className="w-6 h-6 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
            <span className="font-sans text-[10px] text-obsidian-velvet/40 tracking-wider uppercase font-semibold">
              Loading products...
            </span>
          </div>
        ) : catalog.length === 0 ? (
          <div className="bg-surface-white border border-muted-zinc rounded-xl p-10 text-center">
            <p className="font-sans text-xs text-obsidian-velvet/40">No products match your filters.</p>
          </div>
        ) : (
          catalog.map((item) => (
            <div
              key={item.sku}
              className="bg-surface-white border border-muted-zinc rounded-xl p-5 space-y-4"
            >
              {/* Top row: Image + SKU + status */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted-zinc/20 border border-muted-zinc/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl || "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop";
                    }}
                  />
                </div>

                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="font-sans text-[10px] font-bold text-obsidian-velvet/50 tracking-widest uppercase">
                    {item.sku}
                  </span>
                  <span className={`border px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider flex-shrink-0 ${getStatusBadge(item.status)}`}>
                    {item.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Title + category */}
              <div className="space-y-1">
                <p className="font-serif text-base font-light text-obsidian-velvet leading-snug">{item.title}</p>
                <span className="bg-warm-linen border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-bold text-obsidian-velvet/60 uppercase inline-block">
                  {item.category}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-3 gap-3 border-t border-muted-zinc/40 pt-3">
                <div>
                  <span className="block font-sans text-[9px] text-obsidian-velvet/40 uppercase tracking-wider mb-0.5">Price</span>
                  <span className="font-sans text-xs font-semibold text-obsidian-velvet">${item.price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block font-sans text-[9px] text-obsidian-velvet/40 uppercase tracking-wider mb-0.5">Stock</span>
                  <span className={`font-sans text-xs font-semibold ${item.stock === 0 ? "text-red-500" : "text-obsidian-velvet"}`}>
                    {item.stock} units
                  </span>
                </div>
                <div className="flex items-end justify-end gap-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="border border-red-200 bg-red-50 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-red-700 hover:bg-red-700 hover:text-white transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => router.push(`/seller/ingestion?id=${item.id || item.sku}`)}
                    className="border border-muted-zinc bg-surface-white px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Sourcing */}
              <p className="font-sans text-[10px] text-obsidian-velvet/40 border-t border-muted-zinc/40 pt-3">
                Sourced: {item.sourcing}
              </p>
            </div>
          ))
        )}

        {/* Mobile pagination */}
        {!loading && totalItems > 0 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
              disabled={currentPage === 0 || loading}
              className="flex-1 border border-muted-zinc bg-surface-white py-2.5 rounded-md font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="font-sans text-xs text-obsidian-velvet/60 whitespace-nowrap">
              {currentPage + 1} / {Math.ceil(totalItems / itemsPerPage) || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalItems / itemsPerPage) - 1))}
              disabled={currentPage >= Math.ceil(totalItems / itemsPerPage) - 1 || loading}
              className="flex-1 border border-muted-zinc bg-surface-white py-2.5 rounded-md font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Desktop Table (md+) ─────────────────────────────────────────────── */}
      <div className="hidden md:block bg-surface-white border border-muted-zinc rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-muted-zinc font-semibold text-obsidian-velvet/50 uppercase tracking-widest text-[9px]">
                <th className="px-3 py-4 text-left whitespace-nowrap w-12">Preview</th>
                <th className="px-3 py-4 text-left whitespace-nowrap">SKU / Code</th>
                <th className="px-3 py-4 text-left whitespace-nowrap">Garment Title</th>
                <th className="px-3 py-4 text-left whitespace-nowrap">Category</th>
                <th className="px-3 py-4 text-left whitespace-nowrap">Sourcing</th>
                <th className="px-3 py-4 text-right whitespace-nowrap">Price</th>
                <th className="px-3 py-4 text-right whitespace-nowrap">Stock</th>
                <th className="px-3 py-4 text-center whitespace-nowrap">Status</th>
                <th className="px-3 py-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-zinc/60 text-obsidian-velvet">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-6 h-6 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
                      <span className="font-sans text-[10px] text-obsidian-velvet/40 tracking-wider uppercase font-semibold">
                        Loading products...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : catalog.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-obsidian-velvet/40">
                    No products found.
                  </td>
                </tr>
              ) : (
                catalog.map((item) => (
                  <tr key={item.sku} className="hover:bg-warm-linen/10 transition-colors">
                    <td className="px-3 py-4 text-left">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted-zinc/20 border border-muted-zinc/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl || "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop"}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop";
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-4 text-left font-semibold text-obsidian-velvet/85 whitespace-nowrap">{item.sku}</td>
                    <td className="px-3 py-4 text-left">
                      <span
                        className="block truncate max-w-[180px] font-serif text-sm font-light"
                        data-tooltip-id="table-tooltip"
                        data-tooltip-content={item.title}
                      >
                        {item.title}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-left whitespace-nowrap">
                      <span className="bg-warm-linen border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-bold text-obsidian-velvet/60 uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-left">
                      <span
                        className="block truncate max-w-[140px] text-obsidian-velvet/60"
                        data-tooltip-id="table-tooltip"
                        data-tooltip-content={item.sourcing}
                      >
                        {item.sourcing}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right font-semibold whitespace-nowrap">${item.price.toFixed(2)}</td>
                    <td className="px-3 py-4 text-right font-semibold whitespace-nowrap">
                      <span className={item.stock === 0 ? "text-red-500 font-bold" : "text-obsidian-velvet"}>
                        {item.stock} units
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center whitespace-nowrap">
                      <span className={`border px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => router.push(`/seller/ingestion?id=${item.id || item.sku}`)}
                          className="border border-muted-zinc bg-surface-white px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white hover:border-obsidian-velvet transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="border border-red-200 bg-red-50 px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-red-700 hover:bg-red-700 hover:text-white hover:border-red-700 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Tooltip id="table-tooltip" className="z-50" style={{ maxWidth: '300px', whiteSpace: 'normal', borderRadius: '6px', fontSize: '12px' }} />

        {/* Desktop Pagination */}
        {!loading && totalItems > 0 && (
          <div className="bg-zinc-50 border-t border-muted-zinc/80 px-6 py-4 flex items-center justify-between font-sans text-xs">
            <span className="text-obsidian-velvet/45 font-medium">
              Showing <span className="font-semibold text-obsidian-velvet">{currentPage * itemsPerPage + 1}</span> to{" "}
              <span className="font-semibold text-obsidian-velvet">
                {Math.min((currentPage + 1) * itemsPerPage, totalItems)}
              </span>{" "}
              of <span className="font-semibold text-obsidian-velvet">{totalItems}</span> products
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                disabled={currentPage === 0 || loading}
                className="border border-muted-zinc bg-surface-white px-3 py-1.5 rounded-md font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white hover:border-obsidian-velvet disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex gap-1.5 items-center px-2">
                <span className="font-bold text-obsidian-velvet">Page {currentPage + 1}</span>
                <span className="text-obsidian-velvet/30">/</span>
                <span className="text-obsidian-velvet/60">{Math.ceil(totalItems / itemsPerPage) || 1}</span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalItems / itemsPerPage) - 1))}
                disabled={currentPage >= Math.ceil(totalItems / itemsPerPage) - 1 || loading}
                className="border border-muted-zinc bg-surface-white px-3 py-1.5 rounded-md font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white hover:border-obsidian-velvet disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Delete Product"
        description="This action cannot be undone and the product will be removed from the catalog immediately."
        size="sm"
        closeOnBackdropClick={!isDeleting}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setProductToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDelete}
              disabled={isDeleting}
              loading={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 border-red-600"
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div />
      </Modal>
    </div>
  );
}
