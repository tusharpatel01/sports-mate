// const mongoose = require("mongoose");

// const reviewSchema = new mongoose.Schema(
//   {
//     reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
//     reviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
//     match:    { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
//     rating:   { type: Number, required: true, min: 1, max: 5 },
//     comment:  { type: String, maxlength: 300 },
//   },
//   { timestamps: true }
// );

// reviewSchema.index({ reviewee: 1 });
// reviewSchema.index({ reviewer: 1, match: 1, reviewee: 1 }, { unique: true });

// module.exports = mongoose.model("Review", reviewSchema);


const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewer:    { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    reviewee:    { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    match:       { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    rating:      { type: Number, required: true, min: 1, max: 5 },
    comment:     { type: String, maxlength: 300 },
    wouldPlayAgain: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One review per (reviewer, reviewee, match) combo
reviewSchema.index({ reviewer: 1, reviewee: 1, match: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ match: 1 });

// Static method to recalculate a user's average rating after a new review
reviewSchema.statics.recalculateRating = async function (userId) {
  const stats = await this.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$reviewee",
        averageRating: { $avg: "$rating" },
        totalReviews:  { $sum: 1 },
        wouldPlayAgainPercent: {
          $avg: { $cond: [{ $eq: ["$wouldPlayAgain", true] }, 100, 0] },
        },
      },
    },
  ]);

  const User = mongoose.model("User");
  if (stats.length > 0) {
    await User.findByIdAndUpdate(userId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews:  stats[0].totalReviews,
      wouldPlayAgainPercent: Math.round(stats[0].wouldPlayAgainPercent),
    });
  }
};

module.exports = mongoose.model("Review", reviewSchema);