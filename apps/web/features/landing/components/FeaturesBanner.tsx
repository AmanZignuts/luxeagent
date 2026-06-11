import React from "react";
import Link from "next/link";

export function FeaturesBanner() {
  return (
    <>
      <section className="py-20 bg-obsidian-velvet relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-tint-champagne transform translate-x-32 -translate-y-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-tint-champagne transform -translate-x-20 translate-y-20" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <div className="text-center mb-14">
            <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-surface-white/40 mb-3">Why Vestira</p>
            <h2 className="font-serif text-3xl lg:text-5xl font-light text-surface-white tracking-tight">
              Atelier Intelligence,<br />
              <span className="italic">Delivered to You</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {[
              {
                icon: (
                  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7 text-tint-champagne">
                    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" />
                    <path d="M14 20 C14 15 20 12 20 12 C20 12 26 15 26 20 C26 25 20 28 20 28 C20 28 14 25 14 20Z" stroke="currentColor" strokeWidth="1" />
                    <circle cx="20" cy="20" r="3" fill="currentColor" />
                  </svg>
                ),
                title: "AI Styling Concierge",
                desc: "Your personal AI stylist calibrates preferences, sizing, and hemlines to curate looks perfectly matched to your aesthetic profile.",
              },
              {
                icon: (
                  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7 text-tint-champagne">
                    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" />
                    <path d="M12 26 L20 14 L28 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M15 22 L25 22" stroke="currentColor" strokeWidth="1" />
                  </svg>
                ),
                title: "Carbon-Neutral Courier",
                desc: "Complimentary carbon-neutral delivery on every order. Your atelier pieces arrive immaculately packaged, right to your door.",
              },
              {
                icon: (
                  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7 text-tint-champagne">
                    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" />
                    <rect x="13" y="17" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1" />
                    <path d="M16 17 L16 14 C16 11.8 17.8 10 20 10 C22.2 10 24 11.8 24 14 L24 17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                ),
                title: "Secure Express Checkout",
                desc: "Military-grade encrypted transaction ledger. Your curation is dispatched only when you authorize — never a moment before.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-surface-white/5 border border-surface-white/10 rounded-sm p-7 hover:bg-surface-white/8 hover:border-surface-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-surface-white/10 rounded-full flex items-center justify-center mb-5">
                  {feature.icon}
                </div>
                <h3 className="font-serif text-lg font-medium text-surface-white mb-3">
                  {feature.title}
                </h3>
                <p className="font-sans text-xs text-surface-white/50 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lookbook Full-Width Banner ── */}
      <section className="relative overflow-hidden" style={{ height: 520 }}>
        <img
          src="/luxe_atelier.png"
          alt="Vestira Lookbook"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian-velvet/70 via-obsidian-velvet/30 to-transparent" />
        <div className="relative z-10 h-full flex items-center max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-lg">
            <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-surface-white/60 mb-4">
              ✦ Lookbook — Autumn Collection
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl font-light text-surface-white leading-tight tracking-tight mb-6">
              Your Wardrobe,<br />
              <span className="italic">Reimagined</span>
            </h2>
            <p className="font-sans text-xs text-surface-white/60 leading-relaxed mb-8 max-w-sm">
              Let our AI Concierge Stage your complete autumn coordinates. Every garment atelier-sourced, every hem calibrated to your exact measurements.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-3 bg-surface-white text-obsidian-velvet font-sans font-semibold text-[10px] uppercase tracking-widest px-8 py-4 rounded-sm hover:bg-tint-champagne transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Your Curation</span>
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
