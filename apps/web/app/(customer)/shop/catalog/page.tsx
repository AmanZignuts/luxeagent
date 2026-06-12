import { createClient } from "@/lib/supabase/server";
import CatalogShell from "@/features/catalog/CatalogShell";

// Stop words — same as client used to have
const CATALOG_STOP_WORDS = new Set([
  "find", "show", "me", "the", "a", "an", "for", "and", "with", "under", "below",
  "above", "over", "less", "than", "more", "upto", "max", "min", "please", "looking",
  "want", "need", "get", "give", "some", "any", "our", "catalog", "from", "in", "at",
  "to", "of", "rupees", "inr", "rs", "product", "products", "garment", "garments",
  "search", "recommend", "suggest", "anything", "something", "everything", "all",
  "item", "items", "piece", "pieces", "selection", "selections", "clothing", "clothes",
  "apparel", "fashion", "wear", "wears", "collection", "collections", "outfit", "outfits",
  "look", "looks", "style", "styles",
]);

function capitalize(str: string) {
  if (!str) return "";
  return str.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function parseSearchTerms(raw: string): string[] {
  return raw
    .replace(/[₹$]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9-]/gi, "").toLowerCase())
    .filter((t) => t.length > 0 && !CATALOG_STOP_WORDS.has(t) && isNaN(Number(t)));
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Parse all filter params
  const rawQ = typeof params.q === "string" ? params.q : "";
  const searchTerms = rawQ ? parseSearchTerms(rawQ) : [];

  const cats = Array.isArray(params.cat)
    ? params.cat
    : params.cat
    ? [params.cat]
    : [];

  const sizes = Array.isArray(params.size)
    ? params.size
    : params.size
    ? [params.size]
    : [];

  const inStockOnly = params.inStock === "1";
  const priceMin = params.priceMin ? Number(params.priceMin) : null;
  const priceMax = params.priceMax ? Number(params.priceMax) : null;
  const gender = typeof params.gender === "string" ? params.gender : null;
  const sortBy = (params.sort as string) || "featured";

  // ── Server-side Supabase query ──────────────────────────────────────────────
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  // Server-side price filters
  if (priceMin !== null && !isNaN(priceMin)) query = query.gte("price", priceMin);
  if (priceMax !== null && !isNaN(priceMax)) query = query.lte("price", priceMax);

  // Server-side gender filter
  if (gender) query = query.eq("gender", gender);

  // Server-side in-stock filter (requires stock_by_size to not be empty)
  // We'll handle stock client-side as Supabase JSON filtering is complex

  const { data, error } = await query;

  // ── Map DB rows to typed products ──────────────────────────────────────────
  type MappedProduct = {
    id: string;
    sku: string;
    title: string;
    price: number;
    material: string;
    category: string;
    rawCategory: string;
    imageUrl: string;
    inStock: boolean;
    sizes: string[];
    gender?: string;
    tags: string[];
    description: string;
    searchScore: number;
  };

  let products: MappedProduct[] = [];

  if (!error && data && data.length > 0) {
    products = data
      .map((p) => {
        const stockMap = p.stock_by_size as Record<string, number> | null;
        const totalStock = stockMap
          ? Object.values(stockMap).reduce((a, b) => a + b, 0)
          : 0;

        // Search score — how many terms match
        let searchScore = 0;
        if (searchTerms.length > 0) {
          const haystack = [
            p.title ?? "",
            p.sku ?? "",
            p.category ?? "",
            p.material_composition ?? "",
            p.description ?? "",
            ...(Array.isArray(p.tags) ? p.tags : []),
          ]
            .join(" ")
            .toLowerCase();
          searchTerms.forEach((term) => {
            if (haystack.includes(term)) searchScore += 1;
          });
        }

        return {
          id: p.id,
          sku: p.sku ?? "",
          title: p.title ?? "",
          price: Number(p.price) || 0,
          material: p.material_composition || "",
          category: p.category ? capitalize(p.category) : "Ready-to-Wear",
          rawCategory: p.category || "",
          imageUrl:
            Array.isArray(p.image_urls) && p.image_urls.length > 0
              ? p.image_urls[0]
              : "/product_overshirt.png",
          inStock: totalStock > 0,
          sizes: Array.isArray(p.sizes) ? p.sizes : ["M"],
          gender: p.gender ?? undefined,
          tags: Array.isArray(p.tags) ? p.tags : [],
          description: p.description ?? "",
          searchScore,
        };
      })
      // Client-side filtering that can't easily be done server-side
      .filter((p) => {
        // Text search filter
        if (searchTerms.length > 0 && p.searchScore === 0) return false;
        // Category filter
        if (cats.length > 0 && !cats.includes(p.rawCategory)) return false;
        // Size filter
        if (sizes.length > 0 && !p.sizes.some((sz) => sizes.includes(sz))) return false;
        // In-stock filter
        if (inStockOnly && !p.inStock) return false;
        return true;
      })
      // Sort
      .sort((a, b) => {
        if (searchTerms.length > 0 && b.searchScore !== a.searchScore) {
          return b.searchScore - a.searchScore;
        }
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        return 0;
      });
  }

  // Meta for filters sidebar — derive from full unfiltered data if possible
  // We re-use what came back; sidebar will be static enum lists for now
  const allCategories = data
    ? (Array.from(new Set(data.map((p) => p.category).filter(Boolean))) as string[])
    : [];

  const allSizes: string[] = data
    ? Array.from(
        new Set(
          data.flatMap((p) => (Array.isArray(p.sizes) ? p.sizes : []))
        )
      ).sort((a: string, b: string) => {
        const order = ["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"];
        return order.indexOf(a) - order.indexOf(b);
      })
    : ["XS", "S", "M", "L", "XL", "XXL"];

  return (
    <CatalogShell
      products={products}
      categories={allCategories}
      sizes={allSizes}
      activeFilters={{
        q: rawQ,
        cats,
        sizes: sizes,
        inStockOnly,
        priceMin,
        priceMax,
        gender,
        sortBy,
      }}
    />
  );
}
