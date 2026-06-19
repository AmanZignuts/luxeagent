"use client";

import React from "react";
import Link from "next/link";

interface DashboardRecentOrdersProps {
  loading: boolean;
  activeOrders: any[];
  statusLabels: Record<string, string>;
  statusStyle: Record<string, string>;
}

export function DashboardRecentOrders({
  loading,
  activeOrders,
  statusLabels,
  statusStyle,
}: DashboardRecentOrdersProps) {
  return (
    <div className="lg:col-span-5 bg-surface-white border border-muted-zinc rounded-xl p-8 shadow-none flex flex-col justify-between min-h-[380px]">
      <div className="space-y-4 flex-1">
        <div className="border-b border-muted-zinc/60 pb-4">
          <span className="font-sans text-[9px] tracking-widest uppercase text-obsidian-velvet/40 block mb-0.5">
            Order Queue
          </span>
          <h3 className="font-serif text-xl font-light tracking-tight text-obsidian-velvet">
            Active Orders
          </h3>
        </div>

        <div className="relative">
          <div className="space-y-3 text-xs font-sans max-h-[215px] overflow-y-auto pr-2 pb-6">
            {loading ? (
              <div className="flex items-center gap-3 py-8 justify-center">
                <div className="w-4 h-4 rounded-full border border-muted-zinc border-t-obsidian-velvet animate-spin" />
                <span className="text-obsidian-velvet/40 text-[11px]">Loading orders...</span>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="border border-dashed border-muted-zinc/60 rounded-xl p-10 text-center">
                <p className="font-sans text-[11px] text-obsidian-velvet/40 font-semibold uppercase tracking-wider">
                  No active orders
                </p>
                <p className="font-sans text-[10px] text-obsidian-velvet/30 mt-1">
                  Orders will appear here once placed
                </p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-muted-zinc/60 rounded-xl p-4 hover:border-obsidian-velvet/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-xs font-medium text-obsidian-velvet">
                          {order.id}
                        </span>
                        <span
                          className={`border px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${
                            statusStyle[order.status] ?? "text-zinc-500 bg-zinc-50 border-zinc-200"
                          }`}
                        >
                          {statusLabels[order.status] ?? order.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-obsidian-velvet/50 truncate">
                        {order.client} · {order.summary}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-sans text-xs font-semibold text-obsidian-velvet">
                        ${order.total.toFixed(2)}
                      </p>
                      <p className="font-sans text-[9px] text-obsidian-velvet/40 mt-0.5">
                        {order.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface-white to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="pt-4">
        <Link
          href="/seller/orders"
          className="w-full bg-obsidian-velvet text-surface-white font-sans font-semibold text-[10px] uppercase tracking-wider rounded-md py-3 hover:bg-obsidian-velvet/90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
        >
          <span>View All Orders</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
