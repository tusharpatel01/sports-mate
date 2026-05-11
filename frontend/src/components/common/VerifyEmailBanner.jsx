import { useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Send, Loader2 } from "lucide-react";
import { selectCurrentUser } from "../../features/auth/authSlice";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function VerifyEmailBanner() {
  const user = useSelector(selectCurrentUser);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // Don't show if no user, already verified, or dismissed this session
  if (!user || user.isEmailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent! Check your inbox 📩", {
        duration: 5000,
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to send email. Try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-yellow-900/30 border-b border-yellow-800/40 overflow-hidden"
      >
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <Mail size={16} className="text-yellow-400 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-yellow-100 flex-1 leading-snug min-w-0">
            <span className="hidden sm:inline">
              Please verify your email{" "}
              <strong className="text-yellow-200">{user.email}</strong> to unlock all features.
            </span>
            <span className="sm:hidden">
              Verify your email to unlock all features.
            </span>
          </p>
          <button
            onClick={handleResend}
            disabled={sending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-yellow-700/40 hover:bg-yellow-700/60 text-yellow-100 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            <span className="hidden sm:inline">{sending ? "Sending..." : "Resend email"}</span>
            <span className="sm:hidden">{sending ? "..." : "Resend"}</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-300 hover:text-yellow-100 p-1 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}