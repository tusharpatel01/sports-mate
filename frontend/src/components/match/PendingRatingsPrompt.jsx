import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, ChevronRight } from "lucide-react";
import RateTeammatesModal from "./RateTeammatesModal";
import api from "../../api/axios";
import { formatMatchDate } from "../../utils";

export default function PendingRatingsPrompt() {
  const [pending, setPending] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [activeMatch, setActiveMatch] = useState(null);

  useEffect(() => {
    api.get("/reviews/pending")
      .then(({ data }) => setPending(data.data || []))
      .catch(() => {});
  }, []);

  // Re-fetch after rating submitted
  const refreshPending = () => {
    api.get("/reviews/pending")
      .then(({ data }) => setPending(data.data || []))
      .catch(() => {});
  };

  if (dismissed || pending.length === 0) return null;

  const firstMatch = pending[0];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 sm:mb-6"
      >
        <div className="card p-3 sm:p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/20 border-yellow-800/40">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star size={18} className="text-yellow-400 fill-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-100">
                Rate your teammates from {firstMatch.match.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Played {formatMatchDate(firstMatch.match.date)} · {firstMatch.teammates.length} teammate{firstMatch.teammates.length !== 1 ? "s" : ""} to rate
              </p>
              {pending.length > 1 && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  +{pending.length - 1} more match{pending.length - 1 !== 1 ? "es" : ""} pending
                </p>
              )}
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-500 hover:text-slate-300 flex-shrink-0"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>

          <button
            onClick={() => setActiveMatch(firstMatch)}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold transition-colors"
          >
            Rate now <ChevronRight size={12} />
          </button>
        </div>
      </motion.div>

      <RateTeammatesModal
        open={!!activeMatch}
        onClose={() => setActiveMatch(null)}
        matchData={activeMatch}
        onComplete={() => {
          setActiveMatch(null);
          refreshPending();
        }}
      />
    </>
  );
}