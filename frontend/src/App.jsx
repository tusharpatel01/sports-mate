import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence } from "framer-motion";

import { useAuth, useSocket } from "./hooks";
import { selectIsAuthenticated, selectCurrentUser } from "./features/auth/authSlice";
import { lazy, Suspense } from "react";


import AppLayout from "./components/layout/AppLayout";


// ─── Lazy-loaded pages (each becomes its own chunk) ──
const Landing           = lazy(() => import("./pages/Landing"));
const Home              = lazy(() => import("./pages/Home"));
const Explore           = lazy(() => import("./pages/Explore"));
const MatchDetail       = lazy(() => import("./pages/MatchDetail"));
const CreateMatch       = lazy(() => import("./pages/CreateMatch"));
const ChatPage          = lazy(() => import("./pages/ChatPage"));
const ProfilePage       = lazy(() => import("./pages/ProfilePage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const OnboardingPage    = lazy(() => import("./pages/Onboarding/OnboardingPage"));
const AdminDashboard    = lazy(() => import("./pages/Admin/AdminDashboard"));
const LoginPage         = lazy(() => import("./pages/Auth/LoginPage"));
const RegisterPage      = lazy(() => import("./pages/Auth/RegisterPage"));
const ForgotPassword    = lazy(() => import("./pages/Auth/ForgotPassword"));
const ResetPassword     = lazy(() => import("./pages/Auth/ResetPassword"));
const VerifyEmail       = lazy(() => import("./pages/Auth/VerifyEmail"));
const NotFound          = lazy(() => import("./pages/NotFound"));

import LoadingScreen from "./components/common/LoadingScreen";

// ─── Route guards ─────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initialized = useSelector((s) => s.auth.initialized);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (!initialized) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // New users → onboarding
  if (user && !user.onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Onboarded users shouldn't see onboarding again
  if (user && user.onboardingCompleted && location.pathname === "/onboarding") {
    return <Navigate to="/home" replace />;
  }

  return children;
};

const GuestRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initialized = useSelector((s) => s.auth.initialized);
  if (!initialized) return <LoadingScreen />;
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
};

const AdminRoute = ({ children }) => {
  const user = useSelector((s) => s.auth.user);
  const initialized = useSelector((s) => s.auth.initialized);
  if (!initialized) return <LoadingScreen />;
  return user?.role === "admin" ? children : <Navigate to="/home" replace />;
};

export default function App() {
  useAuth();
  useSocket();

  return (
      <Suspense fallback={<LoadingScreen />}>
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Onboarding — protected but full-screen (no AppLayout wrapping) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected — inside AppLayout (sidebar + navbar) */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/create-match" element={<CreateMatch />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
     </Suspense>
  );
}