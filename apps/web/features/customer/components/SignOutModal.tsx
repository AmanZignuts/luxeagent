import React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Pass true while the sign-out async operation is in progress */
  isLoading?: boolean;
}

export function SignOutModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: SignOutModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title="Confirm Sign Out"
      description="Are you sure you want to end your current session? You will need to sign in again to access the shop."
      size="sm"
      closeOnBackdropClick={!isLoading}
      footer={
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="md"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={isLoading}
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1"
          >
            Sign Out
          </Button>
        </div>
      }
    />
  );
}
