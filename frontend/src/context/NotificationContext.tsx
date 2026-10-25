import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export interface Toast {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message?: string;
}

interface NotificationContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
            {t.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />}
            {t.type === "info" && <Info className="h-5 w-5 text-indigo-500 shrink-0" />}
            <div className="flex-1 text-xs">
              <h5 className="font-semibold text-slate-900 dark:text-slate-100">{t.title}</h5>
              {t.message && (
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

