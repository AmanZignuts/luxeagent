"use client";

import React from "react";
import { BagItem } from "@/app/(customer)/BagContext";
import { Button } from "@/components/ui/button";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

interface OrderSummaryProps {
  activeItems: BagItem[];
  isBuyNow: boolean;
  activeTab: "customer" | "payment";
  subtotal: number;
  totalItems: number;
  deliveryFee: number;
  total: number;
  isAuthorizing: boolean;
  onContinueToPayment: () => void;
  onSubmit: () => void;
  onRemoveItem: (id: string, size: string) => void;
  onUpdateQuantity: (id: string, size: string, delta: number) => void;
}

export function OrderSummary({
  activeItems,
  isBuyNow,
  activeTab,
  subtotal,
  totalItems,
  deliveryFee,
  total,
  isAuthorizing,
  onContinueToPayment,
  onSubmit,
  onRemoveItem,
  onUpdateQuantity,
}: OrderSummaryProps) {
  return (
    <div className="bg-surface-white border border-muted-zinc/60 rounded-[20px] p-6 shadow-sm">
      <h3 className="font-serif text-[24px] font-light text-obsidian-velvet tracking-tight mb-1">Current Order</h3>
      <p className="font-sans text-xs font-medium text-obsidian-velvet/40 mb-7">
        Verify your shopping bag contents and sizing parameters.
      </p>

      <div className={`space-y-4 mb-8 ${activeItems.length > 3 ? "max-h-[320px] overflow-y-auto pr-1" : ""}`}>
        {activeItems.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex items-center gap-4 bg-warm-linen/40 border border-muted-zinc/40 p-2.5 rounded-[14px]"
          >
            <div className="w-[60px] h-[60px] rounded-lg bg-surface-white overflow-hidden flex-shrink-0 border border-muted-zinc/10">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 py-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-sans text-[13px] font-bold text-obsidian-velvet leading-tight">
                  {item.title}
                </h4>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id, item.size)}
                  className="text-red-500 hover:text-red-700 transition-colors p-0.5 cursor-pointer flex-shrink-0 border-none bg-transparent"
                  title="Remove item"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <p className="font-sans text-[11px] font-medium text-obsidian-velvet/50 mt-2">
                Size: {item.size} | Qty: {item.quantity}
              </p>
            </div>
            <div className="flex flex-col items-end justify-between self-stretch py-1 flex-shrink-0">
              <span className="font-sans text-[13px] font-bold text-obsidian-velvet">
                ${(item.price * (item.quantity || 1)).toFixed(2)}
              </span>
              <div className="flex items-center gap-2 bg-surface-white border border-muted-zinc/50 rounded-md px-1.5 py-0.5 shadow-sm mt-auto">
                <button
                  type="button"
                  className="w-4 h-4 flex items-center justify-center font-bold text-obsidian-velvet/60 cursor-pointer hover:text-obsidian-velvet transition-colors"
                  onClick={() => onUpdateQuantity(item.id, item.size, -1)}
                  data-tooltip-id="qty-tooltip"
                  data-tooltip-content="Decrease quantity"
                >
                  -
                </button>
                <span className="font-sans text-[11px] font-bold w-3 text-center">{item.quantity}</span>
                <button
                  type="button"
                  disabled={(item.quantity || 1) >= (item.stockBySize?.[item.size] ?? 100)}
                  className="w-4 h-4 flex items-center justify-center font-bold text-obsidian-velvet/60 cursor-pointer hover:text-obsidian-velvet transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed border-none bg-transparent"
                  onClick={() => onUpdateQuantity(item.id, item.size, 1)}
                  data-tooltip-id="qty-tooltip"
                  data-tooltip-content={(item.quantity || 1) >= (item.stockBySize?.[item.size] ?? 100) ? `Only ${item.stockBySize?.[item.size] ?? 100} units available in stock` : "Increase quantity"}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-muted-zinc/50 pt-5 pb-6">
        <div className="flex items-center justify-between mb-5">
          <span className="font-sans text-base font-bold text-obsidian-velvet">Subtotal</span>
          <span className="font-sans text-[17px] font-bold text-obsidian-velvet">${subtotal.toFixed(2)}</span>
        </div>
        <div className="space-y-3 font-sans text-xs font-medium text-obsidian-velvet/50">
          <div className="flex justify-between">
            <span>Items</span>
            <span className="text-obsidian-velvet/80 font-bold">{totalItems}x</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Service</span>
            <span className="text-obsidian-velvet/80 font-bold">${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Vat (0%)</span>
            <span className="text-obsidian-velvet/80 font-bold">$0.00</span>
          </div>
        </div>
      </div>

      {activeTab === "customer" ? (
        <Button type="button" variant="primary" size="lg" onClick={onContinueToPayment} className="w-full">
          Continue to Payment
        </Button>
      ) : (
        <Button
          type="button"
          variant="primary"
          size="lg"
          loading={isAuthorizing}
          disabled={isAuthorizing}
          onClick={onSubmit}
          className="w-full"
        >
          Pay ${total.toFixed(2)}
        </Button>
      )}
      <Tooltip id="qty-tooltip" className="z-50" style={{ borderRadius: '6px', fontSize: '10px', padding: '6px 10px' }} />
    </div>
  );
}
