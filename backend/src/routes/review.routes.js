// const express = require("express");
// const router = express.Router();
// const { createReview, getUserReviews, createReport } = require("../controllers/misc.controller");
// const { protect } = require("../middleware/auth");
// const { createReviewValidator } = require("../validators");

// router.post("/",              protect, createReviewValidator, createReview);
// router.get("/user/:userId",                                   getUserReviews);
// router.post("/report",        protect,                        createReport);

// module.exports = router;



const express = require("express");
const router = express.Router();
const {
  getPendingReviews, submitRatings,
} = require("../controllers/misc.controller");
const { protect } = require("../middleware/auth");

router.get("/pending", protect, getPendingReviews);
router.post("/",       protect, submitRatings);

// Keep your existing review routes here (e.g. getReviewsForUser)
// router.get("/user/:userId", ...)

module.exports = router;