import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ChevronDown, ChevronUp, CheckCircle, Circle, ArrowRight,
} from "lucide-react";
import {
  calculateCompletion,
  getCompletionLabel,
  getCompletionColor,
} from "../../utils/profileCompletion";

/**
 * Profile completion progress meter.
 * Pass `onItemClick(key)` to handle when user clicks a missing item.
 */
export default function ProfileCompletionMeter({ user, onItemClick }) {
  const [expanded, setExpanded] = useState(false);
  const { percent, missing } = calculateCompletion(user);

  // Don't show if 100% complete
  if (percent >= 100) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-3 sm:p-4 mb-4 bg-brand-900/20 border-brand-800/40"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-900/40 flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-400">
              Profile complete! 🎉
            </p>
            <p className="text-xs text-slate-500">
              You're getting maximum match invites
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const colorClass = getCompletionColor(percent);
  const label = getCompletionLabel(percent);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-3 sm:p-4 mb-4"
    >
      {/* Header — clickable to expand */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 text-left"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 ${colorClass}`}>
          <Sparkles size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-100 truncate">
              Complete your profile
            </p>
            <span className={`text-sm font-black ${colorClass}`}>
              {percent}%
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 truncate">
            {label} · {missing.length} item{missing.length !== 1 ? "s" : ""} left
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />
        )}
      </button>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            percent >= 80 ? "bg-brand-500" :
            percent >= 50 ? "bg-blue-500" :
            percent >= 25 ? "bg-yellow-500" :
            "bg-orange-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Expanded list of missing items */}
      <AnimatePresence>
        {expanded && missing.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-1.5">
              {missing.map((item) => (
                <button
                  key={item.key}
                  onClick={() => onItemClick?.(item.key)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                >
                  <Circle size={14} className="text-slate-500 flex-shrink-0" />
                  <span className="text-xs text-slate-300 flex-1 truncate">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    +{item.weight}%
                  </span>
                  <ArrowRight
                    size={12}
                    className="text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}