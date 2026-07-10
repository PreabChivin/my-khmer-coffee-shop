"use client";

import { AlertOctagon, X } from "lucide-react";

/**
 * 🚨 A single dismissable error banner, fixed to the bottom of the viewport.
 * Used everywhere a mutation (order update, product edit) fails so staff get
 * clear, non-blocking feedback instead of a silently-stuck UI or a crash.
 */
export default function AdminToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4">
      <div className="animate-pop-in flex max-w-md items-start gap-2.5 rounded-2xl border-2 border-crimson-500 bg-crimson-50 px-4 py-3 text-sm text-crimson-700 shadow-2xl dark:bg-coffee-900 dark:text-crimson-300">
        <AlertOctagon size={18} className="mt-0.5 shrink-0" />
        <p className="flex-1 font-medium leading-snug">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-crimson-500 hover:text-crimson-800 dark:text-crimson-400 dark:hover:text-crimson-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
