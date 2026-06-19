"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { logoutAction } from "@/lib/actions/auth";
import { useBag } from "@/app/(customer)/BagContext";
import { createClient } from "@/lib/supabase/client";
import {
  AuthModal,
  BagDrawer,
  HeaderNav,
  MobileNav,
  ProductOverviewModal,
  SignOutModal,
} from "./components";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={null}>
      <CustomerLayoutContent>{children}</CustomerLayoutContent>
    </React.Suspense>
  );
}

interface LookItem {
  id: string;
  sku: string;
  title: string;
  price: number;
  category: string;
  imageUrl?: string;
}

function CustomerLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isBagDrawerOpen, setIsBagDrawerOpen } = useBag();
  const [isAiOpen, setIsAiOpen] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

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

  // State for popup overview modal of products
  const [activeProductOverview, setActiveProductOverview] = useState<LookItem | null>(null);

  // Listener to open AI Concierge chat dynamically
  useEffect(() => {
    const handleOpen = () => {
      setIsBagDrawerOpen(false);
      setIsAiOpen(true);
    };
    window.addEventListener("open-concierge", handleOpen);
    return () => {
      window.removeEventListener("open-concierge", handleOpen);
    };
  }, [setIsBagDrawerOpen]);

  // Listener to open Auth Modal dynamically from children (e.g. PDP Buy Now)
  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.pendingAction) {
        setPendingAction(() => customEvent.detail.pendingAction);
      }
      setAuthTab("signin");
      setIsAuthModalOpen(true);
    };
    window.addEventListener("open-auth", handleOpenAuth);
    return () => {
      window.removeEventListener("open-auth", handleOpenAuth);
    };
  }, []);

  // Lock body scroll when any drawer is open
  useEffect(() => {
    if (isAiOpen || isBagDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAiOpen, isBagDrawerOpen]);

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSignOutModal(true);
  };

  const executeSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setShowSignOutModal(false);
    toast.success("Successfully signed out. Hope to see you soon.");
    await logoutAction();
  };

  const handleCheckoutNavigation = () => {
    setIsBagDrawerOpen(false);
    if (isLoggedIn) {
      router.push("/checkout");
    } else {
      setPendingAction(() => () => router.push("/checkout"));
      setAuthTab("signin");
      setIsAuthModalOpen(true);
    }
  };

  const handleProtectedNavigation = (targetPath: string) => {
    setPendingAction(() => () => router.push(targetPath));
    setAuthTab("signin");
    setIsAuthModalOpen(true);
  };

  const toggleBagDrawer = (open: boolean) => {
    if (open) setIsAiOpen(false); // Close AI drawer if opening Bag
    setIsBagDrawerOpen(open);
  };

  return (
    <div className="min-h-screen bg-warm-linen font-sans antialiased text-obsidian-velvet selection:bg-tint-champagne relative">
      <HeaderNav
        isLoggedIn={isLoggedIn}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onSignIn={() => {
          setAuthTab("signin");
          setIsAuthModalOpen(true);
        }}
        onSignOut={handleSignOutClick}
        onToggleBag={toggleBagDrawer}
        onProtectedNavigation={handleProtectedNavigation}
      />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-24 pb-16 relative z-10">
        {children}
      </main>

      <BagDrawer
        isOpen={isBagDrawerOpen}
        onClose={() => toggleBagDrawer(false)}
        onCheckout={handleCheckoutNavigation}
      />

      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={executeSignOut}
      />

      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        onSignOut={handleSignOutClick}
        onSignIn={() => {
          setAuthTab("signin");
          setIsAuthModalOpen(true);
        }}
        onProtectedNavigation={handleProtectedNavigation}
      />

      <ProductOverviewModal
        product={activeProductOverview}
        onClose={() => setActiveProductOverview(null)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authTab}
        onSuccess={() => setIsAuthModalOpen(false)}
        pendingAction={pendingAction}
      />
    </div>
  );
}
