"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
}

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="group flex flex-col"
      style={{
        animationDelay: `${index * 100}ms`,
        animation: "fadeSlideUp 0.6s ease forwards",
        opacity: 0,
      }}
    >
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-sm bg-tint-champagne"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >

        <img
          src={product.image}
          alt={product.title}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
            hovered ? "scale-108" : "scale-100"
          }`}
          style={{ transform: hovered ? "scale(1.08)" : "scale(1)" }}
        />
        {/* Quick add overlay */}
        <div
          className={`absolute inset-0 flex items-end p-3 transition-all duration-300 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Link
            href={`/pdp/${product.id}`}
            className="w-full bg-surface-white/95 backdrop-blur-sm text-obsidian-velvet font-sans font-semibold text-[9px] uppercase tracking-widest py-2.5 text-center rounded-sm hover:bg-obsidian-velvet hover:text-surface-white transition-all duration-200"
          >
            Shop Now →
          </Link>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <span className="font-sans text-[8px] tracking-widest uppercase text-obsidian-velvet/40 block">
          {product.category}
        </span>
        <h4 className="font-serif text-sm font-medium text-obsidian-velvet leading-tight">
          {product.title}
        </h4>
        <span className="font-sans text-xs font-semibold text-obsidian-velvet/70">
          ₹{product.price.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}
