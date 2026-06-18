"use client";

import React, { useState, useEffect } from "react";
import { getMerchantOrders, updateMerchantOrderStatus } from "@/lib/actions/orders";
import { toast } from "sonner";
import { Input } from "@/components/ui";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

interface MerchantOrder {
  id: string;
  date: string;
  client: string;
  items: string;
  tailorAdjustment: string;
  status: "In Sourcing" | "Tailoring in Progress" | "Quality Check" | "Dispatched";
  courier: string;
  total: number;
}

function mapDbStatusToUi(dbStatus: string): "In Sourcing" | "Tailoring in Progress" | "Quality Check" | "Dispatched" {
  switch (dbStatus) {
    case "PENDING":
    case "CONFIRMED":
      return "In Sourcing";
    case "PROCESSING":
      return "Tailoring in Progress";
    case "SHIPPED":
      return "Quality Check";
    case "DELIVERED":
      return "Dispatched";
    default:
      return "In Sourcing";
  }
}

function mapUiStatusToDb(uiStatus: string): 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' {
  switch (uiStatus) {
    case "In Sourcing":
      return "CONFIRMED";
    case "Tailoring in Progress":
      return "PROCESSING";
    case "Quality Check":
      return "SHIPPED";
    case "Dispatched":
      return "DELIVERED";
    default:
      return "CONFIRMED";
  }
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("ALL");

  const fetchOrders = async () => {
    try {
      const data = await getMerchantOrders();

      if (data) {
        const formatted = data.map((o: any) => {
          let clientName = "Anonymous Client";
          try {
            const addr = typeof o.shipping_address === "string" ? JSON.parse(o.shipping_address) : o.shipping_address;
            if (addr && addr.name) clientName = addr.name;
          } catch (e) {
            console.error("Failed to parse shipping address", e);
          }

          let itemsList = "Apparel Garment";
          try {
            const parsedItems = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
            if (Array.isArray(parsedItems)) {
              itemsList = parsedItems.map((it: any) => `${it.title || "Garment"} (${it.size || "M"}) x${it.qty || 1}`).join(", ");
            }
          } catch (e) {
            console.error("Failed to parse items", e);
          }

          let dateStr = "May 26, 2026";
          if (o.created_at) {
            dateStr = new Date(o.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            });
          }

          return {
            id: o.id,
            date: dateStr,
            client: clientName,
            items: itemsList,
            tailorAdjustment: o.notes || "Standard calibrated dimensions. Sleeves adjusted to default.",
            status: mapDbStatusToUi(o.status),
            courier: o.tracking_number ? `Carbon-Neutral Priority (${o.tracking_number})` : "Carbon-Neutral Priority",
            total: Number(o.total) || 0
          };
        });

        setOrders(formatted);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to load orders from Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const advanceOrderStatus = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    let nextStatus: MerchantOrder["status"] = order.status;
    if (order.status === "In Sourcing") nextStatus = "Tailoring in Progress";
    else if (order.status === "Tailoring in Progress") nextStatus = "Quality Check";
    else if (order.status === "Quality Check") nextStatus = "Dispatched";

    const dbStatus = mapUiStatusToDb(nextStatus);

    try {
      await updateMerchantOrderStatus(orderId, dbStatus);
      toast.success(`Order status successfully advanced to: ${nextStatus}`);
      fetchOrders();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update order status in Supabase.");
    }
  };

  const getStatusBadge = (status: MerchantOrder["status"]) => {
    switch (status) {
      case "In Sourcing":
        return "text-amber-700 bg-amber-50 border border-amber-200";
      case "Tailoring in Progress":
        return "text-indigo-700 bg-indigo-50 border border-indigo-200 animate-pulse";
      case "Quality Check":
        return "text-cyan-700 bg-cyan-50 border border-cyan-200";
      case "Dispatched":
        return "text-emerald-700 bg-emerald-50 border border-emerald-200";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      activeStatusFilter === "ALL" ||
      order.status.toUpperCase() === activeStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeOrder = orders.find((o) => o.id === selectedOrderId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-3xl mx-auto py-12 animate-in fade-in duration-300">
        <div className="bg-surface-white border border-muted-zinc rounded-xl p-12 w-full flex flex-col items-center justify-center space-y-6 shadow-sm">
          <div className="w-9 h-9 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
          <div className="text-center space-y-1.5">
            <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">
              Loading Atelier Orders
            </h3>
            <p className="font-sans text-[10px] text-obsidian-velvet/40 tracking-wider uppercase font-semibold">
              Retrieving dynamic fulfillment queue
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If in detail view, render the detail page
  if (activeOrder) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 w-full max-w-4xl mx-auto">
        {/* Header Branding Row / Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-muted-zinc/60 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedOrderId(null)}
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
        </div>        {/* Detailed Layout — single column stack */}
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

            <div className="space-y-2 pt-2 border-t border-muted-zinc/40">
              <span className="text-obsidian-velvet/40 font-semibold uppercase tracking-wider text-[9px] block">Items Ordered</span>
              <p className="bg-warm-linen/20 border border-muted-zinc/50 rounded-md p-3 text-obsidian-velvet/80 font-medium text-xs">
                {activeOrder.items}
              </p>
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

  // Master List View
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

        {/* Category Pill Filters */}
        <div className="flex flex-wrap gap-2">
          {["ALL", "IN SOURCING", "TAILORING IN PROGRESS", "QUALITY CHECK", "DISPATCHED"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatusFilter(status)}
              className={`px-3 py-1.5 border rounded-md font-sans text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${activeStatusFilter === status
                ? "bg-obsidian-velvet border-obsidian-velvet text-surface-white"
                : "border-muted-zinc bg-surface-white hover:border-obsidian-velvet/60 text-obsidian-velvet/70"
                }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
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
