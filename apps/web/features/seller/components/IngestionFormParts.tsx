"use client";

import React from "react";
import { useRef } from "react";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";

export function SectionLoader({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 bg-surface-white/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center animate-in fade-in duration-200">
      <div className="w-7 h-7 rounded-full border-[1.5px] border-muted-zinc border-t-obsidian-velvet animate-spin mb-3" />
      <span className="font-sans text-[9px] text-obsidian-velvet/60 tracking-widest uppercase font-bold text-center px-4">
        {label}
      </span>
    </div>
  );
}

interface ImageUploadProps {
  imageUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (file: File) => void;
  isSaving: boolean;
}

export function ImageUploadPanel({ imageUrl, fileInputRef, onUpload, isSaving }: ImageUploadProps) {
  return (
    <div className="bg-surface-white border border-muted-zinc rounded-xl p-6 shadow-sm">
      <h2 className="font-sans text-base font-bold text-obsidian-velvet mb-4">Product Image</h2>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) onUpload(e.dataTransfer.files[0]); }}
        className="border-2 border-dashed border-muted-zinc rounded-xl bg-warm-linen/10 hover:bg-warm-linen/25 transition-colors cursor-pointer overflow-hidden relative group aspect-[4/5] w-full max-w-[360px] mx-auto lg:max-w-none lg:mx-0 flex flex-col items-center justify-center"
      >
        <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }} className="hidden" />
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
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21" />
            </svg>
            <p className="font-sans text-xs font-semibold text-obsidian-velvet">Upload product image</p>
            <p className="font-sans text-[10px] text-obsidian-velvet/40">Drag & drop or click to browse</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface IngestionFormFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isSaving: boolean;
  categoriesList: string[];
  isAnalyzing?: boolean;
}

export function BasicInfoFields({ register, errors, watch, setValue, isSaving, categoriesList, isAnalyzing }: IngestionFormFieldsProps) {
  const sizeType = watch("sizeType") || "standard";

  return (
    <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 shadow-sm space-y-6 relative overflow-hidden">
      {isAnalyzing && <SectionLoader label="Analyzing Basic Parameters..." />}
      <h2 className="font-sans text-base font-bold text-obsidian-velvet border-b border-muted-zinc/60 pb-3">Basic Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Brand Name" error={errors.brandName?.message}><Input type="text" disabled={isSaving} error={!!errors.brandName} placeholder="Your brand name..." {...register("brandName")} /></FormField>
        <FormField label="Category" error={errors.category?.message}>
          <Combobox
            options={[{ label: "Select category...", value: "" }, ...categoriesList.map((c) => ({ label: c, value: c }))]}
            value={watch("category") || ""}
            onChange={(v) => setValue("category", v, { shouldValidate: true })}
            error={!!errors.category}
            disabled={isSaving}
            placeholder="Select category..."
          />
        </FormField>
        <FormField label="Price (USD)" error={errors.price?.message}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm text-obsidian-velvet/40">$</span>
            <Input type="number" disabled={isSaving} error={!!errors.price} placeholder="0.00" className="pl-7" allowDecimals={true} step="0.01" {...register("price")} />
          </div>
        </FormField>
        <FormField label="Size Type" error={errors.sizeType?.message}>
          <Combobox
            options={[
              { label: "Standard Sizes (XS-XL)", value: "standard" },
              { label: "One Size (OS)", value: "one_size" }
            ]}
            value={sizeType}
            onChange={(v) => setValue("sizeType", v, { shouldValidate: true })}
            error={!!errors.sizeType}
            disabled={isSaving}
            placeholder="Select size type..."
          />
        </FormField>
        <FormField label="Material" error={errors.material?.message}><Input type="text" disabled={isSaving} error={!!errors.material} placeholder="e.g. 100% Wool, Linen" {...register("material")} /></FormField>
        <FormField label="Product Name" error={errors.productName?.message}><Input type="text" disabled={isSaving} error={!!errors.productName} placeholder="Your product name..." {...register("productName")} /></FormField>
      </div>

      {sizeType === "standard" ? (
        <div className="border-t border-muted-zinc/40 pt-4 space-y-3">
          <label className="block font-sans text-xs font-bold uppercase tracking-widest text-obsidian-velvet/40">
            Standard Sizes Stock
          </label>
          <div className="grid grid-cols-5 gap-3">
            <FormField label="XS" error={errors.stockXS?.message}>
              <Input type="number" disabled={isSaving} error={!!errors.stockXS} placeholder="XS Qty" {...register("stockXS")} />
            </FormField>
            <FormField label="S" error={errors.stockS?.message}>
              <Input type="number" disabled={isSaving} error={!!errors.stockS} placeholder="S Qty" {...register("stockS")} />
            </FormField>
            <FormField label="M" error={errors.stockM?.message}>
              <Input type="number" disabled={isSaving} error={!!errors.stockM} placeholder="M Qty" {...register("stockM")} />
            </FormField>
            <FormField label="L" error={errors.stockL?.message}>
              <Input type="number" disabled={isSaving} error={!!errors.stockL} placeholder="L Qty" {...register("stockL")} />
            </FormField>
            <FormField label="XL" error={errors.stockXL?.message}>
              <Input type="number" disabled={isSaving} error={!!errors.stockXL} placeholder="XL Qty" {...register("stockXL")} />
            </FormField>
          </div>
        </div>
      ) : (
        <div className="border-t border-muted-zinc/40 pt-4 max-w-xs">
          <FormField label="One Size (OS) Stock" error={errors.stockOS?.message}>
            <Input type="number" disabled={isSaving} error={!!errors.stockOS} placeholder="OS Qty" {...register("stockOS")} />
          </FormField>
        </div>
      )}

      <FormField label="Description" error={errors.description?.message}>
        <div className="border border-muted-zinc rounded-md overflow-hidden bg-warm-linen/20">
          <div className="bg-surface-white border-b border-muted-zinc px-4 py-3 flex items-center gap-5 text-obsidian-velvet/60 overflow-x-auto whitespace-nowrap">
            <span className="font-serif font-bold text-sm cursor-pointer hover:text-obsidian-velvet">B</span>
            <span className="font-serif italic text-sm cursor-pointer hover:text-obsidian-velvet">I</span>
            <span className="font-serif underline text-sm cursor-pointer hover:text-obsidian-velvet">U</span>
            <span className="w-px h-4 bg-muted-zinc" />
            <span className="text-[11px] cursor-pointer hover:text-obsidian-velvet">Format ▾</span>
            <span className="w-px h-4 bg-muted-zinc" />
            <svg className="w-4 h-4 cursor-pointer hover:text-obsidian-velvet" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
          </div>
          <Textarea rows={6} disabled={isSaving} error={!!errors.description} placeholder="Enter manual override description..." className="bg-transparent border-none rounded-none focus:border-none focus:outline-none resize-y" {...register("description")} />
        </div>
      </FormField>
    </div>
  );
}

