"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Modal, Button, Combobox, Input } from "@/components/ui";
import { SkuRecord, FALLBACK_IMAGES, STATIC_CATALOG } from "./lib/inventory-data";
import { InventoryTable } from "./components/InventoryTable";
import { InventoryMobileList } from "./components/InventoryMobileList";

// Cache variables to prevent strict mode and navigation double-fetches
let cachedCategoriesList: string[] | null = null;
let cachedUserId: string | null = null;
let userPromise: any = null;
let categoriesPromise: any = null;
let lastFetchHash = "";
let lastFetchTime = 0;

export default function InventoryLedgerPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [categoriesList, setCategoriesList] = useState<string[]>(["ALL"]);

  const [catalog, setCatalog] = useState<SkuRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const userIdRef = React.useRef<string | null>(null);

  // Search debouncer (only triggers if search term actually changes)
  useEffect(() => {
    if (searchTerm === debouncedSearch) return;
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(0); }, 450);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // Load distinct categories from DB (uses cached categories if already fetched)
  useEffect(() => {
    if (cachedCategoriesList) {
      setCategoriesList(cachedCategoriesList);
      return;
    }
    let active = true;
    async function loadUniqueCategories() {
      try {
        const supabase = createClient();
        if (!categoriesPromise) {
          categoriesPromise = supabase.from("products").select("category");
        }
        const { data } = await categoriesPromise;
        if (data && active) {
          const unique = Array.from(new Set(data.map((p: any) => (p.category || "").toUpperCase()))).filter(Boolean);
          const result = Array.from(new Set(["ALL", ...unique])) as string[];
          cachedCategoriesList = result;
          setCategoriesList(result);
        }
      } catch (e) {
        console.error("Failed to load unique categories from DB", e);
        categoriesPromise = null; // Reset on error to allow retry
      }
    }
    loadUniqueCategories();
    return () => { active = false; };
  }, []);

  // Fetch catalog from Supabase
  useEffect(() => {
    let active = true;
    setLoading(true);
    async function fetchCatalog() {
      try {
        const supabase = createClient();
        let userId = userIdRef.current || cachedUserId;
        if (!userId) {
          if (!userPromise) {
            userPromise = supabase.auth.getUser();
          }
          const { data: { user } } = await userPromise;
          if (user && active) {
            userId = user.id;
            userIdRef.current = user.id;
            cachedUserId = user.id;
          }
        }

        // Crucial: check if this effect instance is still active/mounted
        if (!active) return;

        // Deduplicate simultaneous or strict mode double fetches
        const currentHash = `${debouncedSearch}-${selectedCategory}-${currentPage}-${userId}-${refreshTrigger}`;
        const now = Date.now();
        if (currentHash === lastFetchHash && now - lastFetchTime < 150) {
          setLoading(false);
          return;
        }
        lastFetchHash = currentHash;
        lastFetchTime = now;

        let query = supabase.from("products").select("*", { count: "exact" });
        if (userId) { query = query.or(`seller_id.eq.${userId},seller_id.is.null`); } else { query = query.is("seller_id", null); }
        if (debouncedSearch.trim() !== "") { const val = `%${debouncedSearch.trim()}%`; query = query.or(`title.ilike.${val},sku.ilike.${val},material_composition.ilike.${val}`); }
        if (selectedCategory !== "ALL") { query = query.ilike("category", selectedCategory); }

        const from = currentPage * itemsPerPage;
        const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, from + itemsPerPage - 1);
        if (error) throw error;
        if (!active) return;

        let dbProducts: SkuRecord[] = [];
        if (data && data.length > 0) {
          dbProducts = data.map((p: any) => ({
            id: p.id, sku: p.sku, title: p.title,
            category: p.category || "Ready-to-Wear",
            stock: p.stock_by_size ? Object.values(p.stock_by_size).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number : 10,
            price: Number(p.price) || 0,
            sourcing: p.material_composition || "Premium Sourced",
            material: p.material_composition || "Selected Blend",
            status: "ACTIVE" as const,
            imageUrl: p.image_urls?.length > 0
              ? p.image_urls[0]
              : FALLBACK_IMAGES[Math.abs((p.sku || p.id || "").split("").reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % FALLBACK_IMAGES.length],
          }));
        } else if (currentPage === 0 && debouncedSearch.trim() === "" && selectedCategory === "ALL") {
          dbProducts = STATIC_CATALOG;
        }

        setCatalog(dbProducts);
        setTotalItems(count || dbProducts.length);
      } catch (e) {
        console.error("Failed to query catalog from Supabase", e);
      } finally { if (active) setLoading(false); }
    }
    fetchCatalog();
    return () => { active = false; };
  }, [debouncedSearch, selectedCategory, currentPage, refreshTrigger]);

  const handleDelete = (id?: string) => {
    if (!id) return;
    if (id.startsWith("static-")) { toast.error("Cannot delete static placeholder items."); return; }
    setProductToDelete(id);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/delete?id=${productToDelete}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to delete product from server");
      toast.success("Product deleted successfully");
      setProductToDelete(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete product");
    } finally { setIsDeleting(false); }
  };

  const getStatusBadge = (status: SkuRecord["status"]) => {
    switch (status) {
      case "ACTIVE": return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "OUT_OF_STOCK": return "text-red-700 bg-red-50 border-red-200";
      case "PENDING": return "text-amber-700 bg-amber-50 border-amber-200";
    }
  };

  const sharedTableProps = {
    catalog, loading, totalItems, currentPage, itemsPerPage,
    getStatusBadge,
    onEdit: (id?: string, sku?: string) => router.push(`/seller/ingestion?id=${id || sku}`),
    onDelete: handleDelete,
    onPageChange: setCurrentPage,
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300 w-full max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="border-b border-muted-zinc/60 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block mb-2">Product Catalog</span>
          <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">Product Inventory</h1>
        </div>
        <div>
          <Link href="/seller/ingestion" className="bg-obsidian-velvet text-surface-white font-sans font-semibold text-xs rounded-md px-5 py-3 hover:bg-obsidian-velvet/90 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-none">
            <span>✦ Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-white border border-muted-zinc rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="relative w-full md:w-80">
          <Input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search SKUs, materials, or sourcing..." className="py-2.5 text-xs" />
        </div>
        <div className="w-full md:w-56">
          <Combobox
            options={categoriesList.map((c) => ({ label: c === "ALL" ? "All Categories" : c, value: c }))}
            value={selectedCategory}
            onChange={(v) => { setSelectedCategory(v); setCurrentPage(0); }}
          />
        </div>
      </div>

      <InventoryMobileList {...sharedTableProps} />
      <InventoryTable {...sharedTableProps} />

      <Modal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Delete Product"
        description="This action cannot be undone and the product will be removed from the catalog immediately."
        size="sm"
        closeOnBackdropClick={!isDeleting}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" disabled={isDeleting} onClick={() => setProductToDelete(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={confirmDelete} disabled={isDeleting} loading={isDeleting} className="bg-red-600 text-white hover:bg-red-700 border-red-600">Confirm Delete</Button>
          </div>
        }
      >
        <div />
      </Modal>
    </div>
  );
}
