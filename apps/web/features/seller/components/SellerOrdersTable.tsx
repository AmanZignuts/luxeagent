"use client";

import React from "react";
import { Input, Combobox } from "@/components/ui";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { MerchantOrder } from "./SellerOrderDetailView";

interface SellerOrdersTableProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  activeStatusFilter: string;
  setActiveStatusFilter: (val: string) => void;
  filteredOrders: MerchantOrder[];
  setSelectedOrderId: (id: string) => void;
  advanceOrderStatus: (orderId: string) => void;
  getStatusBadge: (status: MerchantOrder["status"]) => string;
}

export function SellerOrdersTable({
  searchTerm,
  setSearchTerm,
  activeStatusFilter,
  setActiveStatusFilter,
  filteredOrders,
  setSelectedOrderId,
  advanceOrderStatus,
  getStatusBadge,
}: SellerOrdersTableProps) {
  return (
    <div className="space-y-10 animate-in fade-in duration-300 w-full">
      {/* Page Header */}
      <div className="border-b border-muted-zinc/60 pb-6">
        <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block mb-2">
          Operations Pipeline
        </span>
        <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">
          Orders & Fulfillment
        </h1>
      </div>

      {/* Filters & Search Console Panel */}
      <div className="bg-surface-white border border-muted-zinc rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-none">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order ID, customers, or items..."
            className="py-2.5 text-xs"
          />
        </div>

        {/* Status Dropdown Filter */}
        <div className="w-full md:w-60">
          <Combobox
            options={[
              { label: "ALL ORDERS", value: "ALL" },
              { label: "IN SOURCING", value: "IN SOURCING" },
              { label: "TAILORING IN PROGRESS", value: "TAILORING IN PROGRESS" },
              { label: "QUALITY CHECK", value: "QUALITY CHECK" },
              { label: "DISPATCHED", value: "DISPATCHED" },
            ]}
            value={activeStatusFilter}
            onChange={setActiveStatusFilter}
            placeholder="Filter by Status"
            className="py-2.5 text-xs bg-surface-white font-sans text-obsidian-velvet border-muted-zinc uppercase tracking-wider font-semibold"
          />
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="bg-surface-white border border-muted-zinc rounded-xl overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-muted-zinc font-semibold text-obsidian-velvet/50 uppercase tracking-widest text-[9px]">
                <th className="px-6 py-4 text-left whitespace-nowrap">Order ID</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Customer</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Ordered Items</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Courier</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Order Value</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-zinc/60 text-obsidian-velvet">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-obsidian-velvet/40">
                    No active orders match your search or filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="hover:bg-warm-linen/10 transition-colors cursor-pointer"
                  >
                    {/* Order ID */}
                    <td className="px-6 py-5 text-left font-semibold text-obsidian-velvet/85 whitespace-nowrap w-36">
                      <span className="block truncate max-w-[128px]" data-tooltip-id="table-tooltip" data-tooltip-content={order.id}>{order.id}</span>
                    </td>

                    {/* Client */}
                    <td className="px-6 py-5 text-left w-36">
                      <span className="block truncate max-w-[128px] font-serif text-sm font-light" data-tooltip-id="table-tooltip" data-tooltip-content={order.client}>{order.client}</span>
                    </td>

                    {/* Items */}
                    <td className="px-6 py-5 text-left w-56">
                      <span
                        className="block truncate max-w-[200px] text-obsidian-velvet/70"
                        data-tooltip-id="table-tooltip"
                        data-tooltip-content={order.items}
                      >
                        {order.items}
                      </span>
                    </td>

                    {/* Courier */}
                    <td className="px-6 py-5 text-left w-44">
                      <span
                        className="block truncate max-w-[160px] text-obsidian-velvet/60"
                        data-tooltip-id="table-tooltip"
                        data-tooltip-content={order.courier}
                      >
                        {order.courier}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="px-6 py-5 text-right font-semibold whitespace-nowrap w-24">${order.total.toFixed(2)}</td>

                    {/* Status Badge */}
                    <td className="px-6 py-5 text-center whitespace-nowrap w-36">
                      <span className={`border px-2.5 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-5 text-center whitespace-nowrap w-32" onClick={(e) => e.stopPropagation()}>
                      {order.status !== "Dispatched" ? (
                        <button
                          type="button"
                          onClick={() => advanceOrderStatus(order.id)}
                          className="bg-obsidian-velvet hover:bg-obsidian-velvet/90 text-surface-white font-sans font-bold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-md transition-all active:scale-[0.97] cursor-pointer whitespace-nowrap"
                        >
                          Update Status
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold uppercase text-[9px] tracking-wider block whitespace-nowrap">
                          ✦ Complete
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Tooltip id="table-tooltip" className="z-50" style={{ maxWidth: '300px', whiteSpace: 'normal', borderRadius: '6px', fontSize: '12px' }} />
    </div>
  );
}
