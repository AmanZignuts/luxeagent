"use client";

import React from "react";
import { ShowcasePanel } from "./ShowcasePanel";
import { ShowcaseState } from "../types";
import { Product, StagedLookItem } from "./types";

interface MobileShowcaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  showcase: ShowcaseState;
  sizePickerLoading: boolean;
  handleShowcaseBack: () => void;
  openSizePickerForProduct: (product: Product) => Promise<void>;
  append: (msg: { role: "user"; content: string }) => void;
  openSizePickerForStagedItem: (item: StagedLookItem) => void;
  swapOutfitPiece: (item: StagedLookItem) => Promise<void>;
  swappingOutfitSku: string | null;
  sendUserQuery: (text: string) => void;
  bagCount: number;
  openBag: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function MobileShowcaseDrawer({
  isOpen,
  onClose,
  showcase,
  sizePickerLoading,
  handleShowcaseBack,
  openSizePickerForProduct,
  append,
  openSizePickerForStagedItem,
  swapOutfitPiece,
  swappingOutfitSku,
  sendUserQuery,
  bagCount,
  openBag,
  fileInputRef,
}: MobileShowcaseDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Mask */}
      <div
        onClick={onClose}
        className="lg:hidden fixed inset-0 bg-obsidian-velvet/30 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
      />

      {/* Bottom Sheet Drawer (95% height) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[95vh] bg-warm-linen rounded-t-2xl z-50 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Elegant Drag Handle Indicator */}
        <div className="flex-shrink-0 w-full pt-2 bg-surface-white">
          <div className="w-10 h-1 bg-obsidian-velvet/15 rounded-full mx-auto" />
        </div>

        {/* Header for mobile styling suite */}
        <header className="flex-shrink-0 bg-surface-white border-b border-muted-zinc/60 flex items-center justify-between px-6 pb-3 pt-1.5 h-12">
          <span className="font-serif text-sm font-semibold tracking-tight text-obsidian-velvet">✦ Styling Suite</span>
          <button
            type="button"
            onClick={onClose}
            className="w-14 h-7 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet flex items-center justify-center font-sans text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer bg-surface-white"
          >
            Close
          </button>
        </header>

        {/* Mobile Showcase Content wrapper */}
        <div className="flex-1 overflow-hidden relative">
          <ShowcasePanel
            showcase={showcase}
            sizePickerLoading={sizePickerLoading}
            handleShowcaseBack={handleShowcaseBack}
            openSizePickerForProduct={openSizePickerForProduct}
            append={append}
            openSizePickerForStagedItem={openSizePickerForStagedItem}
            swapOutfitPiece={swapOutfitPiece}
            swappingOutfitSku={swappingOutfitSku}
            sendUserQuery={sendUserQuery}
            bagCount={bagCount}
            openBag={openBag}
            isMobile={true}
            onUploadClick={() => fileInputRef.current?.click()}
          />
        </div>
      </div>
    </>
  );
}
