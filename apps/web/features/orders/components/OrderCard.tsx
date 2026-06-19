"use client";

import React from "react";
import Link from "next/link";

interface DossierItem {
  sku: string;
  title: string;
  price: number;
  size: string;
  calibrationNote: string;
  category: string;
  imageUrl?: string;
  svgIcon?: React.ReactNode;
}

interface HistoricalOrder {
  id: string;
  date: string;
  total: number;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "ALL";
  courier: string;
  hash: string;
  items: DossierItem[];
}

const GarmentSVG = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-obsidian-velvet">
    <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" /><path d="M50,12 L50,85" />
  </svg>
);

interface OrderItemCardProps { item: DossierItem; }
export function OrderItemCard({ item }: OrderItemCardProps) {
  return (
    <div className="flex gap-4 items-center bg-surface-white border border-muted-zinc/60 rounded-xl p-4">
      <div className="w-12 h-12 rounded-md bg-warm-linen/40 border border-muted-zinc/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" /> : (item.svgIcon || <GarmentSVG />)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="font-sans text-[8px] tracking-widest uppercase text-obsidian-velvet/40 block">{item.category} — {item.sku}</span>
            <h5 className="font-serif text-xs font-semibold text-obsidian-velvet">{item.title}</h5>
          </div>
          <span className="font-sans text-xs font-bold text-obsidian-velvet">${item.price.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <span className="w-fit self-start bg-warm-linen border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/60 uppercase">Selected Fit: {item.size}</span>
          <p className="font-sans text-[10px] text-obsidian-velvet/60 italic leading-relaxed">&quot;{item.calibrationNote}&quot;</p>
        </div>
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: HistoricalOrder;
  isExpanded: boolean;
  onToggle: () => void;
  getStatusStyle: (status: any) => string;
  statusLabel: string;
}

export function OrderCard({ order, isExpanded, onToggle, getStatusStyle, statusLabel }: OrderCardProps) {
  const previewImages = order.items.slice(0, 5);

  return (
    <div className="bg-surface-white border border-muted-zinc rounded-xl overflow-hidden shadow-none transition-all duration-200">
      {/* Collapsible Header */}
      <div onClick={onToggle} className="px-6 pt-5 pb-4 cursor-pointer hover:bg-warm-linen/10 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-3">
              <span className="font-serif text-lg text-obsidian-velvet font-medium">{order.id}</span>
              <span className="text-[10px] font-sans text-obsidian-velvet/40 font-semibold">{order.date}</span>
            </div>
            <p className="font-sans text-[10px] text-obsidian-velvet/40 tracking-wider">Order Reference: #{order.hash}</p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="font-sans text-sm font-bold text-obsidian-velvet">${order.total.toFixed(2)}</span>
            <div className="flex items-center gap-3">
              <span className={`border px-2.5 py-0.5 rounded-sm text-[9px] font-sans font-bold uppercase tracking-wider ${getStatusStyle(order.status)}`}>{statusLabel}</span>
              <span className="text-xs text-obsidian-velvet/40 font-bold font-sans w-4 text-center select-none">{isExpanded ? "—" : "+"}</span>
            </div>
          </div>
        </div>

        {/* Preview images when collapsed */}
        {!isExpanded && previewImages.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-2">
              {previewImages.map((item, idx) => (
                <div key={item.sku + idx} className="w-9 h-9 rounded-md border-2 border-surface-white bg-warm-linen/40 overflow-hidden flex-shrink-0 shadow-sm" style={{ zIndex: previewImages.length - idx }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" /> : (
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full p-2 text-obsidian-velvet/30">
                      <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" /><path d="M50,12 L50,85" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
            <span className="text-[10px] font-sans text-obsidian-velvet/40">{order.items.length} item{order.items.length !== 1 ? "s" : ""}{order.items.length > 5 ? ` · +${order.items.length - 5} more` : ""}</span>
          </div>
        )}
      </div>

      {/* Expanded Detail Section */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-muted-zinc/40 space-y-6 bg-zinc-50/50 animate-in fade-in duration-200">
          <div className="space-y-4">
            <h4 className="font-sans text-[10px] font-bold tracking-widest uppercase text-obsidian-velvet/50">Items Ordered</h4>
            <div className="space-y-4">{order.items.map((item) => <OrderItemCard key={item.sku} item={item} />)}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-muted-zinc/40 text-xs font-sans">
            <div>
              <span className="font-bold tracking-widest text-[9px] uppercase text-obsidian-velvet/40 block mb-1">Shipping &amp; Delivery</span>
              <p className="text-obsidian-velvet/70">Shipping Carrier: {order.courier}</p>
              <p className="text-obsidian-velvet/70">Delivery Method: Carbon-Neutral Express</p>
            </div>
            <div>
              <span className="font-bold tracking-widest text-[9px] uppercase text-obsidian-velvet/40 block mb-1">Logistics Protocol</span>
              <p className="text-obsidian-velvet/70">Fulfillment Status: {statusLabel}</p>
              <p className="text-obsidian-velvet/70">Payment Status: Paid &amp; Confirmed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrdersEmptyState() {
  return (
    <div className="text-center py-20 bg-surface-white border border-muted-zinc rounded-xl p-8 flex flex-col items-center justify-center space-y-4">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 text-obsidian-velvet/20">
        <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" /><line x1="25" y1="85" x2="75" y2="85" />
      </svg>
      <p className="font-sans text-sm text-obsidian-velvet/60">No orders found. Explore our luxury coordinates to begin curating your capsule lookbook.</p>
      <Link href="/shop/catalog" className="inline-flex items-center justify-center font-sans font-semibold tracking-wider uppercase bg-[#09090B] text-white hover:bg-[#09090B]/90 px-6 py-3 text-xs rounded-md transition-colors">Explore Catalog</Link>
    </div>
  );
}
