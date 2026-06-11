export interface Product {
  id: string;
  title: string;
  sku: string;
  price: number;
  category: string;
  tags: string[];
  imageUrl: string;
  imageUrls: string[];
  colors: string[];
  sizes: string[];
  stockBySize: Record<string, number>;
  brand: string;
  description?: string;
  rrfScore?: number;
}

export interface StagedLookItem {
  id: string;
  title: string;
  sku: string;
  price: number;
  category: string;
  imageUrl: string;
  colors: string[];
  sizes?: string[];
  brand?: string;
  tags?: string[];
}

export function stagedLookItemToProduct(item: StagedLookItem): Product {
  return {
    id: item.id,
    title: item.title,
    sku: item.sku,
    price: item.price,
    category: item.category,
    tags: item.tags ?? [],
    imageUrl: item.imageUrl,
    imageUrls: item.imageUrl ? [item.imageUrl] : [],
    colors: item.colors ?? [],
    sizes: item.sizes ?? [],
    stockBySize: {},
    brand: item.brand ?? "LuxeLabel",
  };
}

export type ShowcaseGridVariant = "catalog" | "personalized" | "occasion" | "visual";

export interface ComparisonProduct {
  id: string;
  title: string;
  sku: string;
  price: number;
  category: string;
  imageUrl: string;
  brand: string;
  material?: string;
  colors: string[];
  sizes: string[];
  tags: string[];
  description?: string;
}
