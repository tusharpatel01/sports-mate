const User = require("../models/User");
const Match = require("../models/Match");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const Report = require("../models/Report");
const { asyncHandler, AppError } = require("../utils/helpers");
const { cloudinary } = require("../config/cloudinary");
const admin = require("../config/firebase");
const { emitToUser } = require("../config/socket");

// ══════════════════════════════════════════════════════════
// USER CONTROLLER
// ══════════════════════════════════════════════════════════

// GET /api/users/:id
exports.getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user || user.isBanned) return next(new AppError("User not found.", 404));
  res.json({ success: true, data: user.toPublicJSON() });
});

// PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = [
    "name", "bio", "age", "gender", "skillLevel",
    "preferredSports", "availability", "searchRadius",
  ];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (req.body.lat && req.body.lng) {
    updates.location = {
      type: "Point",
      coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
      address: req.body.address,
      city: req.body.city,
    };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, data: user.toPublicJSON() });
});

// POST /api/users/verify-phone
exports.verifyPhone = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  if (!idToken) return next(new AppError("Missing Firebase ID token.", 400));

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    return next(new AppError("Invalid or expired verification token.", 401));
  }

  const phoneNumber = decoded.phone_number;
  if (!phoneNumber) {
    return next(new AppError("This token has no phone number attached.", 400));
  }

  const existing = await User.findOne({
    phone: phoneNumber,
    _id: { $ne: req.user._id },
    isPhoneVerified: true,
  });
  if (existing) {
    return next(new AppError("This phone is already linked to another account.", 409));
  }

  req.user.phone = phoneNumber;
  req.user.isPhoneVerified = true;
  req.user.phoneVerifiedAt = new Date();
  await req.user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Phone verified successfully.",
    data: req.user.toPublicJSON(),
  });
});

// PUT /api/users/avatar
exports.updateAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError("Please upload an image.", 400));

  if (req.user.avatarPublicId) {
    await cloudinary.uploader.destroy(req.user.avatarPublicId).catch(() => {});
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.file.path, avatarPublicId: req.file.filename },
    { new: true }
  );

  res.json({ success: true, data: { avatar: user.avatar } });
});

// GET /api/users/nearby
exports.getNearbyPlayers = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10, sport, page = 1, limit = 20 } = req.query;

  const filter = {
    isActive: true,
    isBanned: false,
    _id: { $ne: req.user._id },
  };
  if (sport) filter.preferredSports = sport;

  const users = await User.find({
    ...filter,
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(radius) * 1000,
      },
    },
  })
    .select("name avatar skillLevel preferredSports averageRating totalReviews matchesPlayed location isEmailVerified")
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: users });
});

// PUT /api/users/change-password
exports.changePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new AppError("Current password is incorrect.", 401));
  }
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated." });
});

// PUT /api/users/onboarding
exports.completeOnboarding = asyncHandler(async (req, res, next) => {
  const { preferredSports, skillLevel, searchRadius, location } = req.body;

  if (!preferredSports || preferredSports.length === 0) {
    return next(new AppError("Please select at least one sport.", 400));
  }
  if (!skillLevel) {
    return next(new AppError("Please set your skill level.", 400));
  }

  const user = req.user;
  user.preferredSports = preferredSports;
  user.skillLevel = skillLevel;
  user.searchRadius = searchRadius || 10;
  user.onboardingCompleted = true;

  if (location && location.lat && location.lng) {
    user.location = {
      type: "Point",
      coordinates: [location.lng, location.lat],
      city: location.city || "",
      address: location.address || "",
    };
  }

  await user.save();

  res.json({
    success: true,
    message: "Welcome to PlayMate! Your profile has been set up.",
    data: user.toPublicJSON(),
  });
});

// ══════════════════════════════════════════════════════════
// NOTIFICATION CONTROLLER
// ══════════════════════════════════════════════════════════

exports.getNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate({ path: "sender", select: "name avatar" })
      .populate({ path: "match",  select: "title sport" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: notifications || [] });
  } catch (err) {
    console.error("getNotifications error:", err);
    res.json({ success: true, data: [] });
  }
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );
  res.json({ success: true });
});

exports.markOneAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.json({ success: true, count });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    res.json({ success: true, count: 0 });
  }
});

// ══════════════════════════════════════════════════════════
// REVIEW CONTROLLER
// ══════════════════════════════════════════════════════════

// GET /api/reviews/user/:userId — Get all reviews for a user
exports.getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate("reviewer", "name avatar")
    .populate("match", "title sport")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: reviews });
});

// GET /api/reviews/pending — Matches the user can still rate
exports.getPendingReviews = asyncHandler(async (req, res) => {
  const now = new Date();
  const ratingDeadlineHours = 168; // 7 days

  const matches = await Match.find({
    "participants.user": req.user._id,
    date: {
      $lt: now,
      $gte: new Date(now.getTime() - ratingDeadlineHours * 60 * 60 * 1000),
    },
  })
    .populate("participants.user", "name avatar skillLevel")
    .populate("organizer", "name avatar skillLevel")
    .lean();

  // Only matches that have actually ended (date + startTime + duration in past)
  const completedMatches = matches.filter((m) => {
    const start = new Date(m.date);
    const [hours, minutes] = (m.startTime || "00:00").split(":").map(Number);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + (m.duration || 120) * 60000);
    return end < now;
  });

  const pendingByMatch = [];
  for (const match of completedMatches) {
    const teammates = match.participants
      .map((p) => p.user)
      .filter((u) => u && u._id.toString() !== req.user._id.toString());

    const alreadyRated = await Review.find({
      reviewer: req.user._id,
      match: match._id,
    })
      .select("reviewee")
      .lean();

    const ratedIds = alreadyRated.map((r) => r.reviewee.toString());
    const unrated = teammates.filter((t) => !ratedIds.includes(t._id.toString()));

    if (unrated.length > 0) {
      pendingByMatch.push({
        match: {
          _id: match._id,
          title: match.title,
          sport: match.sport,
          date: match.date,
        },
        teammates: unrated,
      });
    }
  }

  res.json({ success: true, data: pendingByMatch });
});

