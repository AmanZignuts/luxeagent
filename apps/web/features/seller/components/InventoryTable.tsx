"use client";

import React from "react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { SkuRecord } from "../lib/inventory-data";

interface InventoryTableProps {
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

export function InventoryTable({
  catalog,
  loading,
  totalItems,
  currentPage,
  itemsPerPage,
  getStatusBadge,
  onEdit,
  onDelete,
  onPageChange,
}: InventoryTableProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const FALLBACK = "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop";

  return (
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
                    <span className="font-sans text-[10px] text-obsidian-velvet/40 tracking-wider uppercase font-semibold">Loading products...</span>
                  </div>
                </td>
              </tr>
            ) : catalog.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-obsidian-velvet/40">No products found.</td>
              </tr>
            ) : (
              catalog.map((item) => (
                <tr key={item.sku} className="hover:bg-warm-linen/10 transition-colors">
                  <td className="px-3 py-4 text-left">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted-zinc/20 border border-muted-zinc/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl || FALLBACK} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                    </div>
                  </td>
                  <td className="px-3 py-4 text-left font-semibold text-obsidian-velvet/85 whitespace-nowrap">{item.sku}</td>
                  <td className="px-3 py-4 text-left">
                    <span className="block truncate max-w-[180px] font-serif text-sm font-light" data-tooltip-id="inv-tooltip" data-tooltip-content={item.title}>{item.title}</span>
                  </td>
                  <td className="px-3 py-4 text-left whitespace-nowrap">
                    <span className="bg-warm-linen border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-bold text-obsidian-velvet/60 uppercase">{item.category}</span>
                  </td>
                  <td className="px-3 py-4 text-left">
                    <span className="block truncate max-w-[140px] text-obsidian-velvet/60" data-tooltip-id="inv-tooltip" data-tooltip-content={item.sourcing}>{item.sourcing}</span>
                  </td>
                  <td className="px-3 py-4 text-right font-semibold whitespace-nowrap">${item.price.toFixed(2)}</td>
                  <td className="px-3 py-4 text-right font-semibold whitespace-nowrap">
                    <span className={item.stock === 0 ? "text-red-500 font-bold" : "text-obsidian-velvet"}>{item.stock} units</span>
                  </td>
                  <td className="px-3 py-4 text-center whitespace-nowrap">
                    <span className={`border px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${getStatusBadge(item.status)}`}>{item.status.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-3 py-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => onEdit(item.id, item.sku)} className="border border-muted-zinc bg-surface-white px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white hover:border-obsidian-velvet transition-colors cursor-pointer">Edit</button>
                      <button onClick={() => onDelete(item.id)} className="border border-red-200 bg-red-50 px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-red-700 hover:bg-red-700 hover:text-white hover:border-red-700 transition-colors cursor-pointer">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Tooltip id="inv-tooltip" className="z-50" style={{ maxWidth: "300px", whiteSpace: "normal", borderRadius: "6px", fontSize: "12px" }} />

      {!loading && totalItems > 0 && (
        <div className="bg-zinc-50 border-t border-muted-zinc/80 px-6 py-4 flex items-center justify-between font-sans text-xs">
          <span className="text-obsidian-velvet/45 font-medium">
            Showing <span className="font-semibold text-obsidian-velvet">{currentPage * itemsPerPage + 1}</span> to{" "}
            <span className="font-semibold text-obsidian-velvet">{Math.min((currentPage + 1) * itemsPerPage, totalItems)}</span>{" "}
            of <span className="font-semibold text-obsidian-velvet">{totalItems}</span> products
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(Math.max(currentPage - 1, 0))} disabled={currentPage === 0 || loading} className="border border-muted-zinc bg-surface-white px-3 py-1.5 rounded-md font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white hover:border-obsidian-velvet disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed">Previous</button>
            <div className="flex gap-1.5 items-center px-2">
              <span className="font-bold text-obsidian-velvet">Page {currentPage + 1}</span>
              <span className="text-obsidian-velvet/30">/</span>
              <span className="text-obsidian-velvet/60">{totalPages}</span>
            </div>
            <button onClick={() => onPageChange(Math.min(currentPage + 1, totalPages - 1))} disabled={currentPage >= totalPages - 1 || loading} className="border border-muted-zinc bg-surface-white px-3 py-1.5 rounded-md font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet hover:bg-obsidian-velvet hover:text-surface-white hover:border-obsidian-velvet disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
