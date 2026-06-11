"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBag } from "@/app/(customer)/BagContext";

interface HeaderNavProps {
  isLoggedIn: boolean;
  onOpenMobileMenu: () => void;
  onSignIn: () => void;
  onSignOut: (e: React.MouseEvent) => void;
  onToggleBag: (open: boolean) => void;
}

export function HeaderNav({
  isLoggedIn,
  onOpenMobileMenu,
  onSignIn,
  onSignOut,
  onToggleBag,
}: HeaderNavProps) {
  const pathname = usePathname();
  const { bagItems } = useBag();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const bagCount = bagItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return (
    <header className="fixed top-0 left-0 w-full bg-surface-white/80 backdrop-blur-md border-b border-muted-zinc z-50 h-16">
      <div className="max-w-7xl mx-auto h-full px-6 sm:px-8 flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="xl:hidden flex flex-col justify-between w-5 h-3.5 bg-transparent border-none cursor-pointer focus:outline-none py-0.5 select-none"
            title="Open Navigation Menu"
          >
            <span className="w-full h-0.5 bg-obsidian-velvet rounded-sm transition-all" />
            <span className="w-full h-0.5 bg-obsidian-velvet rounded-sm transition-all" />
            <span className="w-full h-0.5 bg-obsidian-velvet rounded-sm transition-all" />
          </button>

          <Link href="/shop" className="font-serif text-xl sm:text-2xl font-light tracking-tight text-obsidian-velvet select-none">
            Vestira
          </Link>
        </div>

        <nav className="hidden xl:flex items-center gap-6 text-[10px] font-sans font-semibold tracking-widest uppercase text-obsidian-velvet/60">
          <Link
            href="/shop"
            className={`hover:text-obsidian-velvet transition-colors pb-0.5 ${
              pathname === "/shop"
                ? "text-obsidian-velvet border-b border-obsidian-velvet font-bold"
                : "text-obsidian-velvet/60"
            }`}
          >
            Lookbook
          </Link>
          <Link
            href="/shop/catalog"
            className={`hover:text-obsidian-velvet transition-colors pb-0.5 ${
              pathname === "/shop/catalog" || pathname.startsWith("/pdp")
                ? "text-obsidian-velvet border-b border-obsidian-velvet font-bold"
                : "text-obsidian-velvet/60"
            }`}
          >
            Catalog
          </Link>
          <Link
            href="/profile"
            className={`hover:text-obsidian-velvet transition-colors pb-0.5 ${
              pathname === "/profile"
                ? "text-obsidian-velvet border-b border-obsidian-velvet font-bold"
                : "text-obsidian-velvet/60"
            }`}
          >
            Profile
          </Link>
          <Link
            href="/orders"
            className={`hover:text-obsidian-velvet transition-colors pb-0.5 ${
              pathname === "/orders"
                ? "text-obsidian-velvet border-b border-obsidian-velvet font-bold"
                : "text-obsidian-velvet/60"
            }`}
          >
            Purchases
          </Link>
          <Link
            href="/concierge"
            className="hover:text-amber-600 transition-colors pb-0.5 font-bold text-amber-600/80 font-sans text-[10px] uppercase tracking-widest"
          >
            ✦ AI Concierge
          </Link>
        </nav>

        <div className="flex items-center gap-6 text-[11px] font-sans font-semibold uppercase tracking-wider">
          <div className="relative">
            <button
              onClick={() => {
                if (isLoggedIn) {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                } else {
                  onSignIn();
                }
              }}
              className="flex items-center text-obsidian-velvet/80 hover:text-obsidian-velvet transition-opacity cursor-pointer p-1"
              title={isLoggedIn ? "Profile Menu" : "Sign In"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </button>
            {isLoggedIn && isProfileDropdownOpen && (
              <div className="absolute right-0 mt-3 w-40 bg-surface-white border border-muted-zinc shadow-lg rounded-sm py-2 z-50 animate-[fadeIn_0.2s_ease]">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-[10px] font-sans font-semibold uppercase tracking-widest text-obsidian-velvet hover:bg-tint-champagne/50 transition-colors"
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={(e) => {
                    setIsProfileDropdownOpen(false);
                    onSignOut(e);
                  }}
                  className="w-full text-left px-4 py-2 text-[10px] font-sans font-semibold uppercase tracking-widest text-obsidian-velvet hover:bg-tint-champagne/50 transition-colors cursor-pointer border-none bg-transparent"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => onToggleBag(true)}
            className="relative flex items-center hover:opacity-85 transition-opacity cursor-pointer border-none bg-transparent p-1"
            title="Open Bag"
          >
            <svg className="w-5 h-5 text-obsidian-velvet" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {isMounted && bagCount > 0 && (
              <span className="flex w-4.5 h-4.5 rounded-full border border-muted-zinc bg-obsidian-velvet text-surface-white text-[8px] items-center justify-center font-bold absolute -top-1.5 -right-1.5 animate-in zoom-in duration-200">
                {bagCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
