import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onSignOut: (e: React.MouseEvent) => void;
  onSignIn: () => void;
  onProtectedNavigation?: (targetPath: string) => void;
}

export function MobileNav({ isOpen, onClose, isLoggedIn, onSignOut, onSignIn, onProtectedNavigation }: MobileNavProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-obsidian-velvet/20 backdrop-blur-md z-[60] transition-opacity animate-in fade-in duration-200 xl:hidden"
      />

      <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-surface-white border-r border-muted-zinc z-[70] p-8 flex flex-col justify-between shadow-none animate-in slide-in-from-left duration-300 xl:hidden">
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-muted-zinc/60 pb-5">
            <span className="font-serif text-xl font-light tracking-tight text-obsidian-velvet">
              Vestira
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet flex items-center justify-center font-sans text-xs rounded transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-6 text-[12px] font-sans font-bold tracking-widest uppercase text-obsidian-velvet/60">
            <Link
              href="/shop"
              onClick={onClose}
              className={`hover:text-obsidian-velvet transition-colors pb-1 ${
                pathname === "/shop" ? "text-obsidian-velvet font-bold pl-2 border-l-2 border-obsidian-velvet" : ""
              }`}
            >
              Lookbook
            </Link>
            <Link
              href="/shop/catalog"
              onClick={onClose}
              className={`hover:text-obsidian-velvet transition-colors pb-1 ${
                pathname === "/shop/catalog" || pathname.startsWith("/pdp") ? "text-obsidian-velvet font-bold pl-2 border-l-2 border-obsidian-velvet" : ""
              }`}
            >
              Catalog
            </Link>
            <Link
              href="/profile"
              onClick={(e) => {
                onClose();
                if (!isLoggedIn) {
                  e.preventDefault();
                  onProtectedNavigation?.("/profile");
                }
              }}
              className={`hover:text-obsidian-velvet transition-colors pb-1 ${
                pathname === "/profile" ? "text-obsidian-velvet font-bold pl-2 border-l-2 border-obsidian-velvet" : ""
              }`}
            >
              Calibrations
            </Link>
            <Link
              href="/orders"
              onClick={(e) => {
                onClose();
                if (!isLoggedIn) {
                  e.preventDefault();
                  onProtectedNavigation?.("/orders");
                }
              }}
              className={`hover:text-obsidian-velvet transition-colors pb-1 ${
                pathname === "/orders" ? "text-obsidian-velvet font-bold pl-2 border-l-2 border-obsidian-velvet" : ""
              }`}
            >
              Purchases
            </Link>
            <Link
              href="/concierge"
              onClick={(e) => {
                onClose();
                if (!isLoggedIn) {
                  e.preventDefault();
                  onProtectedNavigation?.("/concierge");
                }
              }}
              className="hover:text-amber-600 transition-colors font-bold pb-1 text-amber-600/80 text-[12px] uppercase tracking-widest"
            >
              ✦ AI Concierge
            </Link>
          </nav>
        </div>

        <div className="border-t border-muted-zinc/60 pt-6 space-y-4">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={(e) => {
                onClose();
                onSignOut(e);
              }}
              className="w-full text-center border border-muted-zinc hover:border-red-500 hover:text-red-600 py-2.5 rounded-md font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSignIn();
              }}
              className="w-full text-center border border-muted-zinc hover:border-obsidian-velvet py-2.5 rounded-md font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </>
  );
}
