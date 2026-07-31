export interface FriendlyErrorDialogPayload {
  title: string;
  description: string;
}

let dialogHandler: ((payload: FriendlyErrorDialogPayload) => void) | null = null;

export function registerErrorDialogHandler(
  handler: ((payload: FriendlyErrorDialogPayload) => void) | null
) {
  dialogHandler = handler;
}

export function showErrorDialog(payload: FriendlyErrorDialogPayload) {
  if (typeof window === 'undefined' || !dialogHandler) return false;
  dialogHandler(payload);
  return true;
}
