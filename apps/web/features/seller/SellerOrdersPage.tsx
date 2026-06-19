"use client";

import React, { useState, useEffect } from "react";
import { getMerchantOrders, updateMerchantOrderStatus } from "@/lib/actions/orders";
import { toast } from "sonner";
import { SellerOrderDetailView, MerchantOrder } from "./components/SellerOrderDetailView";
import { SellerOrdersTable } from "./components/SellerOrdersTable";

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
          let rawItems: any[] = [];
          try {
            const parsedItems = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
            if (Array.isArray(parsedItems)) {
              itemsList = parsedItems.map((it: any) => `${it.title || "Garment"} (${it.size || "M"}) x${it.qty || 1}`).join(", ");
              rawItems = parsedItems;
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
            rawItems: rawItems,
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

  if (activeOrder) {
    return (
      <SellerOrderDetailView
        activeOrder={activeOrder}
        onBack={() => setSelectedOrderId(null)}
        advanceOrderStatus={advanceOrderStatus}
        getStatusBadge={getStatusBadge}
      />
    );
  }

  return (
    <SellerOrdersTable
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      activeStatusFilter={activeStatusFilter}
      setActiveStatusFilter={setActiveStatusFilter}
      filteredOrders={filteredOrders}
      setSelectedOrderId={setSelectedOrderId}
      advanceOrderStatus={advanceOrderStatus}
      getStatusBadge={getStatusBadge}
    />
  );
}
