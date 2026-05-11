import { useState, useRef, useEffect } from "react";
import {
  RecaptchaVerifier, signInWithPhoneNumber,
} from "firebase/auth";
import { Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { Modal, Spinner } from "../common";
import { firebaseAuth } from "../../config/firebase";
import api from "../../api/axios";
import { useDispatch } from "react-redux";
import { updateUser } from "../../features/auth/authSlice";
import toast from "react-hot-toast";

export default function PhoneVerifyModal({ open, onClose }) {
  const dispatch = useDispatch();
  const [step, setStep]       = useState("phone"); // "phone" | "otp" | "done"
  const [phone, setPhone]     = useState("");
  const [otp, setOtp]         = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaRef = useRef(null);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setStep("phone");
      setPhone("");
      setOtp("");
      setConfirmationResult(null);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  }, [open]);

  // ─── Send OTP ─────────────────────────────────
  const handleSendOtp = async () => {
    if (!phone.match(/^\+\d{10,15}$/)) {
      toast.error("Use international format, e.g. +919876543210");
      return;
    }
    setLoading(true);
    try {
      // Set up invisible reCAPTCHA (required by Firebase)
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          firebaseAuth,
          recaptchaRef.current,
          { size: "invisible" }
        );
      }

      const result = await signInWithPhoneNumber(
        firebaseAuth,
        phone,
        window.recaptchaVerifier
      );
      setConfirmationResult(result);
      setStep("otp");
      toast.success("OTP sent! Check your messages.");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to send OTP. Try again.");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify OTP ─────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const credential = await confirmationResult.confirm(otp);
      const idToken    = await credential.user.getIdToken();

      // Send token to backend to mark user verified
      const { data } = await api.post("/users/verify-phone", { idToken });
      dispatch(updateUser({ phone: data.data.phone, isPhoneVerified: true }));

      setStep("done");
      toast.success("Phone verified! ✓");
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        "Invalid OTP. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Verify Phone Number" size="sm">
      {/* Invisible reCAPTCHA container (required by Firebase) */}
      <div ref={recaptchaRef} />

      {step === "phone" && (
        <>
          <div className="flex items-center gap-3 mb-5 p-3 bg-brand-900/20 border border-brand-800/40 rounded-xl">
            <ShieldCheck size={24} className="text-brand-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Get a verified badge
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified players get more match invites and trust.
              </p>
            </div>
          </div>

          <label className="text-xs font-medium text-slate-400 mb-1.5 block">
            Phone Number
          </label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              className="input pl-9"
              autoFocus
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 mb-5">
            Include country code (e.g. +91 for India)
          </p>

          <button
            onClick={handleSendOtp}
            disabled={loading || !phone}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Spinner size={16} /> : "Send OTP"}
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <button
            onClick={() => setStep("phone")}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 mb-4"
          >
            <ArrowLeft size={12} /> Change number
          </button>

          <p className="text-sm text-slate-400 mb-1">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-semibold text-slate-200 mb-5">{phone}</p>

          <label className="text-xs font-medium text-slate-400 mb-1.5 block">
            Enter OTP
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="input text-center text-2xl font-mono tracking-[0.5em] py-3"
            maxLength={6}
            autoFocus
          />

          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Spinner size={16} /> : "Verify"}
          </button>

          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="text-xs text-brand-400 hover:text-brand-300 mt-3 w-full text-center transition-colors"
          >
            Didn't get the code? Resend
          </button>
        </>
      )}

      {step === "done" && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-brand-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-brand-400" />
          </div>
          <p className="text-lg font-semibold text-slate-100 mb-1">
            Phone Verified! ✓
          </p>
          <p className="text-sm text-slate-500">
            You now have a verified badge.
          </p>
        </div>
      )}
    </Modal>
  );
}