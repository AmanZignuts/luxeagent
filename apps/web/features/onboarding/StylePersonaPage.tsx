"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { completeOnboardingAction } from "@/lib/actions/auth";
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

const onboardingSchema = yup.object().shape({
  fullName: yup.string().required("Full name is required."),
  email: yup.string().email("Please enter a valid email format.").required("Email address is required."),
  phone: yup
    .string()
    .required("Phone number is required.")
    .matches(/^[+]?[0-9\s\-()]{7,18}$/, "Please enter a valid phone number."),
  address: yup.string().required("Shipping address is required."),
  addPayment: yup.boolean().default(false),
  cardNumber: yup.string().when("addPayment", {
    is: true,
    then: (schema) =>
      schema
        .required("Card number is required.")
        .test("len", "Please enter a valid 16-digit card number.", (val) => val?.replace(/\s/g, "").length === 16),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardName: yup.string().when("addPayment", {
    is: true,
    then: (schema) => schema.required("Cardholder name is required."),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardExpiry: yup.string().when("addPayment", {
    is: true,
    then: (schema) =>
      schema.required("Expiry is required.").matches(/^(0[1-9]|1[0-2])\/\d{2}$/, "Please enter expiry in MM/YY format."),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardCvv: yup.string().when("addPayment", {
    is: true,
    then: (schema) =>
      schema
        .required("CVV is required.")
        .min(3, "CVV must be 3 or 4 digits.")
        .max(4, "CVV must be 3 or 4 digits."),
    otherwise: (schema) => schema.notRequired(),
  }),
});

type OnboardingFormValues = yup.InferType<typeof onboardingSchema>;

export default function ShopperSetupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(onboardingSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      addPayment: false,
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCvv: "",
    },
  });

  const addPayment = watch("addPayment");
  const cardNumber = watch("cardNumber");

  // Pre-fill from auth metadata
  useEffect(() => {
    async function prefill() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      if (user.email) {
        setValue("email", user.email);
      }
      if (user.user_metadata?.full_name) {
        setValue("fullName", user.user_metadata.full_name);
      }
    }
    prefill();
  }, [setValue]);

  // Card formatting helpers
  const handleCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, "").substring(0, 16);
    setValue("cardNumber", clean.match(/.{1,4}/g)?.join(" ") || clean, { shouldValidate: true });
  };

  const handleCardExpiry = (val: string) => {
    const clean = val.replace(/\D/g, "").substring(0, 4);
    setValue("cardExpiry", clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean, {
      shouldValidate: true,
    });
  };

  const handleCardCvv = (val: string) => {
    setValue("cardCvv", val.replace(/\D/g, "").substring(0, 4), { shouldValidate: true });
  };

  const saveCard = async (userId: string, values: OnboardingFormValues) => {
    if (!values.cardNumber || !values.cardName || !values.cardExpiry) return;
    const raw = values.cardNumber.replace(/\s/g, "");
    const supabase = createClient();
    const last4 = raw.slice(-4);
    const brand = detectCardBrand(raw);
    const masked = `${raw.substring(0, 4)} •••• •••• ${last4}`;

    await supabase.from("user_payment_methods").insert({
      user_id: userId,
      card_last4: last4,
      card_brand: brand,
      card_name: values.cardName.trim(),
      card_expiry: values.cardExpiry,
      card_number_masked: masked,
      is_default: true,
    });
  };

  const onSubmit = async (values: OnboardingFormValues) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expired. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      // Save card if provided
      if (values.addPayment) {
        await saveCard(user.id, values);
      }

      // Update style profile + mark onboarding complete
      const formData = new FormData();
      formData.append("displayName", values.fullName.trim());
      formData.append("phone", values.phone || "");
      formData.append("address", values.address || "");
      formData.append("preferredSize", "M");
      formData.append("budgetMin", "100");
      formData.append("budgetMax", "2000");

      const res = await completeOnboardingAction(formData);
      if (res && res.error) {
        handleApiError(res.error, "Complete Onboarding Setup Action");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      handleApiError(err, "Onboarding Setup Process");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-warm-linen flex flex-col">
      {/* Processing overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-warm-linen/95 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-6"
          >
            <div className="w-10 h-10 rounded-full border-t border-r border-obsidian-velvet animate-spin" />
            <div className="text-center">
              <h2 className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet">
                Setting Up Your Account
              </h2>
              <p className="font-sans text-xs text-obsidian-velvet/60 mt-2">
                Building your bespoke portfolio...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="w-full border-b border-muted-zinc/60 px-8 sm:px-16 py-6 flex items-center justify-between">
        <span className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet">
          Vestira
        </span>
        <span className="font-sans text-[10px] tracking-widest uppercase text-obsidian-velvet/40 font-semibold">
          Account Setup
        </span>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-xl space-y-6">

          {/* Title */}
          <div className="text-center mb-8">
            <span className="font-sans text-[10px] tracking-widest uppercase text-obsidian-velvet/40 font-semibold block mb-3">
              Welcome to Vestira
            </span>
            <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet">
              Complete Your Profile
            </h1>
            <p className="font-sans text-sm text-obsidian-velvet/60 mt-2">
              Set up your details to calibrate your personalized stylist engine.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ── Personal Details ─────────────────────────────────────── */}
            <div className="bg-surface-white border border-muted-zinc rounded-2xl p-8 space-y-5">
              <h2 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet border-b border-muted-zinc/60 pb-4">
                01. Personal Details
              </h2>

              <FormField label="Full Name" error={errors.fullName?.message}>
                <Input
                  type="text"
                  disabled={isSubmitting}
                  error={!!errors.fullName}
                  placeholder="Jean Lauren"
                  {...register("fullName")}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Email Address" error={errors.email?.message}>
                  <Input
                    type="email"
                    disabled={true}
                    error={!!errors.email}
                    {...register("email")}
                  />
                </FormField>
                <FormField label="Phone Number" error={errors.phone?.message}>
                  <Input
                    type="tel"
                    disabled={isSubmitting}
                    error={!!errors.phone}
                    {...register("phone", {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/[^0-9+\s\-()]/g, "");
                      }
                    })}
                  />
                </FormField>
              </div>

              <FormField label="Default Shipping Address" error={errors.address?.message}>
                <Input
                  type="text"
                  disabled={isSubmitting}
                  error={!!errors.address}
                  {...register("address")}
                />
              </FormField>
            </div>

            {/* ── Payment (Optional) ───────────────────────────────────── */}
            <div className="bg-surface-white border border-muted-zinc rounded-2xl overflow-hidden">
              {/* Toggle header */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setValue("addPayment", !addPayment, { shouldValidate: true })}
                className="w-full px-8 py-5 flex items-center justify-between cursor-pointer hover:bg-warm-linen/10 transition-colors border-none text-left"
              >
                <div className="text-left">
                  <h2 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">
                    02. Payment Details
                  </h2>
                  <p className="font-sans text-[10px] text-obsidian-velvet/40 mt-0.5">
                    {addPayment ? "You can skip this and add it later in Profile Settings" : "Optional — add now or later in Profile Settings"}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  addPayment
                    ? "bg-obsidian-velvet border-obsidian-velvet text-surface-white"
                    : "border-muted-zinc bg-warm-linen/40"
                }`}>
                  {addPayment && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>

              {/* Payment form — shown when toggled on */}
              <AnimatePresence>
                {addPayment && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-8 pb-8 space-y-4 border-t border-muted-zinc/40 pt-6 overflow-hidden"
                  >
                    {/* Card Number */}
                    <FormField label="Card Number" error={errors.cardNumber?.message}>
                      <div className="relative">
                        <Input
                          type="text"
                          disabled={isSubmitting}
                          error={!!errors.cardNumber}
                          maxLength={19}
                          placeholder="1234 5678 9012 3456"
                          className="pr-16 font-mono placeholder:font-sans"
                          value={cardNumber}
                          onChange={(e) => handleCardNumber(e.target.value)}
                        />
                        {cardNumber && cardNumber.length > 0 && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-sans text-[10px] text-obsidian-velvet/50 font-semibold">
                            {detectCardBrand(cardNumber)}
                          </span>
                        )}
                      </div>
                    </FormField>

                    {/* Cardholder Name */}
                    <FormField label="Name on Card" error={errors.cardName?.message}>
                      <Input
                        type="text"
                        disabled={isSubmitting}
                        error={!!errors.cardName}
                        placeholder="Jean Lauren"
                        {...register("cardName")}
                      />
                    </FormField>

                    {/* Expiry + CVV */}
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Expiry (MM/YY)" error={errors.cardExpiry?.message}>
                        <Input
                          type="text"
                          disabled={isSubmitting}
                          error={!!errors.cardExpiry}
                          maxLength={5}
                          placeholder="MM/YY"
                          className="font-mono placeholder:font-sans"
                          {...register("cardExpiry")}
                          onChange={(e) => handleCardExpiry(e.target.value)}
                        />
                      </FormField>
                      <FormField label="CVV" optional error={errors.cardCvv?.message}>
                        <Input
                          type="password"
                          disabled={isSubmitting}
                          error={!!errors.cardCvv}
                          maxLength={4}
                          placeholder="•••"
                          className="font-mono placeholder:font-sans"
                          {...register("cardCvv")}
                          onChange={(e) => handleCardCvv(e.target.value)}
                        />
                      </FormField>
                    </div>

                    <p className="font-sans text-[10px] text-obsidian-velvet/40 leading-relaxed">
                      🔒 Card number is masked before saving. CVV is never stored.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="w-full py-4 text-sm"
            >
              Enter Vestira →
            </Button>
          </form>

          <p className="text-center font-sans text-[10px] text-obsidian-velvet/40">
            You can update your profile details and payment options from Profile Settings after sign-in.
          </p>
        </div>
      </div>
    </div>
  );
}
