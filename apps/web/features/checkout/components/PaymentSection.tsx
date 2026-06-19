"use client";

import React from "react";
import { FormField, Input } from "@/components/ui/input";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { CheckoutFormValues } from "../lib/checkout-schema";
import { detectCardBrand, formatCardNumber, formatCardExpiry } from "../lib/card-utils";

interface SavedCard {
  id: string;
  card_last4: string;
  card_brand: string | null;
  card_name: string;
  card_expiry: string;
  card_number_masked: string;
}

interface PaymentSectionProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<CheckoutFormValues>;
  isAuthorizing: boolean;
  savedCard: SavedCard | null;
  watchUsingSavedCard: boolean;
  watchEditingCard: boolean;
  watchCardNumber: string;
  setValue: UseFormSetValue<any>;
}

export function PaymentSection({
  register,
  errors,
  isAuthorizing,
  savedCard,
  watchUsingSavedCard,
  watchEditingCard,
  watchCardNumber,
  setValue,
}: PaymentSectionProps) {
  const handleCardNumberChange = (val: string) => {
    setValue("cardNumber", formatCardNumber(val), { shouldValidate: true });
  };

  const handleCardExpiryChange = (val: string) => {
    setValue("cardExpiry", formatCardExpiry(val), { shouldValidate: true });
  };

  const handleCardCvvChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setValue("cardCvv", clean.substring(0, 4), { shouldValidate: true });
  };

  return (
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
          {/* Saved Card Display */}
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
  );
}
