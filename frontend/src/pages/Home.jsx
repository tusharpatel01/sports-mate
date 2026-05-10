import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import {
  fetchMatches, setFilters, selectMatches, selectMatchLoading, selectFilters,
} from "../features/matches/matchSlice";
import { selectCurrentUser } from "../features/auth/authSlice";
import { useGeolocation } from "../hooks";
import MatchCard from "../components/match/MatchCard";
import MatchFilters from "../components/match/MatchFilters";
import { SkeletonCard, EmptyState } from "../components/common";

export default function Home() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const matches = useSelector(selectMatches);
  const loading = useSelector(selectMatchLoading);
  const filters = useSelector(selectFilters);
  const { location, error: geoError, getLocation } = useGeolocation();

  useEffect(() => {
    const params = { status: "open", ...filters };
    if (location) { params.lat = location.lat; params.lng = location.lng; }
    dispatch(fetchMatches(params));
  }, [location, filters, dispatch]);

  const handleFilterChange = (newFilters) => dispatch(setFilters(newFilters));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 sm:mb-6"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Hey, {user?.name?.split(" ")[0]} 👋
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            {location ? (
              <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
                <MapPin size={12} className="text-brand-400" />
                Showing matches within {filters.radius}km
              </p>
            ) : (
              <button
                onClick={getLocation}
                className="text-xs sm:text-sm text-brand-400 flex items-center gap-1 hover:text-brand-300 transition-colors"
              >
                <MapPin size={12} />
                Enable location for nearby matches
              </button>
            )}
          </div>
        </div>
        <Link
          to="/create-match"
          className="btn-primary flex items-center justify-center gap-2 text-sm whitespace-nowrap"
        >
          <Plus size={16} /> New Match
        </Link>
      </motion.div>

      {geoError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-800/40 text-yellow-400 text-xs sm:text-sm px-3 sm:px-4 py-3 rounded-xl mb-5"
        >
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span className="flex-1">Location access denied. Showing all matches.</span>
          <button
            onClick={getLocation}
            className="text-xs underline whitespace-nowrap"
          >
            Try again
          </button>
        </motion.div>
      )}

      <div className="mb-5 sm:mb-6">
        <MatchFilters filters={filters} onChange={handleFilterChange} />
      </div>

      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <p className="text-xs sm:text-sm text-slate-500">
          {loading ? "Loading..." : `${matches.length} match${matches.length !== 1 ? "es" : ""} found`}
        </p>
        <button
          onClick={() => {
            const params = { status: "open", ...filters };
            if (location) { params.lat = location.lat; params.lng = location.lng; }
            dispatch(fetchMatches(params));
          }}
          className="text-xs text-slate-500 hover:text-brand-400 flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading && matches.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No matches found"
          description={`No ${filters.sport !== "all" ? filters.sport : ""} matches within ${filters.radius}km. Try increasing your radius or check back later.`}
          action={
            <Link to="/create-match" className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Create the first match
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {matches.map((match, i) => (
            <MatchCard key={match._id} match={match} index={i} />
          ))}
        </div>
      )}

      {!loading && user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4"
        >
          {[
            { label: "Played",    value: user.matchesPlayed || 0 },
            { label: "Organised", value: user.matchesOrganised || 0 },
            { label: "Rating",    value: user.averageRating || "—" },
          ].map((stat) => (
            <div key={stat.label} className="card p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-black text-brand-400">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
