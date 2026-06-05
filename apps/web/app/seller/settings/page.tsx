"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { FormField, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { handleApiError } from "@/lib/utils/error-handler";

const sellerSettingsSchema = yup.object().shape({
  storeName: yup.string().min(3, "Store name must be at least 3 characters.").required("Store name is required."),
  storeEmail: yup.string().email("Please enter a valid email format.").required("Contact email is required."),
  storeLocation: yup.string().required("Business address is required."),
  storePhone: yup
    .string()
    .required("Phone number is required.")
    .matches(/^[+]?[0-9\s\-()]{7,18}$/, "Please enter a valid phone number."),
  taxId: yup.string().required("Tax/VAT ID is required."),
});

type SellerSettingsFormValues = yup.InferType<typeof sellerSettingsSchema>;

// Module-level cache to deduplicate concurrent network requests during React development double-mounts
let activeProfileFetchPromise: Promise<{ user: any; data: any } | null> | null = null;

export default function SellerSettingsPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const isFetched = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SellerSettingsFormValues>({
    resolver: yupResolver(sellerSettingsSchema),
    defaultValues: {
      storeName: "",
      storeEmail: "",
      storeLocation: "",
      storePhone: "",
      taxId: "",
    },
  });

  useEffect(() => {
    // 1. Stale-While-Revalidate: Hydrate form fields from client-side cache
    try {
      const cached = localStorage.getItem("vestira_merchant_profile");
      if (cached) {
        const parsed = JSON.parse(cached);
        reset({
          storeName: parsed.store_name || "",
          storeEmail: parsed.store_email || "",
          storeLocation: parsed.business_address || "",
          storePhone: parsed.phone || "",
          taxId: parsed.tax_id || "",
        });
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to parse cached merchant profile", e);
    }

    if (isFetched.current) return;
    isFetched.current = true;

    async function loadSettings() {
      if (!activeProfileFetchPromise) {
        activeProfileFetchPromise = (async () => {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return null;

          const { data } = await supabase
            .from("merchant_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          return { user, data };
        })();
      }

      try {
        const result = await activeProfileFetchPromise;
        if (result) {
          const { user, data } = result;
          if (data) {
            const freshValues = {
              storeName: data.store_name || "",
              storeEmail: data.store_email || user.email || "",
              storeLocation: data.business_address || "",
              storePhone: data.phone || "",
              taxId: data.tax_id || "",
            };
            reset(freshValues);
            localStorage.setItem("vestira_merchant_profile", JSON.stringify(data));
          } else {
            setValue("storeEmail", user.email || "");
          }
        }
      } catch (err) {
        console.error("Failed to load settings from Supabase", err);
      } finally {
        setLoading(false);
        setTimeout(() => {
          activeProfileFetchPromise = null;
        }, 1000);
      }
    }
    loadSettings();
  }, [reset, setValue]);

  const onSubmit = async (values: SellerSettingsFormValues) => {
    setIsUpdating(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated. Please sign in.");
      setIsUpdating(false);
      return;
    }

    try {
      const { error } = await supabase.from("merchant_profiles").upsert({
        user_id: user.id,
        store_name: values.storeName,
        store_email: values.storeEmail,
        business_address: values.storeLocation,
        phone: values.storePhone,
        tax_id: values.taxId,
      });

      if (error) {
        handleApiError(error, "Update Store settings Database action");
        setIsUpdating(false);
        return;
      }

      // Synchronously write successfully saved inputs to client-side cache
      const updatedData = {
        store_name: values.storeName,
        store_email: values.storeEmail,
        business_address: values.storeLocation,
        phone: values.storePhone,
        tax_id: values.taxId,
      };

      localStorage.setItem("vestira_merchant_profile", JSON.stringify(updatedData));

      // Update active promise cache
      activeProfileFetchPromise = Promise.resolve({
        user,
        data: {
          ...updatedData,
          user_id: user.id,
        },
      });

      toast.success("Store profile updated successfully.");
    } catch (err: any) {
      handleApiError(err, "Update Store settings Form submission");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-3xl mx-auto py-12 animate-in fade-in duration-300">
        <div className="bg-surface-white border border-muted-zinc rounded-xl p-12 w-full flex flex-col items-center justify-center space-y-6 shadow-sm">
          <div className="w-9 h-9 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin" />
          <div className="text-center space-y-1.5">
            <h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">
              Loading Store Calibrations
            </h3>
            <p className="font-sans text-[10px] text-obsidian-velvet/40 tracking-wider uppercase font-semibold">
              Syncing business parameters from Supabase
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300 w-full max-w-3xl mx-auto pb-12">
      {/* Page Header */}
      <div className="border-b border-muted-zinc/60 pb-6">
        <span className="font-sans text-xs tracking-widest uppercase text-obsidian-velvet/40 block mb-2">
          System Panel
        </span>
        <h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">
          Store Settings
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 space-y-8 shadow-none">
          <div className="border-b border-muted-zinc/60 pb-4">
            <h2 className="font-serif text-xl font-light tracking-tight text-obsidian-velvet">
              Store Profile
            </h2>
            <p className="font-sans text-xs text-obsidian-velvet/60 mt-1">
              Manage your business details and contact information.
            </p>
          </div>

          <div className="space-y-5">
            <FormField label="Store Name" error={errors.storeName?.message}>
              <Input
                type="text"
                disabled={isUpdating}
                error={!!errors.storeName}
                {...register("storeName")}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Contact Email" error={errors.storeEmail?.message}>
                <Input
                  type="email"
                  disabled={isUpdating}
                  error={!!errors.storeEmail}
                  {...register("storeEmail")}
                />
              </FormField>

              <FormField label="Business Address" error={errors.storeLocation?.message}>
                <Input
                  type="text"
                  disabled={isUpdating}
                  error={!!errors.storeLocation}
                  {...register("storeLocation")}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Phone Number" error={errors.storePhone?.message}>
                <Input
                  type="tel"
                  disabled={isUpdating}
                  error={!!errors.storePhone}
                  {...register("storePhone")}
                />
              </FormField>

              <FormField label="Tax / VAT ID" error={errors.taxId?.message}>
                <Input
                  type="text"
                  disabled={isUpdating}
                  error={!!errors.taxId}
                  {...register("taxId")}
                />
              </FormField>
            </div>
          </div>

          <div className="pt-6 border-t border-muted-zinc/60">
            <Button
              type="submit"
              variant="primary"
              loading={isUpdating}
              disabled={isUpdating}
              className="w-full py-4 text-xs tracking-widest"
            >
              Save Store Profile
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