export function MetaInfoFields({ register, errors, isSaving, isAnalyzing }: { register: UseFormRegister<any>; errors: FieldErrors<any>; isSaving: boolean; isAnalyzing?: boolean }) {
  return (
    <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 shadow-sm space-y-6 relative overflow-hidden">
      {isAnalyzing && <SectionLoader label="Optimizing Search Metadata..." />}
      <h2 className="font-sans text-base font-bold text-obsidian-velvet border-b border-muted-zinc/60 pb-3">Meta Information</h2>
      <div className="grid grid-cols-1 gap-6 pt-2">
        <FormField label="Page Title" error={errors.pageTitle?.message}><Input type="text" disabled={isSaving} error={!!errors.pageTitle} placeholder="e.g. Buy Luxury Item at Vestira" {...register("pageTitle")} /></FormField>
        <FormField label="Meta Description" error={errors.metaDescription?.message}><Textarea rows={3} disabled={isSaving} error={!!errors.metaDescription} className="resize-none" placeholder="your meta description..." {...register("metaDescription")} /></FormField>
      </div>
    </div>
  );
}

interface StyleFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isSaving: boolean;
  isAnalyzing?: boolean;
}

export function StyleAndAIAttributes({ register, errors, watch, setValue, isSaving, isAnalyzing }: StyleFieldsProps) {
  return (
    <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 shadow-sm space-y-6 relative overflow-hidden">
      {isAnalyzing && <SectionLoader label="Calibrating Style & Aesthetics..." />}
      <h2 className="font-sans text-base font-bold text-obsidian-velvet border-b border-muted-zinc/60 pb-3">AI & Styling Attributes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <FormField label="Sub-Category" error={errors.subCategory?.message}>
          <Input type="text" disabled={isSaving} error={!!errors.subCategory} placeholder="e.g. blazer, midi-dress, heels" {...register("subCategory")} />
        </FormField>
        <FormField label="Gender Target" error={errors.gender?.message}>
          <Combobox
            options={[
              { label: "Select gender...", value: "" },
              { label: "Women", value: "women" },
              { label: "Men", value: "men" },
              { label: "Unisex", value: "unisex" }
            ]}
            value={watch("gender") || "women"}
            onChange={(v) => setValue("gender", v, { shouldValidate: true })}
            error={!!errors.gender}
            disabled={isSaving}
            placeholder="Select gender..."
          />
        </FormField>
        <FormField label="Colors" error={errors.colors?.message}>
          <Input type="text" disabled={isSaving} error={!!errors.colors} placeholder="e.g. obsidian, ivory (comma-separated)" {...register("colors")} />
        </FormField>
        <FormField label="Style Tags" error={errors.tags?.message}>
          <Input type="text" disabled={isSaving} error={!!errors.tags} placeholder="e.g. minimalist, monochrome (comma-separated)" {...register("tags")} />
        </FormField>
      </div>
      <FormField label="Visual Caption (for Search Embeddings)" error={errors.imageCaption?.message}>
        <Textarea rows={3} disabled={isSaving} error={!!errors.imageCaption} className="resize-y" placeholder="Describe the visual details for the search system..." {...register("imageCaption")} />
      </FormField>
    </div>
  );
}