// POST /api/reviews — Submit one or more ratings at once
exports.submitRatings = asyncHandler(async (req, res, next) => {
  const { matchId, ratings } = req.body;

  if (!matchId || !ratings || !Array.isArray(ratings) || ratings.length === 0) {
    return next(new AppError("Match ID and ratings array required.", 400));
  }

  const match = await Match.findById(matchId);
  if (!match) return next(new AppError("Match not found.", 404));

  const isParticipant = match.participants.some(
    (p) => p.user.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return next(new AppError("You can only rate matches you played in.", 403));
  }

  const results = { success: [], failed: [] };

  for (const r of ratings) {
    if (!r.revieweeId || !r.rating) {
      results.failed.push({ revieweeId: r.revieweeId, reason: "Missing data" });
      continue;
    }
    if (r.revieweeId === req.user._id.toString()) {
      results.failed.push({
        revieweeId: r.revieweeId,
        reason: "Cannot rate yourself",
      });
      continue;
    }

    try {
      await Review.create({
        reviewer:       req.user._id,
        reviewee:       r.revieweeId,
        match:          matchId,
        rating:         r.rating,
        comment:        r.comment || "",
        wouldPlayAgain: r.wouldPlayAgain !== false,
      });

      // Recalculate average rating for the reviewee
      if (typeof Review.recalculateRating === "function") {
        await Review.recalculateRating(r.revieweeId);
      } else {
        // Fallback if static method missing
        const allReviews = await Review.find({ reviewee: r.revieweeId });
        const avg = allReviews.reduce((s, x) => s + x.rating, 0) / allReviews.length;
        const wpa = allReviews.filter((x) => x.wouldPlayAgain).length / allReviews.length * 100;
        await User.findByIdAndUpdate(r.revieweeId, {
          averageRating: Math.round(avg * 10) / 10,
          totalReviews:  allReviews.length,
          wouldPlayAgainPercent: Math.round(wpa),
        });
      }

      // Notify the reviewee
      const notif = await Notification.create({
        recipient: r.revieweeId,
        sender:    req.user._id,
        type:      "new_review",
        title:     `New ${r.rating}★ rating`,
        message:   `${req.user.name} rated you ${r.rating} stars for "${match.title}"`,
        match:     matchId,
      });

      if (req.io) {
        emitToUser(req.io, r.revieweeId.toString(), "notification:new", notif);
      }

      results.success.push(r.revieweeId);
    } catch (err) {
      if (err.code === 11000) {
        results.failed.push({ revieweeId: r.revieweeId, reason: "Already rated" });
      } else {
        console.error("Rating submission error:", err);
        results.failed.push({ revieweeId: r.revieweeId, reason: "Server error" });
      }
    }
  }

  res.json({
    success: true,
    message: `Submitted ${results.success.length} rating(s)`,
    data: results,
  });
});

// ══════════════════════════════════════════════════════════
// REPORT CONTROLLER
// ══════════════════════════════════════════════════════════

exports.createReport = asyncHandler(async (req, res) => {
  const { reportedUserId, reportedMatchId, reason, description } = req.body;
  const report = await Report.create({
    reporter:      req.user._id,
    reportedUser:  reportedUserId,
    reportedMatch: reportedMatchId,
    reason,
    description,
  });
  res.status(201).json({ success: true, data: report });
});

// ══════════════════════════════════════════════════════════
// ADMIN CONTROLLER
// ══════════════════════════════════════════════════════════

exports.adminGetStats = asyncHandler(async (_req, res) => {
  const [users, matches, reports, activeMatches] = await Promise.all([
    User.countDocuments(),
    Match.countDocuments(),
    Report.countDocuments({ status: "pending" }),
    Match.countDocuments({ status: "open" }),
  ]);
  res.json({
    success: true,
    data: { users, matches, pendingReports: reports, activeMatches },
  });
});

exports.adminGetUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, isBanned } = req.query;
  const filter = {};
  if (search) filter.name = { $regex: search, $options: "i" };
  if (isBanned !== undefined) filter.isBanned = isBanned === "true";

  const users = await User.find(filter)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);
  res.json({ success: true, data: users, total });
});

exports.adminBanUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) return next(new AppError("User not found.", 404));

  user.isBanned = true;
  user.banReason = req.body.reason || "Violated community guidelines.";
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: "User banned." });
});

exports.adminUnbanUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) return next(new AppError("User not found.", 404));
  user.isBanned = false;
  user.banReason = undefined;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: "User unbanned." });
});

exports.adminGetReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ status: "pending" })
    .populate("reporter", "name email")
    .populate("reportedUser", "name email")
    .populate("reportedMatch", "title sport")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: reports });
});

exports.adminResolveReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.reportId);
  if (!report) return next(new AppError("Report not found.", 404));
  report.status = req.body.status || "resolved";
  report.resolvedBy = req.user._id;
  await report.save();
  res.json({ success: true });
});