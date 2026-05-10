import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// ─── Modal ────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className={`relative w-full ${sizes[size]} card p-4 sm:p-6 z-10
              max-h-[90vh] overflow-y-auto
              rounded-t-2xl rounded-b-none sm:rounded-2xl
              safe-bottom`}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5 sticky top-0 bg-[#161b22] -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-white/[0.05] z-10">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 pr-4 truncate">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="btn-ghost p-1.5 rounded-lg flex-shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Spinner ──────────────────────────────────────────────
export function Spinner({ size = 20, className = "" }) {
  return (
    <svg
      className={`animate-spin text-brand-400 ${className}`}
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── EmptyState ───────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
      {Icon && (
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={26} className="text-slate-500" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-slate-300 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-slate-500 text-xs sm:text-sm max-w-xs mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="card p-3 sm:p-4 space-y-3">
      <div className="flex justify-between gap-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-5 w-14 sm:w-16 rounded-full flex-shrink-0" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
      <div className="flex justify-between items-center pt-1 gap-2">
        <div className="skeleton h-3 w-20 sm:w-24 rounded" />
        <div className="skeleton h-7 w-14 sm:w-16 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────
export function SportBadge({ sport }) {
  return <span className={`badge badge-${sport} capitalize`}>{sport}</span>;
}

export function StatusBadge({ status }) {
  const labels = {
    open: "Open",
    full: "Full",
    in_progress: "Live",
    completed: "Done",
    cancelled: "Cancelled",
  };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

// ─── ConfirmDialog ────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-slate-400 text-sm mb-5 sm:mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        <button onClick={onClose} className="btn-secondary text-sm w-full sm:w-auto">
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full sm:w-auto ${
            danger ? "bg-red-600 hover:bg-red-700 text-white" : "btn-primary"
          }`}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}
