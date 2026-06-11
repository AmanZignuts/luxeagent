import React from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  rating: number;
  image: string;
}

interface FeaturedSectionProps {
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  products: Product[];
  bgColor?: string;
}

export function FeaturedSection({ titleLine1, titleLine2, subtitle, products, bgColor }: FeaturedSectionProps) {
  return (
    <section className={`py-14 ${bgColor || ""}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-obsidian-velvet/40 mb-2">{subtitle}</p>
            <h2 className="font-serif text-3xl lg:text-4xl font-light text-obsidian-velvet tracking-tight leading-tight">
              {titleLine1}<br />
              <span className="italic">{titleLine2}</span>
            </h2>
          </div>
          <Link
            href="/shop/catalog"
            className="hidden sm:flex items-center gap-2 border border-obsidian-velvet text-obsidian-velvet font-sans font-semibold text-[9px] uppercase tracking-widest px-5 py-2.5 rounded-sm hover:bg-obsidian-velvet hover:text-surface-white transition-all duration-200"
          >
            See More →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/shop/catalog"
            className="flex items-center gap-2 border border-obsidian-velvet text-obsidian-velvet font-sans font-semibold text-[9px] uppercase tracking-widest px-6 py-2.5 rounded-sm"
          >
            See More →
          </Link>
        </div>
      </div>
    </section>
  );
}
