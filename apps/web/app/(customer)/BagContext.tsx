"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface BagItem {
  id: string;
  sku: string;
  title: string;
  price: number;
  size: string;
  material: string;
  category: string;
  imageUrl?: string;
  quantity?: number;
}

interface BagContextType {
  bagItems: BagItem[];
  addToBag: (item: BagItem) => void;
  removeFromBag: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, delta: number) => void;
  clearBag: () => void;
  isBagDrawerOpen: boolean;
  setIsBagDrawerOpen: (open: boolean) => void;
}

const BagContext = createContext<BagContextType | undefined>(undefined);

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [isBagDrawerOpen, setIsBagDrawerOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Subscribe to auth state changes to detect login/logout/registration
  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // When userId changes, load and merge the corresponding bag from localStorage
  useEffect(() => {
    setIsInitialized(false);
    try {
      const guestKey = "vestira_bag_guest";
      const userKey = userId ? `vestira_bag_${userId}` : null;

      if (userId) {
        // Guest logged in! Merge the guest bag into the user's bag.
        const storedUser = localStorage.getItem(userKey!);
        const storedGuest = localStorage.getItem(guestKey);

        const userItems: BagItem[] = storedUser ? JSON.parse(storedUser) : [];
        const guestItems: BagItem[] = storedGuest ? JSON.parse(storedGuest) : [];

        if (guestItems.length > 0) {
          // Deep clone userItems to modify
          const merged = [...userItems];
          guestItems.forEach((gItem) => {
            const matchIndex = merged.findIndex(
              (uItem) => uItem.id === gItem.id && uItem.size === gItem.size
            );
            if (matchIndex > -1) {
              merged[matchIndex] = {
                ...merged[matchIndex],
                quantity: (merged[matchIndex].quantity || 1) + (gItem.quantity || 1),
              };
            } else {
              merged.push(gItem);
            }
          });

          // Save the merged bag to user local storage and clear the guest bag
          localStorage.setItem(userKey!, JSON.stringify(merged));
          localStorage.removeItem(guestKey);
          setBagItems(merged);
        } else {
          setBagItems(userItems);
        }
      } else {
        // Logged out or initial load as guest
        const stored = localStorage.getItem(guestKey);
        setBagItems(stored ? JSON.parse(stored) : []);
      }
    } catch (e) {
      console.error("Failed to load or merge bag from localStorage:", e);
      setBagItems([]);
    }
    setIsInitialized(true);
  }, [userId]);

  // Persist state to localStorage upon any mutations
  useEffect(() => {
    if (!isInitialized) return;
    try {
      const key = userId ? `vestira_bag_${userId}` : "vestira_bag_guest";
      localStorage.setItem(key, JSON.stringify(bagItems));
    } catch (e) {
      console.error("Failed to save bag to localStorage:", e);
    }
  }, [bagItems, userId, isInitialized]);

  const addToBag = (item: BagItem) => {
    setBagItems((prev) => {
      // If an item with the same id and size already exists, increment its quantity
      const existingIndex = prev.findIndex(
        (existing) => existing.id === item.id && existing.size === item.size
      );
      if (existingIndex > -1) {
        return prev.map((existing, index) =>
          index === existingIndex
            ? { ...existing, quantity: (Number(existing.quantity) || 1) + 1 }
            : existing
        );
      }
      // Otherwise add as a new entry with quantity 1
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromBag = (id: string, size: string) => {
    setBagItems((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
  };

  const updateQuantity = (id: string, size: string, delta: number) => {
    setBagItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === id && item.size === size) {
            const currentQty = Number(item.quantity) || 1;
            const change = Number(delta);
            const newQty = currentQty + change;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        // Remove item if quantity drops to 0 or below
        .filter((item) => (Number(item.quantity) || 1) > 0);
    });
  };

  const clearBag = () => {
    setBagItems([]);
  };

  return (
    <BagContext.Provider
      value={{
        bagItems,
        addToBag,
        removeFromBag,
        updateQuantity,
        clearBag,
        isBagDrawerOpen,
        setIsBagDrawerOpen,
      }}
    >
      {children}
    </BagContext.Provider>
  );
}

export function useBag() {
  const context = useContext(BagContext);
  if (context === undefined) {
    throw new Error("useBag must be used within a BagProvider");
  }
  return context;
}
