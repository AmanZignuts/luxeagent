import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const queryText = q.trim();

  if (!queryText) {
    return NextResponse.json({ suggestions: [] });
  }

  const searchTerms = parseSearchTerms(queryText);
  if (searchTerms.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const supabase = await createClient();

  // Basic query for active products
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = data
    .map((p) => {
      const stockMap = p.stock_by_size as Record<string, number> | null;
      const totalStock = stockMap
        ? Object.values(stockMap).reduce((a, b) => a + b, 0)
        : 0;

      // Score matching
      let searchScore = 0;
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
    .filter((p) => p.searchScore > 0)
    .sort((a, b) => b.searchScore - a.searchScore)
    .slice(0, 5);

  // Artificially add a tiny sleep to make the loader visible for visual feedback
  await new Promise((resolve) => setTimeout(resolve, 600));

  return NextResponse.json({ suggestions });
}
