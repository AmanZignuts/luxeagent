"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const PRODUCTS_WOMEN = [
  {
    id: "dress-1",
    title: "Silk Crepe Slip Dress",
    category: "Evening Wear",
    price: 680,
    rating: 4.95,
    image: "/product_dress.png",
  },
  {
    id: "LX-DR-002",
    title: "Ivory Column Dress",
    category: "Evening Wear",
    price: 360,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800",
  },
  {
    id: "LX-TP-002",
    title: "Slate Grey Cashmere Turtleneck",
    category: "Tops",
    price: 285,
    rating: 4.95,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
  },
  {
    id: "LX-OW-001",
    title: "Camel Wool Overcoat",
    category: "Outerwear",
    price: 890,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800",
  },
];

const PRODUCTS_MEN = [
  {
    id: "overshirt-1",
    title: "Linen Blend Overshirt",
    category: "Ready-to-Wear",
    price: 380,
    rating: 4.95,
    image: "/product_overshirt.png",
  },
  {
    id: "trouser-1",
    title: "Tailored Navy Trouser",
    category: "Custom Fit",
    price: 450,
    rating: 4.9,
    image: "/product_trouser.png",
  },
  {
    id: "LX-MN-003",
    title: "The Atelier Blazer",
    category: "Formal Wear",
    price: 595,
    rating: 4.85,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
  },
  {
    id: "LX-MN-001",
    title: "Chalk Linen Relaxed-Fit Shirt",
    category: "Ready-to-Wear",
    price: 165,
    rating: 4.95,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
  },
];

