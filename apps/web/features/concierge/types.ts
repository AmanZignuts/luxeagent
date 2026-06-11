import {
  Product,
  StagedLookItem,
  ComparisonProduct,
} from "@/features/concierge/components";

export type ShowcaseState =
  | { kind: "idle" }
  | { kind: "thinking" }
  | {
      kind: "product_carousel";
      products: Product[];
      query?: string;
      emptyMessage?: string;
      appliedFiltersLabel?: string;
      totalFound?: number;
      appliedFilters?: {
        category?: string;
        priceMin?: number | null;
        priceMax?: number | null;
        gender?: string;
      };
    }
  | { kind: "personalized_carousel"; products: Product[] }
  | {
      kind: "size_picker";
      productId: string;
      title: string;
      sku: string;
      price: number;
      imageUrl?: string;
      category?: string;
      stockBySize: Record<string, number>;
      availableSizes: { size: string; qty: number }[];
      totalStock: number;
      isLowStock: boolean;
      returnTo?: SizePickerReturnState;
    }
  | { kind: "lookbook"; occasion: string; colorPalette?: string; look: StagedLookItem[]; totalPrice: number }
  | {
      kind: "outfit_builder";
      occasion: string;
      colorPalette?: string;
      look: StagedLookItem[];
      totalPrice: number;
      totalBudgetMax?: number | null;
      emptyMessage?: string;
    }
  | { kind: "product_comparison"; productA: ComparisonProduct; productB: ComparisonProduct }
  | { kind: "image_search_result"; imageDescription?: string; products: Product[] }
  | { kind: "occasion_recommendation"; occasion: string; products: Product[] }
  | { kind: "order_status"; orders: { id: string; status: string; total: number; itemCount: number; createdAt: string; trackingNumber?: string }[] }
  | { kind: "style_profile"; displayName?: string; styleTokens: string[]; preferredSize?: string; budgetMin?: number; budgetMax?: number; preferredColors?: string[]; preferredCategories?: string[] }
  | { kind: "add_to_bag"; item: { productId: string; sku: string; title: string; size: string; price: number; imageUrl?: string }; message: string };

export type ProductGridShowcase =
  | Extract<ShowcaseState, { kind: "product_carousel" }>
  | Extract<ShowcaseState, { kind: "personalized_carousel" }>
  | Extract<ShowcaseState, { kind: "occasion_recommendation" }>
  | Extract<ShowcaseState, { kind: "image_search_result" }>;

export function isProductGridShowcase(state: ShowcaseState): state is ProductGridShowcase {
  return (
    state.kind === "product_carousel" ||
    state.kind === "personalized_carousel" ||
    state.kind === "occasion_recommendation" ||
    state.kind === "image_search_result"
  );
}

export type SizePickerReturnState = ProductGridShowcase | Extract<ShowcaseState, { kind: "outfit_builder" }>;

export function canReturnFromSizePicker(state: ShowcaseState): state is SizePickerReturnState {
  return isProductGridShowcase(state) || state.kind === "outfit_builder";
}

export const QUICK_PROMPTS = [
  { label: "Quiet Luxury", query: "Show me quiet luxury essentials" },
  { label: "Summer Dresses", query: "Find summer dresses" },
  { label: "Office Edit", query: "Recommend an office wardrobe" },
  { label: "Wedding Guest", query: "Build a wedding guest outfit" },
  { label: "Resort Wear", query: "Stage resort linen coordinates" },
  { label: "Evening Silk", query: "Recommend evening silk combinations" },
];

export const STYLE_CATEGORIES = [
  { label: "Dresses", icon: "✦" },
  { label: "Outerwear", icon: "◈" },
  { label: "Tops", icon: "◇" },
  { label: "Trousers", icon: "▽" },
  { label: "Accessories", icon: "○" },
];
