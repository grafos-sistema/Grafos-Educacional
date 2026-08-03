'use client';

import { useEffect, useState } from 'react';
import {
  registerErrorDialogHandler,
  type FriendlyErrorDialogPayload,
} from '@/lib/error-dialog';
import { Modal } from '@/components/ui/Modal';

export function ErrorDialogProvider() {
  const [payload, setPayload] = useState<FriendlyErrorDialogPayload | null>(null);

  useEffect(() => {
    registerErrorDialogHandler((nextPayload) => {
      setPayload(nextPayload);
    });
  }, []);

  const handleClose = () => {
    setPayload(null);
  };

  return (
    <Modal
      isOpen={Boolean(payload)}
      onClose={handleClose}
      title={payload?.title ?? 'Aviso'}
      size="sm"
    >
      <div className="flex flex-col items-center text-center">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {payload?.description}
        </p>

        <div className="mt-6 flex w-full justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-w-28 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Entendi
          </button>
        </div>
      </div>
    </Modal>
  );
}
