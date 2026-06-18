"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GlobalLoader() {
  const pathname = usePathname();
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderFading, setLoaderFading] = useState(false);

  // Skip loader on seller routes
  const isSellerRoute = pathname.startsWith("/seller");

  useEffect(() => {
    // Check sessionStorage to see if loader was already shown in this tab session
    const hasAlreadyShown = typeof window !== "undefined" && sessionStorage.getItem("global_loader_shown") === "true";

    if (isSellerRoute || hasAlreadyShown) {
      setLoaderVisible(false);
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("loading");
      }
      return;
    }

    // Start fading at 2.0s, remove from DOM at 2.8s
    const timer1 = setTimeout(() => setLoaderFading(true), 2000);
    const timer2 = setTimeout(() => {
      setLoaderVisible(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("global_loader_shown", "true");
      }
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isSellerRoute]);

  useEffect(() => {
    if (loaderFading) {
      document.documentElement.classList.remove("loading");
    }
    return () => {
      document.documentElement.classList.remove("loading");
    };
  }, [loaderFading]);

  const hasAlreadyShownOnMount = typeof window !== "undefined" && sessionStorage.getItem("global_loader_shown") === "true";
  if (isSellerRoute || hasAlreadyShownOnMount || !loaderVisible) return null;

  return (
    <>
      <style>{`
        @keyframes globalSlideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: globalSlideDown 1.5s ease-in-out infinite;
        }
      `}</style>
      
      <div
        className={`fixed inset-0 z-[100] bg-obsidian-velvet flex flex-col items-center justify-center transition-opacity duration-700 ${
          loaderFading ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex flex-col items-center space-y-8">
          <span className="font-serif text-4xl sm:text-5xl font-light tracking-[0.2em] text-surface-white animate-pulse">
            Vestira
          </span>
          <div className="flex flex-col items-center gap-3">
            <div className="w-px h-16 bg-surface-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-surface-white/80 animate-slide-down" />
            </div>
            <span className="font-sans text-[8px] tracking-[0.4em] uppercase text-surface-white/40">
              Curating Exhibition
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
