import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Modal } from './Modal';
import clsx from 'clsx';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
}) => {
  const confirmBtnStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    info: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  }[variant];

  const iconColor = {
    danger: 'text-red-500 bg-red-50',
    warning: 'text-amber-500 bg-amber-50',
    info: 'text-indigo-500 bg-indigo-50',
  }[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={clsx('px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition', confirmBtnStyles)}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className={clsx('p-2 rounded-lg shrink-0', iconColor)}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed pt-1">{message}</p>
      </div>
    </Modal>
  );
};