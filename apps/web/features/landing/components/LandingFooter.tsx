import React from "react";
import Link from "next/link";

export function LandingFooter() {
  const [currentYear, setCurrentYear] = React.useState(2025);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-obsidian-velvet text-surface-white pt-16 pb-12 border-t border-muted-zinc/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-12 pb-12 border-b border-surface-white/10">
          {/* Brand & Concept */}
          <div className="max-w-md">
            <div className="font-serif text-3xl font-light text-surface-white mb-3 tracking-tight">
              Vestira
            </div>
            <p className="font-sans text-[10px] text-surface-white/40 leading-relaxed mb-6">
              The world's first AI-powered luxury fashion concierge. Curating bespoke wardrobes from atelier-sourced garments, calibrated to your exact style persona and measurements.
            </p>
            <div className="space-y-1.5 font-sans text-[10px] text-surface-white/40">
              <p><span className="text-surface-white/60 font-semibold">WhatsApp:</span> &nbsp;+1 888 999 0000</p>
              <p><span className="text-surface-white/60 font-semibold">Email:</span> &nbsp;hello@vestira.com</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex gap-16 md:gap-24">
            {/* Catalog Column */}
            <div>
              <h4 className="font-sans font-bold text-[9px] uppercase tracking-widest text-surface-white/60 mb-4">Catalog</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/shop" className="font-sans text-[10px] text-surface-white/40 hover:text-surface-white transition-colors">
                    Lookbook
                  </Link>
                </li>
                <li>
                  <Link href="/shop/catalog" className="font-sans text-[10px] text-surface-white/40 hover:text-surface-white transition-colors">
                    Collection Catalog
                  </Link>
                </li>
                <li>
                  <Link href="/concierge" className="font-sans text-[10px] text-amber-500/80 hover:text-amber-500 transition-colors font-semibold">
                    ✦ AI Concierge
                  </Link>
                </li>
              </ul>
            </div>

            {/* Client Services Column */}
            <div>
              <h4 className="font-sans font-bold text-[9px] uppercase tracking-widest text-surface-white/60 mb-4">Client Services</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/profile" className="font-sans text-[10px] text-surface-white/40 hover:text-surface-white transition-colors">
                    Styling Profile
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="font-sans text-[10px] text-surface-white/40 hover:text-surface-white transition-colors">
                    Purchases & Orders
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-[9px] text-surface-white/30 text-center sm:text-left">
            All rights reserved. Copyright © {currentYear} by Vestira Atelier.
          </p>
          <div className="flex items-center gap-6">
            {["Instagram", "Pinterest", "X (Twitter)"].map((social) => (
              <a key={social} href="#" className="font-sans text-[9px] uppercase tracking-widest text-surface-white/30 hover:text-surface-white transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
