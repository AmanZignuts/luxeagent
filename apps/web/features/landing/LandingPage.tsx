"use client";

import React from "react";
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
