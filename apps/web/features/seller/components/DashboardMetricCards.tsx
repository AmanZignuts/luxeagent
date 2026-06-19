"use client";

import React from "react";

interface DashboardMetricCardsProps {
  loading: boolean;
  totalRevenue: string;
  activeOrdersCount: string;
  pendingCount: string;
  catalogueSize: string;
  embeddingAccuracy: string;
}

export function DashboardMetricCards({
  loading,
  totalRevenue,
  activeOrdersCount,
  pendingCount,
  catalogueSize,
  embeddingAccuracy,
}: DashboardMetricCardsProps) {
  const metrics = [
    {
      label: "Total Revenue",
      value: loading ? "—" : totalRevenue,
      sub: "All non-cancelled orders",
      dot: "bg-emerald-500",
      dotText: "text-emerald-600",
    },
    {
      label: "Active Orders",
      value: loading ? "—" : activeOrdersCount,
      sub: loading ? "—" : pendingCount,
      dot: "bg-sky-500",
      dotText: "text-sky-600",
    },
    {
      label: "Catalogue Size",
      value: loading ? "—" : catalogueSize,
      sub: "Active listings",
      dot: "bg-violet-500",
      dotText: "text-violet-600",
    },
    {
      label: "Embedding Coverage",
      value: loading ? "—" : embeddingAccuracy,
      sub: "Products with AI vectors",
      dot: "bg-amber-500",
      dotText: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((m, i) => (
        <div
          key={i}
          className="bg-surface-white border border-muted-zinc rounded-xl p-6 space-y-2 shadow-none"
        >
          <span className="font-sans text-[10px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">
            {m.label}
          </span>
          <p className="font-sans text-2xl font-semibold text-obsidian-velvet">
            {m.value}
          </p>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.dot}`} />
            <span className={`font-sans text-[9px] font-semibold uppercase tracking-wider ${m.dotText}`}>
              {m.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
