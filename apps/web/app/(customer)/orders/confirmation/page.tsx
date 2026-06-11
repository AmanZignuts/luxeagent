"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
  status: "In Sourcing" | "Tailoring in Progress" | "Quality Check" | "Delivered & Archived";
  courier: string;
  hash: string;
  items: DossierItem[];
  clientName?: string;
  streetAddress?: string;
}



function mapDbStatusToUi(dbStatus: string): HistoricalOrder["status"] {
  switch (dbStatus) {
    case "PENDING":
    case "CONFIRMED":
      return "In Sourcing";
    case "PROCESSING":
      return "Tailoring in Progress";
    case "SHIPPED":
      return "Quality Check";
    case "DELIVERED":
      return "Delivered & Archived";
    default:
      return "In Sourcing";
  }
}

export default function OrderConfirmationPage() {

  const [order, setOrder] = useState<HistoricalOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get("orderId");

        if (orderId) {
          const supabase = createClient();
          const { data: dbOrder } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .maybeSingle();

          if (dbOrder) {
            let parsedItems: any[] = [];
            try {
              parsedItems = typeof dbOrder.items === "string" ? JSON.parse(dbOrder.items) : (dbOrder.items as any);
            } catch {
              parsedItems = (dbOrder.items as any) || [];
            }

            const dossierItems: DossierItem[] = (Array.isArray(parsedItems) ? parsedItems : []).map((item: any) => {
              const category = item.category || "Atelier Curation";
              return {
                sku: item.sku || "LA-ACC-000",
                title: item.title || "Luxury Garment",
                price: Number(item.unit_price) || 0,
                size: item.size || "M",
                calibrationNote: dbOrder.notes || (category.toLowerCase().includes("trouser") || item.title?.toLowerCase().includes("trouser")
                  ? "Bespoke adjustment: -1.5cm leg hem tailored automatically."
                  : "Standard drape fit aligned with Style Persona preference."),
                category: category,
                imageUrl: item.image_url || ""
              };
            });

            const dateStr = dbOrder.created_at
              ? new Date(dbOrder.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })
              : "Just Now";

            let clientName = "Jean Lauren";
            let streetAddress = "Atelier Suite 4B";
            try {
              const addr = typeof dbOrder.shipping_address === "string" 
                ? JSON.parse(dbOrder.shipping_address) 
                : dbOrder.shipping_address;
              if (addr && addr.name) clientName = addr.name;
              if (addr && addr.street) streetAddress = addr.street;
            } catch (e) {
              console.error("Failed to parse shipping address", e);
            }

            setOrder({
              id: `LA-ORD-${dbOrder.id.substring(0, 6).toUpperCase()}`,
              date: dateStr,
              total: Number(dbOrder.total) || 0,
              status: mapDbStatusToUi(dbOrder.status),
              courier: dbOrder.tracking_number ? `Carbon-Neutral Priority (${dbOrder.tracking_number})` : "Carbon-Neutral Priority",
              hash: dbOrder.id.substring(0, 8),
              items: dossierItems,
              clientName,
              streetAddress
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load confirmed order details:", err);
      }
      setLoading(false);
    }

    loadOrder();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
        <span className="font-serif text-sm text-obsidian-velvet/40 tracking-wider uppercase">
          Verifying Curation Dispatch...
        </span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h1 className="font-serif text-3xl font-light tracking-tight text-obsidian-velvet">
          Order Not Found
        </h1>
        <p className="font-sans text-sm text-obsidian-velvet/60">
          We couldn't locate the specified order dossier.
        </p>
        <Link
          href="/orders"
          className="bg-obsidian-velvet text-surface-white font-sans font-semibold text-[10px] uppercase tracking-widest px-6 py-3 rounded-md hover:bg-obsidian-velvet/90 transition-all mt-4"
        >
          View Order History
        </Link>
      </div>
    );
  }

  const activeOrder = order;

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="border-b border-muted-zinc/60 pb-8 text-center sm:text-left">
        <span className="font-sans text-[10px] tracking-widest uppercase text-emerald-600 font-bold block mb-2">
          ✦ Ledger Transaction Confirmed
        </span>
        <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">
          Curation Dispatch Approved
        </h1>
        <p className="font-sans text-xs text-obsidian-velvet/40 mt-2 font-semibold">
          ORDER DOSSIER: {activeOrder.id} — CLIENT REFERENCE: {activeOrder.clientName?.toUpperCase() || "JEAN LAUREN"}
        </p>
      </div>

      {/* Main Grid: Info Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Courier & Transaction Ledger (Spans 6 cols) */}
        <div className="lg:col-span-6 bg-surface-white border border-muted-zinc rounded-xl p-8 space-y-6 shadow-none flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="font-serif text-xl font-light tracking-tight text-obsidian-velvet border-b border-muted-zinc/60 pb-4">
              Courier Dispatch Ledger
            </h2>

            <div className="grid grid-cols-2 gap-6 text-xs font-sans">
              <div>
                <span className="font-bold tracking-widest text-[9px] uppercase text-obsidian-velvet/40 block mb-1">
                  Recipient Identity
                </span>
                <p className="font-semibold text-obsidian-velvet">{activeOrder.clientName || "Jean Lauren"}</p>
                <p className="text-obsidian-velvet/60">{activeOrder.streetAddress || "Atelier Suite 4B"}</p>
                <p className="text-obsidian-velvet/60">New York, NY 10012</p>
              </div>

              <div>
                <span className="font-bold tracking-widest text-[9px] uppercase text-obsidian-velvet/40 block mb-1">
                  Atelier Courier
                </span>
                <p className="font-semibold text-obsidian-velvet">{activeOrder.courier}</p>
                <p className="text-obsidian-velvet/60">Status: {activeOrder.status}</p>
                <p className="text-obsidian-velvet/60">Est. Arrival: {activeOrder.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs font-sans pt-2 border-t border-muted-zinc/40">
              <div>
                <span className="font-bold tracking-widest text-[9px] uppercase text-obsidian-velvet/40 block mb-1">
                  Payment Protocol
                </span>
                <p className="font-semibold text-obsidian-velvet">Security Key Ledger</p>
                <p className="text-obsidian-velvet/60">Visa ending in •••• 8910</p>
              </div>

              <div>
                <span className="font-bold tracking-widest text-[9px] uppercase text-obsidian-velvet/40 block mb-1">
                  Compliance Check
                </span>
                <p className="font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Passed Security Gate
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-muted-zinc/40">
            <p className="font-sans text-[10px] text-obsidian-velvet/40 leading-relaxed">
              Receipt reference matches secure hash block `{activeOrder.hash}`. Sizing profiles are archived under active style calibrations.
            </p>
          </div>
        </div>

        {/* Right Column: Acquired Capsule Summary (Spans 6 cols) */}
        <div className="lg:col-span-6 bg-surface-white border border-muted-zinc rounded-xl p-8 space-y-6 shadow-none">
          <h2 className="font-serif text-xl font-light tracking-tight text-obsidian-velvet border-b border-muted-zinc/60 pb-4">
            Acquired Capsule Elements
          </h2>

          <div
            className="space-y-4 pr-1 text-xs"
            style={activeOrder.items.length > 4 ? { maxHeight: "20rem", overflowY: "auto" } : undefined}
          >
            {activeOrder.items.map((item) => (
              <div key={item.sku} className="flex gap-4 items-center pb-4 border-b border-muted-zinc/40">
                <div className="w-12 h-12 rounded-md bg-warm-linen/40 border border-muted-zinc/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    item.svgIcon || (
                      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-obsidian-velvet">
                        <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" />
                        <path d="M50,12 L50,85" />
                      </svg>
                    )
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-sans text-[8px] tracking-widest uppercase text-obsidian-velvet/40 block">
                    {item.category} — {item.sku}
                  </span>
                  <h4 className="font-serif text-xs font-semibold text-obsidian-velvet truncate">
                    {item.title}
                  </h4>
                  <p className="font-sans text-[9px] text-obsidian-velvet/60">
                    Fit Parameter: {item.size}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-sans text-xs font-semibold text-obsidian-velvet">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Action Controls */}
      <div className="flex justify-center pt-4">
        <Link
          href="/shop"
          className="w-full sm:w-auto min-w-[200px] bg-obsidian-velvet text-surface-white font-sans font-semibold text-xs rounded-md py-3.5 hover:bg-obsidian-velvet/90 active:scale-[0.99] transition-all text-center"
        >
          Continue Exploration
        </Link>
      </div>


    </div>
  );
}
