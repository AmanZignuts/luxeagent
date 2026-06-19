/** Fallback image pool used when a product has no image_urls. */
export const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1594938298299-1f4967a50fc4?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1550614000-4b95dd2449bb?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop",
];

export interface SkuRecord {
  id?: string;
  sku: string;
  title: string;
  category: string;
  stock: number;
  price: number;
  sourcing: string;
  material: string;
  status: "ACTIVE" | "PENDING" | "OUT_OF_STOCK";
  imageUrl?: string;
}

export const STATIC_CATALOG: SkuRecord[] = [
  {
    id: "static-1",
    sku: "LA-SH-039",
    title: "Linen Blend Overshirt",
    category: "Ready-to-Wear",
    stock: 45,
    price: 380,
    sourcing: "Florence, Italy",
    material: "70% Organic Linen, 30% Fine Cotton",
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop",
  },
  {
    id: "static-2",
    sku: "LA-TR-012",
    title: "Tailored Navy Trouser",
    category: "Couture",
    stock: 32,
    price: 450,
    sourcing: "Biella, Italy",
    material: "100% Super-120s Virgin Wool",
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1594938298299-1f4967a50fc4?w=200&h=200&fit=crop",
  },
  {
    id: "static-3",
    sku: "LA-DR-094",
    title: "Silk Crepe Slip Dress",
    category: "Evening Wear",
    stock: 18,
    price: 680,
    sourcing: "Florence, Italy",
    material: "100% Mulberry Silk Crepe",
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&h=200&fit=crop",
  },
  {
    id: "static-4",
    sku: "LA-JK-005",
    title: "Double-Breasted Wool Blazer",
    category: "Couture",
    stock: 0,
    price: 950,
    sourcing: "Biella, Italy",
    material: "100% Recycled Cashmere Wool Blend",
    status: "OUT_OF_STOCK",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&h=200&fit=crop",
  },
  {
    id: "static-5",
    sku: "LA-SH-018",
    title: "Organic Silk Georgette Blouse",
    category: "Ready-to-Wear",
    stock: 12,
    price: 490,
    sourcing: "Florence, Italy",
    material: "100% Organic Silk Georgette",
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1550614000-4b95dd2449bb?w=200&h=200&fit=crop",
  },
];
