import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import {
  fetchNotifications, markAllRead,
  selectNotifications,
} from "../features/notifications/notificationSlice";
import NotificationItem from "../components/notifications/NotificationItem";
import { EmptyState, Spinner } from "../components/common";

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const loading = useSelector((s) => s.notifications.loading);
  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-3 mb-5 sm:mb-6"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <Bell size={20} className="text-brand-400 flex-shrink-0" />
            Notifications
          </h1>
          {unread > 0 && (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {unread} unread
            </p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => dispatch(markAllRead())}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-400 transition-colors btn-ghost flex-shrink-0"
          >
            <CheckCheck size={14} /> <span className="hidden sm:inline">Mark all read</span>
            <span className="sm:hidden">All read</span>
          </button>
        )}
      </motion.div>

      {loading && notifications.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll see join requests, match updates, and messages here."
        />
      ) : (
        <div className="space-y-1">
          {unread > 0 && (
            <>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1 py-2">
                Unread
              </p>
              {notifications
                .filter((n) => !n.isRead)
                .map((n, i) => (
                  <NotificationItem key={n._id} notification={n} index={i} />
                ))}
              <div className="border-t border-white/[0.06] my-3" />
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1 py-2">
                Earlier
              </p>
            </>
          )}
          {notifications
            .filter((n) => n.isRead)
            .map((n, i) => (
              <NotificationItem key={n._id} notification={n} index={i} />
            ))}
        </div>
      )}
    </div>
  );
}
