"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "sonner";
import { useBag, BagItem } from "@/app/(customer)/BagContext";
import { createClient } from "@/lib/supabase/client";
import { handleApiError } from "@/lib/utils/error-handler";
import { checkoutSchema, CheckoutFormValues } from "./lib/checkout-schema";
import { CustomerSection } from "./components/CustomerSection";
import { PaymentSection } from "./components/PaymentSection";
import { OrderSummary } from "./components/OrderSummary";

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prodId = searchParams.get("productId");
  const size = searchParams.get("size") || "M";

  const isBuyNow = !!prodId;
  const { bagItems, clearBag, updateQuantity, removeFromBag } = useBag();
  const [buyNowItem, setBuyNowItem] = useState<BagItem | null>(null);

  const [activeTab, setActiveTab] = useState<"customer" | "payment">("customer");
  const [savedCard, setSavedCard] = useState<{
    id: string;
    card_last4: string;
    card_brand: string | null;
    card_name: string;
    card_expiry: string;
    card_number_masked: string;
  } | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      address: "",
      usingSavedCard: true,
      editingCard: false,
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCvv: "",
    },
  });

  const watchUsingSavedCard = watch("usingSavedCard");
  const watchEditingCard = watch("editingCard");
  const watchCardNumber = watch("cardNumber");

  // Buy Now item loader
  useEffect(() => {
    async function checkBuyNow() {
      if (prodId) {
        const isStatic = prodId.startsWith("overshirt") || prodId.startsWith("trouser") || prodId.startsWith("dress");
        if (isStatic) {
          const staticMap: Record<string, any> = {
            "overshirt-1": { id: "overshirt-1", sku: "LA-SH-039", title: "Linen Blend Overshirt", price: 380, size, material: "Linen Blend", category: "Atelier", imageUrl: "/product_overshirt.png", quantity: 1 },
            "trouser-1": { id: "trouser-1", sku: "LA-TR-012", title: "Tailored Navy Trouser", price: 450, size, material: "100% Virgin Wool", category: "Couture", imageUrl: "/product_trouser.png", quantity: 1 },
            "dress-1": { id: "dress-1", sku: "LA-DR-094", title: "Silk Crepe Slip Dress", price: 680, size, material: "Silk Crepe", category: "Evening Wear", imageUrl: "/product_dress.png", quantity: 1 },
          };
          const item = staticMap[prodId];
          if (item) setBuyNowItem(item);
        } else {
          try {
            const supabase = createClient();
            const { data } = await supabase.from("products").select("*").eq("id", prodId).maybeSingle();
            if (data) {
              setBuyNowItem({
                id: data.id, sku: data.sku, title: data.title,
                price: Number(data.price) || 0, size: size as any,
                material: data.material_composition || "Selected Fiber",
                category: data.category || "Atelier",
                imageUrl: data.image_urls?.[0] || "/product_overshirt.png",
                quantity: 1,
                stockBySize: (data.stock_by_size as Record<string, number>) || {},
              });
            }
          } catch (e) {
            console.error("Failed to load Buy Now product:", e);
          }
        }
      }
    }
    checkBuyNow();
  }, [prodId, size]);

  // Load user profile & saved card
  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setValue("email", user.email || "");

          const { data: profile } = await supabase
            .from("user_style_profiles").select("display_name").eq("user_id", user.id).maybeSingle();
          if (profile?.display_name) {
            setValue("fullName", profile.display_name);
          } else if (user.user_metadata?.full_name) {
            setValue("fullName", user.user_metadata.full_name);
          }

          if (user.user_metadata?.address) {
            setValue("address", user.user_metadata.address);
          } else {
            const { data: lastOrder } = await supabase
              .from("orders").select("shipping_address").eq("user_id", user.id)
              .order("created_at", { ascending: false }).limit(1).maybeSingle();
            if (lastOrder?.shipping_address) {
              const addr = lastOrder.shipping_address as any;
              if (addr && typeof addr === "object") {
                setValue("address", addr.street || addr.streetLine || addr.formatted || "");
              } else if (typeof addr === "string") {
                setValue("address", addr);
              }
            }
          }

          const { data: paymentMethod } = await supabase
            .from("user_payment_methods").select("*").eq("user_id", user.id).eq("is_default", true).maybeSingle();
          if (paymentMethod) {
            setSavedCard(paymentMethod);
            setValue("cardName", paymentMethod.card_name);
            setValue("cardExpiry", paymentMethod.card_expiry);
            setValue("cardNumber", paymentMethod.card_number_masked);
            setValue("usingSavedCard", true);
          } else {
            setValue("usingSavedCard", false);
          }
        }
      } catch (err) {
        console.error("Failed to load user details:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadUserData();
  }, [setValue]);

  const handleContinueToPayment = async () => {
    const isValid = await trigger(["fullName", "email", "address"]);
    if (isValid) {
      setActiveTab("payment");
    } else {
      toast.error("Please fill in all required customer details.");
    }
  };

  const activeItems = isBuyNow ? (buyNowItem ? [buyNowItem] : []) : bagItems.length > 0 ? bagItems : [];
  const subtotal = activeItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
  const totalItems = activeItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const deliveryFee = activeItems.length > 0 ? 15 : 0;
  const total = subtotal + deliveryFee;

  const onSubmit = async (values: CheckoutFormValues) => {
    setIsAuthorizing(true);
    let newOrderId: string | undefined = undefined;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const orderItems = activeItems.map((item) => ({
          product_id: (item.id.startsWith("overshirt") || item.id.startsWith("trouser") || item.id.startsWith("dress")) ? null : item.id,
          sku: item.sku, title: item.title, size: item.size,
          qty: item.quantity || 1, unit_price: item.price,
          image_url: item.imageUrl || "",
        }));

        const { data: newOrder, error: orderError } = await supabase
          .from("orders").insert({
            user_id: user.id, items: orderItems,
            subtotal, shipping_cost: deliveryFee, total, status: "CONFIRMED",
            shipping_address: { name: values.fullName, street: values.address, email: values.email },
          }).select("id").single();

        if (orderError) throw orderError;
        if (newOrder) newOrderId = newOrder.id;

        await supabase.from("user_style_profiles").upsert({
          user_id: user.id, display_name: values.fullName, onboarding_complete: true,
        });
      }

      setTimeout(() => {
        setIsAuthorizing(false);
        if (!isBuyNow) clearBag();
        toast.success("Order authorized successfully!");
        router.push(newOrderId ? `/orders/confirmation?orderId=${newOrderId}` : "/orders/confirmation");
      }, 1500);
    } catch (err: any) {
      handleApiError(err, "Checkout Order Placement");
      setIsAuthorizing(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
        <span className="font-serif text-sm text-obsidian-velvet/40 tracking-wider uppercase">
          Aligning Preferences...
        </span>
      </div>
    );
  }

  if (activeItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 space-y-6">
        <div className="w-16 h-16 rounded-full border border-muted-zinc flex items-center justify-center">
          <svg className="w-7 h-7 text-obsidian-velvet/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-light text-obsidian-velvet tracking-tight">Your bag is empty</h2>
          <p className="font-sans text-sm text-obsidian-velvet/50 max-w-xs">
            Add pieces to your bag before proceeding to checkout.
          </p>
        </div>
        <Link href="/shop/catalog" className="inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-widest text-surface-white bg-obsidian-velvet hover:bg-obsidian-velvet/90 transition-colors px-6 py-3 rounded-xl">
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="mb-6">
        <Link href="/shop" className="font-sans font-bold text-sm text-obsidian-velvet hover:opacity-75 transition-opacity flex items-center gap-2 w-fit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (Forms) */}
        <div className="lg:col-span-7">
          {/* Tabs */}
          <div className="flex items-center gap-8 border-b border-muted-zinc/60 mb-8">
            {(["customer", "payment"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => tab === "customer" ? setActiveTab("customer") : handleContinueToPayment()}
                className={`flex items-center gap-2 pb-3 border-b-2 font-sans text-sm font-bold w-1/2 justify-center transition-colors cursor-pointer ${activeTab === tab
                    ? "border-obsidian-velvet text-obsidian-velvet"
                    : "border-transparent text-obsidian-velvet/40 hover:text-obsidian-velvet/70"
                  }`}
              >
                <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${activeTab === tab ? "bg-obsidian-velvet text-surface-white" : "bg-muted-zinc/50 text-surface-white"}`}>
                  ✓
                </span>
                {tab === "customer" ? "Customer Information" : "Payment Details"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {activeTab === "customer" ? (
              <CustomerSection register={register} errors={errors} isAuthorizing={isAuthorizing} />
            ) : (
              <PaymentSection
                register={register}
                errors={errors}
                isAuthorizing={isAuthorizing}
                savedCard={savedCard}
                watchUsingSavedCard={watchUsingSavedCard}
                watchEditingCard={watchEditingCard}
                watchCardNumber={watchCardNumber}
                setValue={setValue}
              />
            )}
          </form>
        </div>

        {/* Right Column (Order Summary) */}
        <div className="lg:col-span-5 pt-6">
          <OrderSummary
            activeItems={activeItems}
            isBuyNow={isBuyNow}
            activeTab={activeTab}
            subtotal={subtotal}
            totalItems={totalItems}
            deliveryFee={deliveryFee}
            total={total}
            isAuthorizing={isAuthorizing}
            onContinueToPayment={handleContinueToPayment}
            onSubmit={handleSubmit(onSubmit)}
            onRemoveItem={(id, size) => {
              if (isBuyNow) setBuyNowItem(null);
              else removeFromBag(id, size);
            }}
            onUpdateQuantity={(id, size, delta) => {
              if (isBuyNow) {
                if (!buyNowItem) return;
                const currentQty = buyNowItem.quantity || 1;
                const newQty = currentQty + delta;
                const stock = buyNowItem.stockBySize?.[size] ?? 100;
                if (delta > 0 && newQty > stock) {
                  toast.error(`Cannot increase quantity. Only ${stock} units of ${buyNowItem.title} (${size}) are in stock.`);
                  return;
                }
                setBuyNowItem({ ...buyNowItem, quantity: Math.max(1, newQty) });
              } else {
                if (delta < 0 && (!activeItems.find(i => i.id === id && i.size === size)?.quantity || activeItems.find(i => i.id === id && i.size === size)!.quantity! <= 1)) {
                  removeFromBag(id, size);
                } else {
                  updateQuantity(id, size, delta);
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
          <span className="font-serif text-sm text-obsidian-velvet/40 tracking-wider uppercase">
            Loading Checkout Staging...
          </span>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
