"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { FormField, Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { handleApiError } from "@/lib/utils/error-handler";

const ingestionSchema = yup.object().shape({
  sku: yup.string().notRequired(),
  brandName: yup.string().required("Brand name is required."),
  category: yup.string().required("Category is required."),
  price: yup
    .number()
    .typeError("Price must be a number.")
    .positive("Price must be greater than zero.")
    .required("Price is required."),
  productName: yup.string().required("Product name is required."),
  description: yup.string().required("Description is required."),
  pageTitle: yup.string().required("SEO page title is required."),
  metaDescription: yup.string().required("SEO meta description is required."),
  stock: yup
    .number()
    .transform((value, originalValue) => (String(originalValue).trim() === "" ? null : value))
    .nullable()
    .typeError("Stock units must be a number.")
    .integer("Stock must be an integer.")
    .min(0, "Stock cannot be negative.")
    .required("Stock is required."),
  material: yup.string().required("Material details are required."),
});

type IngestionFormValues = yup.InferType<typeof ingestionSchema>;

function IngestionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>([
    "Ready-to-Wear", "Couture", "Evening Wear", "Dresses", "Tops", "Outerwear", "Trousers", "Accessories"
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoriesFetched = useRef(false);
  const productFetchedId = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!editId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
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
      stock: "" as any,
      material: "",
    },
  });

  // Load distinct categories list dynamically from DB products
  useEffect(() => {
    if (categoriesFetched.current) return;
    categoriesFetched.current = true;

    async function loadUniqueCategories() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("products")
          .select("category");

        if (data) {
          const unique = Array.from(
            new Set(data.map((p) => p.category))
          ).filter(Boolean) as string[];

          const merged = Array.from(new Set([
            "Ready-to-Wear", "Couture", "Evening Wear", "Dresses", "Tops", "Outerwear", "Trousers", "Accessories", ...unique
          ]));
          setCategoriesList(merged);
        }
      } catch (e) {
        console.error("Failed to load unique categories from DB", e);
      }
    }
    loadUniqueCategories();
  }, []);

  // Load product if in edit mode
  useEffect(() => {
    if (editId) {
      if (productFetchedId.current === editId) return;
      productFetchedId.current = editId;
      setIsLoading(true);

      async function fetchProduct() {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("products")
            .select("*")
            .or(`id.eq.${editId},sku.eq.${editId}`)
            .maybeSingle();

          if (data) {
            reset({
              sku: data.sku || "",
              brandName: data.brand || "",
              category: data.category || "Ready-to-Wear",
              price: data.price || 0,
              productName: data.title || "",
              description: data.description || "",
              pageTitle: data.title || "",
              metaDescription: data.description || "",
              stock: data.stock_by_size ? Object.values(data.stock_by_size).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number : "" as any,
              material: data.material_composition || "",
            });
            setImageUrl(data.image_urls && data.image_urls.length > 0 ? data.image_urls[0] : null);
          }
        } catch (e) {
          console.error("Failed to load product for editing", e);
        } finally {
          setIsLoading(false);
        }
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
        stock: "" as any,
        material: "",
      });
      setImageUrl(null);
      setUploadFile(null);
    }
  }, [editId, reset]);

  const handleUpload = (file: File) => {
    setUploadFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  const onSubmit = async (values: any) => {
    if (!uploadFile && !imageUrl) {
      toast.error("Please upload a product image.");
      return;
    }

    setIsSaving(true);

    try {
      if (editId) {
        const supabase = createClient();
        const { error } = await supabase
          .from("products")
          .update({
            title: values.productName,
            price: Number(values.price),
            sku: values.sku,
            description: values.description,
            category: values.category,
            brand: values.brandName,
            material_composition: values.material,
            image_urls: imageUrl ? [imageUrl] : [],
            stock_by_size: { M: Number(values.stock || 10) }
          })
          .or(`id.eq.${editId},sku.eq.${editId}`);

        if (error) {
          throw new Error(error.message);
        }

        toast.success("Product changes saved successfully to database.");
        setIsSaving(false);
        router.push("/seller/inventory");
        return;
      }

      const formData = new FormData();
      formData.append("title", values.productName);
      formData.append("price", String(values.price));
      formData.append("sku", values.sku || `LA-CST-${Math.floor(Math.random() * 10000)}`);

      if (uploadFile) {
        formData.append("images", uploadFile);
      }

      const res = await fetch("/api/admin/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Ingestion pipeline failed");
      }

      toast.success("Product successfully added to inventory!");
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
        <span className="font-sans text-xs text-obsidian-velvet/60 tracking-widest uppercase font-semibold">
          Loading Product Details...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 w-full max-w-7xl mx-auto pb-12">
      <div className="border-b border-muted-zinc/60 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <Link
            href="/seller/inventory"
            className="group inline-flex items-center gap-1.5 font-sans text-[10px] sm:text-xs tracking-widest uppercase text-obsidian-velvet/40 hover:text-obsidian-velvet mb-2 transition-colors"
          >
            <span className="inline-block transform transition-transform group-hover:-translate-x-0.5">←</span>
            Back to Inventory
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-obsidian-velvet">
            {editId ? "Edit Product" : "Vision LLM Product Ingestion"}
          </h1>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          loading={isSaving}
          disabled={isSaving}
          className="w-full sm:w-auto text-xs"
        >
          {editId ? "Save Changes" : "Save & Publish"}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN: Image Upload & Parent Category */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-white border border-muted-zinc rounded-xl p-6 shadow-sm">
            <h2 className="font-sans text-base font-bold text-obsidian-velvet mb-4">Product Image</h2>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleUpload(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-muted-zinc rounded-xl bg-warm-linen/10 hover:bg-warm-linen/25 transition-colors cursor-pointer overflow-hidden relative group h-48 lg:h-auto lg:aspect-[4/5] flex flex-col items-center justify-center"
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Product" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-obsidian-velvet/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-surface-white font-sans text-xs font-bold uppercase tracking-wider">Change Image</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 space-y-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-obsidian-velvet/30 mx-auto">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21" />
                  </svg>
                  <p className="font-sans text-xs font-semibold text-obsidian-velvet">Upload product image</p>
                  <p className="font-sans text-[10px] text-obsidian-velvet/40">Drag & drop or click to browse</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Form Fields */}
        <div className="lg:col-span-8 space-y-6">

          {/* Basic Information */}
          <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 shadow-sm space-y-6 relative overflow-hidden">
            <h2 className="font-sans text-base font-bold text-obsidian-velvet border-b border-muted-zinc/60 pb-3">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Brand Name" error={errors.brandName?.message}>
                <Input
                  type="text"
                  disabled={isSaving}
                  error={!!errors.brandName}
                  placeholder="Your brand name..."
                  {...register("brandName")}
                />
              </FormField>

              <FormField label="Category" error={errors.category?.message}>
                <Select
                  disabled={isSaving}
                  error={!!errors.category}
                  {...register("category")}
                >
                  <option value="">Select...</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Price (USD)" error={errors.price?.message}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm text-obsidian-velvet/40">$</span>
                  <Input
                    type="number"
                    disabled={isSaving}
                    error={!!errors.price}
                    placeholder="0.00"
                    className="pl-7"
                    allowDecimals={true}
                    step="0.01"
                    {...register("price")}
                  />
                </div>
              </FormField>

              <FormField label="Stock Units" error={errors.stock?.message}>
                <Input
                  type="number"
                  disabled={isSaving}
                  error={!!errors.stock}
                  placeholder="Qty"
                  {...register("stock")}
                />
              </FormField>

              <FormField label="Material" error={errors.material?.message}>
                <Input
                  type="text"
                  disabled={isSaving}
                  error={!!errors.material}
                  placeholder="e.g. 100% Wool, Linen"
                  {...register("material")}
                />
              </FormField>

              <FormField label="Product Name" error={errors.productName?.message}>
                <Input
                  type="text"
                  disabled={isSaving}
                  error={!!errors.productName}
                  placeholder='Your product name...'
                  {...register("productName")}
                />
              </FormField>
            </div>

            <FormField label="Description" error={errors.description?.message}>
              <div className="border border-muted-zinc rounded-md overflow-hidden bg-warm-linen/20">
                <div className="bg-surface-white border-b border-muted-zinc px-4 py-3 flex items-center gap-5 text-obsidian-velvet/60 overflow-x-auto whitespace-nowrap">
                  <span className="font-serif font-bold text-sm cursor-pointer hover:text-obsidian-velvet">B</span>
                  <span className="font-serif italic text-sm cursor-pointer hover:text-obsidian-velvet">I</span>
                  <span className="font-serif underline text-sm cursor-pointer hover:text-obsidian-velvet">U</span>
                  <span className="w-px h-4 bg-muted-zinc"></span>
                  <span className="text-[11px] cursor-pointer hover:text-obsidian-velvet">Format ▾</span>
                  <span className="w-px h-4 bg-muted-zinc"></span>
                  <svg className="w-4 h-4 cursor-pointer hover:text-obsidian-velvet" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                </div>
                <Textarea
                  rows={6}
                  disabled={isSaving}
                  error={!!errors.description}
                  placeholder="Enter manual override description..."
                  className="bg-transparent border-none rounded-none focus:border-none focus:outline-none resize-y"
                  {...register("description")}
                />
              </div>
            </FormField>
          </div>

          {/* Meta Info */}
          <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 shadow-sm space-y-6 relative overflow-hidden">
            <h2 className="font-sans text-base font-bold text-obsidian-velvet border-b border-muted-zinc/60 pb-3">Meta Information</h2>

            <div className="grid grid-cols-1 gap-6 pt-2">
              <FormField label="Page Title" error={errors.pageTitle?.message}>
                <Input
                  type="text"
                  disabled={isSaving}
                  error={!!errors.pageTitle}
                  placeholder="e.g. Buy Luxury Item at Vestira"
                  {...register("pageTitle")}
                />
              </FormField>

              <FormField label="Meta Description" error={errors.metaDescription?.message}>
                <Textarea
                  rows={3}
                  disabled={isSaving}
                  error={!!errors.metaDescription}
                  className="resize-none"
                  placeholder='your meta description...'
                  {...register("metaDescription")}
                />
              </FormField>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}

export default function InventoryIngestionPage() {
  return (
    <Suspense fallback={<div className="p-10 font-sans text-sm">Loading Ingestion Console...</div>}>
      <IngestionForm />
    </Suspense>
  );
}
