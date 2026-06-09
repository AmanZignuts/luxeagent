"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { loginAction } from "@/lib/actions/auth";
import { FormField, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { handleApiError } from "@/lib/utils/error-handler";
import { toast } from "sonner";
import { motion } from "framer-motion";

const loginSchema = yup.object().shape({
  email: yup.string().email("Please enter a valid email format.").required("Email address is required."),
  password: yup.string().min(6, "Password must be at least 6 characters.").required("Password is required."),
});

type LoginFormValues = yup.InferType<typeof loginSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("role", "shopper");

    try {
      const res = await loginAction(formData);
      if (res && res.error) {
        handleApiError(res.error, "User Login Action");
        setIsSubmitting(false);
      } else {
        toast.success("Successfully signed in.");
      }
    } catch (err: any) {
      handleApiError(err, "User Login");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen overflow-x-hidden bg-warm-linen">
      {/* Left 50% Visual Column — Campaign Visual */}
      <div className="relative hidden w-1/2 overflow-hidden border-r border-muted-zinc lg:block">
        <img
          alt="Vestira Editorial"
          className="absolute inset-0 w-full h-full object-cover"
          src="/luxe_gateway.png"
        />
        <div className="absolute inset-0 bg-black/5 mix-blend-multiply pointer-events-none z-10" />

        {/* Campaign Visual Label */}
        <div className="absolute bottom-10 left-10 z-20 text-white drop-shadow-sm">
          <h2 className="font-serif text-2xl tracking-tight font-light">Vestira</h2>
          <p className="font-sans text-xs tracking-widest uppercase opacity-80 mt-1">Campaign Lookbook — Atelier N° 3</p>
        </div>
      </div>

      {/* Right 50% Interaction Column — Alabaster Linen Canvas */}
      <div className="flex w-full flex-col justify-between bg-warm-linen p-8 lg:w-1/2 sm:p-16">
        
        {/* Header Branding Row */}
        <div className="flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet">
            Vestira
          </Link>
        </div>

        {/* Core Card Console */}
        <div className="mx-auto my-auto w-full max-w-[420px]">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-surface-white border border-muted-zinc p-8 rounded-xl shadow-none"
          >
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-light tracking-tight text-obsidian-velvet">
                Sign In
              </h1>
              <p className="font-sans text-sm text-obsidian-velvet/60 mt-2">
                Sign in to access your custom wardrobe and styling console.
              </p>
            </div>



            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormField label="Email Address" error={errors.email?.message}>
                <Input
                  type="email"
                  disabled={isSubmitting}
                  error={!!errors.email}
                  placeholder="client@vestira.ai"
                  {...register("email")}
                />
              </FormField>

              <FormField label="Password" error={errors.password?.message}>
                <Input
                  type="password"
                  disabled={isSubmitting}
                  error={!!errors.password}
                  placeholder="••••••••••••"
                  {...register("password")}
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="w-full"
              >
                Sign In
              </Button>
            </form>
          </motion.div>
        </div>

        {/* Base Footnotes */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-muted-zinc/60 pt-6 text-center sm:flex-row text-xs font-sans text-obsidian-velvet/60">
          <div />
          <Link href="/register" className="hover:underline hover:text-obsidian-velvet transition-colors">
            New to Vestira? Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
