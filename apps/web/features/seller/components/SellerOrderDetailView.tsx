"use client";

import React from "react";

export interface MerchantOrderItem {
  product_id: string | null;
  sku: string;
  title: string;
  size: string;
  qty: number;
  unit_price: number;
  image_url?: string;
}

export interface MerchantOrder {
  id: string;
  date: string;
  client: string;
  items: string;
  tailorAdjustment: string;
  status: "In Sourcing" | "Tailoring in Progress" | "Quality Check" | "Dispatched";
  courier: string;
  total: number;
  rawItems?: MerchantOrderItem[];
}

interface SellerOrderDetailViewProps {
  activeOrder: MerchantOrder;
  onBack: () => void;
  advanceOrderStatus: (orderId: string) => void;
  getStatusBadge: (status: MerchantOrder["status"]) => string;
}

export function SellerOrderDetailView({
  activeOrder,
  onBack,
  advanceOrderStatus,
  getStatusBadge,
}: SellerOrderDetailViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 w-full max-w-4xl mx-auto">
      {/* Header Branding Row / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-muted-zinc/60 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="border border-muted-zinc bg-surface-white hover:border-obsidian-velvet hover:bg-surface-white text-obsidian-velvet font-sans font-semibold text-xs rounded-md px-4 py-2.5 transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Orders</span>
          </button>
          <div>
            <span className="font-sans text-[9px] tracking-widest uppercase text-obsidian-velvet/40 block">Order Status Dashboard</span>
            <h1 className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet mt-0.5">{activeOrder.id}</h1>
          </div>
        </div>
        <span className={`border px-3 py-1 rounded-sm text-[8px] font-bold uppercase tracking-widest self-start sm:self-center ${getStatusBadge(activeOrder.status)}`}>
          {activeOrder.status}
        </span>
      </div>

      {/* Detailed Layout — single column stack */}
      <div className="space-y-6">
        {/* Order Overview */}
        <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 space-y-5 shadow-none">
          <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet border-b border-muted-zinc/60 pb-3">
            Order Overview
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <span className="text-obsidian-velvet/40 font-semibold uppercase tracking-wider text-[9px] block">Customer</span>
              <span className="font-medium text-obsidian-velvet">{activeOrder.client}</span>
            </div>
            <div className="space-y-1">
              <span className="text-obsidian-velvet/40 font-semibold uppercase tracking-wider text-[9px] block">Date Placed</span>
              <span className="font-medium text-obsidian-velvet">{activeOrder.date}</span>
            </div>
            <div className="space-y-1">
              <span className="text-obsidian-velvet/40 font-semibold uppercase tracking-wider text-[9px] block">Courier</span>
              <span className="font-medium text-obsidian-velvet">{activeOrder.courier}</span>
            </div>
            <div className="space-y-1">
              <span className="text-obsidian-velvet/40 font-semibold uppercase tracking-wider text-[9px] block">Order Value</span>
              <span className="font-bold text-obsidian-velvet">${activeOrder.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-muted-zinc/40">
            <span className="text-obsidian-velvet/40 font-semibold uppercase tracking-wider text-[9px] block">
              Items Ordered ({activeOrder.rawItems?.length || 0})
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrder.rawItems && activeOrder.rawItems.length > 0 ? (
                activeOrder.rawItems.map((item, index) => (
                  <div key={item.sku + index} className="flex gap-4 items-center bg-surface-white border border-muted-zinc/60 rounded-xl p-4 transition-all hover:border-obsidian-velvet/30">
                    <div className="w-16 h-16 rounded-md bg-warm-linen/30 border border-muted-zinc/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-obsidian-velvet/40">
                          <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" />
                          <path d="M50,12 L50,85" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-sans text-[8px] tracking-widest uppercase text-obsidian-velvet/40 block">SKU: {item.sku}</span>
                          <h5 className="font-serif text-xs font-semibold text-obsidian-velvet truncate max-w-[180px]">{item.title}</h5>
                        </div>
                        <div className="text-right">
                          <span className="font-sans text-xs font-bold text-obsidian-velvet block">${(item.unit_price * item.qty).toFixed(2)}</span>
                          {item.qty > 1 && (
                            <span className="font-sans text-[9px] text-obsidian-velvet/40 block">${item.unit_price.toFixed(2)} each</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="bg-warm-linen border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/60 uppercase">
                          Size: {item.size}
                        </span>
                        <span className="bg-obsidian-velvet/5 border border-obsidian-velvet/10 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/70 uppercase">
                          Qty: {item.qty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="bg-warm-linen/20 border border-muted-zinc/50 rounded-md p-3 text-obsidian-velvet/80 font-medium text-xs col-span-2">
                  {activeOrder.items}
                </p>
              )}
            </div>
          </div>

          {activeOrder.tailorAdjustment && activeOrder.tailorAdjustment !== "Standard calibrated dimensions. Sleeves adjusted to default." && (
            <div className="space-y-2">
              <span className="text-obsidian-velvet/40 font-semibold uppercase tracking-wider text-[9px] block">Order Notes</span>
              <p className="bg-warm-linen/40 border border-muted-zinc/80 rounded-md p-3 text-obsidian-velvet/60 italic leading-relaxed text-xs">
                &quot;{activeOrder.tailorAdjustment}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Fulfillment Timeline */}
        <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 space-y-6 shadow-none">
          <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet border-b border-muted-zinc/60 pb-3">
            Fulfillment Timeline
          </h3>

          <div className="flex items-start gap-0 sm:gap-4">
            {/* Steps */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              {[
                { key: "In Sourcing", label: "Sourcing", desc: "Verifying stock & materials" },
                { key: "Tailoring in Progress", label: "Processing", desc: "Order being prepared" },
                { key: "Quality Check", label: "Shipped", desc: "Out for delivery" },
                { key: "Dispatched", label: "Delivered", desc: "Order complete" },
              ].map((step, idx) => {
                const statuses = ["In Sourcing", "Tailoring in Progress", "Quality Check", "Dispatched"];
                const currentIdx = statuses.indexOf(activeOrder.status);
                const stepIdx = statuses.indexOf(step.key);
                const isCompleted = stepIdx < currentIdx;
                const isActive = stepIdx === currentIdx;
                const isPending = stepIdx > currentIdx;

                return (
                  <div key={step.key} className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 text-xs font-sans sm:text-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                      isCompleted
                        ? "bg-obsidian-velvet border-obsidian-velvet text-surface-white"
                        : isActive
                        ? "bg-warm-linen border-obsidian-velvet text-obsidian-velvet ring-4 ring-obsidian-velvet/10"
                        : "bg-surface-white border-muted-zinc text-obsidian-velvet/30"
                    }`}>
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <div>
                      <h4 className={`font-semibold uppercase text-[9px] tracking-wider ${
                        isPending ? "text-obsidian-velvet/30" : "text-obsidian-velvet"
                      }`}>{step.label}</h4>
                      <p className={`text-[9px] mt-0.5 ${isPending ? "text-obsidian-velvet/20" : "text-obsidian-velvet/50"}`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-muted-zinc/60 pt-6">
            {activeOrder.status !== "Dispatched" ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => advanceOrderStatus(activeOrder.id)}
                  className="w-full bg-obsidian-velvet text-surface-white font-sans font-bold text-xs uppercase tracking-widest rounded-md py-3 hover:bg-obsidian-velvet/90 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Advance to Next Stage</span>
                  <span>→</span>
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <span className="text-emerald-700 font-bold uppercase text-[9px] tracking-wider block">Fulfillment Complete</span>
                <span className="font-sans text-[10px] text-emerald-600/70">Order delivered and archived.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
