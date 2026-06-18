import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Optional subtitle rendered below the title */
  description?: string;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional sticky footer slot — ideal for action buttons */
  footer?: React.ReactNode;
  /** Whether clicking the backdrop dismisses the modal. Defaults to true. */
  closeOnBackdropClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  footer,
  closeOnBackdropClick = true,
}: ModalProps) {
  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
        >
          {/* Backdrop Mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            className="fixed inset-0 bg-[#09090B]/10 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className={`relative w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-xl shadow-sm overflow-hidden z-10 flex flex-col ${sizeClasses[size]}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E4E4E7]/60 px-6 pt-5 pb-4 flex-shrink-0">
              <div className="space-y-0.5 pr-4">
                {title && (
                  <h3
                    id="modal-title"
                    className="font-serif text-lg font-light tracking-tight text-[#09090B]"
                  >
                    {title}
                  </h3>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="font-sans text-xs text-[#09090B]/50 leading-relaxed"
                  >
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="flex-shrink-0 w-6 h-6 border border-[#E4E4E7] hover:border-[#09090B] text-[#09090B] flex items-center justify-center font-sans text-xs rounded transition-colors cursor-pointer mt-0.5"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            {children && (
              <div className="flex-1 max-h-[calc(100vh-14rem)] overflow-y-auto px-6 py-5">
                {children}
              </div>
            )}

            {/* Footer — rendered only when provided */}
            {footer && (
              <div className="flex-shrink-0 border-t border-[#E4E4E7]/60 px-6 py-4 bg-[#FAF0E6]/20">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
