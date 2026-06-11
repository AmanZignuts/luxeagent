import React from "react";
import Link from "next/link";

export function CategoryGrid() {
  return (
    <section className="py-16 lg:py-20 max-w-7xl mx-auto px-6 lg:px-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-obsidian-velvet/40 mb-2">Explore Our World</p>
          <h2 className="font-serif text-3xl font-light text-obsidian-velvet tracking-tight">Collections</h2>
        </div>
        <Link href="/shop/catalog" className="font-sans text-[9px] uppercase tracking-wider font-bold text-obsidian-velvet hover:text-amber-700 transition-colors underline underline-offset-2 hidden sm:block">
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Large card */}
        <Link
          href="/shop/catalog"
          className="group col-span-1 lg:col-span-1 row-span-2 relative overflow-hidden rounded-sm"
          style={{ minHeight: 420 }}
        >
          <img
            src="/landing_womenswear.png"
            alt="Quiet Luxury Womenswear"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-velvet/80 via-obsidian-velvet/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <span className="font-sans text-[8px] tracking-[0.3em] uppercase text-surface-white/60 block mb-1">Featured</span>
            <h3 className="font-serif text-xl font-semibold text-surface-white tracking-wide">
              QUIET LUXURY<br />WOMAN
            </h3>
          </div>
        </Link>

        {/* Small top right */}
        <Link
          href="/shop/catalog"
          className="group relative overflow-hidden rounded-sm"
          style={{ minHeight: 200 }}
        >
          <img
            src="/luxe_menswear.png"
            alt="Formal Menswear"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-velvet/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-5">
            <h3 className="font-serif text-base font-semibold text-surface-white tracking-widest uppercase">
              Formal Men
            </h3>
          </div>
        </Link>

        {/* Small bottom right */}
        <Link
          href="/shop/catalog"
          className="group relative overflow-hidden rounded-sm"
          style={{ minHeight: 200 }}
        >
          <img
            src="/luxe_resort.png"
            alt="Resort Collection"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-velvet/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-5">
            <h3 className="font-serif text-base font-semibold text-surface-white tracking-widest uppercase">
              Resort Style
            </h3>
          </div>
        </Link>

        {/* Bottom spanning two */}
        <Link
          href="/shop/catalog"
          className="group col-span-2 lg:col-span-1 relative overflow-hidden rounded-sm"
          style={{ minHeight: 200 }}
        >
          <img
            src="/luxe_knitwear.png"
            alt="Knitwear Collection"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-velvet/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-5">
            <h3 className="font-serif text-base font-semibold text-surface-white tracking-widest uppercase">
              Knitwear
            </h3>
          </div>
        </Link>
      </div>
    </section>
  );
}
