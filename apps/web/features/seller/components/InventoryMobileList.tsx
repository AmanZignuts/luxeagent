"use client";

import React from "react";
import { SkuRecord } from "../lib/inventory-data";

interface InventoryMobileListProps {
  catalog: SkuRecord[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  getStatusBadge: (status: SkuRecord["status"]) => string;
  onEdit: (id?: string, sku?: string) => void;
  onDelete: (id?: string) => void;
  onPageChange: (page: number) => void;
}

export function InventoryMobileList({
  catalog,
  loading,
  totalItems,
  currentPage,
  itemsPerPage,
  getStatusBadge,
  onEdit,
  onDelete,
  onPageChange,
}: InventoryMobileListProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const FALLBACK = "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop";

  return (
    <div className="md:hidden space-y-3">
      {loading ? (
        <div className="bg-surface-white border border-muted-zinc rounded-xl p-10 flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
          <span className="font-sans text-[10px] text-obsidian-velvet/40 tracking-wider uppercase font-semibold">Loading products...</span>
        </div>
      ) : catalog.length === 0 ? (
        <div className="bg-surface-white border border-muted-zinc rounded-xl p-10 text-center">
          <p className="font-sans text-xs text-obsidian-velvet/40">No products match your filters.</p>
        </div>
      ) : (
        catalog.map((item) => (
          <div key={item.sku} className="bg-surface-white border border-muted-zinc rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted-zinc/20 border border-muted-zinc/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl || FALLBACK} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }} />
              </div>
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="font-sans text-[10px] font-bold text-obsidian-velvet/50 tracking-widest uppercase">{item.sku}</span>
                <span className={`border px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider flex-shrink-0 ${getStatusBadge(item.status)}`}>{item.status.replace(/_/g, " ")}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-serif text-base font-light text-obsidian-velvet leading-snug">{item.title}</p>
              <span className="bg-warm-linen border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-bold text-obsidian-velvet/60 uppercase inline-block">{item.category}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-muted-zinc/40 pt-3">
              <div>
                <span className="block font-sans text-[9px] text-obsidian-velvet/40 uppercase tracking-wider mb-0.5">Price</span>
                <span className="font-sans text-xs font-semibold text-obsidian-velvet">${item.price.toFixed(2)}</span>
              </div>
              <div>
                <span className="block font-sans text-[9px] text-obsidian-velvet/40 uppercase tracking-wider mb-0.5">Stock</span>
                <span className={`font-sans text-xs font-semibold ${item.stock === 0 ? "text-red-500" : "text-obsidian-velvet"}`}>{item.stock} units</span>
              </div>
              <div className="flex items-end justify-end gap-2">
                <button onClick={() => onDelete(item.id)} className="border border-red-200 bg-red-50 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-red-700 hover:bg-red-700 hover:text-white transition-colors cursor-pointer">Delete</button>
                <button onClick={() => onEdit(item.id, item.sku)} className="border border-muted-zinc bg-surface-white px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white transition-colors cursor-pointer">Edit</button>
              </div>
            </div>

            <p className="font-sans text-[10px] text-obsidian-velvet/40 border-t border-muted-zinc/40 pt-3">Sourced: {item.sourcing}</p>
          </div>
        ))
      )}

      {!loading && totalItems > 0 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button onClick={() => onPageChange(Math.max(currentPage - 1, 0))} disabled={currentPage === 0 || loading} className="flex-1 border border-muted-zinc bg-surface-white py-2.5 rounded-md font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed">← Prev</button>
          <span className="font-sans text-xs text-obsidian-velvet/60 whitespace-nowrap">{currentPage + 1} / {totalPages}</span>
          <button onClick={() => onPageChange(Math.min(currentPage + 1, totalPages - 1))} disabled={currentPage >= totalPages - 1 || loading} className="flex-1 border border-muted-zinc bg-surface-white py-2.5 rounded-md font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed">Next →</button>
        </div>
      )}
    </div>
  );
}
