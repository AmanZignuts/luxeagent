"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
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
                className="flex items-center gap-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider text-obsidian-velvet hover:opacity-75 transition-opacity cursor-pointer"
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
                    className="w-full text-left px-4 py-2 text-[10px] font-sans font-semibold uppercase tracking-widest text-obsidian-velvet hover:bg-tint-champagne/50 transition-colors cursor-pointer border-none bg-transparent"
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
            className="lg:hidden flex flex-col gap-1.5 cursor-pointer p-1 border-none bg-transparent"
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
              <button onClick={handleSignOut} className="block w-full text-left font-sans text-xs font-semibold uppercase tracking-widest text-obsidian-velvet/70 hover:text-obsidian-velvet py-2 transition-colors cursor-pointer border-none bg-transparent">
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
  );
}
