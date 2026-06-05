"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useBag } from "../../(customer)/BagContext";

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

export function ConciergeBagDrawer() {
  const {
    bagItems,
    removeFromBag,
    updateQuantity,
    isBagDrawerOpen,
    setIsBagDrawerOpen,
  } = useBag();

  const subtotal = bagItems.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  return (
    <AnimatePresence>
      {isBagDrawerOpen && (
        <>
          {/* Backdrop Mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-obsidian-velvet/15 backdrop-blur-[2px] z-[60]"
            onClick={() => setIsBagDrawerOpen(false)}
            aria-hidden
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-[380px] bg-surface-white border-l border-muted-zinc z-[70] flex flex-col shadow-none"
            role="dialog"
            aria-label="Shopping bag"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-muted-zinc/60 flex-shrink-0">
              <div>
                <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/35 block">
                  Your capsule
                </span>
                <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">
                  Styling bag
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBagDrawerOpen(false)}
                className="w-8 h-8 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/70 flex items-center justify-center font-sans text-sm rounded-md transition-colors cursor-pointer bg-transparent"
                aria-label="Close bag"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
              {bagItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
                  <p className="font-sans text-xs text-obsidian-velvet/45 leading-relaxed max-w-[220px]">
                    Your bag is empty. Curate pieces from the panel or ask the concierge to add items.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {bagItems.map((item, idx) => (
                    <li
                      key={`${item.id}-${item.size}-${idx}`}
                      className="flex gap-3 border-b border-muted-zinc/40 pb-4 last:border-0"
                    >
                      <div className="w-14 h-[4.5rem] rounded-lg border border-muted-zinc/40 overflow-hidden flex-shrink-0 bg-warm-linen/30">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-warm-linen/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-sans text-[7px] tracking-widest uppercase text-obsidian-velvet/35 block truncate">
                          {item.sku}
                        </span>
                        <h4 className="font-serif text-xs font-medium text-obsidian-velvet line-clamp-2 leading-snug mt-0.5">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="bg-warm-linen border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[7px] font-bold uppercase text-obsidian-velvet/55">
                            {item.size}
                          </span>
                          <div className="flex items-center border border-muted-zinc rounded-md overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.size, -1)}
                              className="px-2 py-0.5 text-[10px] font-bold text-obsidian-velvet/80 hover:bg-warm-linen cursor-pointer border-none bg-transparent"
                            >
                              −
                            </button>
                            <span className="px-2 text-[9px] font-semibold text-obsidian-velvet min-w-[1.25rem] text-center">
                              {item.quantity || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.size, 1)}
                              className="px-2 py-0.5 text-[10px] font-bold text-obsidian-velvet/80 hover:bg-warm-linen cursor-pointer border-none bg-transparent"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="font-sans text-xs font-bold text-obsidian-velvet">
                          {formatPrice(item.price * (item.quantity || 1))}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromBag(item.id, item.size)}
                          className="font-sans text-[8px] uppercase tracking-wider text-obsidian-velvet/40 hover:text-red-600 border-none bg-transparent cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex-shrink-0 border-t border-muted-zinc/60 px-5 py-4 space-y-3 bg-surface-white">
              <div className="flex justify-between items-center">
                <span className="font-serif text-sm text-obsidian-velvet">Subtotal</span>
                <span className="font-sans text-sm font-bold text-obsidian-velvet">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsBagDrawerOpen(false)}
                className="w-full border border-muted-zinc bg-warm-linen/30 text-obsidian-velvet font-sans font-bold text-[9px] uppercase tracking-wider rounded-xl py-3 hover:border-obsidian-velvet/50 transition-all cursor-pointer"
              >
                Continue styling
              </button>
              <Link
                href="/checkout"
                className="block w-full text-center bg-obsidian-velvet text-surface-white font-sans font-bold text-[9px] uppercase tracking-wider rounded-xl py-3 hover:bg-obsidian-velvet/90 transition-all"
              >
                Proceed to checkout →
              </Link>
              <p className="font-sans text-[8px] text-obsidian-velvet/35 text-center leading-relaxed">
                Checkout opens in the shop flow. Your concierge chat stays here when you return.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
