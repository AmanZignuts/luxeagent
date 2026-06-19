import React from "react";
import { useBag } from "@/app/(customer)/BagContext";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

interface BagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function BagDrawer({ isOpen, onClose, onCheckout }: BagDrawerProps) {
  const { bagItems, removeFromBag, updateQuantity } = useBag();

  if (!isOpen) return null;

  const subtotal = bagItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);

  const getGarmentIcon = (category?: string) => {
    const lower = (category || "").toLowerCase();
    if (lower.includes("trouser")) {
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-obsidian-velvet">
          <path d="M35,15 L65,15 L70,85 L52,85 L50,45 L48,85 L30,85 Z" />
        </svg>
      );
    } else if (lower.includes("evening") || lower.includes("dress")) {
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-obsidian-velvet">
          <path d="M35,15 L32,30 L25,85 L75,85 L68,30 L65,15 Z" />
          <path d="M35,15 Q50,22 65,15" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-obsidian-velvet">
        <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" />
        <path d="M50,12 L50,85" />
      </svg>
    );
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-obsidian-velvet/10 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-surface-white border-l border-muted-zinc z-50 p-6 flex flex-col justify-between shadow-none animate-in slide-in-from-right duration-300">
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-muted-zinc/60 pb-4 mb-5">
            <div>
              <span className="font-sans text-[9px] tracking-widest uppercase text-obsidian-velvet/40 block mb-0.5">
                Your Curation
              </span>
              <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">
                Capsule Bag Curation
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet flex items-center justify-center font-sans text-xs rounded transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {bagItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-3">
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 text-obsidian-velvet/20">
                <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" />
                <line x1="25" y1="85" x2="75" y2="85" />
              </svg>
              <p className="font-sans text-xs text-obsidian-velvet/40 leading-relaxed max-w-[220px]">
                Your curation capsule is empty. Return to the shop feed to select garments.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pr-1">
              {bagItems.map((item, idx) => (
                <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4 border-b border-muted-zinc/40 pb-4 items-center">
                  <div className="w-12 h-12 rounded-md border border-muted-zinc/40 overflow-hidden flex-shrink-0 relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-warm-linen/40 flex items-center justify-center">
                        {getGarmentIcon(item.category || item.title)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-sans text-[8px] tracking-widest uppercase text-obsidian-velvet/40 block">
                      {item.sku} — {item.category}
                    </span>
                    <h4 className="font-serif text-xs font-medium text-obsidian-velvet truncate mb-1">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="bg-warm-linen border border-muted-zinc/80 px-2 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/60 uppercase">
                        Fit: {item.size}
                      </span>
                      
                      <div className="flex items-center border border-muted-zinc rounded bg-warm-linen/10 overflow-hidden">
                        <button
                          type="button"
                          disabled={(item.quantity || 1) <= 1}
                          onClick={() => updateQuantity(item.id, item.size, -1)}
                          className="px-2 py-0.5 hover:bg-muted-zinc/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed text-obsidian-velvet/85 text-[10px] font-bold border-none transition-colors cursor-pointer"
                          data-tooltip-id="bag-tooltip"
                          data-tooltip-content="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="px-2 text-[9px] font-sans font-semibold text-obsidian-velvet/90">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          disabled={(item.quantity || 1) >= (item.stockBySize?.[item.size] ?? 100)}
                          onClick={() => updateQuantity(item.id, item.size, 1)}
                          className="px-2 py-0.5 hover:bg-muted-zinc/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed text-obsidian-velvet/85 text-[10px] font-bold border-none transition-colors cursor-pointer"
                          data-tooltip-id="bag-tooltip"
                          data-tooltip-content={(item.quantity || 1) >= (item.stockBySize?.[item.size] ?? 100) ? `Only ${item.stockBySize?.[item.size] ?? 100} units available in stock` : "Increase quantity"}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="font-sans text-xs font-semibold block text-obsidian-velvet">
                      ${item.price}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromBag(item.id, item.size)}
                      className="text-red-500 hover:text-red-700 border-none bg-transparent cursor-pointer p-1 transition-colors flex items-center justify-center ml-auto"
                      title="Remove item"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-muted-zinc/60 pt-4 space-y-4 bg-surface-white">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-sans text-obsidian-velvet/60">
              <span>Subtotal Curation</span>
              <span className="font-semibold text-obsidian-velvet">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-sans text-obsidian-velvet/60">
              <span>Carbon-Neutral Courier</span>
              <span className="font-semibold text-obsidian-velvet">Complimentary</span>
            </div>
            <div className="flex justify-between items-center text-obsidian-velvet border-t border-muted-zinc/40 pt-2">
              <span className="font-serif text-sm">Total Curation Capital</span>
              <span className="font-sans text-sm font-bold">${subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onCheckout}
              disabled={bagItems.length === 0}
              className="w-full bg-obsidian-velvet text-surface-white font-sans font-semibold text-xs rounded-md py-3 hover:bg-obsidian-velvet/90 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-none flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Express Checkout</span>
              <span className="text-[10px]">→</span>
            </button>
            <p className="font-sans text-[9px] text-obsidian-velvet/40 text-center leading-relaxed">
              Compiles items dynamically for transaction ledger authorization.
            </p>
          </div>
        </div>
      </div>
      <Tooltip id="bag-tooltip" className="z-50" style={{ borderRadius: '6px', fontSize: '10px', padding: '6px 10px' }} />
    </>
  );
}
