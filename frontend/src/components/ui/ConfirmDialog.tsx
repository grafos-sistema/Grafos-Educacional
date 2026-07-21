import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'danger' | 'primary' | 'warning';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = 'danger',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
