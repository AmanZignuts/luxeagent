"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { logoutAction } from "@/lib/actions/auth";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSignOutModal(true);
  };

  const executeSignOut = async () => {
    // Flush session cookies
    toast.success("Successfully signed out. Hope to see you soon.");
    await logoutAction();
  };

  const navLinks = [
    { href: "/seller/dashboard", label: "Dashboard" },
    { href: "/seller/inventory", label: "Inventory" },
    { href: "/seller/ingestion", label: "Add New Product" },
    { href: "/seller/orders", label: "Orders" },
    { href: "/seller/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-warm-linen font-sans antialiased text-obsidian-velvet relative flex">
      
      {/* Sticky Mobile/Tablet Top Header */}
      <header className="lg:hidden fixed top-0 left-0 w-full bg-surface-white/80 backdrop-blur-md border-b border-muted-zinc h-16 z-30 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col justify-between w-5 h-3.5 bg-transparent border-none cursor-pointer focus:outline-none py-0.5 select-none"
            title="Open Seller Menu"
          >
            <span className="w-full h-0.5 bg-obsidian-velvet rounded-sm transition-all" />
            <span className="w-full h-0.5 bg-obsidian-velvet rounded-sm transition-all" />
            <span className="w-full h-0.5 bg-obsidian-velvet rounded-sm transition-all" />
          </button>
          
          <div>
            <span className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">
              Vestira
            </span>
            <span className="font-sans text-[8px] tracking-widest uppercase text-obsidian-velvet/40 block -mt-1 font-bold">
              Seller Portal
            </span>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full border border-muted-zinc bg-warm-linen flex items-center justify-center text-[10px] font-bold">
          S
        </div>
      </header>

      {/* Layout Gamma Left-Side Fixed Sidebar (260px wide, hidden on mobile/tablet) */}
      <aside className="w-[260px] h-screen fixed left-0 top-0 bg-surface-white border-r border-muted-zinc z-40 p-6 hidden lg:flex flex-col justify-between select-none">
        
        {/* Top Section: Branding & Role info */}
        <div className="space-y-6">
          <div className="border-b border-muted-zinc/60 pb-5">
            <span className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet block">
              Vestira
            </span>
            <span className="font-sans text-[10px] tracking-widest uppercase text-obsidian-velvet/40 block mt-1">
              Seller Portal
            </span>
          </div>

          {/* Navigation Tracks */}
          <nav className="space-y-1.5 flex flex-col">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2.5 rounded-md font-sans text-xs font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-between group ${
                    isActive
                      ? "bg-obsidian-velvet text-surface-white"
                      : "text-obsidian-velvet/60 hover:bg-warm-linen/40 hover:text-obsidian-velvet"
                  }`}
                >
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Operations / Sign Out */}
        <div className="space-y-4 pt-6 border-t border-muted-zinc/60">
          <button
            onClick={handleSignOutClick}
            className="w-full text-center border border-muted-zinc hover:border-red-500 hover:text-red-600 bg-surface-white py-2.5 rounded-md font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>

      </aside>

      {/* Mobile Drawer Overlay for Seller Layout */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop mask */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-obsidian-velvet/20 backdrop-blur-md z-[50] transition-opacity animate-in fade-in duration-200 lg:hidden"
          />

          {/* Sliding Panel */}
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-surface-white border-r border-muted-zinc z-[60] p-8 flex flex-col justify-between shadow-none animate-in slide-in-from-left duration-300 lg:hidden">
            <div className="space-y-8">
              {/* Close & Brand Header */}
              <div className="flex items-center justify-between border-b border-muted-zinc/60 pb-5">
                <div>
                  <span className="font-serif text-xl font-light tracking-tight text-obsidian-velvet">
                    Vestira
                  </span>
                  <span className="font-sans text-[9px] tracking-widest uppercase text-obsidian-velvet/40 block mt-0.5">
                    Seller Portal
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-6 h-6 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet flex items-center justify-center font-sans text-xs rounded transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Navigation list */}
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-3 py-2.5 rounded-md font-sans text-xs font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-between ${
                        isActive
                          ? "bg-obsidian-velvet text-surface-white font-bold"
                          : "text-obsidian-velvet/60 hover:bg-warm-linen/40 hover:text-obsidian-velvet"
                      }`}
                    >
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-muted-zinc/60 pt-6">
              <button
                type="button"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleSignOutClick(e);
                }}
                className="w-full text-center border border-muted-zinc hover:border-red-500 hover:text-red-600 py-2.5 bg-surface-white rounded-md font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area (Spans remainder of screen, pl-0 on mobile/tablet, pl-[260px] on desktop) */}
      <main className="pl-0 lg:pl-[260px] w-full min-h-screen relative z-10 flex flex-col pt-16 lg:pt-0">
        <div className="p-6 sm:p-10 w-full flex-1 max-w-7xl mx-auto space-y-8 sm:space-y-10">
          {children}
        </div>
      </main>

      {/* Sign Out Confirmation Modal Overlay */}
      {showSignOutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 max-w-sm w-full mx-4 space-y-6 shadow-none animate-in zoom-in-95 duration-200">
            <div className="space-y-2 text-center">
              <h3 className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet">
                Confirm Sign Out
              </h3>
              <p className="font-sans text-xs text-obsidian-velvet/60 leading-relaxed">
                Are you sure you want to end your current session? You will need to sign in again to access the portal.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutModal(false)}
                className="flex-1 border border-muted-zinc hover:border-obsidian-velvet hover:bg-warm-linen/20 text-obsidian-velvet font-sans font-semibold text-xs rounded-md py-2.5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSignOut}
                className="flex-1 bg-obsidian-velvet hover:bg-obsidian-velvet/90 text-surface-white font-sans font-semibold text-xs rounded-md py-2.5 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
