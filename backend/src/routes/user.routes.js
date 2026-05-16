const express = require("express");
const router = express.Router();
const {
  getUserProfile, updateProfile, updateAvatar,
  getNearbyPlayers, changePassword,verifyPhone,completeOnboarding
} = require("../controllers/misc.controller");
const { protect } = require("../middleware/auth");
const { uploadAvatar } = require("../config/cloudinary");
const { updateProfileValidator } = require("../validators");
const { uploadLimiter } = require("../middleware/rateLimiter");

router.get("/nearby",           protect,                                  getNearbyPlayers);
router.get("/:id",                                                        getUserProfile);
router.put("/profile",          protect, updateProfileValidator,          updateProfile);
router.put("/avatar",           protect, uploadLimiter, uploadAvatar.single("avatar"), updateAvatar);
router.put("/change-password",  protect,                                  changePassword);
router.post("/verify-phone",     protect,                                 verifyPhone);
router.put("/onboarding",        protect,                                 completeOnboarding);

module.exports = router;
