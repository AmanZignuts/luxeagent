import React from "react";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-obsidian-velvet text-surface-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 pb-12 border-b border-surface-white/10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <div className="font-serif text-3xl font-light text-surface-white mb-4 tracking-tight">
              Vestira
            </div>
            <p className="font-sans text-[10px] text-surface-white/40 leading-relaxed max-w-xs mb-6">
              The world's first AI-powered luxury fashion concierge. Curating bespoke wardrobes from atelier-sourced garments, calibrated to your exact measurements.
            </p>
            <div className="space-y-1.5 font-sans text-[10px] text-surface-white/40">
              <p><span className="text-surface-white/60 font-semibold">WhatsApp:</span> &nbsp;+1 888 999 0000</p>
              <p><span className="text-surface-white/60 font-semibold">Email:</span> &nbsp;hello@vestira.com</p>
              <p><span className="text-surface-white/60 font-semibold">Atelier:</span> &nbsp;Via della Vigna Nuova, Florence</p>
            </div>
          </div>

          {/* Menu */}
          <div>
            <h4 className="font-sans font-bold text-[9px] uppercase tracking-widest text-surface-white/60 mb-4">Catalog</h4>
            <ul className="space-y-2.5">
              {["New Arrivals", "Womenswear", "Menswear", "Knitwear", "Evening Wear", "Sale"].map((item) => (
                <li key={item}>
                  <Link href="/shop/catalog" className="font-sans text-[10px] text-surface-white/40 hover:text-surface-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-sans font-bold text-[9px] uppercase tracking-widest text-surface-white/60 mb-4">Get Help</h4>
            <ul className="space-y-2.5">
              {["FAQ", "Customer Service", "Refund & Return", "Terms & Conditions", "Shipping", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <Link href="/shop/catalog" className="font-sans text-[10px] text-surface-white/40 hover:text-surface-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-sans font-bold text-[9px] uppercase tracking-widest text-surface-white/60 mb-4">Account</h4>
            <ul className="space-y-2.5">
              {["My Account", "My Orders", "AI Concierge", "Vouchers", "Styling Profile"].map((item) => (
                <li key={item}>
                  <Link href="/shop/catalog" className="font-sans text-[10px] text-surface-white/40 hover:text-surface-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-sans text-[9px] text-surface-white/30 text-center md:text-left">
            All rights reserved. Copyright © 2025 by Vestira Atelier.
          </p>
          <div className="flex items-center gap-5">
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
