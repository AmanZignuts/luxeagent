"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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

  if (!isOpen) return null;

  const handleModalAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

        const actualRole = data.user?.user_metadata?.role ?? 'shopper';
        if (actualRole !== 'shopper') {
          await supabase.auth.signOut();
          toast.error("Access denied. Please use a shopper account to sign in here.");
          return;
        }

        onSuccess?.();
        toast.success("Welcome back! Signed in successfully.");

        if (pendingAction) {
          setTimeout(() => {
            pendingAction();
          }, 100);
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: authName,
              role: "shopper"
            }
          }
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data.user) {
          await supabase.from('user_style_profiles').upsert({
            user_id: data.user.id,
            display_name: authName,
            onboarding_complete: false,
          });
        }

        onSuccess?.();
        toast.success("Welcome to Vestira! Account registered successfully.");

        router.push("/onboarding/style-persona");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during authentication.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 max-w-sm w-full mx-4 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-6 h-6 text-obsidian-velvet/40 hover:text-obsidian-velvet transition-colors font-sans text-sm cursor-pointer border-none bg-transparent"
        >
          ✕
        </button>

        <div className="space-y-2 text-center">
          <h3 className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet">
            {authTab === "signin" ? "Welcome back to Vestira" : "Join the Vestira Atelier"}
          </h3>
          <p className="font-sans text-[10px] text-obsidian-velvet/50 tracking-wider uppercase">
            {authTab === "signin" ? "Sign in to access your curated capsule" : "Create an account to calibrate your styling persona"}
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
            <div>
              <label className="block font-sans text-[9px] font-bold tracking-widest text-obsidian-velvet/40 uppercase mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Jean Lauren"
                className="w-full bg-warm-linen/40 border border-muted-zinc rounded-md px-4 py-2.5 text-xs font-sans text-obsidian-velvet placeholder-obsidian-velvet/30 focus:outline-none focus:border-obsidian-velvet transition-colors duration-200"
              />
            </div>
          )}

          <div>
            <label className="block font-sans text-[9px] font-bold tracking-widest text-obsidian-velvet/40 uppercase mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="client@vestira.ai"
              className="w-full bg-warm-linen/40 border border-muted-zinc rounded-md px-4 py-2.5 text-xs font-sans text-obsidian-velvet placeholder-obsidian-velvet/30 focus:outline-none focus:border-obsidian-velvet transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block font-sans text-[9px] font-bold tracking-widest text-obsidian-velvet/40 uppercase mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-warm-linen/40 border border-muted-zinc rounded-md px-4 py-2.5 text-xs font-sans text-obsidian-velvet placeholder-obsidian-velvet/30 focus:outline-none focus:border-obsidian-velvet transition-colors duration-200"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-obsidian-velvet text-surface-white font-sans font-semibold text-[10px] tracking-widest uppercase rounded-md py-3 hover:bg-obsidian-velvet/90 active:scale-[0.99] transition-all duration-200 border-none cursor-pointer"
          >
            {authTab === "signin" ? "Sign In" : "Register"}
          </button>
        </form>
        
        <p className="font-sans text-[8px] text-obsidian-velvet/40 text-center leading-relaxed max-w-xs mx-auto">
          Your session state, customized fit metrics, and bag selections will remain saved in this browser window.
        </p>
      </div>
    </div>
  );
}
