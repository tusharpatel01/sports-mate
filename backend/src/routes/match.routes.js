const express = require("express");
const router = express.Router();
const {
  getMatches, getMatchById, createMatch, updateMatchStatus, deleteMatch,
  getMyMatches, getJoinedMatches, leaveMatch,
} = require("../controllers/match.controller");
const { protect, optionalAuth } = require("../middleware/auth");
const { createMatchValidator, updateMatchValidator } = require("../validators");

router.get("/",          optionalAuth,                    getMatches);
router.get("/my",        protect,                         getMyMatches);
router.get("/joined",    protect,                         getJoinedMatches);
router.get("/:id",       optionalAuth,                    getMatchById);
router.post("/",         protect, createMatchValidator,   createMatch);
router.put("/:id",       protect, updateMatchValidator,   updateMatchStatus);
router.delete("/:id",    protect,                         deleteMatch);
router.post("/:id/leave", protect,                        leaveMatch);

module.exports = router;
