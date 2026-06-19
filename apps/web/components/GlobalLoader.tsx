"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GlobalLoader() {
  const pathname = usePathname();

  // Skip loader on seller routes
  const isSellerRoute = pathname.startsWith("/seller");

  useEffect(() => {
    const loaderElement = document.getElementById("global-loader");

    if (isSellerRoute) {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("loading");
      }
      if (loaderElement) {
        loaderElement.style.display = "none";
      }
      return;
    }

    // Start fading at 2.0s (adds fade-out class)
    const timer1 = setTimeout(() => {
      if (loaderElement) {
        loaderElement.classList.add("fade-out");
      }
    }, 2000);

    // Hide/remove from display flow and enable scroll at 2.8s (after fade completes)
    const timer2 = setTimeout(() => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("loading");
      }
      if (loaderElement) {
        loaderElement.style.display = "none";
      }
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isSellerRoute]);

  return null;
}
