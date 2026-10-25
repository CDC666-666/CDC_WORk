"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}

const openDialogs: symbol[] = [];
let previousOverflow: { root: string; body: string } | null = null;

export function Dialog({ open, title, description, onClose, children, footer, size = "md" }: DialogProps) {
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const token = Symbol("dialog");
    if (openDialogs.length === 0) {
      previousOverflow = { root: document.documentElement.style.overflow, body: document.body.style.overflow };
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }
    openDialogs.push(token);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && openDialogs.at(-1) === token) {
        event.preventDefault();
        closeRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      const index = openDialogs.indexOf(token);
      if (index !== -1) openDialogs.splice(index, 1);
      if (openDialogs.length === 0 && previousOverflow) {
        document.documentElement.style.overflow = previousOverflow.root;
        document.body.style.overflow = previousOverflow.body;
        previousOverflow = null;
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-hidden bg-slate-950/35 p-3 sm:p-6"
      style={{ margin: 0 }} onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`my-auto flex max-h-[calc(100vh-1.5rem)] w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)] ${size === "lg" ? "max-w-3xl" : "max-w-xl"}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-950">{title}</h2>
            {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="关闭对话框" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">{footer}</footer>}
      </section>
    </div>
  );
}

