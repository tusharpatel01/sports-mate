import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Clock,
  Star,
  Shield,
  MessageCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  UserX,
  LogOut,
} from "lucide-react";
import {
  fetchMatchById,
  selectCurrentMatch,
  selectMatchLoading,
} from "../features/matches/matchSlice";
import { selectCurrentUser } from "../features/auth/authSlice";
import { formatMatchDate, formatCurrency, getSkillColor } from "../utils";
import { useLocalStorage } from "../hooks";
import Avatar from "../components/common/Avatar";
import { MatchMap } from "../components/common/MatchMap";
import {
  SportBadge,
  StatusBadge,
  Modal,
  ConfirmDialog,
  Spinner,
} from "../components/common";
import JoinRequestCard from "../components/match/JoinRequestCard";
import api from "../api/axios";
import toast from "react-hot-toast";

import VerifiedBadge from "../components/common/VerifiedBadge";

export default function MatchDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const match = useSelector(selectCurrentMatch);
  const loading = useSelector(selectMatchLoading);
  const user = useSelector(selectCurrentUser);

  const [joinMsg, setJoinMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [requests, setRequests] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const [saved, setSaved] = useLocalStorage("pm_saved_matches", []);
  const isSaved = saved.includes(id);

  useEffect(() => {
    dispatch(fetchMatchById(id));
  }, [id, dispatch]);

  if (loading || !match) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Spinner size={32} />
      </div>
    );
  }

  const myStatus = match.myStatus || {};
  const spotsLeft = match.totalSlots - (match.participants?.length || 0);
  const isFull = spotsLeft <= 0;
  const lat = match.location?.coordinates?.[1];
  const lng = match.location?.coordinates?.[0];

  const handleJoinRequest = async () => {
    setActionLoading(true);
    try {
      await api.post("/join-requests", {
        matchId: match._id,
        message: joinMsg,
      });
      toast.success("Join request sent! 🎯");
      setShowJoinModal(false);
      setJoinMsg("");
      dispatch(fetchMatchById(id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setActionLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const { data } = await api.get(`/join-requests/match/${match._id}`);
      setRequests(data.data);
      setShowRequests(true);
    } catch {
      toast.error("Failed to load requests");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/matches/${match._id}`);
      toast.success("Match deleted.");
      navigate("/home");
    } catch {
      toast.error("Failed to delete match.");
    }
  };

  const handleLeave = async () => {
    try {
      await api.post(`/matches/${match._id}/leave`);
      toast.success("You have left the match.");
      dispatch(fetchMatchById(id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave match.");
    }
  };

  const handleChatOpen = () => {
    if (match.groupChat) navigate(`/chat/${match.groupChat}`);
  };

  const handleDirectMessage = async () => {
    try {
      const { data } = await api.post("/chats/direct", {
        userId: match.organizer._id,
      });
      navigate(`/chat/${data.data._id}`);
    } catch {
      toast.error("Failed to open chat");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `PlayMate · ${match.title}`,
      text: `Join me for ${match.title} on PlayMate!`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied! 🔗");
      } catch {
        toast.error("Could not copy link.");
      }
    }
  };

  const handleSave = () => {
    if (isSaved) {
      setSaved(saved.filter((sid) => sid !== id));
      toast("Removed from saved", { icon: "🗑️" });
    } else {
      setSaved([...saved, id]);
      toast.success("Saved!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-slate-400 hover:text-slate-200 mb-4 sm:mb-5 transition-colors text-sm"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Title card */}
        <div className="card p-4 sm:p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <SportBadge sport={match.sport} />
                <StatusBadge status={match.status} />
                <span className="text-[10px] sm:text-xs text-slate-500 capitalize">
                  {match.visibility}
                </span>
                {myStatus.isParticipant && !myStatus.isOrganizer && (
                  <span className="badge badge-open">✓ You're in</span>
                )}
                {myStatus.isOnWaitlist && (
                  <span className="badge bg-yellow-900/50 text-yellow-400">
                    ⏱ Waitlisted
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-100 leading-tight break-words">
                {match.title}
              </h1>
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={handleShare}
                className="btn-ghost p-2"
                title="Share"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={handleSave}
                className={`btn-ghost p-2 ${isSaved ? "text-brand-400" : ""}`}
                title={isSaved ? "Saved" : "Save"}
              >
                <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
              </button>
              {myStatus.isOrganizer && (
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="btn-ghost p-2 text-red-400 hover:text-red-300"
                  title="Delete match"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {match.description && (
            <p className="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed break-words">
              {match.description}
            </p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
            {[
              {
                icon: Users,
                label: "Spots",
                value: isFull ? "Full" : `${spotsLeft}/${match.totalSlots}`,
                color: isFull ? "text-red-400" : "text-brand-400",
              },
              {
                icon: Calendar,
                label: "Date",
                value: formatMatchDate(match.date),
                color: "text-slate-200",
              },
              {
                icon: Clock,
                label: "Time",
                value: match.startTime,
                color: "text-slate-200",
              },
              {
                icon: IndianRupee,
                label: "Entry",
                value: formatCurrency(match.entryFee || 0),
                color: "text-slate-200",
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white/5 rounded-xl p-2.5 sm:p-3">
                <Icon size={12} className="text-slate-500 mb-1" />
                <p className={`text-xs sm:text-sm font-bold ${color} truncate`}>
                  {value}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Location summary */}
          <div className="flex items-start gap-2 mb-4 bg-white/5 rounded-xl p-3">
            <MapPin size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              {match.location?.groundName && (
                <p className="text-sm font-semibold text-slate-200 truncate">
                  {match.location.groundName}
                </p>
              )}
              <p className="text-xs sm:text-sm text-slate-400 break-words">
                {match.location?.address}
              </p>
              {match.location?.city && (
                <p className="text-[11px] text-slate-500">
                  {match.location.city}
                </p>
              )}
            </div>
          </div>

          {/* Skill chips */}
          <div className="flex gap-2 flex-wrap mb-5">
            {match.skillRequired !== "any" && (
              <span
                className={`text-[11px] px-3 py-1 rounded-full bg-white/5 ${getSkillColor(match.skillRequired)} font-medium capitalize`}
              >
                <Shield size={10} className="inline mr-1" />
                {match.skillRequired} required
              </span>
            )}
            {match.duration && (
              <span className="text-[11px] px-3 py-1 rounded-full bg-white/5 text-slate-400">
                <Clock size={10} className="inline mr-1" />~{match.duration} min
              </span>
            )}
          </div>

          {/* Spots progress */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{match.participants?.length || 0} joined</span>
              <span>{spotsLeft} spots left</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isFull ? "bg-red-500" : "bg-brand-500"}`}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, ((match.participants?.length || 0) / match.totalSlots) * 100)}%`,
                }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {myStatus.isOrganizer && (
              <>
                <button
                  onClick={loadRequests}
                  className="btn-primary flex items-center justify-center gap-2 flex-1"
                >
                  <Users size={15} /> View Requests
                </button>
                <button
                  onClick={handleChatOpen}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <MessageCircle size={15} /> Group Chat
                </button>
              </>
            )}

            {myStatus.isParticipant && !myStatus.isOrganizer && (
              <>
                <button
                  onClick={handleChatOpen}
                  className="btn-primary flex items-center justify-center gap-2 flex-1"
                >
                  <MessageCircle size={15} />
                  Open Group Chat ({match.participants?.length})
                </button>
                <button
                  onClick={() => setLeaveOpen(true)}
                  className="text-sm flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={15} /> Leave
                </button>
              </>
            )}

            {!myStatus.isOrganizer &&
              !myStatus.isParticipant &&
              myStatus.requestStatus === "pending" && (
                <button
                  disabled
                  className="btn-secondary flex items-center justify-center gap-2 flex-1 opacity-80"
                >
                  <Clock size={15} /> Request Pending
                </button>
              )}

            {!myStatus.isOrganizer &&
              !myStatus.isParticipant &&
              myStatus.requestStatus === "rejected" && (
                <>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="btn-primary flex items-center justify-center gap-2 flex-1"
                  >
                    <Send size={15} /> Send Again
                  </button>
                  <button
                    onClick={handleDirectMessage}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={15} /> Message Host
                  </button>
                </>
              )}

            {!myStatus.isOrganizer &&
              !myStatus.isParticipant &&
              !myStatus.requestStatus && (
                <>
                  <button
                    onClick={() =>
                      match.status === "open" && setShowJoinModal(true)
                    }
                    disabled={match.status !== "open"}
                    className="btn-primary flex items-center justify-center gap-2 flex-1"
                  >
                    <Send size={15} />
                    {isFull ? "Join Waitlist" : "Request to Join"}
                  </button>
                  <button
                    onClick={handleDirectMessage}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={15} /> Message Host
                  </button>
                </>
              )}

            {!myStatus.isOrganizer &&
              !myStatus.isParticipant &&
              myStatus.requestStatus === "cancelled" && (
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="btn-primary flex items-center justify-center gap-2 flex-1"
                >
                  <Send size={15} /> Request Again
                </button>
              )}
          </div>
        </div>

        {/* Map */}
        {lat && lng && (
          <div className="mb-4">
            <MatchMap
              lat={lat}
              lng={lng}
              address={match.location?.address}
              height={
                typeof window !== "undefined" && window.innerWidth < 640
                  ? 220
                  : 280
              }
            />
          </div>
        )}

        {/* Organizer */}
        <div className="card p-3 sm:p-4 mb-4">
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">
            Organizer
          </p>
          <div className="flex items-center gap-3">
            <Avatar
              src={match.organizer?.avatar}
              name={match.organizer?.name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate flex items-center gap-1.5">
                <span className="truncate">{match.organizer?.name}</span>
                <VerifiedBadge user={match.organizer} size={13} />
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {match.organizer?.averageRating > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Star
                      size={10}
                      className="text-yellow-400 fill-yellow-400"
                    />
                    {match.organizer.averageRating}
                  </span>
                )}
                <span className="text-xs text-slate-500 capitalize">
                  {match.organizer?.skillLevel}
                </span>
              </div>
              {match.organizer?.bio && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {match.organizer.bio}
                </p>
              )}
            </div>
            <Link
              to={`/profile/${match.organizer?._id}`}
              className="btn-secondary text-[11px] px-3 py-1.5 flex-shrink-0"
            >
              Profile
            </Link>
          </div>
        </div>

        {/* Players */}
        {match.participants?.length > 0 && (
          <div className="card p-3 sm:p-4 mb-4">
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">
              Players ({match.participants.length}/{match.totalSlots})
            </p>
            <div className="space-y-2.5">
              {match.participants.map(({ user: participant }) => (
                <div key={participant?._id} className="flex items-center gap-3">
                  <Link
                    to={`/profile/${participant?._id}`}
                    className="text-sm font-medium text-slate-200 truncate hover:text-brand-400 flex items-center gap-1"
                  >
                    <span className="truncate">{participant?.name}</span>
                    <VerifiedBadge user={participant} size={11} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${participant?._id}`}
                      className="text-sm font-medium text-slate-200 truncate hover:text-brand-400 block"
                    >
                      {participant?.name}
                    </Link>
                    <p className="text-xs text-slate-500 capitalize">
                      {participant?.skillLevel}
                      {participant?.averageRating > 0 && (
                        <> · ⭐ {participant.averageRating}</>
                      )}
                    </p>
                  </div>
                  {participant?._id === match.organizer?._id ? (
                    <span className="text-[10px] bg-brand-900/50 text-brand-400 px-2 py-0.5 rounded-full">
                      Host
                    </span>
                  ) : (
                    myStatus.isOrganizer && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Remove ${participant.name}?`)) return;
                          try {
                            await api.delete(
                              `/join-requests/match/${match._id}/player/${participant._id}`,
                            );
                            toast.success("Player removed.");
                            dispatch(fetchMatchById(id));
                          } catch {
                            toast.error("Failed.");
                          }
                        }}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      >
                        <UserX size={14} />
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiting list */}
        {match.waitingList?.length > 0 && (
          <div className="card p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">
              Waitlist ({match.waitingList.length})
            </p>
            <div className="space-y-2">
              {match.waitingList.map(({ user: w }, i) => (
                <div key={w?._id} className="flex items-center gap-2.5">
                  <span className="text-[10px] text-slate-600 w-4">
                    #{i + 1}
                  </span>
                  <Avatar src={w?.avatar} name={w?.name} size="xs" />
                  <p className="text-sm text-slate-300 truncate">{w?.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <Modal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Send Join Request"
        size="sm"
      >
        <p className="text-slate-400 text-sm mb-4">
          Send a request to join{" "}
          <strong className="text-slate-200">{match.title}</strong>.
        </p>
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1.5 block">
            Message (optional)
          </label>
          <textarea
            value={joinMsg}
            onChange={(e) => setJoinMsg(e.target.value)}
            placeholder="Tell the organizer about yourself..."
            className="input resize-none"
            rows={3}
            maxLength={200}
          />
          <p className="text-[10px] text-slate-600 text-right mt-1">
            {joinMsg.length}/200
          </p>
        </div>
        <button
          onClick={handleJoinRequest}
          disabled={actionLoading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {actionLoading ? (
            <Spinner size={16} />
          ) : (
            <>
              <Send size={15} /> Send Request
            </>
          )}
        </button>
      </Modal>

      <Modal
        open={showRequests}
        onClose={() => setShowRequests(false)}
        title={`Join Requests (${requests.length})`}
        size="md"
      >
        {requests.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            No pending requests.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {requests.map((req) => (
                <JoinRequestCard
                  key={req._id}
                  request={req}
                  onUpdate={(reqId, action) => {
                    setRequests((prev) => prev.filter((r) => r._id !== reqId));
                    if (action === "accept") dispatch(fetchMatchById(id));
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Match"
        message="Delete this match permanently? The group chat will close."
        danger
      />

      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={handleLeave}
        title="Leave Match"
        message="Leave this match? Your spot will go to the next person on the waitlist."
        danger
      />
    </div>
  );
}
