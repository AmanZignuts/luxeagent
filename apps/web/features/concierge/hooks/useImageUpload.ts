"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useImageUpload() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const handleImageFile = useCallback((file: File) => {
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WEBP)");
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      toast.error("Image file size must be less than 5MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setImagePreview(null);
    setImageFile(null);
    setImageBase64(null);
  }, []);

  return {
    imagePreview,
    imageFile,
    imageBase64,
    handleImageFile,
    clearImage,
    setImageFile,
    setImagePreview,
    setImageBase64,
  };
}
