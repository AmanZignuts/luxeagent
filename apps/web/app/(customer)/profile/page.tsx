"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { FormField, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { handleApiError } from "@/lib/utils/error-handler";

function detectCardBrand(num: string): string {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6(?:011|5)/.test(n)) return "Discover";
  return "Card";
}

// ─── Yup Validation Schemas ─────────────────────────────────────────

const personalSchema = yup.object().shape({
  fullName: yup
    .string()
    .required("Full name is required.")
    .matches(/^[A-Za-z\s\-]+$/, "Full name must contain only letters and spaces."),
  email: yup.string().email("Please enter a valid email format.").required("Email address is required."),
  phone: yup
    .string()
    .required("Phone number is required.")
    .matches(/^[+]?[0-9\s\-()]{7,18}$/, "Please enter a valid phone number."),
  address: yup.string().required("Shipping address is required."),
});

const cardSchema = yup.object().shape({
  cardNumber: yup
    .string()
    .required("Card number is required.")
    .test("len", "Please enter a valid 16-digit card number.", (val) => val?.replace(/\s/g, "").length === 16),
  cardName: yup
    .string()
    .required("Cardholder name is required.")
    .matches(/^[A-Za-z\s\-]+$/, "Cardholder name must contain only letters and spaces."),
  cardExpiry: yup
    .string()
    .required("Expiry is required.")
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, "Please enter expiry in MM/YY format."),
  cardCvv: yup
    .string()
    .required("CVV is required.")
    .min(3, "CVV must be 3 or 4 digits.")
    .max(4, "CVV must be 3 or 4 digits."),
});

type PersonalFormValues = yup.InferType<typeof personalSchema>;
type CardFormValues = yup.InferType<typeof cardSchema>;

