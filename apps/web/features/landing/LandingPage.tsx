"use client";

import React, { useState, useEffect } from "react";
import { PRODUCTS_WOMEN, PRODUCTS_MEN } from "./constants";
import {
  LandingHeader,
  HeroSection,
  CategoryGrid,
  FeaturedSection,
  FeaturesBanner,
  Testimonials,
  LandingFooter,
} from "./components";

export default function LandingPage() {
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderFading, setLoaderFading] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setLoaderFading(true), 2000);
    const timer2 = setTimeout(() => setLoaderVisible(false), 2800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-warm-linen font-sans antialiased text-obsidian-velvet selection:bg-tint-champagne overflow-x-hidden">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-text-animate {
          animation: fadeSlideUp 1s ease 0.3s forwards;
          opacity: 0;
        }
        .hero-cards-animate {
          animation: fadeSlideUp 0.8s ease 0.6s forwards;
          opacity: 0;
        }
        .scale-108 { transform: scale(1.08); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Cinematic Loader ── */}
      {loaderVisible && (
        <div
          className={`fixed inset-0 z-[100] bg-obsidian-velvet flex flex-col items-center justify-center transition-opacity duration-700 ${
            loaderFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center space-y-8">
            <span className="font-serif text-4xl sm:text-5xl font-light tracking-[0.2em] text-surface-white animate-[pulse_2.5s_ease-in-out_infinite]">
              Vestira
            </span>
            <div className="flex flex-col items-center gap-3">
              <div className="w-px h-16 bg-surface-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-surface-white/80 animate-[slideDown_1.5s_ease-in-out_infinite]" />
              </div>
              <span className="font-sans text-[8px] tracking-[0.4em] uppercase text-surface-white/40">
                Curating Exhibition
              </span>
            </div>
          </div>
        </div>
      )}

      <LandingHeader />
      <HeroSection />
      <CategoryGrid />
      
      <FeaturedSection 
        titleLine1="THE FINEST PIECES"
        titleLine2="FOR THE FINEST WOMAN"
        subtitle="Womenswear"
        products={PRODUCTS_WOMEN}
        bgColor="bg-tint-champagne/40"
      />

      <FeaturedSection 
        titleLine1="BEST OUTFITS"
        titleLine2="FOR YOUR HAPPINESS"
        subtitle="Menswear"
        products={PRODUCTS_MEN}
      />

      <FeaturesBanner />
      <Testimonials />
      <LandingFooter />
    </div>
  );
}
