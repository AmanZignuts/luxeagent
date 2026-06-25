"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { handleApiError } from "@/lib/utils/error-handler";

const merchantSchema = yup.object().shape({
  storeName: yup.string().min(3, "Store name must be at least 3 characters.").required("Store name is required."),
  address: yup.string().required("Business address is required."),
  phone: yup
    .string()
    .required("Phone number is required.")
    .matches(/^[+]?[0-9\s\-()]{7,18}$/, "Please enter a valid phone number format."),
  taxId: yup.string().required("Tax/VAT ID is required."),
});

type MerchantFormValues = yup.InferType<typeof merchantSchema>;

export default function MerchantOnboardingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MerchantFormValues>({
    resolver: yupResolver(merchantSchema),
  });

  const onSubmit = async (values: MerchantFormValues) => {
    setIsSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated. Please sign in.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("merchant_profiles").upsert({
        user_id: user.id,
        store_name: values.storeName,
        store_email: user.email,
        business_address: values.address,
        phone: values.phone,
        tax_id: values.taxId,
      });

      if (error) {
        handleApiError(error, "Merchant Profile Upsert Action");
        setIsSubmitting(false);
        return;
      }

      toast.success("Merchant profile successfully calibrated!");
      router.push("/seller/dashboard");
    } catch (err) {
      handleApiError(err, "Merchant Profile Calibration Setup");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-linen px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl bg-surface-white border border-muted-zinc p-8 md:p-12 rounded-2xl shadow-sm"
      >
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-light tracking-tight text-obsidian-velvet">
            Welcome to Vestira
          </h1>
          <p className="font-sans text-sm text-obsidian-velvet/60 mt-2">
            Let's set up your seller profile so you can start managing your atelier.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField label="Store Name" error={errors.storeName?.message}>
            <Input
              type="text"
              disabled={isSubmitting}
              error={!!errors.storeName}
              placeholder="e.g. Maison de Lauren"
              {...register("storeName")}
            />
          </FormField>

          <FormField label="Business Address" error={errors.address?.message}>
            <Textarea
              disabled={isSubmitting}
              error={!!errors.address}
              rows={2}
              placeholder="e.g. 15 Rue de la Paix, 75002 Paris"
              className="resize-none"
              {...register("address")}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Phone Number" error={errors.phone?.message}>
              <Input
                type="tel"
                disabled={isSubmitting}
                error={!!errors.phone}
                placeholder="+1 (555) 000-0000"
                {...register("phone", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/[^0-9+\s\-()]/g, "");
                  }
                })}
              />
            </FormField>
            
            <FormField label="Tax/VAT ID" error={errors.taxId?.message}>
              <Input
                type="text"
                disabled={isSubmitting}
                error={!!errors.taxId}
                placeholder="e.g. FR12345678901"
                {...register("taxId")}
              />
            </FormField>
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="w-full"
            >
              Complete Setup
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
