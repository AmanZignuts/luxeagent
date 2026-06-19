"use client";

import React from "react";
import { FormField, Input } from "@/components/ui/input";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { CheckoutFormValues } from "../lib/checkout-schema";

interface CustomerSectionProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<CheckoutFormValues>;
  isAuthorizing: boolean;
}

export function CustomerSection({ register, errors, isAuthorizing }: CustomerSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="font-serif text-[28px] font-light text-obsidian-velvet tracking-tight mb-1">
          Check Out Your Items
        </h2>
        <p className="font-sans text-sm font-medium text-obsidian-velvet/50">
          Please provide your contact details and shipping preferences.
        </p>
      </div>

      <div>
        <FormField label="Full Name" error={errors.fullName?.message}>
          <Input
            type="text"
            disabled={isAuthorizing}
            error={!!errors.fullName}
            placeholder="Jean Lauren"
            {...register("fullName")}
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
  );
}
