import type { Metadata } from "next";
import { Playfair_Display, Inter, Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Agentation } from "agentation";
import GlobalLoader from "@/components/GlobalLoader";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { BagProvider } from "@/app/(customer)/BagContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Vestira — Elite Fashion Concierge",
  description: "Agentic AI styling suite, private multi-modal search, and automated boutique cataloging.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("loading", "font-sans", geist.variable)}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var isSeller = window.location.pathname.indexOf("/seller") === 0;
                if (isSeller) {
                  document.documentElement.classList.remove("loading");
                  var style = document.createElement("style");
                  style.id = "global-loader-hide-style";
                  style.innerHTML = "#global-loader { display: none !important; }";
                  document.head.appendChild(style);
                }
              })()
            `,
          }}
        />
      </head>
      <body
        className={`${geist.variable} ${playfair.variable} antialiased`}
      >
        <div
          id="global-loader"
          className="fixed inset-0 z-[100] bg-obsidian-velvet flex flex-col items-center justify-center"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: "#09090B",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
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
        <Suspense fallback={null}>
          <GlobalLoader />
        </Suspense>
        <BagProvider>
          {children}
        </BagProvider>
        <Toaster richColors position="top-right" closeButton />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}

