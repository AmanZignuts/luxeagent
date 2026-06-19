"use client";

import React from "react";
import { components } from "react-select";

export const selectCustomStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: "var(--color-surface-white, #FFFFFF)",
    borderColor: state.isFocused ? "#09090B" : "#E4E4E7",
    boxShadow: "none",
    borderRadius: "0.375rem",
    paddingLeft: "0.5rem",
    paddingRight: "2.5rem",
    height: "2.25rem",
    minHeight: "2.25rem",
    fontFamily: "var(--font-sans), sans-serif",
    fontSize: "0.75rem",
    "&:hover": { borderColor: "#09090B" },
  }),
  valueContainer: (provided: any) => ({ ...provided, padding: "0" }),
  input: (provided: any) => ({ ...provided, margin: "0", color: "#09090B" }),
  placeholder: (provided: any) => ({ ...provided, color: "rgba(9, 9, 11, 0.4)" }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E4E4E7",
    borderRadius: "0.375rem",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
    zIndex: 99,
    overflow: "hidden",
  }),
  menuList: (provided: any) => ({ ...provided, padding: "0" }),
};

export const selectCustomComponents = {
  DropdownIndicator: () => null,
  IndicatorSeparator: () => null,
  Menu: (props: any) => {
    const { selectProps } = props;
    if (!selectProps.inputValue || selectProps.inputValue.trim().length === 0) return null;
    return <components.Menu {...props} />;
  },
  Option: (props: any) => {
    const { data, innerRef, innerProps, isFocused } = props;
    const item = data.product;
    return (
      <div
        ref={innerRef}
        {...innerProps}
        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors border-b border-muted-zinc/10 last:border-none ${
          isFocused ? "bg-tint-champagne/70 font-semibold" : "hover:bg-tint-champagne/40 bg-surface-white"
        }`}
      >
        <img src={item.imageUrl} alt={item.title} className="w-8 h-8 rounded object-cover border border-muted-zinc/20 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[11px] font-semibold text-obsidian-velvet truncate">{item.title}</p>
          <p className="font-sans text-[8px] text-obsidian-velvet/50 uppercase tracking-wider truncate">
            {item.sku}{item.material ? ` — ${item.material}` : ""}
          </p>
        </div>
        <span className="font-sans text-[10px] font-bold text-obsidian-velvet shrink-0">${item.price}</span>
      </div>
    );
  },
  LoadingMessage: () => (
    <div className="px-4 py-6 flex flex-col items-center justify-center gap-2 text-obsidian-velvet/45 select-none bg-surface-white">
      <svg className="animate-spin h-5 w-5 text-obsidian-velvet/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="font-sans text-[10px] tracking-wider uppercase font-bold text-obsidian-velvet/30">Searching garments...</span>
    </div>
  ),
  NoOptionsMessage: () => (
    <div className="px-4 py-3 text-center text-xs font-sans text-obsidian-velvet/40 bg-surface-white">
      No garments found
    </div>
  ),
};
