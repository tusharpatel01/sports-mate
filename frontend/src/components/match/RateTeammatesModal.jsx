import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, ThumbsDown, ChevronRight, Send, CheckCircle, X } from "lucide-react";
import { Modal, Spinner } from "../common";
import Avatar from "../common/Avatar";
import { getSkillColor } from "../../utils";
import api from "../../api/axios";
import toast from "react-hot-toast";

/**
 * Multi-step rating modal.
 * Lets the user rate each teammate one by one with stars + optional comment + thumbs.
 */
export default function RateTeammatesModal({ open, onClose, matchData, onComplete }) {
  const teammates = matchData?.teammates || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ratings, setRatings] = useState({}); // { revieweeId: { rating, comment, wouldPlayAgain } }
  const [submitting, setSubmitting] = useState(false);

  const teammate = teammates[currentIdx];
  const isLast = currentIdx === teammates.length - 1;
  const currentRating = teammate ? ratings[teammate._id] : null;
  const hasRated = teammates.every((t) => ratings[t._id]?.rating);

  const handleRate = (rating) => {
    if (!teammate) return;
    setRatings((prev) => ({
      ...prev,
      [teammate._id]: { ...(prev[teammate._id] || {}), rating },
    }));
  };

  const handleComment = (comment) => {
    if (!teammate) return;
    setRatings((prev) => ({
      ...prev,
      [teammate._id]: { ...(prev[teammate._id] || {}), comment },
    }));
  };

  const handleWouldPlayAgain = (value) => {
    if (!teammate) return;
    setRatings((prev) => ({
      ...prev,
      [teammate._id]: { ...(prev[teammate._id] || {}), wouldPlayAgain: value },
    }));
  };

  const handleNext = () => {
    if (!currentRating?.rating) {
      toast.error("Please give a star rating first");
      return;
    }
    setCurrentIdx((i) => i + 1);
  };

  const handleSkipPlayer = () => {
    // Remove this teammate from ratings and move on
    setRatings((prev) => {
      const copy = { ...prev };
      delete copy[teammate._id];
      return copy;
    });
    if (isLast) {
      onClose();
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const handleSubmit = async () => {
    const ratingsList = teammates
      .map((t) => ratings[t._id]?.rating ? {
        revieweeId:     t._id,
        rating:         ratings[t._id].rating,
        comment:        ratings[t._id].comment || "",
        wouldPlayAgain: ratings[t._id].wouldPlayAgain !== false,
      } : null)
      .filter(Boolean);

    if (ratingsList.length === 0) {
      toast.error("Rate at least one teammate before submitting");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/reviews", {
        matchId: matchData.match._id,
        ratings: ratingsList,
      });
      toast.success(`Thanks for rating! ⭐`);
      onComplete?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit ratings");
    } finally {
      setSubmitting(false);
    }
  };

  if (!teammate) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Rate teammates · ${matchData?.match?.title || ""}`}
      size="sm"
    >
      <div className="space-y-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {teammates.map((t, i) => (
            <div
              key={t._id}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIdx
                  ? "w-6 bg-brand-500"
                  : ratings[t._id]?.rating
                  ? "w-1.5 bg-brand-500"
                  : "w-1.5 bg-white/10"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={teammate._id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Teammate card */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Avatar src={teammate.avatar} name={teammate.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-100 truncate">
                  {teammate.name}
                </p>
                <p className={`text-xs capitalize ${getSkillColor(teammate.skillLevel)}`}>
                  {teammate.skillLevel}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                {currentIdx + 1}/{teammates.length}
              </p>
            </div>

            {/* Star rating */}
            <div className="text-center py-4">
              <p className="text-xs text-slate-400 mb-3">
                How were they to play with?
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={36}
                      className={
                        currentRating?.rating >= star
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-slate-700"
                      }
                    />
                  </button>
                ))}
              </div>
              {currentRating?.rating && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs mt-3 font-medium text-yellow-400"
                >
                  {currentRating.rating === 5 && "Amazing! 🌟"}
                  {currentRating.rating === 4 && "Great player 👏"}
                  {currentRating.rating === 3 && "Solid teammate 👍"}
                  {currentRating.rating === 2 && "Could improve 🤔"}
                  {currentRating.rating === 1 && "Tough experience 😕"}
                </motion.p>
              )}
            </div>

            {/* Would play again */}
            {currentRating?.rating && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <p className="text-xs text-slate-400 mb-2">Would you play with them again?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWouldPlayAgain(true)}
                    className={`flex-1 py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      currentRating.wouldPlayAgain !== false
                        ? "border-brand-500 bg-brand-900/40 text-brand-400"
                        : "border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <ThumbsUp size={14} /> Yes
                  </button>
                  <button
                    onClick={() => handleWouldPlayAgain(false)}
                    className={`flex-1 py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      currentRating.wouldPlayAgain === false
                        ? "border-red-500 bg-red-900/40 text-red-400"
                        : "border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <ThumbsDown size={14} /> No
                  </button>
                </div>
              </motion.div>
            )}

            {/* Comment (optional) */}
            {currentRating?.rating && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Add a comment <span className="text-slate-600">(optional)</span>
                </label>
                <textarea
                  value={currentRating.comment || ""}
                  onChange={(e) => handleComment(e.target.value)}
                  placeholder="Great hitter, super positive attitude..."
                  rows={2}
                  maxLength={300}
                  className="input resize-none"
                />
                <p className="text-[10px] text-slate-600 text-right mt-1">
                  {currentRating.comment?.length || 0}/300
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-white/[0.05]">
          <button
            onClick={handleSkipPlayer}
            disabled={submitting}
            className="text-xs text-slate-500 hover:text-slate-300 py-2 transition-colors"
          >
            Skip this player
          </button>

          <div className="flex-1" />

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={!hasRated || submitting}
              className="btn-primary flex items-center justify-center gap-2 sm:w-auto"
            >
              {submitting ? <Spinner size={14} /> : (
                <><Send size={14} /> Submit ratings</>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!currentRating?.rating}
              className="btn-primary flex items-center justify-center gap-2 sm:w-auto"
            >
              Next teammate <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}