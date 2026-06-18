"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Accessible, keyboard-navigable dropdown built on Base UI Select primitives.
 * Replaces native <select> elements throughout the application.
 * Styled to match the Vestira design system — warm-linen fill, obsidian borders.
 *
 * Usage:
 * ```tsx
 * <Combobox
 *   options={[{ label: "Couture", value: "couture" }]}
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   placeholder="Select category..."
 * />
 * ```
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  error = false,
  disabled = false,
  className,
}: ComboboxProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "w-full bg-[#FAF0E6]/40 rounded-md px-4 py-3 text-sm font-sans text-[#09090B] focus:outline-none transition-colors duration-200 cursor-pointer h-auto",
          error
            ? "border border-red-400 focus:border-red-500"
            : "border border-[#E4E4E7] focus:border-[#09090B]",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <SelectValue placeholder={placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-xl shadow-sm font-sans z-[200] max-h-60 overflow-y-auto">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-sm font-sans text-[#09090B] hover:bg-[#FAF0E6] focus:bg-[#FAF0E6] cursor-pointer rounded-md pl-3 pr-8 py-2 data-highlighted:bg-[#FAF0E6] data-highlighted:text-[#09090B] data-selected:font-semibold"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
