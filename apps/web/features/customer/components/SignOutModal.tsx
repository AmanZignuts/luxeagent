import React from "react";

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SignOutModal({ isOpen, onClose, onConfirm }: SignOutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-surface-white border border-muted-zinc rounded-xl p-8 max-w-sm w-full mx-4 space-y-6 shadow-none animate-in zoom-in-95 duration-200">
        <div className="space-y-2 text-center">
          <h3 className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet">
            Confirm Sign Out
          </h3>
          <p className="font-sans text-xs text-obsidian-velvet/60 leading-relaxed">
            Are you sure you want to end your current session? You will need to sign in again to access the shop.
          </p>
        </div>

        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-muted-zinc hover:border-obsidian-velvet hover:bg-warm-linen/20 text-obsidian-velvet font-sans font-semibold text-xs rounded-md py-2.5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-obsidian-velvet hover:bg-obsidian-velvet/90 text-surface-white font-sans font-semibold text-xs rounded-md py-2.5 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
