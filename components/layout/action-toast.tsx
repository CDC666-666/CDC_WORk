"use client";

import { useEffect } from "react";
import { CircleCheckBig, X } from "lucide-react";

export interface ToastNotice {
  id: number;
  title: string;
  description: string;
}

interface ActionToastProps {
  notice: ToastNotice | null;
  onDismiss: () => void;
}

export function ActionToast({ notice, onDismiss }: ActionToastProps) {
  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(onDismiss, 3600);
    return () => window.clearTimeout(timer);
  }, [notice, onDismiss]);

  if (!notice) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm items-start gap-3 rounded-lg border border-blue-100 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.16)]"
    >
      <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{notice.title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{notice.description}</p>
      </div>
      <button
        type="button"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label="关闭提示"
        title="关闭提示"
        onClick={onDismiss}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
