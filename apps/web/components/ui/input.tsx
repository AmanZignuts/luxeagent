import React, { forwardRef } from "react";

interface FormFieldProps {
  label?: string;
  error?: any;
  optional?: boolean;
  /** Optional helper text displayed below the label */
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, optional, hint, children, className = "" }: FormFieldProps) {
  const errorMessage = error && typeof error === "object" ? error.message : error;

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {label && (
        <div className="space-y-0.5">
          <label className="flex items-center gap-2 font-sans text-[10px] font-bold tracking-widest text-[#09090B]/50 uppercase">
            {label}
            {optional && (
              <span className="text-[#09090B]/30 font-normal normal-case tracking-normal text-[10px]">
                (optional)
              </span>
            )}
          </label>
          {hint && (
            <p className="font-sans text-[10px] text-[#09090B]/40 leading-relaxed">
              {hint}
            </p>
          )}
        </div>
      )}
      {children}
      {errorMessage && (
        <p className="font-sans text-[11px] font-semibold text-red-500 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {String(errorMessage)}
        </p>
      )}
    </div>
  );
}


export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean; allowDecimals?: boolean }>(
  ({ className = "", error, onKeyDown, min, allowDecimals, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full bg-[#FAF0E6]/40 border ${
          error ? "border-red-400 focus:border-red-500" : "border-[#E4E4E7] focus:border-[#09090B]"
        } rounded-md px-4 py-3 text-sm font-sans text-[#09090B] placeholder:text-[#09090B]/30 focus:outline-none transition-colors duration-200 ${className}`}
        onKeyDown={(e) => {
          if (props.type === "number") {
            const blockedKeys = allowDecimals ? ["e", "E", "+", "-"] : ["e", "E", "+", "-", "."];
            if (blockedKeys.includes(e.key)) {
              e.preventDefault();
            }
          }
          if (onKeyDown) onKeyDown(e);
        }}
        min={props.type === "number" && min === undefined ? "0" : min}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full bg-[#FAF0E6]/40 border ${
          error ? "border-red-400 focus:border-red-500" : "border-[#E4E4E7] focus:border-[#09090B]"
        } rounded-md px-4 py-3 text-sm font-sans text-[#09090B] placeholder:text-[#09090B]/30 focus:outline-none transition-colors duration-200 ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }>(
  ({ className = "", error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full bg-[#FAF0E6]/40 border ${
          error ? "border-red-400 focus:border-red-500" : "border-[#E4E4E7] focus:border-[#09090B]"
        } rounded-md px-4 py-3 text-sm font-sans text-[#09090B] focus:outline-none transition-colors duration-200 ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";
