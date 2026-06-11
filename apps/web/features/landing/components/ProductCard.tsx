"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  rating: number;
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
        {/* Rating badge */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-obsidian-velvet/90 text-surface-white px-2 py-0.5 rounded-full">
          <svg className="w-2.5 h-2.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-sans text-[9px] font-bold tracking-wider">{product.rating}</span>
        </div>
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
          ${product.price.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
