"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useBag, BagItem } from "../BagContext";
import { createClient } from "@/lib/supabase/client";
import { FormField, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { handleApiError } from "@/lib/utils/error-handler";



const checkoutSchema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required.")
    .matches(/^[A-Za-z\s\-]+$/, "First name must contain only letters and spaces."),
  lastName: yup
    .string()
    .required("Last name is required.")
    .matches(/^[A-Za-z\s\-]+$/, "Last name must contain only letters and spaces."),
  email: yup.string().email("Please enter a valid email format.").required("Email address is required."),
  address: yup.string().min(8, "Please enter a complete delivery address.").required("Delivery address is required."),
  usingSavedCard: yup.boolean().default(true),
  editingCard: yup.boolean().default(false),
  cardNumber: yup.string().when(["usingSavedCard", "editingCard"], {
    is: (usingSaved: boolean, editing: boolean) => !usingSaved || editing,
    then: (schema) =>
      schema
        .required("Card number is required.")
        .test("len", "Please enter a valid 16-digit card number.", (val) => val?.replace(/[\s•]/g, "").length === 16),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardName: yup.string().when(["usingSavedCard", "editingCard"], {
    is: (usingSaved: boolean, editing: boolean) => !usingSaved || editing,
    then: (schema) =>
      schema
        .required("Cardholder name is required.")
        .matches(/^[A-Za-z\s\-]+$/, "Cardholder name must contain only letters and spaces."),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardExpiry: yup.string().when(["usingSavedCard", "editingCard"], {
    is: (usingSaved: boolean, editing: boolean) => !usingSaved || editing,
    then: (schema) =>
      schema.required("Expiry is required.").matches(/^(0[1-9]|1[0-2])\/\d{2}$/, "Please enter expiry in MM/YY format."),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardCvv: yup
    .string()
    .required("CVV is required to confirm payment.")
    .min(3, "CVV must be 3 or 4 digits.")
    .max(4, "CVV must be 3 or 4 digits."),
});

type CheckoutFormValues = yup.InferType<typeof checkoutSchema>;

function detectCardBrand(num: string): string {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6(?:011|5)/.test(n)) return "Discover";
  return "Card";
}

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
      firstName: "",
      lastName: "",
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
            "overshirt-1": {
              id: "overshirt-1",
              sku: "LA-SH-039",
              title: "Linen Blend Overshirt",
              price: 380,
              size: size,
              material: "Linen Blend",
              category: "Atelier",
              imageUrl: "/product_overshirt.png",
              quantity: 1,
            },
            "trouser-1": {
              id: "trouser-1",
              sku: "LA-TR-012",
              title: "Tailored Navy Trouser",
              price: 450,
              size: size,
              material: "100% Virgin Wool",
              category: "Couture",
              imageUrl: "/product_trouser.png",
              quantity: 1,
            },
            "dress-1": {
              id: "dress-1",
              sku: "LA-DR-094",
              title: "Silk Crepe Slip Dress",
              price: 680,
              size: size,
              material: "Silk Crepe",
              category: "Evening Wear",
              imageUrl: "/product_dress.png",
              quantity: 1,
            },
          };
          const item = staticMap[prodId];
          if (item) {
            setBuyNowItem(item);
          }
        } else {
          try {
            const supabase = createClient();
            const { data } = await supabase.from("products").select("*").eq("id", prodId).maybeSingle();

            if (data) {
              setBuyNowItem({
                id: data.id,
                sku: data.sku,
                title: data.title,
                price: Number(data.price) || 0,
                size: size as any,
                material: data.material_composition || "Selected Fiber",
                category: data.category || "Atelier",
                imageUrl: data.image_urls?.[0] || "/product_overshirt.png",
                quantity: 1,
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
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setValue("email", user.email || "");

          // Get profile display name
          const { data: profile } = await supabase
            .from("user_style_profiles")
            .select("display_name")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profile && profile.display_name) {
            const parts = profile.display_name.trim().split(" ");
            if (parts.length > 1) {
              setValue("firstName", parts[0]);
              setValue("lastName", parts.slice(1).join(" "));
            } else {
              setValue("firstName", profile.display_name);
            }
          } else if (user.user_metadata?.full_name) {
            const metaName = user.user_metadata.full_name;
            const parts = metaName.trim().split(" ");
            if (parts.length > 1) {
              setValue("firstName", parts[0]);
              setValue("lastName", parts.slice(1).join(" "));
            } else {
              setValue("firstName", metaName);
            }
          }

          // Fetch last order's shipping address as default
          const { data: lastOrder } = await supabase
            .from("orders")
            .select("shipping_address")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastOrder && lastOrder.shipping_address) {
            const addr = lastOrder.shipping_address as any;
            if (addr && typeof addr === "object") {
              const formatted = addr.street || addr.streetLine || addr.formatted || "";
              setValue("address", formatted);
            } else if (typeof addr === "string") {
              setValue("address", addr);
            }
          }

          // Fetch saved payment method
          const { data: paymentMethod } = await supabase
            .from("user_payment_methods")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_default", true)
            .maybeSingle();

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
        console.error("Failed to load user calibrations:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadUserData();
  }, [setValue]);

  const handleUpdateBuyNowQuantity = (delta: number) => {
    if (!buyNowItem) return;
    const newQty = Math.max(1, (buyNowItem.quantity || 1) + delta);
    setBuyNowItem({ ...buyNowItem, quantity: newQty });
  };

  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    const trimmed = clean.substring(0, 16);
    const formatted = trimmed.match(/.{1,4}/g)?.join(" ") || trimmed;
    setValue("cardNumber", formatted, { shouldValidate: true });
  };

  const handleCardExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    const trimmed = clean.substring(0, 4);
    setValue("cardExpiry", trimmed.length > 2 ? `${trimmed.substring(0, 2)}/${trimmed.substring(2)}` : trimmed, {
      shouldValidate: true,
    });
  };

  const handleCardCvvChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setValue("cardCvv", clean.substring(0, 4), { shouldValidate: true });
  };

  const handleContinueToPayment = async () => {
    const isValid = await trigger(["firstName", "lastName", "email", "address"]);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const orderItems = activeItems.map((item) => ({
          product_id: item.id.includes("-") ? null : item.id,
          sku: item.sku,
          title: item.title,
          size: item.size,
          qty: item.quantity || 1,
          unit_price: item.price,
          image_url: item.imageUrl || "",
        }));

        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            items: orderItems,
            subtotal: subtotal,
            shipping_cost: deliveryFee,
            total: total,
            status: "CONFIRMED",
            shipping_address: {
              name: `${values.firstName} ${values.lastName}`,
              street: values.address,
              email: values.email,
            },
          })
          .select("id")
          .single();

        if (orderError) throw orderError;
        if (newOrder) newOrderId = newOrder.id;

        // Sync name back to user style profile
        await supabase.from("user_style_profiles").upsert({
          user_id: user.id,
          display_name: `${values.firstName} ${values.lastName}`,
          onboarding_complete: true,
        });
      }

      setTimeout(() => {
        setIsAuthorizing(false);
        clearBag();
        toast.success("Order authorized successfully!");
        if (newOrderId) {
          router.push(`/orders/confirmation?orderId=${newOrderId}`);
        } else {
          router.push("/orders/confirmation");
        }
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

  return (
    <div className="max-w-6xl mx-auto py-4">
      {/* Top Header */}
      <div className="mb-6">
        <Link
          href="/shop"
          className="font-sans font-bold text-sm text-obsidian-velvet hover:opacity-75 transition-opacity flex items-center gap-2 w-fit"
        >
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
            <button
              type="button"
              onClick={() => setActiveTab("customer")}
              className={`flex items-center gap-2 pb-3 border-b-2 font-sans text-sm font-bold w-1/2 justify-center transition-colors cursor-pointer ${
                activeTab === "customer"
                  ? "border-obsidian-velvet text-obsidian-velvet"
                  : "border-transparent text-obsidian-velvet/40 hover:text-obsidian-velvet/70"
              }`}
            >
              <span
                className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${
                  activeTab === "customer" ? "bg-obsidian-velvet text-surface-white" : "bg-muted-zinc/50 text-surface-white"
                }`}
              >
                ✓
              </span>
              Customer Information
            </button>
            <button
              type="button"
              onClick={handleContinueToPayment}
              className={`flex items-center gap-2 pb-3 border-b-2 font-sans text-sm font-bold w-1/2 justify-center transition-colors cursor-pointer ${
                activeTab === "payment"
                  ? "border-obsidian-velvet text-obsidian-velvet"
                  : "border-transparent text-obsidian-velvet/40 hover:text-obsidian-velvet/70"
              }`}
            >
              <span
                className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${
                  activeTab === "payment" ? "bg-obsidian-velvet text-surface-white" : "bg-muted-zinc/50 text-surface-white"
                }`}
              >
                ✓
              </span>
              Payment Details
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {activeTab === "customer" ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="font-serif text-[28px] font-light text-obsidian-velvet tracking-tight mb-1">
                    Check Out Your Items
                  </h2>
                  <p className="font-sans text-sm font-medium text-obsidian-velvet/50">
                    Please provide your contact details and shipping preferences.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="First Name" error={errors.firstName?.message}>
                    <Input
                      type="text"
                      disabled={isAuthorizing}
                      error={!!errors.firstName}
                      placeholder="Jean"
                      {...register("firstName")}
                    />
                  </FormField>
                  <FormField label="Last Name" error={errors.lastName?.message}>
                    <Input
                      type="text"
                      disabled={isAuthorizing}
                      error={!!errors.lastName}
                      placeholder="Lauren"
                      {...register("lastName")}
                    />
                  </FormField>
                </div>

                <FormField label="Email Address" error={errors.email?.message}>
                  <Input
                    type="email"
                    disabled={isAuthorizing}
                    error={!!errors.email}
                    placeholder="client@vestira.ai"
                    {...register("email")}
                  />
                </FormField>

                <FormField label="Delivery Address" error={errors.address?.message}>
                  <Input
                    type="text"
                    disabled={isAuthorizing}
                    error={!!errors.address}
                    placeholder="Enter full shipping address..."
                    {...register("address")}
                  />
                </FormField>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="font-serif text-[28px] font-light text-obsidian-velvet tracking-tight mb-1">
                    Secure Payment
                  </h2>
                  <p className="font-sans text-sm font-medium text-obsidian-velvet/50">
                    All payment credentials are fully encrypted and securely handled.
                  </p>
                </div>

                {savedCard && watchUsingSavedCard && !watchEditingCard ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-gradient-to-r from-obsidian-velvet/5 to-obsidian-velvet/10 border border-obsidian-velvet/20 rounded-2xl p-4 animate-in fade-in duration-300">
                      <div
                        className="w-12 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)" }}
                      >
                        <svg className="w-5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 16">
                          <rect width="24" height="16" rx="2" fill="currentColor" opacity="0.3" />
                          <rect y="4" width="24" height="3" fill="currentColor" opacity="0.5" />
                          <rect x="2" y="9" width="6" height="2" rx="1" fill="white" opacity="0.8" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-sans text-[10px] font-bold tracking-wider text-obsidian-velvet uppercase">
                            {savedCard.card_brand || "Card"}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 font-sans text-[9px] font-bold tracking-wider uppercase">
                            Saved
                          </span>
                        </div>
                        <p className="font-mono text-sm font-bold text-obsidian-velvet tracking-widest">
                          {savedCard.card_number_masked}
                        </p>
                        <p className="font-sans text-[11px] text-obsidian-velvet/50 mt-0.5">
                          {savedCard.card_name} &nbsp;·&nbsp; Expires {savedCard.card_expiry}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setValue("editingCard", true);
                          setValue("usingSavedCard", false);
                        }}
                        className="flex-shrink-0 font-sans text-[11px] font-bold text-obsidian-velvet/60 hover:text-obsidian-velvet underline transition-colors cursor-pointer border-none bg-transparent"
                      >
                        Change
                      </button>
                    </div>

                    <FormField label="Confirm Security Code (CVV)" error={errors.cardCvv?.message}>
                      <Input
                        type="password"
                        disabled={isAuthorizing}
                        error={!!errors.cardCvv}
                        maxLength={4}
                        placeholder="•••"
                        className="w-40 font-mono"
                        {...register("cardCvv")}
                        onChange={(e) => handleCardCvvChange(e.target.value)}
                      />
                    </FormField>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedCard && (
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs text-obsidian-velvet/60">
                          Entering new payment card details
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setValue("editingCard", false);
                            setValue("usingSavedCard", true);
                          }}
                          className="font-sans text-[11px] text-obsidian-velvet/50 hover:text-obsidian-velvet underline cursor-pointer border-none bg-transparent"
                        >
                          ← Use saved card
                        </button>
                      </div>
                    )}

                    <FormField label="Card Number" error={errors.cardNumber?.message}>
                      <div className="relative">
                        <Input
                          type="text"
                          disabled={isAuthorizing}
                          error={!!errors.cardNumber}
                          maxLength={19}
                          placeholder="Card Number (4444 4444 4444 4444)"
                          className="font-mono"
                          value={watchCardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                        />
                        {watchCardNumber && watchCardNumber.length > 0 && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-sans text-[10px] text-obsidian-velvet/50 font-semibold">
                            {detectCardBrand(watchCardNumber)}
                          </span>
                        )}
                      </div>
                    </FormField>

                    <FormField label="Name on Card" error={errors.cardName?.message}>
                      <Input
                        type="text"
                        disabled={isAuthorizing}
                        error={!!errors.cardName}
                        placeholder="Jean Lauren"
                        {...register("cardName")}
                      />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Expiry (MM/YY)" error={errors.cardExpiry?.message}>
                        <Input
                          type="text"
                          disabled={isAuthorizing}
                          error={!!errors.cardExpiry}
                          maxLength={5}
                          placeholder="MM/YY"
                          className="font-mono"
                          {...register("cardExpiry")}
                          onChange={(e) => handleCardExpiryChange(e.target.value)}
                        />
                      </FormField>
                      <FormField label="CVV" error={errors.cardCvv?.message}>
                        <Input
                          type="password"
                          disabled={isAuthorizing}
                          error={!!errors.cardCvv}
                          maxLength={4}
                          placeholder="•••"
                          className="font-mono"
                          {...register("cardCvv")}
                          onChange={(e) => handleCardCvvChange(e.target.value)}
                        />
                      </FormField>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Right Column (Order Summary) */}
        <div className="lg:col-span-5 pt-6">
          <div className="bg-surface-white border border-muted-zinc/60 rounded-[20px] p-6 shadow-sm">
            <h3 className="font-serif text-[24px] font-light text-obsidian-velvet tracking-tight mb-1">Current Order</h3>
            <p className="font-sans text-xs font-medium text-obsidian-velvet/40 mb-7">
              Verify your shopping bag contents and sizing parameters.
            </p>

            <div className={`space-y-4 mb-8 ${activeItems.length > 3 ? "max-h-[320px] overflow-y-auto pr-1" : ""}`}>
              {activeItems.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex items-center gap-4 bg-warm-linen/40 border border-muted-zinc/40 p-2.5 rounded-[14px]"
                >
                  <div className="w-[60px] h-[60px] rounded-lg bg-surface-white overflow-hidden flex-shrink-0 border border-muted-zinc/10">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 py-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-sans text-[13px] font-bold text-obsidian-velvet leading-tight truncate">
                        {item.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          if (isBuyNow) {
                            setBuyNowItem(null);
                          } else {
                            removeFromBag(item.id, item.size);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors p-0.5 cursor-pointer flex-shrink-0 border-none bg-transparent"
                        title="Remove item"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="font-sans text-[11px] font-medium text-obsidian-velvet/50 mt-2">
                      Size: {item.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between self-stretch py-1 flex-shrink-0">
                    <span className="font-sans text-[13px] font-bold text-obsidian-velvet">
                      ${(item.price * (item.quantity || 1)).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2 bg-surface-white border border-muted-zinc/50 rounded-md px-1.5 py-0.5 shadow-sm mt-auto">
                      <button
                        type="button"
                        className="w-4 h-4 flex items-center justify-center font-bold text-obsidian-velvet/60 cursor-pointer hover:text-obsidian-velvet transition-colors"
                        onClick={() => {
                          if (isBuyNow) {
                            handleUpdateBuyNowQuantity(-1);
                          } else {
                            if (item.quantity && item.quantity > 1) {
                              updateQuantity(item.id, item.size, -1);
                            } else {
                              removeFromBag(item.id, item.size);
                            }
                          }
                        }}
                      >
                        -
                      </button>
                      <span className="font-sans text-[11px] font-bold w-3 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        className="w-4 h-4 flex items-center justify-center font-bold text-obsidian-velvet/60 cursor-pointer hover:text-obsidian-velvet transition-colors"
                        onClick={() => {
                          if (isBuyNow) {
                            handleUpdateBuyNowQuantity(1);
                          } else {
                            updateQuantity(item.id, item.size, 1);
                          }
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-muted-zinc/50 pt-5 pb-6">
              <div className="flex items-center justify-between mb-5">
                <span className="font-sans text-base font-bold text-obsidian-velvet">Subtotal</span>
                <span className="font-sans text-[17px] font-bold text-obsidian-velvet">${subtotal.toFixed(2)}</span>
              </div>

              <div className="space-y-3 font-sans text-xs font-medium text-obsidian-velvet/50">
                <div className="flex justify-between">
                  <span>Items</span>
                  <span className="text-obsidian-velvet/80 font-bold">{totalItems}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Service</span>
                  <span className="text-obsidian-velvet/80 font-bold">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vat (0%)</span>
                  <span className="text-obsidian-velvet/80 font-bold">$0.00</span>
                </div>
              </div>
            </div>

            {activeTab === "customer" ? (
              <Button type="button" variant="primary" size="lg" onClick={handleContinueToPayment} className="w-full">
                Continue to Payment
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isAuthorizing}
                disabled={isAuthorizing}
                onClick={handleSubmit(onSubmit)}
                className="w-full"
              >
                Pay ${total.toFixed(2)}
              </Button>
            )}
          </div>
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