export default function ProfileSettingsPage() {
  // ── Form Initializations ──────────────────────────────────────────
  const personalForm = useForm<any>({
    resolver: yupResolver(personalSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "+1 (555) 234-8910",
      address: "Apt 4B, 820 Park Avenue, New York, NY 10021",
    },
  });

  const cardForm = useForm<any>({
    resolver: yupResolver(cardSchema),
    defaultValues: {
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCvv: "",
    },
  });

  // ── States ────────────────────────────────────────────────────────
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [savedCard, setSavedCard] = useState<{
    id: string;
    card_last4: string;
    card_brand: string | null;
    card_name: string;
    card_expiry: string;
    card_number_masked: string;
  } | null>(null);

  const [isEditingCard, setIsEditingCard] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [isRemovingCard, setIsRemovingCard] = useState(false);
  const [loadingCard, setLoadingCard] = useState(true);

  const watchCardNumber = cardForm.watch("cardNumber");

  // ── Hydrate Personal & Card Data from Supabase ────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Populate personal details
        personalForm.setValue("email", user.email || "");

        // Fetch style profile
        const { data: profile } = await supabase
          .from("user_style_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile && profile.display_name) {
          personalForm.setValue("fullName", profile.display_name);
        }

        // Fetch default payment method
        const { data: card } = await supabase
          .from("user_payment_methods")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .maybeSingle();

        if (card) {
          setSavedCard(card);
        }
      } catch (err) {
        console.error("Failed to load profile details:", err);
      } finally {
        setLoadingCard(false);
      }
    }
    loadData();
  }, [personalForm]);

  // ── Save Personal Details ─────────────────────────────────────────
  const handleUpdateProfile = async (values: PersonalFormValues) => {
    setIsUpdatingProfile(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Not authenticated.");
        setIsUpdatingProfile(false);
        return;
      }

      const { error } = await supabase.from("user_style_profiles").upsert({
        user_id: user.id,
        display_name: values.fullName.trim(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Profile details saved successfully.");
    } catch (err: any) {
      handleApiError(err, "Update Personal Profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // ── Save Card details ─────────────────────────────────────────────
  const handleSaveCard = async (values: CardFormValues) => {
    setIsSavingCard(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save payment details.");
        setIsSavingCard(false);
        return;
      }

      const rawCard = values.cardNumber.replace(/\s/g, "");
      const last4 = rawCard.slice(-4);
      const brand = detectCardBrand(rawCard);
      const masked = `${rawCard.substring(0, 4)} •••• •••• ${last4}`;

      // Delete any existing default card first
      if (savedCard) {
        await supabase.from("user_payment_methods").delete().eq("id", savedCard.id);
      }

      const { data, error } = await supabase
        .from("user_payment_methods")
        .insert({
          user_id: user.id,
          card_last4: last4,
          card_brand: brand,
          card_name: values.cardName.trim(),
          card_expiry: values.cardExpiry,
          card_number_masked: masked,
          is_default: true,
        })
        .select()
        .single();

      if (error) throw error;

      setSavedCard(data);
      setIsEditingCard(false);
      cardForm.reset();
      toast.success("Payment card saved securely.");
    } catch (err: any) {
      handleApiError(err, "Save Card Details");
    } finally {
      setIsSavingCard(false);
    }
  };

  // ── Remove saved card ─────────────────────────────────────────────
  const handleRemoveCard = async () => {
    if (!savedCard) return;
    setIsRemovingCard(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("user_payment_methods").delete().eq("id", savedCard.id);
      if (error) throw error;

      setSavedCard(null);
      setIsEditingCard(false);
      toast.success("Saved card removed.");
    } catch (err: any) {
      handleApiError(err, "Remove Card Details");
    } finally {
      setIsRemovingCard(false);
    }
  };



  // Card Formatting Hooks
  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    const trimmed = clean.substring(0, 16);
    const formatted = trimmed.match(/.{1,4}/g)?.join(" ") || trimmed;
    cardForm.setValue("cardNumber", formatted, { shouldValidate: true });
  };

  const handleCardExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    const trimmed = clean.substring(0, 4);
    cardForm.setValue(
      "cardExpiry",
      trimmed.length > 2 ? `${trimmed.substring(0, 2)}/${trimmed.substring(2)}` : trimmed,
      { shouldValidate: true }
    );
  };

  const handleCardCvvChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    cardForm.setValue("cardCvv", clean.substring(0, 4), { shouldValidate: true });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300 max-w-5xl mx-auto pb-16">
      {/* Editorial Title Header */}
      <div className="border-b border-muted-zinc/60 pb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block mb-2">
            Your Profile &amp; Preferences
          </span>
          <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">
            Profile Settings
          </h1>
        </div>
        <div>
          <Link
            href="/shop"
            className="font-sans text-[10px] tracking-widest uppercase text-obsidian-velvet/40 hover:text-obsidian-velvet transition-colors inline-flex items-center gap-1.5"
          >
            ← Return to Shop
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Section 1: Personal Details */}
        <form
          onSubmit={personalForm.handleSubmit(handleUpdateProfile)}
          className="bg-surface-white border border-muted-zinc rounded-xl p-8 space-y-6 shadow-none"
        >
          <h2 className="font-serif text-xl font-light tracking-tight text-obsidian-velvet border-b border-muted-zinc/60 pb-4">
            01. Personal Details
          </h2>

          <div className="space-y-4">
            <FormField label="Full Name" error={personalForm.formState.errors.fullName?.message}>
              <Input
                type="text"
                disabled={isUpdatingProfile}
                error={!!personalForm.formState.errors.fullName}
                {...personalForm.register("fullName")}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Email Address" error={personalForm.formState.errors.email?.message}>
                <Input
                  type="email"
                  disabled={true} // Read-only for authentication consistency
                  error={!!personalForm.formState.errors.email}
                  {...personalForm.register("email")}
                />
              </FormField>
              <FormField label="Phone Number" error={personalForm.formState.errors.phone?.message}>
                <Input
                  type="text"
                  disabled={isUpdatingProfile}
                  error={!!personalForm.formState.errors.phone}
                  {...personalForm.register("phone")}
                />
              </FormField>
            </div>

            <FormField label="Default Shipping Address" error={personalForm.formState.errors.address?.message}>
              <Input
                type="text"
                disabled={isUpdatingProfile}
                error={!!personalForm.formState.errors.address}
                {...personalForm.register("address")}
              />
            </FormField>
          </div>

          <div className="pt-4 border-t border-muted-zinc/40 flex justify-end">
            <Button type="submit" variant="primary" loading={isUpdatingProfile} disabled={isUpdatingProfile}>
              Save Details
            </Button>
          </div>
        </form>

        {/* Section 2: Payment Details */}
        <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 space-y-6 shadow-none">
          <div className="flex items-center justify-between border-b border-muted-zinc/60 pb-4">
            <h2 className="font-serif text-xl font-light tracking-tight text-obsidian-velvet">
              02. Payment Details
            </h2>
            {savedCard && !isEditingCard && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 font-sans text-[10px] font-semibold tracking-wider uppercase">
                ✓ Saved
              </span>
            )}
          </div>

          {loadingCard ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-4 h-4 rounded-full border border-muted-zinc border-t-obsidian-velvet animate-spin" />
              <span className="font-sans text-xs text-obsidian-velvet/40">Loading payment details...</span>
            </div>
          ) : savedCard && !isEditingCard ? (
            <div className="space-y-4">
              {/* Masked Card Display */}
              <div
                className="relative w-full rounded-2xl p-6 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                }}
              >
                <div
                  className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10"
                  style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
                />
                <div
                  className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-[0.07]"
                  style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
                />

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-90 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-0.5 w-5 h-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-yellow-700/30 rounded-sm" />
                      ))}
                    </div>
                  </div>
                  <span className="text-white/80 font-sans text-sm font-bold tracking-widest">
                    {savedCard.card_brand?.toUpperCase() || "CARD"}
                  </span>
                </div>

                <p className="text-white font-mono text-base tracking-[0.25em] mb-5 relative z-10">
                  {savedCard.card_number_masked}
                </p>

                <div className="flex items-end justify-between relative z-10">
                  <div>
                    <p className="text-white/40 font-sans text-[9px] uppercase tracking-widest mb-1">Card Holder</p>
                    <p className="text-white font-sans text-sm font-semibold tracking-wide">{savedCard.card_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 font-sans text-[9px] uppercase tracking-widest mb-1">Expires</p>
                    <p className="text-white font-sans text-sm font-semibold">{savedCard.card_expiry}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsEditingCard(true);
                    cardForm.setValue("cardName", savedCard.card_name);
                    cardForm.setValue("cardExpiry", savedCard.card_expiry);
                  }}
                >
                  Edit / Change Card
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="flex-1"
                  onClick={handleRemoveCard}
                  loading={isRemovingCard}
                  disabled={isRemovingCard}
                >
                  Remove Card
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={cardForm.handleSubmit(handleSaveCard)} className="space-y-4">
              {isEditingCard && savedCard && (
                <div className="flex items-center justify-between mb-2">
                  <p className="font-sans text-xs text-obsidian-velvet/60">
                    Replacing saved card ending in{" "}
                    <span className="font-bold text-obsidian-velvet">{savedCard.card_last4}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsEditingCard(false)}
                    className="font-sans text-[10px] text-obsidian-velvet/40 hover:text-obsidian-velvet underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <FormField label="Card Number" error={cardForm.formState.errors.cardNumber?.message}>
                <div className="relative">
                  <Input
                    type="text"
                    disabled={isSavingCard}
                    error={!!cardForm.formState.errors.cardNumber}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={watchCardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                  />
                  {watchCardNumber && watchCardNumber.length > 0 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-sans text-[10px] text-[#09090B]/50 font-semibold">
                      {detectCardBrand(watchCardNumber)}
                    </span>
                  )}
                </div>
              </FormField>

              <FormField label="Name on Card" error={cardForm.formState.errors.cardName?.message}>
                <Input
                  type="text"
                  disabled={isSavingCard}
                  error={!!cardForm.formState.errors.cardName}
                  placeholder="Jean Lauren"
                  {...cardForm.register("cardName")}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Expiry (MM/YY)" error={cardForm.formState.errors.cardExpiry?.message}>
                  <Input
                    type="text"
                    disabled={isSavingCard}
                    error={!!cardForm.formState.errors.cardExpiry}
                    maxLength={5}
                    placeholder="MM/YY"
                    {...cardForm.register("cardExpiry")}
                    onChange={(e) => handleCardExpiryChange(e.target.value)}
                  />
                </FormField>
                <FormField label="CVV" error={cardForm.formState.errors.cardCvv?.message}>
                  <Input
                    type="password"
                    disabled={isSavingCard}
                    error={!!cardForm.formState.errors.cardCvv}
                    maxLength={4}
                    placeholder="•••"
                    {...cardForm.register("cardCvv")}
                    onChange={(e) => handleCardCvvChange(e.target.value)}
                  />
                </FormField>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" loading={isSavingCard} disabled={isSavingCard} className="w-full">
                  Save Card Securely
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
