import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function UploadDialog({
  children,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-3 py-6 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-lg bg-surface-muted text-muted transition hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="max-h-[calc(90vh-58px)] overflow-y-auto p-4">{children}</div>
      </section>
    </div>
  );
}
