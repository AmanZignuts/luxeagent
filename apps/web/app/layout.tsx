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
      <body
        className={`${geist.variable} ${playfair.variable} antialiased`}
      >
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

