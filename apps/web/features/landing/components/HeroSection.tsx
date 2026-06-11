import React from "react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "92vh" }}>
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <img
          src="/landing_hero.png"
          alt="Vestira Hero — The Art of Dressing"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian-velvet/55 via-obsidian-velvet/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-velvet/30 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 h-full flex items-center" style={{ minHeight: "92vh" }}>
        <div className="flex flex-col lg:flex-row items-end justify-between w-full gap-10">
          
          {/* Left: Headline */}
          <div className="flex-1 max-w-xl hero-text-animate">
            <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-surface-white/60 mb-4">
              Curated in Florence · AI-Calibrated for You
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-surface-white leading-[1.05] tracking-tight mb-8">
              DISCOVER<br />
              THE ART OF<br />
              <span className="italic font-light">Dressing Up</span>
            </h1>
            <div className="flex items-center gap-4">
              <Link
                href="/register"
                className="bg-surface-white text-obsidian-velvet font-sans font-semibold text-[10px] uppercase tracking-widest px-7 py-3.5 rounded-sm hover:bg-tint-champagne transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Enter Vestira
              </Link>
              <Link
                href="/shop"
                className="text-surface-white/80 font-sans font-semibold text-[10px] uppercase tracking-widest hover:text-surface-white transition-colors flex items-center gap-2 group"
              >
                View Lookbook
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            {/* Scroll indicator */}
            <div className="mt-16 flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="w-px h-8 bg-surface-white/30 mx-auto block" />
              </div>
              <span className="font-sans text-[8px] tracking-[0.3em] uppercase text-surface-white/40">
                Scroll Down
              </span>
            </div>
          </div>

          {/* Right: Floating product cards */}
          <div className="hidden lg:flex flex-col gap-3 mb-12 hero-cards-animate">
            {[
              { title: "100% Cotton Regular Fit Shirt", sku: "LA-SH-039", price: "$380", image: "/product_overshirt.png", category: "READY-TO-WEAR", id: "overshirt-1" },
              { title: "Silk Crepe Slip Dress", sku: "LA-DR-094", price: "$680", image: "/product_dress.png", category: "EVENING WEAR", id: "dress-1" },
            ].map((card) => (
              <Link
                href={`/pdp/${card.id}`}
                key={card.sku}
                className="group flex items-center gap-0 bg-surface-white rounded-sm overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 w-80"
              >
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden bg-tint-champagne">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="px-4 flex-1 min-w-0">
                  <span className="font-sans text-[7px] tracking-widest uppercase text-obsidian-velvet/40 block mb-1">
                    {card.sku} — {card.category}
                  </span>
                  <h4 className="font-serif text-sm font-medium text-obsidian-velvet leading-tight mb-2">
                    {card.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm font-bold text-obsidian-velvet">{card.price}</span>
                    <span className="font-sans text-[8px] uppercase tracking-wider text-obsidian-velvet underline underline-offset-2 font-bold group-hover:text-amber-700 transition-colors">
                      Shop Now
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