const TESTIMONIALS = [
  {
    name: "Isabelle Laurent",
    date: "12 May 2025",
    rating: 5,
    text: "Vestira's AI concierge curated an entire seasonal wardrobe for me in minutes. The hem calibration feature alone is worth every penny — flawless drape, every time.",
  },
  {
    name: "Marcus Chen",
    date: "3 June 2025",
    rating: 5,
    text: "The quality of the tailored trousers is extraordinary. The custom -1.5cm hem taper the AI recommended was exactly what I needed. Exceptional atelier-level service.",
  },
  {
    name: "Sofia Andreou",
    date: "19 June 2025",
    rating: 5,
    text: "I've never experienced luxury fashion shopping like this. The private concierge room and AI styling suite are years ahead of anything else on the market.",
  },
  {
    name: "James Whitfield",
    date: "28 June 2025",
    rating: 5,
    text: "From curation to checkout, every touchpoint feels premium. The Silk Crepe Slip Dress arrived immaculately packaged. Vestira is redefining what fashion retail means.",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 ${
            star <= Math.round(rating) ? "text-amber-500" : "text-zinc-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ProductCard({
  product,
  index,
}: {
  product: (typeof PRODUCTS_WOMEN)[0];
  index: number;
}) {
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

export default function LandingPage() {
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderFading, setLoaderFading] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer1 = setTimeout(() => setLoaderFading(true), 2000);
    const timer2 = setTimeout(() => setLoaderVisible(false), 2800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setProfileDropdownOpen(false);
    window.location.href = "/landing";
  };

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

      {/* ── Navigation ── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-surface-white/95 backdrop-blur-md border-b border-muted-zinc shadow-sm"
            : "bg-surface-white border-b border-muted-zinc/50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/landing" className="flex-shrink-0">
            <span className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet select-none">
              Vestira
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-[10px] font-sans font-semibold tracking-widest uppercase text-obsidian-velvet/60">
            <Link href="/shop" className="hover:text-obsidian-velvet transition-colors pb-0.5 hover:border-b hover:border-obsidian-velvet">Lookbook</Link>
            <Link href="/shop/catalog" className="hover:text-obsidian-velvet transition-colors pb-0.5 hover:border-b hover:border-obsidian-velvet">Catalog</Link>
            <Link href="/profile" className="hover:text-obsidian-velvet transition-colors pb-0.5 hover:border-b hover:border-obsidian-velvet">Calibrations</Link>
            <Link href="/orders" className="hover:text-obsidian-velvet transition-colors pb-0.5 hover:border-b hover:border-obsidian-velvet">Purchases</Link>
            <Link href="/concierge" className="text-amber-700/80 hover:text-amber-700 font-bold transition-colors">✦ AI Concierge</Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* CTA */}
            {isLoggedIn ? (
              <div className="hidden md:block relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider text-obsidian-velvet hover:opacity-75 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  Profile
                </button>
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-40 bg-surface-white border border-muted-zinc shadow-lg rounded-sm py-2 z-50 animate-[fadeIn_0.2s_ease]">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-[10px] font-sans font-semibold uppercase tracking-widest text-obsidian-velvet hover:bg-tint-champagne/50 transition-colors"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-[10px] font-sans font-semibold uppercase tracking-widest text-obsidian-velvet hover:bg-tint-champagne/50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:block bg-obsidian-velvet text-surface-white font-sans font-semibold text-[9px] uppercase tracking-widest px-4 py-2 rounded-sm hover:bg-obsidian-velvet/85 transition-all"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex flex-col gap-1.5 cursor-pointer p-1"
            >
              <span className="w-5 h-0.5 bg-obsidian-velvet rounded-full" />
              <span className="w-5 h-0.5 bg-obsidian-velvet rounded-full" />
              <span className="w-3.5 h-0.5 bg-obsidian-velvet rounded-full ml-auto" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-surface-white border-t border-muted-zinc px-6 py-4 space-y-3 animate-[slideDown_0.2s_ease]">
            <Link href="/shop" className="block font-sans text-xs font-semibold uppercase tracking-widest text-obsidian-velvet/70 hover:text-obsidian-velvet py-1 transition-colors">Lookbook</Link>
            <Link href="/shop/catalog" className="block font-sans text-xs font-semibold uppercase tracking-widest text-obsidian-velvet/70 hover:text-obsidian-velvet py-1 transition-colors">Catalog</Link>
            <Link href="/profile" className="block font-sans text-xs font-semibold uppercase tracking-widest text-obsidian-velvet/70 hover:text-obsidian-velvet py-1 transition-colors">Calibrations</Link>
            <Link href="/orders" className="block font-sans text-xs font-semibold uppercase tracking-widest text-obsidian-velvet/70 hover:text-obsidian-velvet py-1 transition-colors">Purchases</Link>
            <Link href="/concierge" className="block font-sans text-xs font-semibold uppercase tracking-widest text-amber-700/80 hover:text-amber-700 py-1 transition-colors">✦ AI Concierge</Link>
            {isLoggedIn ? (
              <div className="pt-2 border-t border-muted-zinc/50 mt-2">
                <Link href="/profile" className="block font-sans text-xs font-semibold uppercase tracking-widest text-obsidian-velvet/70 hover:text-obsidian-velvet py-2 transition-colors">
                  My Profile
                </Link>
                <button onClick={handleSignOut} className="block w-full text-left font-sans text-xs font-semibold uppercase tracking-widest text-obsidian-velvet/70 hover:text-obsidian-velvet py-2 transition-colors">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-2 flex gap-3">
                <Link href="/login" className="flex-1 text-center bg-obsidian-velvet text-surface-white font-sans text-[10px] uppercase tracking-widest py-2.5 rounded-sm font-semibold">
                  Sign In
                </Link>
                <Link href="/register" className="flex-1 text-center border border-obsidian-velvet text-obsidian-velvet font-sans text-[10px] uppercase tracking-widest py-2.5 rounded-sm font-semibold">
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section ref={heroRef} className="relative w-full overflow-hidden" style={{ minHeight: "92vh" }}>
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

      {/* ── Category Grid ── */}
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

      {/* ── Women's Featured Products ── */}
      <section className="py-14 bg-tint-champagne/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-obsidian-velvet/40 mb-2">Womenswear</p>
              <h2 className="font-serif text-3xl lg:text-4xl font-light text-obsidian-velvet tracking-tight leading-tight">
                THE FINEST PIECES<br />
                <span className="italic">FOR THE FINEST WOMAN</span>
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
            {PRODUCTS_WOMEN.map((product, index) => (
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

      {/* ── Men's Collection ── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-obsidian-velvet/40 mb-2">Menswear</p>
              <h2 className="font-serif text-3xl lg:text-4xl font-light text-obsidian-velvet tracking-tight leading-tight">
                BEST OUTFITS<br />
                <span className="italic">FOR YOUR HAPPINESS</span>
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
            {PRODUCTS_MEN.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Concierge Feature Banner ── */}
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

      {/* ── Testimonials ── */}
      <section className="py-16 lg:py-20 bg-tint-champagne/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-obsidian-velvet/40 mb-2">Client Stories</p>
            <h2 className="font-serif text-3xl font-light text-obsidian-velvet tracking-tight">
              What Our Clients Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-surface-white border border-muted-zinc p-6 rounded-sm hover:border-obsidian-velvet/30 hover:shadow-sm transition-all duration-300"
                style={{ animation: `fadeSlideUp 0.6s ease ${i * 100}ms forwards`, opacity: 0 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-sans font-bold text-[10px] uppercase tracking-wider text-obsidian-velvet">
                      {t.name}
                    </p>
                    <p className="font-sans text-[8px] text-obsidian-velvet/40 mt-0.5">{t.date}</p>
                  </div>
                  <StarRating rating={t.rating} />
                </div>
                <p className="font-sans text-[10px] leading-relaxed text-obsidian-velvet/70">
                  {t.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── Footer ── */}
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
    </div>
  );
}
