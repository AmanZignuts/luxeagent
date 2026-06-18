"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup";
  onSuccess?: () => void;
  pendingAction?: (() => void) | null;
}

export function AuthModal({
  isOpen,
  onClose,
  initialTab = "signin",
  onSuccess,
  pendingAction,
}: AuthModalProps) {
  const router = useRouter();
  const [authTab, setAuthTab] = useState<"signin" | "signup">(initialTab);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleModalAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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

        const actualRole = data.user?.user_metadata?.role ?? "shopper";
        if (actualRole !== "shopper") {
          await supabase.auth.signOut();
          toast.error(
            "Access denied. Please use a shopper account to sign in here."
          );
          return;
        }

        onSuccess?.();
        toast.success("Welcome back! Signed in successfully.");

        router.refresh();

        if (pendingAction) {
          setTimeout(() => {
            pendingAction();
          }, 200);
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: authName,
              role: "shopper",
            },
          },
        });

        if (error) {
          toast.error(error.message);
          setIsSubmitting(false);
          return;
        }

        if (data.user) {
          await supabase.from("user_style_profiles").upsert({
            user_id: data.user.id,
            display_name: authName,
            onboarding_complete: false,
          });
        }

        onSuccess?.();
        toast.success("Welcome to Vestira! Account registered successfully.");
        router.refresh();
        router.push("/onboarding/style-persona");
      }
    } catch (err: any) {
      toast.error(
        err.message || "An unexpected error occurred during authentication."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnBackdropClick>
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="space-y-2 text-center">
          <h3 className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet">
            {authTab === "signin"
              ? "Welcome back to Vestira"
              : "Join the Vestira Atelier"}
          </h3>
          <p className="font-sans text-[10px] text-obsidian-velvet/50 tracking-wider uppercase">
            {authTab === "signin"
              ? "Sign in to access your curated capsule"
              : "Create an account to calibrate your styling persona"}
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
            <FormField label="Full Name">
              <Input
                type="text"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Jean Lauren"
              />
            </FormField>
          )}

          <FormField label="Email Address">
            <Input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="client@vestira.ai"
            />
          </FormField>

          <FormField label="Password">
            <Input
              type="password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full"
          >
            {authTab === "signin" ? "Sign In" : "Register"}
          </Button>
        </form>

        <p className="font-sans text-[8px] text-obsidian-velvet/40 text-center leading-relaxed max-w-xs mx-auto">
          Your session state, customized fit metrics, and bag selections will
          remain saved in this browser window.
        </p>
      </div>
    </Modal>
  );
}
