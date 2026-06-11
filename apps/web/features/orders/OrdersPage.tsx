"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  status: DbStatus;
  courier: string;
  hash: string;
  items: DossierItem[];
}

type DbStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "ALL";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<DbStatus, string> = {
  ALL: "All Orders",
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const FILTER_ORDER: DbStatus[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function getStatusStyle(status: DbStatus): string {
  switch (status) {
    case "PENDING":
      return "text-amber-700 bg-amber-50 border border-amber-200";
    case "CONFIRMED":
      return "text-sky-700 bg-sky-50 border border-sky-200";
    case "PROCESSING":
      return "text-violet-700 bg-violet-50 border border-violet-200";
    case "SHIPPED":
      return "text-emerald-700 bg-emerald-50 border border-emerald-200";
    case "DELIVERED":
      return "text-zinc-500 bg-zinc-50 border border-zinc-200";
    case "CANCELLED":
      return "text-red-600 bg-red-50 border border-red-200";
    default:
      return "text-zinc-500 bg-zinc-50 border border-zinc-200";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PurchaseDossierPage() {
  const [orders, setOrders] = useState<HistoricalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  // Set of expanded order IDs (independent, multi-open)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  // Active filter tab — one of the DB status values or "ALL"
  const [activeFilter, setActiveFilter] = useState<DbStatus>("ALL");
  // Which statuses actually appear in the user's orders
  const [presentStatuses, setPresentStatuses] = useState<Set<DbStatus>>(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: dbOrders, error: ordersError } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (ordersError) throw ordersError;

          if (dbOrders && dbOrders.length > 0) {
            const statuses = new Set<DbStatus>();

            const formatted: HistoricalOrder[] = dbOrders.map((o) => {
              let parsedItems: any[] = [];
              try {
                parsedItems =
                  typeof o.items === "string"
                    ? JSON.parse(o.items)
                    : (o.items as any);
              } catch {
                parsedItems = (o.items as any) || [];
              }

              const dossierItems: DossierItem[] = (
                Array.isArray(parsedItems) ? parsedItems : []
              ).map((item: any) => {
                const category = item.category || "Atelier Curation";
                return {
                  sku: item.sku || "LA-ACC-000",
                  title: item.title || "Luxury Garment",
                  price: Number(item.unit_price) || 0,
                  size: item.size || "M",
                  calibrationNote:
                    o.notes ||
                    (category.toLowerCase().includes("trouser") ||
                    item.title?.toLowerCase().includes("trouser")
                      ? "Bespoke adjustment: -1.5cm leg hem tailored automatically."
                      : "Standard drape fit aligned with style persona preference."),
                  category: category,
                  imageUrl: item.image_url || "",
                };
              });

              const dateStr = o.created_at
                ? new Date(o.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Just Now";

              const dbStatus = (o.status as DbStatus) || "PENDING";
              statuses.add(dbStatus);

              return {
                id: `LA-ORD-${o.id.substring(0, 6).toUpperCase()}`,
                date: dateStr,
                total: Number(o.total) || 0,
                status: dbStatus,
                courier: o.tracking_number
                  ? `Carbon-Neutral Priority (${o.tracking_number})`
                  : "Carbon-Neutral Priority",
                hash: o.id.substring(0, 8),
                items: dossierItems,
              };
            });

            setOrders(formatted);
            setPresentStatuses(statuses);
            // All collapsed by default — expandedOrders stays empty Set
          } else {
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Failed to load customer orders data:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const toggleOrder = (id: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Only show filter tabs that the user actually has orders for
  const visibleFilters = FILTER_ORDER.filter(
    (s) => s === "ALL" || presentStatuses.has(s)
  );

  const filteredOrders =
    activeFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === activeFilter);

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
        <span className="font-serif text-sm text-obsidian-velvet/40 tracking-wider uppercase">
          Assembling Purchase Dossier...
        </span>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-muted-zinc/60 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block mb-2">
            Your Orders
          </span>
          <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">
            Order History
          </h1>
        </div>
        <div className="text-xs font-sans font-semibold uppercase tracking-wider">
          <Link
            href="/shop"
            className="border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet bg-surface-white px-4 py-2.5 rounded-md transition-colors inline-block"
          >
            ← Return to Catalog
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      {visibleFilters.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {visibleFilters.map((status) => {
            const isActive = activeFilter === status;
            return (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`
                  px-4 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest
                  border transition-all duration-150
                  ${
                    isActive
                      ? status === "ALL"
                        ? "bg-obsidian-velvet text-surface-white border-obsidian-velvet"
                        : `${getStatusStyle(status)} opacity-100`
                      : "bg-surface-white text-obsidian-velvet/50 border-muted-zinc hover:border-obsidian-velvet/40 hover:text-obsidian-velvet"
                  }
                `}
              >
                {STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-surface-white border border-muted-zinc rounded-xl p-8 flex flex-col items-center justify-center space-y-4">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 text-obsidian-velvet/20">
              <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" />
              <line x1="25" y1="85" x2="75" y2="85" />
            </svg>
            <p className="font-sans text-sm text-obsidian-velvet/60">
              No orders found. Explore our luxury coordinates to begin curating your capsule lookbook.
            </p>
            <Link
              href="/shop/catalog"
              className="inline-flex items-center justify-center font-sans font-semibold tracking-wider uppercase bg-[#09090B] text-white hover:bg-[#09090B]/90 px-6 py-3 text-xs rounded-md transition-colors"
            >
              Explore Catalog
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrders.has(order.id);
            // Product image previews (up to 5 shown in collapsed state)
            const previewImages = order.items.slice(0, 5);

            return (
              <div
                key={order.id}
                className="bg-surface-white border border-muted-zinc rounded-xl overflow-hidden shadow-none transition-all duration-200"
              >
                {/* ── Clickable Header ───────────────────────────────────── */}
                <div
                  onClick={() => toggleOrder(order.id)}
                  className="px-6 pt-5 pb-4 cursor-pointer hover:bg-warm-linen/10 transition-colors"
                >
                  {/* Top row: ID + meta + total + status + toggle */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-lg text-obsidian-velvet font-medium">
                          {order.id}
                        </span>
                        <span className="text-[10px] font-sans text-obsidian-velvet/40 font-semibold">
                          {order.date}
                        </span>
                      </div>
                      <p className="font-sans text-[10px] text-obsidian-velvet/40 tracking-wider">
                        Order Reference: #{order.hash}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="font-sans text-sm font-bold text-obsidian-velvet">
                        ${order.total.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`border px-2.5 py-0.5 rounded-sm text-[9px] font-sans font-bold uppercase tracking-wider ${getStatusStyle(order.status)}`}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span className="text-xs text-obsidian-velvet/40 font-bold font-sans w-4 text-center select-none">
                          {isExpanded ? "—" : "+"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preview images row — only when collapsed */}
                  {!isExpanded && previewImages.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {previewImages.map((item, idx) => (
                          <div
                            key={item.sku + idx}
                            className="w-9 h-9 rounded-md border-2 border-surface-white bg-warm-linen/40 overflow-hidden flex-shrink-0 shadow-sm"
                            style={{ zIndex: previewImages.length - idx }}
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg
                                viewBox="0 0 100 100"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                className="w-full h-full p-2 text-obsidian-velvet/30"
                              >
                                <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" />
                                <path d="M50,12 L50,85" />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-sans text-obsidian-velvet/40">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        {order.items.length > 5 ? ` · +${order.items.length - 5} more` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Expanded Detail Section ────────────────────────────── */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-muted-zinc/40 space-y-6 bg-zinc-50/50 animate-in fade-in duration-200">
                    <div className="space-y-4">
                      <h4 className="font-sans text-[10px] font-bold tracking-widest uppercase text-obsidian-velvet/50">
                        Items Ordered
                      </h4>

                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div
                            key={item.sku}
                            className="flex gap-4 items-center bg-surface-white border border-muted-zinc/60 rounded-xl p-4"
                          >
                            <div className="w-12 h-12 rounded-md bg-warm-linen/40 border border-muted-zinc/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                item.svgIcon || (
                                  <svg
                                    viewBox="0 0 100 100"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                    className="w-8 h-8 text-obsidian-velvet"
                                  >
                                    <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" />
                                    <path d="M50,12 L50,85" />
                                  </svg>
                                )
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="font-sans text-[8px] tracking-widest uppercase text-obsidian-velvet/40 block">
                                    {item.category} — {item.sku}
                                  </span>
                                  <h5 className="font-serif text-xs font-semibold text-obsidian-velvet">
                                    {item.title}
                                  </h5>
                                </div>
                                <span className="font-sans text-xs font-bold text-obsidian-velvet">
                                  ${item.price.toFixed(2)}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-col gap-1">
                                <span className="w-fit self-start bg-warm-linen border border-muted-zinc/60 px-1.5 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/60 uppercase">
                                  Selected Fit: {item.size}
                                </span>
                                <p className="font-sans text-[10px] text-obsidian-velvet/60 italic leading-relaxed">
                                  &quot;{item.calibrationNote}&quot;
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Logistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-muted-zinc/40 text-xs font-sans">
                      <div>
                        <span className="font-bold tracking-widest text-[9px] uppercase text-obsidian-velvet/40 block mb-1">
                          Shipping &amp; Delivery
                        </span>
                        <p className="text-obsidian-velvet/70">
                          Shipping Carrier: {order.courier}
                        </p>
                        <p className="text-obsidian-velvet/70">
                          Delivery Method: Carbon-Neutral Express
                        </p>
                      </div>
                      <div>
                        <span className="font-bold tracking-widest text-[9px] uppercase text-obsidian-velvet/40 block mb-1">
                          Logistics Protocol
                        </span>
                        <p className="text-obsidian-velvet/70">
                          Fulfillment Status: {STATUS_LABELS[order.status]}
                        </p>
                        <p className="text-obsidian-velvet/70">
                          Payment Status: Paid &amp; Confirmed
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
