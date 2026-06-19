"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { OrderCard, OrdersEmptyState } from "./components/OrderCard";
import { Combobox } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DossierItem {
  sku: string;
  title: string;
  price: number;
  size: string;
  calibrationNote: string;
  category: string;
  imageUrl?: string;
  svgIcon?: React.ReactNode;
}

export type DbStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "ALL";

export interface HistoricalOrder {
  id: string;
  date: string;
  total: number;
  status: DbStatus;
  courier: string;
  hash: string;
  items: DossierItem[];
}

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
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<DbStatus>("ALL");
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

  const visibleFilters = FILTER_ORDER.filter(
    (s) => s === "ALL" || presentStatuses.has(s)
  );

  const filteredOrders =
    activeFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === activeFilter);

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

      {/* Status Filter Dropdown */}
      {visibleFilters.length > 1 && (
        <div className="flex items-center gap-3 select-none">
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-obsidian-velvet/60">
            Filter by Status:
          </span>
          <Combobox
            options={visibleFilters.map((status) => ({
              label: STATUS_LABELS[status],
              value: status,
            }))}
            value={activeFilter}
            onChange={(val) => setActiveFilter(val as DbStatus)}
            placeholder="Select Status"
            className="bg-surface-white border-muted-zinc px-3 py-1.5 text-xs w-auto min-w-[150px] h-9 flex items-center justify-between"
          />
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <OrdersEmptyState />
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order as any}
              isExpanded={expandedOrders.has(order.id)}
              onToggle={() => toggleOrder(order.id)}
              getStatusStyle={getStatusStyle}
              statusLabel={STATUS_LABELS[order.status]}
            />
          ))
        )}
      </div>
    </div>
  );
}
