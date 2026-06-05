import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-warm-linen font-sans antialiased text-obsidian-velvet selection:bg-tint-champagne">
      {children}
    </div>
  );
}
