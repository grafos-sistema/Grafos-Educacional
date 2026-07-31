'use client';

import { useEffect, useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  registerErrorDialogHandler,
  type FriendlyErrorDialogPayload,
} from '@/lib/error-dialog';

export function ErrorDialogProvider() {
  const [payload, setPayload] = useState<FriendlyErrorDialogPayload | null>(null);

  useEffect(() => {
    registerErrorDialogHandler((nextPayload) => {
      setPayload(nextPayload);
    });

    return () => {
      registerErrorDialogHandler(null);
    };
  }, []);

  return (
    <Modal
      isOpen={Boolean(payload)}
      onClose={() => setPayload(null)}
      showCloseButton={false}
      size="sm"
      panelClassName="border border-slate-200 !rounded-2xl !p-0 dark:border-slate-700"
      headerClassName="hidden"
      contentClassName="!mt-0"
    >
      {payload ? (
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
          <div className="flex items-start gap-4 px-6 pb-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <ExclamationCircleIcon className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {payload.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {payload.description}
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40">
            <Button variant="outline" onClick={() => setPayload(null)}>
              Entendi
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
