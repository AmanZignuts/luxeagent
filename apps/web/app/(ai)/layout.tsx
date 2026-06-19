"use client";

import React from "react";

export default function AiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-warm-linen font-sans antialiased text-obsidian-velvet selection:bg-tint-champagne relative">
      {children}
    </div>
  );
}
