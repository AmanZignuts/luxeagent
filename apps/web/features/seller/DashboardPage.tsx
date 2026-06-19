"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMerchantOrders } from "@/lib/actions/orders";
import { DashboardMetricCards } from "./components/DashboardMetricCards";
import { DashboardRecentOrders } from "./components/DashboardRecentOrders";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "text-amber-700 bg-amber-50 border-amber-200",
  CONFIRMED: "text-sky-700 bg-sky-50 border-sky-200",
  PROCESSING: "text-violet-700 bg-violet-50 border-violet-200",
  SHIPPED: "text-emerald-700 bg-emerald-50 border-emerald-200",
  DELIVERED: "text-zinc-500 bg-zinc-50 border-zinc-200",
  CANCELLED: "text-red-600 bg-red-50 border-red-200",
};

export default function SellerDashboardPage() {
  const [loading, setLoading] = useState(true);

  // ── Metric values ────────────────────────────────────────────────────────────
  const [totalRevenue, setTotalRevenue] = useState("₹0.00");
  const [activeOrdersCount, setActiveOrdersCount] = useState("0 Orders");
  const [pendingCount, setPendingCount] = useState("0");
  const [catalogueSize, setCatalogueSize] = useState("0 Products");
  const [embeddingAccuracy, setEmbeddingAccuracy] = useState("0%");

  // ── Chart + queue ────────────────────────────────────────────────────────────
  const [chartData, setChartData] = useState({
    path: "M 50,170 L 450,170",
    fill: "M 50,170 L 450,170 L 450,180 L 50,180 Z",
    points: [] as { cx: number; cy: number; label: string }[],
  });
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  const dataFetched = useRef(false);

  useEffect(() => {
    if (dataFetched.current) return;
    dataFetched.current = true;

    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // ── Fetch orders via server action ─
        const orders = await getMerchantOrders();

        // ── Fetch seller's own products ─────────────────────────────────────
        const { data: products } = await supabase
          .from("products")
          .select("id, vector_status, is_active")
          .eq("seller_id", user.id);

        const dbOrders = orders || [];
        const dbProducts = products || [];

        // Revenue
        const revenue = dbOrders
          .filter((o) => o.status !== "CANCELLED")
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        setTotalRevenue(
          `₹${revenue.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        );

        // Active (non-terminal) orders
        const nonTerminal = dbOrders.filter(
          (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED"
        );
        const processingCount = nonTerminal.filter(
          (o) => o.status === "PROCESSING" || o.status === "SHIPPED"
        ).length;

        setActiveOrdersCount(
          `${nonTerminal.length} Order${nonTerminal.length !== 1 ? "s" : ""}`
        );
        setPendingCount(
          `${processingCount} Processing / Shipped`
        );

        // Catalogue
        const activeProducts = dbProducts.filter((p) => p.is_active).length;
        const embeddedProducts = dbProducts.filter(
          (p) => p.vector_status === "ACTIVE"
        ).length;
        const accuracy =
          dbProducts.length > 0
            ? ((embeddedProducts / dbProducts.length) * 100).toFixed(0)
            : "—";

        setCatalogueSize(
          `${activeProducts} Product${activeProducts !== 1 ? "s" : ""}`
        );
        setEmbeddingAccuracy(dbProducts.length > 0 ? `${accuracy}%` : "—");

        // ── Chart: weekly revenue buckets ────────────────────────────────────
        const now = new Date();
        const buckets = [0, 0, 0, 0, 0]; // 5 weeks back → now
        dbOrders.forEach((o) => {
          const diffDays = Math.floor(
            (now.getTime() - new Date(o.created_at || now).getTime()) /
              (1000 * 3600 * 24)
          );
          const bucket = Math.min(Math.floor(diffDays / 7), 4);
          buckets[4 - bucket] += Number(o.total) || 0;
        });

        const maxVal = Math.max(...buckets, 1);
        const xs = [50, 150, 250, 350, 450];
        const getY = (v: number) => 160 - (v / maxVal) * 120;
        const pts = xs.map((x, i) => ({
          cx: x,
          cy: getY(buckets[i]),
          label: `₹${buckets[i].toFixed(0)}`,
        }));

        const pathD = pts
          .map((p, i) => (i === 0 ? `M ${p.cx},${p.cy}` : `L ${p.cx},${p.cy}`))
          .join(" ");
        const fillD = `${pathD} L 450,180 L 50,180 Z`;

        setChartData({ path: pathD, fill: fillD, points: pts });

        const fmt = (d: Date) =>
          d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
        setChartLabels([
          fmt(new Date(now.getTime() - 28 * 86400000)),
          fmt(new Date(now.getTime() - 21 * 86400000)),
          fmt(new Date(now.getTime() - 14 * 86400000)),
          fmt(new Date(now.getTime() - 7 * 86400000)),
          "Now",
        ]);

        // ── Active orders queue (all active orders) ─────────────────────────
        const queue = nonTerminal.map((o: any) => {
          let clientName = "—";
          try {
            const addr =
              typeof o.shipping_address === "string"
                ? JSON.parse(o.shipping_address)
                : o.shipping_address;
            if (addr?.name) clientName = addr.name;
          } catch {}

          let itemCount = 0;
          let itemSummary = "—";
          try {
            const items =
              typeof o.items === "string" ? JSON.parse(o.items) : o.items;
            if (Array.isArray(items)) {
              itemCount = items.length;
              itemSummary =
                itemCount === 1
                  ? items[0]?.title || "1 item"
                  : `${itemCount} items`;
            }
          } catch {}

          return {
            id: `#${o.id.substring(0, 8).toUpperCase()}`,
            client: clientName,
            summary: itemSummary,
            status: o.status || "PENDING",
            total: Number(o.total) || 0,
            date: o.created_at
              ? new Date(o.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "—",
          };
        });
        setActiveOrders(queue);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-3xl mx-auto py-12 animate-in fade-in duration-300">
        <div className="bg-surface-white border border-muted-zinc rounded-xl p-12 w-full flex flex-col items-center justify-center space-y-6 shadow-sm">
          <div className="w-9 h-9 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
          <div className="text-center space-y-1.5">
            <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">
              Loading Seller Dashboard
            </h3>
            <p className="font-sans text-[10px] text-obsidian-velvet/40 tracking-wider uppercase font-semibold">
              Assembling revenue and fulfillment metrics
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300 w-full">
      {/* Page Header */}
      <div className="border-b border-muted-zinc/60 pb-6">
        <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block mb-2">
          Management Console
        </span>
        <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">
          Seller Dashboard
        </h1>
      </div>

      {/* Metric Cards */}
      <DashboardMetricCards
        loading={loading}
        totalRevenue={totalRevenue}
        activeOrdersCount={activeOrdersCount}
        pendingCount={pendingCount}
        catalogueSize={catalogueSize}
        embeddingAccuracy={embeddingAccuracy}
      />

      {/* Chart + Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Revenue Chart */}
        <div className="lg:col-span-7 bg-surface-white border border-muted-zinc rounded-xl p-8 shadow-none flex flex-col gap-6">
          <div className="border-b border-muted-zinc/60 pb-4 flex justify-between items-center">
            <div>
              <span className="font-sans text-[9px] tracking-widest uppercase text-obsidian-velvet/40 block mb-0.5">
                Revenue Trend
              </span>
              <h3 className="font-serif text-xl font-light tracking-tight text-obsidian-velvet">
                Weekly Revenue (Last 5 Weeks)
              </h3>
            </div>
          </div>

          <div className="h-64 w-full bg-warm-linen/20 border border-muted-zinc/40 rounded-xl flex flex-col justify-between p-4 relative">
            {/* Grid lines */}
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="absolute inset-x-4 border-b border-muted-zinc/20 pointer-events-none"
                style={{ top: `${n * 25}%` }}
              />
            ))}

            <svg
              viewBox="0 0 500 200"
              fill="none"
              className="w-full h-[150px] flex-1 z-10 overflow-visible"
            >
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#09090B" />
                  <stop offset="100%" stopColor="#FAF0E6" />
                </linearGradient>
              </defs>

              <path
                d={chartData.path}
                fill="none"
                stroke="#09090B"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={chartData.fill}
                fill="url(#chart-gradient)"
                opacity="0.06"
              />

              {chartData.points.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.cx} cy={pt.cy} r="3.5" fill="#09090B" />
                  {pt.label !== "₹0" && (
                    <text
                      x={pt.cx}
                      y={pt.cy - 9}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#09090B"
                      opacity="0.5"
                      fontFamily="sans-serif"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              ))}

              {chartData.points.length === 0 && (
                <text
                  x="250"
                  y="100"
                  textAnchor="middle"
                  fontSize="11"
                  fill="#09090B"
                  opacity="0.3"
                  fontFamily="sans-serif"
                >
                  No order activity yet
                </text>
              )}
            </svg>

            <div className="flex justify-between font-sans text-[8px] font-bold uppercase tracking-wider text-obsidian-velvet/40 pt-2 border-t border-muted-zinc/40 z-10">
              {chartLabels.map((lbl, i) => (
                <span key={i}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Active Orders Queue */}
        <DashboardRecentOrders
          loading={loading}
          activeOrders={activeOrders}
          statusLabels={STATUS_LABELS}
          statusStyle={STATUS_STYLE}
        />
      </div>
    </div>
  );
}
