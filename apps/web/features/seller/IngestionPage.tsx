"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { handleApiError } from "@/lib/utils/error-handler";
import { ImageUploadPanel, BasicInfoFields, MetaInfoFields, StyleAndAIAttributes } from "./components/IngestionFormParts";

const ingestionSchema = yup.object().shape({
  sku: yup.string().notRequired(),
  brandName: yup.string().required("Brand name is required."),
  category: yup.string().required("Category is required."),
  price: yup.number().typeError("Price must be a number.").positive("Price must be greater than zero.").required("Price is required."),
  productName: yup.string().required("Product name is required."),
  description: yup.string().required("Description is required."),
  pageTitle: yup.string().required("SEO page title is required."),
  metaDescription: yup.string().required("SEO meta description is required."),
  sizeType: yup.string().oneOf(["standard", "one_size"]).required("Size Type is required."),
  stockXS: yup.number().transform((value, originalValue) => (String(originalValue).trim() === "" ? 0 : value)).nullable().integer().min(0).notRequired(),
  stockS: yup.number().transform((value, originalValue) => (String(originalValue).trim() === "" ? 0 : value)).nullable().integer().min(0).notRequired(),
  stockM: yup.number().transform((value, originalValue) => (String(originalValue).trim() === "" ? 0 : value)).nullable().integer().min(0).notRequired(),
  stockL: yup.number().transform((value, originalValue) => (String(originalValue).trim() === "" ? 0 : value)).nullable().integer().min(0).notRequired(),
  stockXL: yup.number().transform((value, originalValue) => (String(originalValue).trim() === "" ? 0 : value)).nullable().integer().min(0).notRequired(),
  stockOS: yup.number().transform((value, originalValue) => (String(originalValue).trim() === "" ? 0 : value)).nullable().integer().min(0).notRequired(),
  material: yup.string().required("Material details are required."),
  subCategory: yup.string().required("Sub-category is required."),
  gender: yup.string().required("Gender is required."),
  colors: yup.string().notRequired(),
  tags: yup.string().notRequired(),
  imageCaption: yup.string().required("Visual caption is required for search indexing."),
});



function IngestionForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoriesFetched = useRef(false);
  const productFetchedId = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!editId);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: yupResolver(ingestionSchema),
    defaultValues: {
      sku: "",
      brandName: "",
      category: "",
      price: "",
      productName: "",
      description: "",
      pageTitle: "",
      metaDescription: "",
      sizeType: "standard",
      stockXS: 0,
      stockS: 0,
      stockM: 0,
      stockL: 0,
      stockXL: 0,
      stockOS: 0,
      material: "",
      subCategory: "",
      gender: "women",
      colors: "",
      tags: "",
      imageCaption: ""
    },
  });

  // Load categories from DB
  useEffect(() => {
    if (categoriesFetched.current) return;
    categoriesFetched.current = true;
    async function loadCategories() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("products").select("category");
        if (data) {
          const unique = Array.from(new Set(data.map((p) => p.category))).filter(Boolean) as string[];
          setCategoriesList(unique);
        }
      } catch (e) { console.error("Failed to load unique categories from DB", e); }
    }
    loadCategories();
  }, []);

  // Load product in edit mode
  useEffect(() => {
    if (editId) {
      if (productFetchedId.current === editId) return;
      productFetchedId.current = editId;
      setIsLoading(true);
      async function fetchProduct() {
        try {
          const supabase = createClient();
          const id = editId as string;
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
          let query = supabase.from("products").select("*");
          if (isUuid) { query = query.or(`id.eq.${id},sku.eq.${id}`); } else { query = query.eq("sku", id); }
          const { data } = await query.maybeSingle();
          if (data) {
            const stockMap = (data.stock_by_size as Record<string, any>) || {};
            const isOneSize = data.sizes?.includes("OS") || "OS" in stockMap;
            reset({
              sku: data.sku || "",
              brandName: data.brand || "",
              category: data.category || "",
              price: data.price || 0,
              productName: data.title || "",
              description: data.description || "",
              pageTitle: data.title || "",
              metaDescription: data.description || "",
              sizeType: isOneSize ? "one_size" : "standard",
              stockXS: stockMap.XS ?? 0,
              stockS: stockMap.S ?? 0,
              stockM: stockMap.M ?? 0,
              stockL: stockMap.L ?? 0,
              stockXL: stockMap.XL ?? 0,
              stockOS: stockMap.OS ?? 0,
              material: data.material_composition || "",
              subCategory: data.sub_category || "",
              gender: data.gender || "women",
              colors: data.colors ? data.colors.join(", ") : "",
              tags: data.tags ? data.tags.join(", ") : "",
              imageCaption: (data.ai_metadata as any)?.image_caption || data.title || "",
            });
            setImageUrl(data.image_urls?.length > 0 ? data.image_urls[0] : null);
          }
        } catch (e) { console.error("Failed to load product for editing", e); }
        finally { setIsLoading(false); }
      }
      fetchProduct();
    } else {
      if (productFetchedId.current === null) return;
      productFetchedId.current = null;
      setIsLoading(false);
      reset({
        sku: "",
        brandName: "",
        category: "",
        price: "",
        productName: "",
        description: "",
        pageTitle: "",
        metaDescription: "",
        sizeType: "standard",
        stockXS: 0,
        stockS: 0,
        stockM: 0,
        stockL: 0,
        stockXL: 0,
        stockOS: 0,
        material: "",
        subCategory: "",
        gender: "women",
        colors: "",
        tags: "",
        imageCaption: ""
      });
      setImageUrl(null);
      setUploadFile(null);
    }
  }, [editId, reset]);

  const handleUpload = async (file: File) => {
    setUploadFile(file);
    setImageUrl(URL.createObjectURL(file));

    // Automatically trigger AI Vision metadata extraction
    setIsAnalyzing(true);
    const toastId = toast.loading("Uploading and analyzing your product photo...");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/admin/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Analysis pipeline failed");

      // Auto-populate fields from Gemini response
      if (data.aiMetadata) {
        const meta = data.aiMetadata;
        setValue("category", meta.category || "", { shouldValidate: true });
        setValue("subCategory", meta.sub_category || "", { shouldValidate: true });
        setValue("description", meta.description || "", { shouldValidate: true });
        setValue("material", meta.material_composition || "", { shouldValidate: true });
        setValue("gender", meta.gender || "women", { shouldValidate: true });
        setValue("imageCaption", meta.image_caption || "", { shouldValidate: true });
        setValue("brandName", "LuxeLabel", { shouldValidate: true });
        setValue("sizeType", "standard", { shouldValidate: true });
        setValue("stockXS", 5, { shouldValidate: true });
        setValue("stockS", 10, { shouldValidate: true });
        setValue("stockM", 15, { shouldValidate: true });
        setValue("stockL", 10, { shouldValidate: true });
        setValue("stockXL", 5, { shouldValidate: true });
        setValue("stockOS", 0, { shouldValidate: true });

        if (meta.colors && Array.isArray(meta.colors)) {
          setValue("colors", meta.colors.join(", "), { shouldValidate: true });
        }
        if (meta.tags && Array.isArray(meta.tags)) {
          setValue("tags", meta.tags.join(", "), { shouldValidate: true });
        }

        // Auto-generate SEO attributes if not yet customized
        const currentTitle = watch("productName");
        setValue("pageTitle", currentTitle ? `${currentTitle} | LuxeLabel` : "Luxury Fashion | LuxeLabel", { shouldValidate: true });
        setValue("metaDescription", meta.description || "", { shouldValidate: true });
      }

      if (data.imageUrl) {
        setImageUrl(data.imageUrl); // Save public URL returned by storage
      }
      toast.success("Product details generated successfully!", { id: toastId });
    } catch (err: any) {
      console.error("AI Analysis failed:", err);
      toast.error(`Could not analyze photo automatically: ${err.message || "Please enter details manually."}`, { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = async (values: any) => {
    if (!uploadFile && !imageUrl) { toast.error("Please upload a product image."); return; }
    setIsSaving(true);
    try {
      const formData = new FormData();
      if (editId) formData.append("id", editId);
      formData.append("title", values.productName);
      formData.append("price", String(values.price));
      formData.append("sku", values.sku || `LA-CST-${Math.floor(Math.random() * 10000)}`);
      
      formData.append("category", values.category);
      formData.append("brand", values.brandName);
      formData.append("description", values.description);
      formData.append("material", values.material);

      const isOneSize = values.sizeType === "one_size";
      const stockBySize = isOneSize
        ? { OS: Number(values.stockOS || 0) }
        : {
            XS: Number(values.stockXS || 0),
            S: Number(values.stockS || 0),
            M: Number(values.stockM || 0),
            L: Number(values.stockL || 0),
            XL: Number(values.stockXL || 0),
          };
      const totalStock = Object.values(stockBySize).reduce((a, b) => a + b, 0);
      const sizesArray = isOneSize ? ["OS"] : ["XS", "S", "M", "L", "XL"];

      formData.append("stock", String(totalStock));
      formData.append("stock_by_size", JSON.stringify(stockBySize));
      formData.append("sizes", JSON.stringify(sizesArray));

      // Append pre-analyzed and reviewed metadata
      formData.append("sub_category", values.subCategory || "");
      formData.append("gender", values.gender || "women");
      formData.append("image_caption", values.imageCaption || "");
      formData.append("tags", values.tags || "");
      formData.append("colors", values.colors || "");

      if (imageUrl && !uploadFile) {
        formData.append("image_urls", JSON.stringify([imageUrl]));
      }
      if (uploadFile) {
        formData.append("images", uploadFile);
      }

      const endpoint = editId ? "/api/admin/update" : "/api/admin/ingest";
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || (editId ? "Failed to update product" : "Ingestion pipeline failed"));

      toast.success(editId ? "Product changes saved successfully." : "Product successfully added to inventory!");
      setIsSaving(false);
      router.push("/seller/inventory");
    } catch (err: any) {
      handleApiError(err, "Product Vision Ingestion");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 w-full max-w-7xl mx-auto pb-12 pt-24 flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[2px] border-muted-zinc border-t-obsidian-velvet animate-spin mb-4" />
        <span className="font-sans text-xs text-obsidian-velvet/60 tracking-widest uppercase font-semibold">Loading product editor...</span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 w-full max-w-7xl mx-auto lg:h-full lg:overflow-hidden lg:flex lg:flex-col lg:gap-8 pb-12 lg:pb-0">
      <div className="border-b border-muted-zinc/60 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 shrink-0">
        <div>
          <Link href="/seller/inventory" className="group inline-flex items-center gap-1.5 font-sans text-[10px] sm:text-xs tracking-widest uppercase text-obsidian-velvet/40 hover:text-obsidian-velvet mb-2 transition-colors">
            <span className="inline-block transform transition-transform group-hover:-translate-x-0.5">←</span> Back to Inventory
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-obsidian-velvet">
            {editId ? "Edit Product" : "Vision LLM Product Ingestion"}
          </h1>
        </div>
        <Button onClick={handleSubmit(onSubmit)} loading={isSaving} disabled={isSaving || isAnalyzing} className="w-full sm:w-auto text-xs">
          {editId ? "Save Changes" : "Save & Publish"}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <div className="lg:col-span-4 space-y-6">
          <ImageUploadPanel imageUrl={imageUrl} fileInputRef={fileInputRef} onUpload={handleUpload} isSaving={isSaving || isAnalyzing} />
        </div>
        <div className="lg:col-span-8 space-y-6 relative lg:h-full lg:overflow-y-auto lg:pr-4 pb-12 lg:pb-0">
          <BasicInfoFields register={register} errors={errors} watch={watch} setValue={setValue} isSaving={isSaving || isAnalyzing} categoriesList={categoriesList} isAnalyzing={isAnalyzing} />
          <StyleAndAIAttributes register={register} errors={errors} watch={watch} setValue={setValue} isSaving={isSaving || isAnalyzing} isAnalyzing={isAnalyzing} />
          <MetaInfoFields register={register} errors={errors} isSaving={isSaving || isAnalyzing} isAnalyzing={isAnalyzing} />
        </div>
      </form>
    </div>
  );
}

export default function InventoryIngestionPage() {
  return (
    <Suspense fallback={<div className="p-10 font-sans text-sm">Preparing product editor...</div>}>
      <IngestionForm />
    </Suspense>
  );
}

