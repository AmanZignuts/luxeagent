"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { logoutAction } from "@/lib/actions/auth";
import { BagProvider, useBag } from "./BagContext";
import { createClient } from "@/lib/supabase/client";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BagProvider>
      <CustomerLayoutContent>{children}</CustomerLayoutContent>
    </BagProvider>
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

interface StagedOutfitCollection {
  id: string;
  title: string;
  tag: string;
  description: string;
  price: number;
  mainImage: string;
  gridImages?: string[];
  clothingItems: LookItem[];
  expandedProducts?: LookItem[];
}

interface ChatMessage {
  sender: "ai" | "user";
  type: "text" | "outfits";
  text?: string;
  outfits?: StagedOutfitCollection[];
  feedback?: "like" | "dislike" | null;
}

function CustomerLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { bagItems, addToBag, removeFromBag, updateQuantity, isBagDrawerOpen, setIsBagDrawerOpen } = useBag();
  const [isAiOpen, setIsAiOpen] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

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

  const handleModalAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      if (authTab === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        const actualRole = data.user?.user_metadata?.role ?? 'shopper';
        if (actualRole !== 'shopper') {
          await supabase.auth.signOut();
          toast.error("Access denied. Please use a shopper account to sign in here.");
          return;
        }

        setIsLoggedIn(true);
        setIsAuthModalOpen(false);
        toast.success("Welcome back! Signed in successfully.");

        if (pendingAction) {
          setTimeout(() => {
            pendingAction();
          }, 100);
          setPendingAction(null);
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: authName,
              role: "shopper"
            }
          }
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data.user) {
          await supabase.from('user_style_profiles').upsert({
            user_id: data.user.id,
            display_name: authName,
            onboarding_complete: false,
          });
        }

        setIsLoggedIn(true);
        setIsAuthModalOpen(false);
        toast.success("Welcome to Vestira! Account registered successfully.");

        router.push("/onboarding/style-persona");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during authentication.");
    }
  };
  
  // State for sub-drawer view of collection details
  const [viewingCollection, setViewingCollection] = useState<StagedOutfitCollection | null>(null);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  // State for popup overview modal of products
  const [activeProductOverview, setActiveProductOverview] = useState<LookItem | null>(null);

  // Listener to open AI Concierge chat dynamically
  useEffect(() => {
    const handleOpen = () => {
      toggleAiDrawer(true);
    };
    window.addEventListener("open-concierge", handleOpen);
    return () => {
      window.removeEventListener("open-concierge", handleOpen);
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

  const [chatLog, setChatLog] = useState<Array<ChatMessage>>([
    {
      sender: "ai",
      type: "text",
      text: "Hello Jean. I have calibrated your active styling profile with our Minimalist core settings."
    },
    {
      sender: "ai",
      type: "text",
      text: "Standard measurements for your garments will automatically have a -1.5cm hem taper applied."
    },
    {
      sender: "ai",
      type: "outfits",
      text: "Based on your active minimalist profile and hem calibrations, I have compiled these styling recommendations for your curated autumn wardrobe:",
      outfits: [
        {
          id: "col-shirts",
          title: "Shirts Collection",
          tag: "STAGED COLLECTION",
          description: "With the shirts and t-shirts displayed, consider layering a light shirt over a fitted t-shirt for a stylish, casual look. Pair them with your favorite jeans or chinos for an effortless outfit that's perfect for various occasions!",
          price: 380,
          mainImage: "/product_overshirt.png",
          gridImages: [
            "/luxe_minimalist.png",
            "/luxe_quietluxury.png",
            "/luxe_atelier.png",
            "/luxe_resort.png"
          ],
          clothingItems: [
            { id: "overshirt-1", sku: "LA-SH-039", title: "Linen Blend Overshirt", price: 380, category: "Ready-to-Wear" }
          ],
          expandedProducts: [
            { id: "overshirt-1", sku: "LA-SH-039", title: "100% Cotton Regular Fit Shirt", price: 380, category: "Ready-to-Wear", imageUrl: "/product_overshirt.png" },
            { id: "knit-polo", sku: "LA-KP-078", title: "Sparkling Beige Polo", price: 320, category: "Knitwear", imageUrl: "/luxe_knitwear.png" },
            { id: "linen-quiet", sku: "LA-LS-102", title: "Quiet Luxury Linen Shirt", price: 350, category: "Ready-to-Wear", imageUrl: "/luxe_quietluxury.png" },
            { id: "resort-shirt", sku: "LA-RS-056", title: "Classic Navy Button Down", price: 390, category: "Ready-to-Wear", imageUrl: "/luxe_resort.png" }
          ]
        },
        {
          id: "col-trousers",
          title: "Tailored Coordinates",
          tag: "STAGED COLLECTION",
          description: "Pair with custom-fit wool trousers calibrated at -1.5cm hem taper for a clean, floor-length silhouette.",
          price: 450,
          mainImage: "/product_trouser.png",
          clothingItems: [
            { id: "trouser-1", sku: "LA-TR-012", title: "Tailored Navy Trouser", price: 450, category: "Custom Fit" }
          ],
          expandedProducts: [
            { id: "trouser-1", sku: "LA-TR-012", title: "Tailored Navy Trouser", price: 450, category: "Custom Fit", imageUrl: "/product_trouser.png" },
            { id: "dress-1", sku: "LA-DR-094", title: "Silk Crepe Slip Dress", price: 680, category: "Evening Wear", imageUrl: "/product_dress.png" },
            { id: "wool-trouser", sku: "LA-TR-088", title: "Minimalist Wool Trouser", price: 480, category: "Custom Fit", imageUrl: "/luxe_minimalist.png" },
            { id: "classic-blazer", sku: "LA-BZ-045", title: "Heritage Classic Blazer", price: 850, category: "Ready-to-Wear", imageUrl: "/luxe_menswear.png" }
          ]
        }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const bagCount = bagItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotal = bagItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);

  const handleSignOutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSignOutModal(true);
  };

  const executeSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
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

  const toggleBagDrawer = (open: boolean) => {
    if (open) setIsAiOpen(false); // Close AI drawer if opening Bag
    setIsBagDrawerOpen(open);
  };

  const toggleAiDrawer = (open: boolean) => {
    if (open) setIsBagDrawerOpen(false); // Close Bag drawer if opening AI
    setIsAiOpen(open);
    // Reset view collections
    if (!open) {
      setViewingCollection(null);
    }
  };

  const handleFeedback = (idx: number, type: "like" | "dislike") => {
    setChatLog((prev) =>
      prev.map((msg, i) => {
        if (i === idx) {
          return {
            ...msg,
            feedback: msg.feedback === type ? null : type
          };
        }
        return msg;
      })
    );
  };

  const handleDispatchCuration = (collection: StagedOutfitCollection) => {
    collection.clothingItems.forEach((item) => {
      addToBag({
        id: item.id,
        sku: item.sku,
        title: item.title,
        price: item.price,
        size: "M",
        material: "Atelier Sourced Fiber",
        category: item.category
      });
    });
    setIsBagDrawerOpen(true);
    setIsAiOpen(false); // Close AI drawer to view the updated bag
    toast.success(`Dispatched "${collection.title}" curation to your capsule bag.`);
  };

  const handleAddProductToBag = (product: LookItem) => {
    addToBag({
      id: product.id,
      sku: product.sku,
      title: product.title,
      price: product.price,
      size: "M",
      material: "Atelier Sourced Fiber",
      category: product.category,
      imageUrl: product.imageUrl
    });
    
    // Set added state for this specific product ID
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    toast.success(`Added ${product.title} to capsule bag.`);
    
    // Reset success check after 2 seconds
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setChatLog((prev) => [...prev, { sender: "user", type: "text", text: userText }]);
    setInputValue("");

    // Simulate concierge response
    setTimeout(() => {
      let replyText = "I am processing your wardrobe instructions, Jean. Let me coordinate these parameters.";
      let matchedOutfits: StagedOutfitCollection[] | undefined = undefined;
      const lower = userText.toLowerCase();

      if (lower.includes("hem") || lower.includes("tailor") || lower.includes("size")) {
        replyText = "Hem delta is currently calibrated to -1.5cm based on your style questionnaire. You can fine-tune this in your Client Profile Settings.";
      } else if (lower.includes("stock") || lower.includes("overshirt") || lower.includes("trouser")) {
        replyText = "Atelier inventory check: Linen Blend Overshirts and Navy Wool Trousers are fully stocked in Florence and prepped for prompt customization.";
      } else if (lower.includes("room") || lower.includes("canvas") || lower.includes("concierge")) {
        replyText = "You can enter your Immersive Concierge Room for a full 100vh spatial view of Stage coordinates by clicking the Stage button below.";
      } else if (
        lower.includes("outfit") ||
        lower.includes("suggest") ||
        lower.includes("recommend") ||
        lower.includes("look") ||
        lower.includes("pair") ||
        lower.includes("casual")
      ) {
        replyText = "Certainly, Jean. Staging algorithms have calibrated your styling preferences. Here are curated coordinates ready to pair:";
        matchedOutfits = [
          {
            id: "col-shirts",
            title: "Shirts Collection",
            tag: "STAGED COLLECTION",
            description: "With the shirts and t-shirts displayed, consider layering a light shirt over a fitted t-shirt for a stylish, casual look. Pair them with your favorite jeans or chinos for an effortless outfit that's perfect for various occasions!",
            price: 380,
            mainImage: "/product_overshirt.png",
            gridImages: [
              "/luxe_minimalist.png",
              "/luxe_quietluxury.png",
              "/luxe_atelier.png",
              "/luxe_resort.png"
            ],
            clothingItems: [
              { id: "overshirt-1", sku: "LA-SH-039", title: "Linen Blend Overshirt", price: 380, category: "Ready-to-Wear" }
            ],
            expandedProducts: [
              { id: "overshirt-1", sku: "LA-SH-039", title: "100% Cotton Regular Fit Shirt", price: 380, category: "Ready-to-Wear", imageUrl: "/product_overshirt.png" },
              { id: "knit-polo", sku: "LA-KP-078", title: "Sparkling Beige Polo", price: 320, category: "Knitwear", imageUrl: "/luxe_knitwear.png" },
              { id: "linen-quiet", sku: "LA-LS-102", title: "Quiet Luxury Linen Shirt", price: 350, category: "Ready-to-Wear", imageUrl: "/luxe_quietluxury.png" },
              { id: "resort-shirt", sku: "LA-RS-056", title: "Classic Navy Button Down", price: 390, category: "Ready-to-Wear", imageUrl: "/luxe_resort.png" }
            ]
          },
          {
            id: "col-trousers",
            title: "Tailored Coordinates",
            tag: "STAGED COLLECTION",
            description: "Pair with custom-fit wool trousers calibrated at -1.5cm hem taper for a clean, floor-length silhouette.",
            price: 450,
            mainImage: "/product_trouser.png",
            clothingItems: [
              { id: "trouser-1", sku: "LA-TR-012", title: "Tailored Navy Trouser", price: 450, category: "Custom Fit" }
            ],
            expandedProducts: [
              { id: "trouser-1", sku: "LA-TR-012", title: "Tailored Navy Trouser", price: 450, category: "Custom Fit", imageUrl: "/product_trouser.png" },
              { id: "dress-1", sku: "LA-DR-094", title: "Silk Crepe Slip Dress", price: 680, category: "Evening Wear", imageUrl: "/product_dress.png" },
              { id: "wool-trouser", sku: "LA-TR-088", title: "Minimalist Wool Trouser", price: 480, category: "Custom Fit", imageUrl: "/luxe_minimalist.png" },
              { id: "classic-blazer", sku: "LA-BZ-045", title: "Heritage Classic Blazer", price: 850, category: "Ready-to-Wear", imageUrl: "/luxe_menswear.png" }
            ]
          }
        ];
      }

      setChatLog((prev) => [
        ...prev,
        {
          sender: "ai",
          type: matchedOutfits ? "outfits" : "text",
          text: replyText,
          outfits: matchedOutfits
        }
      ]);
    }, 800);
  };

  const handlePresetAction = (topic: "hem" | "stock" | "room" | "outfits") => {
    let userQuery = "";
    if (topic === "hem") userQuery = "Check active hem tailoring";
    if (topic === "stock") userQuery = "Verify atelier stock status";
    if (topic === "room") userQuery = "Enter immersive concierge canvas";
    if (topic === "outfits") userQuery = "Suggest outfits to pair";

    setChatLog((prev) => [...prev, { sender: "user", type: "text", text: userQuery }]);
    
    setTimeout(() => {
      let reply = "";
      let matchedOutfits: StagedOutfitCollection[] | undefined = undefined;

      if (topic === "hem") {
        reply = "Atelier sizing logs: Navy Trouser hem calibration is currently adjusted by -1.5cm for optimal lookbook drape.";
      } else if (topic === "stock") {
        reply = "Stock audit passed: Standard catalog pieces are fully available for customized cutting in our Florence textile mills.";
      } else if (topic === "room") {
        reply = "To access the immersive spatial room, please click the 'Enter Immersive Staging Canvas' route below.";
      } else if (topic === "outfits") {
        reply = "With the shirts and t-shirts displayed, consider layering a light shirt over a fitted t-shirt for a stylish, casual look. Pair them with your favorite jeans or chinos for an effortless outfit that's perfect for various occasions!";
        matchedOutfits = [
          {
            id: "col-shirts",
            title: "Shirts Collection",
            tag: "STAGED COLLECTION",
            description: "With the shirts and t-shirts displayed, consider layering a light shirt over a fitted t-shirt for a stylish, casual look. Pair them with your favorite jeans or chinos for an effortless outfit that's perfect for various occasions!",
            price: 380,
            mainImage: "/product_overshirt.png",
            gridImages: [
              "/luxe_minimalist.png",
              "/luxe_quietluxury.png",
              "/luxe_atelier.png",
              "/luxe_resort.png"
            ],
            clothingItems: [
              { id: "overshirt-1", sku: "LA-SH-039", title: "Linen Blend Overshirt", price: 380, category: "Ready-to-Wear" }
            ],
            expandedProducts: [
              { id: "overshirt-1", sku: "LA-SH-039", title: "100% Cotton Regular Fit Shirt", price: 380, category: "Ready-to-Wear", imageUrl: "/product_overshirt.png" },
              { id: "knit-polo", sku: "LA-KP-078", title: "Sparkling Beige Polo", price: 320, category: "Knitwear", imageUrl: "/luxe_knitwear.png" },
              { id: "linen-quiet", sku: "LA-LS-102", title: "Quiet Luxury Linen Shirt", price: 350, category: "Ready-to-Wear", imageUrl: "/luxe_quietluxury.png" },
              { id: "resort-shirt", sku: "LA-RS-056", title: "Classic Navy Button Down", price: 390, category: "Ready-to-Wear", imageUrl: "/luxe_resort.png" }
            ]
          },
          {
            id: "col-trousers",
            title: "Tailored Coordinates",
            tag: "STAGED COLLECTION",
            description: "Pair with custom-fit wool trousers calibrated at -1.5cm hem taper for a clean, floor-length silhouette.",
            price: 450,
            mainImage: "/product_trouser.png",
            clothingItems: [
              { id: "trouser-1", sku: "LA-TR-012", title: "Tailored Navy Trouser", price: 450, category: "Custom Fit" }
            ],
            expandedProducts: [
              { id: "trouser-1", sku: "LA-TR-012", title: "Tailored Navy Trouser", price: 450, category: "Custom Fit", imageUrl: "/product_trouser.png" },
              { id: "dress-1", sku: "LA-DR-094", title: "Silk Crepe Slip Dress", price: 680, category: "Evening Wear", imageUrl: "/product_dress.png" },
              { id: "wool-trouser", sku: "LA-TR-088", title: "Minimalist Wool Trouser", price: 480, category: "Custom Fit", imageUrl: "/luxe_minimalist.png" },
              { id: "classic-blazer", sku: "LA-BZ-045", title: "Heritage Classic Blazer", price: 850, category: "Ready-to-Wear", imageUrl: "/luxe_menswear.png" }
            ]
          }
        ];
      }

      setChatLog((prev) => [
        ...prev,
        {
          sender: "ai",
          type: matchedOutfits ? "outfits" : "text",
          text: reply,
          outfits: matchedOutfits
        }
      ]);
    }, 600);
  };

  // Inline SVG helper to represent garment item types in the bag drawer
  const getGarmentIcon = (category?: string) => {
    const lower = (category || "").toLowerCase();
    if (lower.includes("trouser")) {
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-obsidian-velvet">
          <path d="M35,15 L65,15 L70,85 L52,85 L50,45 L48,85 L30,85 Z" />
        </svg>
      );
    } else if (lower.includes("evening") || lower.includes("dress")) {
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-obsidian-velvet">
          <path d="M35,15 L32,30 L25,85 L75,85 L68,30 L65,15 Z" />
          <path d="M35,15 Q50,22 65,15" />
        </svg>
      );
    }
    // Default overshirt/jacket style
    return (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-obsidian-velvet">
        <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" />
        <path d="M50,12 L50,85" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-warm-linen font-sans antialiased text-obsidian-velvet selection:bg-tint-champagne relative">
      {/* Sticky Top Translucent Navigation Header */}
      <header className="fixed top-0 left-0 w-full bg-surface-white/80 backdrop-blur-md border-b border-muted-zinc z-50 h-16">
        <div className="max-w-7xl mx-auto h-full px-6 sm:px-8 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {/* Hamburger Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
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

          {/* Navigation Links */}
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

          {/* Right Header Controls */}
          <div className="flex items-center gap-6 text-[11px] font-sans font-semibold uppercase tracking-wider">
            {/* Profile Dropdown or Sign In */}
            <div className="relative">
              <button
                onClick={() => {
                  if (isLoggedIn) {
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  } else {
                    setAuthTab("signin");
                    setIsAuthModalOpen(true);
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
                      handleSignOutClick(e);
                    }}
                    className="w-full text-left px-4 py-2 text-[10px] font-sans font-semibold uppercase tracking-widest text-obsidian-velvet hover:bg-tint-champagne/50 transition-colors cursor-pointer border-none bg-transparent"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
            
            {/* Bag Counter */}
            <button
              type="button"
              onClick={() => toggleBagDrawer(true)}
              className="relative flex items-center hover:opacity-85 transition-opacity cursor-pointer border-none bg-transparent p-1"
              title="Open Bag"
            >
              <svg className="w-5 h-5 text-obsidian-velvet" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              {bagCount > 0 && (
                <span className="flex w-4.5 h-4.5 rounded-full border border-muted-zinc bg-obsidian-velvet text-surface-white text-[8px] items-center justify-center font-bold absolute -top-1.5 -right-1.5 animate-in zoom-in duration-200">
                  {bagCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Boundaries */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-24 pb-16 relative z-10">
        {children}
      </main>

      {/* Sliding Dynamic Shopping Bag Drawer */}
      {isBagDrawerOpen && (
        <>
          {/* Backdrop Mask */}
          <div
            onClick={() => toggleBagDrawer(false)}
            className="fixed inset-0 bg-obsidian-velvet/10 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-surface-white border-l border-muted-zinc z-50 p-6 flex flex-col justify-between shadow-none animate-in slide-in-from-right duration-300">
            <div className="flex flex-col flex-1 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-muted-zinc/60 pb-4 mb-5">
                <div>
                  <span className="font-sans text-[9px] tracking-widest uppercase text-obsidian-velvet/40 block mb-0.5">
                    Your Curation
                  </span>
                  <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">
                    Capsule Bag Curation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBagDrawer(false)}
                  className="w-6 h-6 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet flex items-center justify-center font-sans text-xs rounded transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Shopping Bag Items List */}
              {bagItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 text-obsidian-velvet/20">
                    <path d="M25,85 L35,20 L50,12 L65,20 L75,85 Z" />
                    <line x1="25" y1="85" x2="75" y2="85" />
                  </svg>
                  <p className="font-sans text-xs text-obsidian-velvet/40 leading-relaxed max-w-[220px]">
                    Your curation capsule is empty. Return to the shop feed to select garments.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pr-1">
                  {bagItems.map((item, idx) => (
                    <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4 border-b border-muted-zinc/40 pb-4 items-center">
                      <div className="w-12 h-12 rounded-md border border-muted-zinc/40 overflow-hidden flex-shrink-0 relative">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-warm-linen/40 flex items-center justify-center">
                            {getGarmentIcon(item.category || item.title)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-sans text-[8px] tracking-widest uppercase text-obsidian-velvet/40 block">
                          {item.sku} — {item.category}
                        </span>
                        <h4 className="font-serif text-xs font-medium text-obsidian-velvet truncate mb-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="bg-warm-linen border border-muted-zinc/80 px-2 py-0.5 rounded-sm text-[8px] font-sans font-bold text-obsidian-velvet/60 uppercase">
                            Fit: {item.size}
                          </span>
                          
                          {/* Quantity Selector */}
                          <div className="flex items-center border border-muted-zinc rounded bg-warm-linen/10 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.size, -1)}
                              className="px-2 py-0.5 hover:bg-muted-zinc/20 text-obsidian-velvet/85 text-[10px] font-bold border-none transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 text-[9px] font-sans font-semibold text-obsidian-velvet/90">
                              {item.quantity || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.size, 1)}
                              className="px-2 py-0.5 hover:bg-muted-zinc/20 text-obsidian-velvet/85 text-[10px] font-bold border-none transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="font-sans text-xs font-semibold block text-obsidian-velvet">
                          ${item.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromBag(item.id, item.size)}
                          className="font-sans text-[9px] uppercase tracking-wider text-red-500 hover:text-red-700 hover:underline border-none bg-transparent cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-muted-zinc/60 pt-4 space-y-4 bg-surface-white">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-sans text-obsidian-velvet/60">
                  <span>Subtotal Curation</span>
                  <span className="font-semibold text-obsidian-velvet">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-sans text-obsidian-velvet/60">
                  <span>Carbon-Neutral Courier</span>
                  <span className="font-semibold text-obsidian-velvet">Complimentary</span>
                </div>
                <div className="flex justify-between items-center text-obsidian-velvet border-t border-muted-zinc/40 pt-2">
                  <span className="font-serif text-sm">Total Curation Capital</span>
                  <span className="font-sans text-sm font-bold">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCheckoutNavigation}
                  disabled={bagItems.length === 0}
                  className="w-full bg-obsidian-velvet text-surface-white font-sans font-semibold text-xs rounded-md py-3 hover:bg-obsidian-velvet/90 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-none flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Express Checkout</span>
                  <span className="text-[10px]">→</span>
                </button>
                <p className="font-sans text-[9px] text-obsidian-velvet/40 text-center leading-relaxed">
                  Compiles items dynamically for transaction ledger authorization.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sliding Dynamic AI Assistant Drawer */}
      {isAiOpen && (
        <>
          {/* Backdrop Mask */}
          <div
            onClick={() => toggleAiDrawer(false)}
            className="fixed inset-0 bg-obsidian-velvet/10 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
          />

          {/* AI Drawer Panel */}
          <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-surface-white border-l border-muted-zinc z-50 p-6 flex flex-col justify-between shadow-none animate-in slide-in-from-right duration-300">
            {viewingCollection ? (
              // Curated collection detailed product grid view
              <div className="flex-grow flex flex-col min-h-0 overflow-hidden animate-in fade-in duration-200">
                {/* Back to chat button */}
                <button
                  type="button"
                  onClick={() => setViewingCollection(null)}
                  className="flex items-center gap-1.5 text-obsidian-velvet/50 hover:text-obsidian-velvet transition-all duration-200 cursor-pointer border-none bg-transparent group self-start"
                  title="Back to chat"
                >
                  <span className="text-base leading-none group-hover:-translate-x-0.5 transition-transform duration-200 inline-block">←</span>
                  <span className="font-sans text-[9px] font-bold uppercase tracking-widest">Back to chat</span>
                </button>

                {/* Header */}
                <div className="mt-4 mb-4">
                  <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">
                    {viewingCollection.title}
                  </h3>
                  <p className="font-sans text-[10px] text-obsidian-velvet/60 mt-1.5 leading-relaxed">
                    Discover our curated range of {viewingCollection.title === "Shirts Collection" ? "T-Shirts and Shirts" : "tailored coordinates"}. Crafted for those who appreciate quality, detail and effortless style.
                  </p>
                </div>

                <div className="border-b border-muted-zinc/60 mb-4" />

                {/* Grid of expanded products */}
                <div className="flex-grow overflow-y-auto pr-1 scrollbar-thin min-h-0">
                  <div className="grid grid-cols-2 gap-4 pb-4">
                    {viewingCollection.expandedProducts?.map((product) => {
                      const isAdded = addedItems[product.id];
                      return (
                        <div
                          key={product.id}
                          className="flex flex-col space-y-2 group relative border border-muted-zinc/40 rounded-lg p-2 bg-warm-linen/10"
                        >
                          {/* Image Box */}
                          <div
                            onClick={() => setActiveProductOverview(product)}
                            className="aspect-[3/4] w-full bg-warm-linen/25 rounded-md overflow-hidden relative border border-muted-zinc/20 cursor-pointer"
                          >
                            <img
                              src={product.imageUrl || "/product_overshirt.png"}
                              alt={product.title}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            />
                            {/* Top Right Plus Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddProductToBag(product);
                              }}
                              className={`absolute top-2 right-2 w-6 h-6 bg-surface-white hover:bg-zinc-100 border border-muted-zinc text-obsidian-velvet rounded shadow-sm flex items-center justify-center font-bold text-xs transition-all active:scale-[0.9] cursor-pointer ${
                                isAdded ? "bg-emerald-50 border-emerald-300 text-emerald-600 scale-105 animate-pulse" : ""
                              }`}
                              title={isAdded ? "Added to capsule bag" : "Add to capsule bag"}
                            >
                              {isAdded ? "✓" : "+"}
                            </button>
                          </div>

                          {/* Info */}
                          <div
                            onClick={() => setActiveProductOverview(product)}
                            className="space-y-0.5 min-w-0 cursor-pointer"
                          >
                            <h4 className="font-serif text-[10px] font-semibold text-obsidian-velvet truncate leading-tight hover:underline">
                              {product.title}
                            </h4>
                            <span className="font-sans text-[9px] font-semibold text-obsidian-velvet/60">
                              ${product.price}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Chat content as normal
              <div className="flex flex-col flex-grow min-h-0 overflow-hidden">
                <div className="flex items-center justify-between border-b border-muted-zinc/60 pb-4 mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <span className="font-sans text-[8px] tracking-widest uppercase text-obsidian-velvet/40 block">
                        Autonomous Stylist
                      </span>
                      <h3 className="font-serif text-sm font-semibold text-obsidian-velvet">
                        AI Concierge Session
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAiDrawer(false)}
                    className="w-6 h-6 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet flex items-center justify-center font-sans text-xs rounded transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Chat Thread Container */}
                <div className="flex-grow overflow-y-auto space-y-4 pr-1 text-xs pb-4 min-h-0">
                  {chatLog.map((chat, idx) => {
                    const isAi = chat.sender === "ai";
                    if (chat.type === "outfits" && chat.outfits) {
                      return (
                        <div key={idx} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          {/* Text part of message */}
                          {chat.text && (
                            <div className="p-4 rounded-xl space-y-3 bg-tint-champagne border border-muted-zinc/40">
                              <div className="space-y-1">
                                <span className="font-sans font-bold tracking-widest text-[8px] uppercase text-obsidian-velvet/40 block">
                                  AI Concierge
                                </span>
                                <p className="font-sans text-obsidian-velvet/90 leading-relaxed">
                                  {chat.text}
                                </p>
                              </div>
                              
                              {/* Card Grid / List of Outfit Recommendations */}
                              <div className="flex flex-col gap-4">
                                {chat.outfits.map((collection) => {
                                  const isGrid = collection.gridImages && collection.gridImages.length > 0;
                                  return (
                                    <div
                                      key={collection.id}
                                      className="bg-surface-white border border-muted-zinc rounded-xl overflow-hidden shadow-none flex flex-col transition-all hover:border-obsidian-velvet/40 group"
                                    >
                                      {/* Image Layout block */}
                                      <div className="aspect-[4/3] w-full bg-warm-linen/25 flex border-b border-muted-zinc/50 overflow-hidden relative">
                                        {isGrid ? (
                                          <>
                                            {/* Column 1: Main spotlight image (50% width) */}
                                            <div className="w-1/2 h-full relative border-r border-muted-zinc/30">
                                              <img
                                                src={collection.mainImage}
                                                alt={collection.title}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                                              />
                                            </div>
                                            {/* Column 2: 2x2 grid of smaller images (50% width) */}
                                            <div className="w-1/2 h-full grid grid-cols-2 grid-rows-2">
                                              {collection.gridImages!.map((imgUrl, i) => (
                                                <div key={i} className="relative border-b border-r border-muted-zinc/20 overflow-hidden last:border-b-0 last:border-r-0 odd:border-r">
                                                  <img
                                                    src={imgUrl}
                                                    alt="collection item"
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          </>
                                        ) : (
                                          // Single Spotlight image (100% width)
                                          <div className="w-full h-full relative">
                                            <img
                                              src={collection.mainImage}
                                              alt={collection.title}
                                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                                            />
                                          </div>
                                        )}
                                      </div>

                                      {/* Footer / Description / Explore Button block */}
                                      <div className="p-3.5 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                          <div className="space-y-0.5">
                                            <span className="font-sans text-[7px] tracking-widest font-bold uppercase text-obsidian-velvet/40 block">
                                              {collection.tag}
                                            </span>
                                            <h4 className="font-serif text-[10px] font-semibold text-obsidian-velvet tracking-tight">
                                              {collection.title}
                                            </h4>
                                          </div>
                                          
                                          {/* Explore Button */}
                                          <button
                                            type="button"
                                            onClick={() => setViewingCollection(collection)}
                                            className="bg-obsidian-velvet hover:bg-obsidian-velvet/90 text-surface-white font-sans font-semibold text-[8px] uppercase tracking-wider px-3 py-1.5 rounded flex items-center gap-1 transition-all active:scale-[0.98] cursor-pointer"
                                          >
                                            <span>Explore More</span>
                                            <span className="text-[9px]">➔</span>
                                          </button>
                                        </div>
                                        
                                        <p className="font-sans text-[9px] text-obsidian-velvet/60 leading-relaxed">
                                          {collection.description}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Helpfulness Feedback buttons */}
                              <div className="border-t border-muted-zinc/30 pt-3 mt-1 flex items-center justify-between text-[9px] font-sans text-obsidian-velvet/50">
                                <span>Is this response helpful?</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(idx, "like")}
                                    className={`p-1.5 rounded hover:bg-warm-linen/40 transition-colors cursor-pointer flex items-center justify-center text-xs ${
                                      chat.feedback === "like" ? "text-emerald-600 bg-emerald-50 border border-emerald-100 font-bold scale-105" : ""
                                    }`}
                                    title="Helpful"
                                  >
                                    👍
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(idx, "dislike")}
                                    className={`p-1.5 rounded hover:bg-warm-linen/40 transition-colors cursor-pointer flex items-center justify-center text-xs ${
                                      chat.feedback === "dislike" ? "text-rose-600 bg-rose-50 border border-rose-100 font-bold scale-105" : ""
                                    }`}
                                    title="Not helpful"
                                  >
                                    👎
                                  </button>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl space-y-1 transition-all ${
                          isAi
                            ? "bg-tint-champagne border border-muted-zinc/40"
                            : "bg-warm-linen/40 border border-muted-zinc text-right ml-8"
                        }`}
                      >
                        <span className="font-sans font-bold tracking-widest text-[8px] uppercase text-obsidian-velvet/40 block">
                          {isAi ? "AI Concierge" : "Client (You)"}
                        </span>
                        <p className="font-sans text-obsidian-velvet/90 leading-relaxed">
                          {chat.text}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Action Suggestion Capsules & Inputs */}
                <div className="border-t border-muted-zinc/60 pt-4 space-y-4 bg-surface-white flex-shrink-0">
                  {/* Suggestion tags */}
                  <div className="space-y-1.5">
                    <span className="font-sans text-[9px] tracking-wider uppercase font-semibold text-obsidian-velvet/40 block">
                      Quick Curation Actions
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePresetAction("outfits")}
                        className="bg-tint-champagne hover:bg-tint-champagne/80 border border-muted-zinc px-2.5 py-1.5 rounded-md text-[9px] font-sans font-bold text-obsidian-velvet/70 uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Outfits to pair</span>
                        <span className="text-[10px]">✦</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetAction("hem")}
                        className="bg-zinc-50 hover:bg-zinc-100 border border-muted-zinc px-2.5 py-1.5 rounded-md text-[9px] font-sans font-bold text-obsidian-velvet/70 uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Check Hem Delta
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetAction("stock")}
                        className="bg-zinc-50 hover:bg-zinc-100 border border-muted-zinc px-2.5 py-1.5 rounded-md text-[9px] font-sans font-bold text-obsidian-velvet/70 uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Atelier Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toggleAiDrawer(false);
                          router.push("/concierge");
                        }}
                        className="bg-zinc-50 hover:bg-zinc-100 border border-muted-zinc px-2.5 py-1.5 rounded-md text-[9px] font-sans font-bold text-amber-700 uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        ✦ Staging Canvas
                      </button>
                    </div>
                  </div>

                  {/* Chat Send Form */}
                  <form onSubmit={handleSendMessage} className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Message your style concierge..."
                        className="w-full bg-warm-linen/40 border border-muted-zinc rounded-md pl-3 pr-12 py-2.5 text-xs font-sans text-obsidian-velvet focus:outline-none focus:border-obsidian-velvet placeholder-obsidian-velvet/40"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-obsidian-velvet hover:text-obsidian-velvet/80 font-sans font-semibold text-[10px] tracking-wider uppercase border-none bg-transparent cursor-pointer"
                      >
                        Send
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        toggleAiDrawer(false);
                        router.push("/concierge");
                      }}
                      className="w-full bg-obsidian-velvet text-surface-white font-sans font-semibold text-xs rounded-md py-3 hover:bg-obsidian-velvet/90 active:scale-[0.99] transition-all duration-200 shadow-none flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Enter Immersive Staging Room</span>
                      <span className="text-[10px]">✦</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating AI Concierge Launcher removed — users access via /concierge page */}

      {/* Sign Out Confirmation Modal Overlay */}
      {showSignOutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 max-w-sm w-full mx-4 space-y-6 shadow-none animate-in zoom-in-95 duration-200">
            <div className="space-y-2 text-center">
              <h3 className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet">
                Confirm Sign Out
              </h3>
              <p className="font-sans text-xs text-obsidian-velvet/60 leading-relaxed">
                Are you sure you want to end your current session? You will need to sign in again to access the shop.
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

      {/* Mobile Sidebar Navigation Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop mask */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-obsidian-velvet/20 backdrop-blur-md z-[60] transition-opacity animate-in fade-in duration-200 xl:hidden"
          />

          {/* Sliding Panel */}
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-surface-white border-r border-muted-zinc z-[70] p-8 flex flex-col justify-between shadow-none animate-in slide-in-from-left duration-300 xl:hidden">
            <div className="space-y-8">
              {/* Close & Brand Header */}
              <div className="flex items-center justify-between border-b border-muted-zinc/60 pb-5">
                <span className="font-serif text-xl font-light tracking-tight text-obsidian-velvet">
                  Vestira
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-6 h-6 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet flex items-center justify-center font-sans text-xs rounded transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Navigation list */}
              <nav className="flex flex-col gap-6 text-[12px] font-sans font-bold tracking-widest uppercase text-obsidian-velvet/60">
                <Link
                  href="/shop"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`hover:text-obsidian-velvet transition-colors pb-1 ${
                    pathname === "/shop" ? "text-obsidian-velvet font-bold pl-2 border-l-2 border-obsidian-velvet" : ""
                  }`}
                >
                  Lookbook
                </Link>
                <Link
                  href="/shop/catalog"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`hover:text-obsidian-velvet transition-colors pb-1 ${
                    pathname === "/shop/catalog" || pathname.startsWith("/pdp") ? "text-obsidian-velvet font-bold pl-2 border-l-2 border-obsidian-velvet" : ""
                  }`}
                >
                  Catalog
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`hover:text-obsidian-velvet transition-colors pb-1 ${
                    pathname === "/profile" ? "text-obsidian-velvet font-bold pl-2 border-l-2 border-obsidian-velvet" : ""
                  }`}
                >
                  Calibrations
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`hover:text-obsidian-velvet transition-colors pb-1 ${
                    pathname === "/orders" ? "text-obsidian-velvet font-bold pl-2 border-l-2 border-obsidian-velvet" : ""
                  }`}
                >
                  Purchases
                </Link>
                <Link
                  href="/concierge"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-amber-600 transition-colors font-bold pb-1 text-amber-600/80 text-[12px] uppercase tracking-widest"
                >
                  ✦ AI Concierge
                </Link>
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-muted-zinc/60 pt-6 space-y-4">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    handleSignOutClick(e);
                  }}
                  className="w-full text-center border border-muted-zinc hover:border-red-500 hover:text-red-600 py-2.5 rounded-md font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setAuthTab("signin");
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full text-center border border-muted-zinc hover:border-obsidian-velvet py-2.5 rounded-md font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {/* Product Overview Modal Popup Overlay */}
      {activeProductOverview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center animate-in fade-in duration-250">
          <div className="bg-surface-white border border-muted-zinc rounded-xl overflow-hidden shadow-2xl flex flex-col max-w-sm w-full mx-4 aspect-[3/4] animate-in zoom-in-95 duration-200 relative">
            
            {/* Top Left Close Icon */}
            <button
              onClick={() => setActiveProductOverview(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-surface-white/85 backdrop-blur-sm border border-muted-zinc/40 text-obsidian-velvet hover:bg-surface-white flex items-center justify-center font-bold transition-all cursor-pointer z-50 text-xs shadow-sm hover:scale-105 active:scale-95"
              title="Close overview"
            >
              ✕
            </button>

            {/* Top Right Wishlist Icon */}
            <button
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-white/85 backdrop-blur-sm border border-muted-zinc/40 text-obsidian-velvet hover:bg-surface-white flex items-center justify-center transition-all cursor-pointer z-50 text-sm shadow-sm hover:scale-105 active:scale-95"
              title="Add to wishlist"
            >
              ♡
            </button>

            {/* Image Curation Container */}
            <div className="flex-grow w-full h-full relative bg-warm-linen/10 overflow-hidden">
              <img
                src={activeProductOverview.imageUrl || "/product_overshirt.png"}
                alt={activeProductOverview.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Bottom White Footer Bar */}
            <div className="bg-surface-white p-5 border-t border-muted-zinc/30 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-serif text-sm font-semibold text-obsidian-velvet truncate flex-1 leading-tight">
                  {activeProductOverview.title}
                </h4>
                <span className="font-sans text-sm font-bold text-obsidian-velvet flex-shrink-0">
                  ${activeProductOverview.price}
                </span>
              </div>

              <button
                onClick={() => {
                  handleAddProductToBag(activeProductOverview);
                  setActiveProductOverview(null);
                }}
                className="w-full bg-obsidian-velvet hover:bg-obsidian-velvet/90 text-surface-white font-sans font-semibold text-xs tracking-wider uppercase py-3.5 rounded transition-all active:scale-[0.98] cursor-pointer shadow-md text-center border-none"
              >
                ADD TO BAG
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Premium Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 max-w-sm w-full mx-4 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            
            {/* Close Button */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 w-6 h-6 text-obsidian-velvet/40 hover:text-obsidian-velvet transition-colors font-sans text-sm cursor-pointer border-none bg-transparent"
            >
              ✕
            </button>

            <div className="space-y-2 text-center">
              <h3 className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet">
                {authTab === "signin" ? "Welcome back to Vestira" : "Join the Vestira Atelier"}
              </h3>
              <p className="font-sans text-[10px] text-obsidian-velvet/50 tracking-wider uppercase">
                {authTab === "signin" ? "Sign in to access your curated capsule" : "Create an account to calibrate your styling persona"}
              </p>
            </div>

            {/* Tab Pill Toggles */}
            <div className="flex p-0.5 rounded-md border border-muted-zinc bg-warm-linen/40 backdrop-blur-sm w-full">
              <button
                type="button"
                onClick={() => setAuthTab("signin")}
                className={`flex-1 rounded-md py-1.5 text-[10px] font-bold font-sans uppercase tracking-widest transition-all duration-300 border-none cursor-pointer ${
                  authTab === "signin"
                    ? "bg-obsidian-velvet text-surface-white"
                    : "text-obsidian-velvet/60 hover:text-obsidian-velvet bg-transparent"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("signup")}
                className={`flex-1 rounded-md py-1.5 text-[10px] font-bold font-sans uppercase tracking-widest transition-all duration-300 border-none cursor-pointer ${
                  authTab === "signup"
                    ? "bg-obsidian-velvet text-surface-white"
                    : "text-obsidian-velvet/60 hover:text-obsidian-velvet bg-transparent"
                }`}
              >
                Register
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleModalAuthSubmit} className="space-y-4">
              {authTab === "signup" && (
                <div>
                  <label className="block font-sans text-[9px] font-bold tracking-widest text-obsidian-velvet/40 uppercase mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Jean Lauren"
                    className="w-full bg-warm-linen/40 border border-muted-zinc rounded-md px-4 py-2.5 text-xs font-sans text-obsidian-velvet placeholder-obsidian-velvet/30 focus:outline-none focus:border-obsidian-velvet transition-colors duration-200"
                  />
                </div>
              )}

              <div>
                <label className="block font-sans text-[9px] font-bold tracking-widest text-obsidian-velvet/40 uppercase mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="client@vestira.ai"
                  className="w-full bg-warm-linen/40 border border-muted-zinc rounded-md px-4 py-2.5 text-xs font-sans text-obsidian-velvet placeholder-obsidian-velvet/30 focus:outline-none focus:border-obsidian-velvet transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block font-sans text-[9px] font-bold tracking-widest text-obsidian-velvet/40 uppercase mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-warm-linen/40 border border-muted-zinc rounded-md px-4 py-2.5 text-xs font-sans text-obsidian-velvet placeholder-obsidian-velvet/30 focus:outline-none focus:border-obsidian-velvet transition-colors duration-200"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-obsidian-velvet text-surface-white font-sans font-semibold text-[10px] tracking-widest uppercase rounded-md py-3 hover:bg-obsidian-velvet/90 active:scale-[0.99] transition-all duration-200 border-none cursor-pointer"
              >
                {authTab === "signin" ? "Sign In" : "Register"}
              </button>
            </form>
            
            <p className="font-sans text-[8px] text-obsidian-velvet/40 text-center leading-relaxed max-w-xs mx-auto">
              Your session state, customized fit metrics, and bag selections will remain saved in this browser window.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
