import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, ChevronLeft, ChevronRight, CheckCircle, MapPin,
  Shield, Sparkles,
} from "lucide-react";
import { selectCurrentUser, updateUser } from "../../features/auth/authSlice";
import { Spinner } from "../../components/common";
import { useGeolocation } from "../../hooks";
import { SPORTS, SKILL_LEVELS, RADIUS_OPTIONS } from "../../utils";
import api from "../../api/axios";
import toast from "react-hot-toast";

const STEPS = [
  { id: "sports",   title: "What do you play?", subtitle: "Pick 1-3 sports you enjoy" },
  { id: "location", title: "Where do you play?", subtitle: "We'll show matches nearby" },
  { id: "skill",    title: "Your skill level?",  subtitle: "Helps us match you with the right players" },
];

export default function OnboardingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { location, error: geoError, getLocation, loading: geoLoading } = useGeolocation();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sports, setSports] = useState([]);
  const [skillLevel, setSkillLevel] = useState("");
  const [radius, setRadius] = useState(10);

  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleSport = (sport) => {
    setSports((prev) => {
      if (prev.includes(sport)) return prev.filter((s) => s !== sport);
      if (prev.length >= 3) {
        toast.error("Pick up to 3 sports for now — you can add more later!");
        return prev;
      }
      return [...prev, sport];
    });
  };

  const handleNext = () => {
    if (step === 0 && sports.length === 0) {
      toast.error("Pick at least one sport to continue");
      return;
    }
    if (step === 1 && !location) {
      toast.error("Please enable location, or tap 'Skip for now'");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!skillLevel) {
      toast.error("Please pick a skill level");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        preferredSports: sports,
        skillLevel,
        searchRadius: radius,
        ...(location && {
          location: {
            lat: location.lat,
            lng: location.lng,
            city: "",
            address: "",
          },
        }),
      };

      const { data } = await api.put("/users/onboarding", payload);
      dispatch(updateUser(data.data));
      toast.success("All set! Let's find your first match 🎯");
      navigate("/home");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      // Mark onboarding complete with minimal defaults
      await api.put("/users/onboarding", {
        preferredSports: sports.length > 0 ? sports : ["cricket"],
        skillLevel: skillLevel || "beginner",
        searchRadius: radius,
      });
      dispatch(updateUser({ onboardingCompleted: true }));
      navigate("/home");
    } catch (err) {
      toast.error("Couldn't skip. Try selecting an option.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-850 flex flex-col safe-bottom">
      {/* Header */}
      <header className="bg-dark-900/80 backdrop-blur-md border-b border-white/[0.06] px-4 sm:px-6 py-3 sm:py-4 safe-top">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">PlayMate</span>
          </div>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white/5 h-1">
        <motion.div
          className="bg-brand-500 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Welcome message on first load */}
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 sm:mb-8"
            >
              <div className="inline-flex items-center gap-2 text-xs bg-brand-900/30 text-brand-400 px-3 py-1.5 rounded-full mb-3">
                <Sparkles size={12} />
                Welcome, {user?.name?.split(" ")[0]}!
              </div>
              <p className="text-slate-500 text-sm">
                Quick setup — takes less than a minute.
              </p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* ─── Step 0: Sports ──────────────────── */}
            {step === 0 && (
              <motion.div
                key="sports"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-center">
                  {STEPS[0].title}
                </h1>
                <p className="text-slate-500 text-sm text-center mb-6 sm:mb-8">
                  {STEPS[0].subtitle}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                  {SPORTS.map((sport) => {
                    const isSelected = sports.includes(sport.value);
                    return (
                      <button
                        key={sport.value}
                        onClick={() => toggleSport(sport.value)}
                        className={`relative p-4 sm:p-5 rounded-2xl border-2 text-center transition-all ${
                          isSelected
                            ? "border-brand-500 bg-brand-900/40 scale-[0.98]"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center"
                          >
                            <CheckCircle size={12} className="text-white" />
                          </motion.div>
                        )}
                        <div className="text-3xl sm:text-4xl mb-2">{sport.emoji}</div>
                        <p
                          className={`text-sm font-semibold ${
                            isSelected ? "text-brand-400" : "text-slate-300"
                          }`}
                        >
                          {sport.label}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {sports.length > 0 && (
                  <p className="text-center text-xs text-slate-500 mt-3">
                    {sports.length} selected · max 3
                  </p>
                )}
              </motion.div>
            )}

            {/* ─── Step 1: Location ─────────────────── */}
            {step === 1 && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-center">
                  {STEPS[1].title}
                </h1>
                <p className="text-slate-500 text-sm text-center mb-6 sm:mb-8">
                  {STEPS[1].subtitle}
                </p>

                <div className="card p-5 sm:p-6 mb-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      location ? "bg-brand-900/40 text-brand-400" : "bg-white/5 text-slate-500"
                    }`}>
                      <MapPin size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {location ? (
                        <>
                          <p className="text-sm font-semibold text-slate-200">
                            Location enabled ✓
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-200">
                            Enable location
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Find players within your area
                          </p>
                        </>
                      )}
                    </div>
                    {!location && (
                      <button
                        onClick={getLocation}
                        disabled={geoLoading}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        {geoLoading ? <Spinner size={12} /> : "Allow"}
                      </button>
                    )}
                  </div>

                  {geoError && (
                    <p className="text-xs text-yellow-400 mt-2 leading-relaxed">
                      ⚠️ {geoError}. You can still continue and set this in your profile later.
                    </p>
                  )}
                </div>

                {location && (
                  <div className="card p-5 sm:p-6">
                    <p className="text-sm font-semibold text-slate-200 mb-3">
                      How far will you travel?
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {RADIUS_OPTIONS.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setRadius(r.value)}
                          className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                            radius === r.value
                              ? "bg-brand-900/50 border-brand-700 text-brand-400"
                              : "border-white/10 text-slate-400 hover:border-white/20"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      Currently set to <strong className="text-brand-400">{radius}km</strong>.
                      You can change this anytime.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Step 2: Skill ─────────────────── */}
            {step === 2 && (
              <motion.div
                key="skill"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-center">
                  {STEPS[2].title}
                </h1>
                <p className="text-slate-500 text-sm text-center mb-6 sm:mb-8">
                  {STEPS[2].subtitle}
                </p>

                <div className="space-y-2 sm:space-y-3">
                  {SKILL_LEVELS.filter((s) => s.value !== "any").map((skill) => {
                    const isSelected = skillLevel === skill.value;
                    const descriptions = {
                      beginner:     "New to the sport, learning basics",
                      intermediate: "Comfortable with the game, played for a while",
                      advanced:     "Skilled player, competitive matches",
                      pro:          "Tournament-level, very experienced",
                    };
                    return (
                      <button
                        key={skill.value}
                        onClick={() => setSkillLevel(skill.value)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                          isSelected
                            ? "border-brand-500 bg-brand-900/40"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-brand-600 text-white" : "bg-white/5 text-slate-400"
                          }`}
                        >
                          <Shield size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-semibold text-sm capitalize ${
                              isSelected ? "text-brand-400" : "text-slate-200"
                            }`}
                          >
                            {skill.label}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {descriptions[skill.value]}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle size={18} className="text-brand-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer with navigation */}
      <footer className="bg-dark-900/80 backdrop-blur-md border-t border-white/[0.06] px-4 sm:px-6 py-3 sm:py-4 safe-bottom">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={loading}
              className="btn-secondary flex items-center gap-2 px-4 py-2.5"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}

          <div className="flex-1 text-center text-xs text-slate-500">
            Step {step + 1} of {STEPS.length}
          </div>

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-5 py-2.5"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !skillLevel}
              className="btn-primary flex items-center gap-2 px-5 py-2.5"
            >
              {loading ? (
                <Spinner size={16} />
              ) : (
                <>
                  Finish <CheckCircle size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}