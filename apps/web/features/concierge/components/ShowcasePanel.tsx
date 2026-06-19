import React from "react";
import {
  SizePicker,
  LookBook,
  OrderStatusComponent,
  AddToBagConfirmComponent,
  StyleProfileComponent,
  OutfitBuilder,
  ProductComparisonCard,
  ShowcaseProductGrid,
  ShowcaseGridVariant,
  Product,
  StagedLookItem,
} from "@/features/concierge/components";
import { ShowcaseState, QUICK_PROMPTS, STYLE_CATEGORIES } from "../types";

interface ShowcasePanelProps {
  showcase: ShowcaseState;
  sizePickerLoading: boolean;
  handleShowcaseBack: () => void;
  openSizePickerForProduct: (product: Product) => void;
  append: (msg: { role: "user"; content: string }) => void;
  openSizePickerForStagedItem: (item: StagedLookItem) => void;
  swapOutfitPiece: (item: StagedLookItem) => void;
  swappingOutfitSku: string | null;
  sendUserQuery: (text: string) => void;
  bagCount: number;
  openBag: () => void;
  isMobile?: boolean;
  onUploadClick?: () => void;
}

export function ShowcasePanel({
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
  isMobile,
  onUploadClick,
}: ShowcasePanelProps) {
  return (
    <div className={`${isMobile ? "flex w-full" : "hidden lg:flex flex-1"} flex-col min-h-0 bg-warm-linen/30 overflow-hidden relative h-full`}>
      <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
        <div className="max-w-4xl mx-auto w-full min-h-full">
          {/* ── IDLE STATE ─────────────────────────────────────────── */}
          {showcase.kind === "idle" && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-500">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block">
                    Private Styling Suite
                  </span>
                  <h2 className="font-serif text-3xl font-light tracking-tight text-obsidian-velvet/80 leading-tight">
                    Your personal<br />fashion concierge.
                  </h2>
                  <p className="font-sans text-xs text-obsidian-velvet/40 leading-relaxed max-w-xs">
                    Ask me anything — a product search, an outfit for an occasion, or upload an image to find similar pieces.
                  </p>
                </div>

                <div>
                  <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-3">
                    Browse by Category
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => {
                          const q = `Show me ${cat.label.toLowerCase()} from the catalog`;
                          sendUserQuery(q);
                        }}
                        className="flex items-center gap-2 bg-surface-white border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/70 hover:text-obsidian-velvet font-sans font-bold text-[9px] uppercase tracking-wider px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer hover:shadow-sm"
                      >
                        <span className="text-[10px]">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-3">
                    Try a Prompt
                  </span>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                    {QUICK_PROMPTS.slice(0, 4).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => sendUserQuery(p.query)}
                        className="text-left bg-surface-white border border-muted-zinc hover:border-obsidian-velvet/60 hover:bg-tint-champagne/20 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group"
                      >
                        <span className="font-serif text-sm font-light text-obsidian-velvet/80 block group-hover:text-obsidian-velvet transition-colors leading-snug">
                          "{p.query}"
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom: Image Upload CTA */}
                {onUploadClick && (
                  <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div
                      onClick={onUploadClick}
                      className="border border-dashed border-muted-zinc hover:border-obsidian-velvet/50 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 hover:bg-surface-white/60 group bg-surface-white/20"
                    >
                      <svg className="w-7 h-7 text-obsidian-velvet/20 group-hover:text-obsidian-velvet/40 transition-colors mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="font-sans text-[9px] font-bold uppercase tracking-widest text-obsidian-velvet/30 group-hover:text-obsidian-velvet/50 transition-colors">
                        Drop or upload an image for visual search
                      </p>
                      <p className="font-sans text-[8px] text-obsidian-velvet/20 mt-1">
                        JPG, PNG, WEBP · max 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── THINKING STATE ──────────────────────────────────────── */}
          {showcase.kind === "thinking" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-obsidian-velvet/20 animate-pulse" />
                <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-obsidian-velvet/30">
                  Curating your selection...
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-surface-white border border-muted-zinc rounded-lg p-2.5 animate-pulse max-w-[180px]" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="aspect-[4/5] w-full bg-warm-linen/60 rounded-md mb-2" />
                    <div className="space-y-2">
                      <div className="h-2 bg-obsidian-velvet/5 rounded w-2/3" />
                      <div className="h-3 bg-obsidian-velvet/8 rounded w-full" />
                      <div className="h-2 bg-obsidian-velvet/5 rounded w-1/2" />
                      <div className="h-7 bg-obsidian-velvet/5 rounded w-full mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── UNIFIED PRODUCT GRID ── */}
          {(showcase.kind === "product_carousel" ||
            showcase.kind === "personalized_carousel" ||
            showcase.kind === "occasion_recommendation" ||
            showcase.kind === "image_search_result") && (
            <div className="relative">
              {sizePickerLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface-white/70 backdrop-blur-[2px]">
                  <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-obsidian-velvet/40 animate-pulse">
                    Loading sizes…
                  </span>
                </div>
              )}
              <ShowcaseProductGrid
                products={showcase.products}
                append={append}
                onOpenSizes={openSizePickerForProduct}
                variant={
                  {
                    product_carousel: "catalog",
                    personalized_carousel: "personalized",
                    occasion_recommendation: "occasion",
                    image_search_result: "visual",
                  }[showcase.kind] as ShowcaseGridVariant
                }
                query={"query" in showcase ? showcase.query : undefined}
                occasion={"occasion" in showcase ? showcase.occasion : undefined}
                imageDescription={
                  "imageDescription" in showcase ? showcase.imageDescription : undefined
                }
                emptyMessage={
                  showcase.kind === "product_carousel"
                    ? showcase.emptyMessage
                    : undefined
                }
                appliedFiltersLabel={
                  showcase.kind === "product_carousel"
                    ? showcase.appliedFiltersLabel
                    : undefined
                }
                totalFound={
                  showcase.kind === "product_carousel"
                    ? showcase.totalFound
                    : undefined
                }
                appliedFilters={
                  showcase.kind === "product_carousel"
                    ? showcase.appliedFilters
                    : undefined
                }
              />
            </div>
          )}

          {/* ── SIZE PICKER ─────────────────────────────────────────── */}
          {showcase.kind === "size_picker" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm space-y-3">
              {showcase.returnTo && (
                <button
                  type="button"
                  onClick={handleShowcaseBack}
                  className="font-sans text-[9px] font-bold uppercase tracking-wider text-obsidian-velvet/50 hover:text-obsidian-velvet flex items-center gap-1.5 border-none bg-transparent cursor-pointer p-0"
                >
                  <span aria-hidden>←</span> Back to results
                </button>
              )}
              <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block">
                Size & Inventory
              </span>
              <SizePicker
                productId={showcase.productId}
                title={showcase.title}
                sku={showcase.sku}
                price={showcase.price}
                imageUrl={showcase.imageUrl}
                category={showcase.category}
                stockBySize={showcase.stockBySize}
                availableSizes={showcase.availableSizes}
                totalStock={showcase.totalStock}
                isLowStock={showcase.isLowStock}
                onBack={showcase.returnTo ? handleShowcaseBack : undefined}
              />
            </div>
          )}

          {/* ── LOOKBOOK ────────────────────────────────────────────── */}
          {showcase.kind === "lookbook" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg">
              <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-4">
                Styled Look
              </span>
              <LookBook
                occasion={showcase.occasion}
                colorPalette={showcase.colorPalette}
                look={showcase.look}
                totalPrice={showcase.totalPrice}
              />
            </div>
          )}

          {/* ── OUTFIT BUILDER ───────────────────────────────────────── */}
          {showcase.kind === "outfit_builder" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg">
              <OutfitBuilder
                occasion={showcase.occasion}
                colorPalette={showcase.colorPalette}
                look={showcase.look}
                totalPrice={showcase.totalPrice}
                totalBudgetMax={showcase.totalBudgetMax}
                emptyMessage={showcase.emptyMessage}
                onOpenSizes={openSizePickerForStagedItem}
                onSwapItem={swapOutfitPiece}
                swappingSku={swappingOutfitSku}
                append={append}
              />
            </div>
          )}

          {/* ── PRODUCT COMPARISON ───────────────────────────────────── */}
          {showcase.kind === "product_comparison" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg">
              <ProductComparisonCard
                productA={showcase.productA}
                productB={showcase.productB}
                append={append}
              />
            </div>
          )}

          {/* ── ORDER STATUS ─────────────────────────────────────────── */}
          {showcase.kind === "order_status" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm">
              <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-4">
                Purchase History
              </span>
              <OrderStatusComponent orders={showcase.orders} />
            </div>
          )}

          {/* ── STYLE PROFILE ─────────────────────────────────────────── */}
          {showcase.kind === "style_profile" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm">
              <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-4">
                Your Style Profile
              </span>
              <StyleProfileComponent
                displayName={showcase.displayName}
                styleTokens={showcase.styleTokens}
                preferredSize={showcase.preferredSize}
                budgetMin={showcase.budgetMin}
                budgetMax={showcase.budgetMax}
                preferredColors={showcase.preferredColors}
                preferredCategories={showcase.preferredCategories}
              />
            </div>
          )}

          {/* ── ADD TO BAG CONFIRM ──────────────────────────────────── */}
          {showcase.kind === "add_to_bag" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm">
              <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/30 block mb-4">
                Added to Bag
              </span>
              <AddToBagConfirmComponent item={showcase.item} message={showcase.message} />
              <button
                type="button"
                onClick={openBag}
                className="mt-4 w-full font-sans font-bold text-[9px] uppercase tracking-wider rounded-xl py-3 bg-obsidian-velvet text-surface-white hover:bg-obsidian-velvet/90 transition-all cursor-pointer text-center"
              >
                View bag
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bag summary — bottom of showcase */}
      {bagCount > 0 && (
        <div className="flex-shrink-0 border-t border-muted-zinc/60 bg-surface-white/80 backdrop-blur-sm px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <span className="font-sans text-[8px] font-bold tracking-widest uppercase text-obsidian-velvet/40 block">
                {bagCount} piece{bagCount > 1 ? "s" : ""} in your bag
              </span>
              <p className="font-serif text-sm font-light text-obsidian-velvet mt-0.5">
                Review without leaving the concierge
              </p>
            </div>
            <button
              type="button"
              onClick={openBag}
              className="bg-obsidian-velvet text-surface-white font-sans font-bold text-[9px] uppercase tracking-wider rounded-xl px-5 py-2.5 hover:bg-obsidian-velvet/90 active:scale-[0.98] transition-all cursor-pointer flex-shrink-0"
            >
              Open bag
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
