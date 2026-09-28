const express = require("express");
const passport = require("passport");
const router = express.Router();
const {
  googleAuthSuccess,
  getCurrentUser,
  logout,
} = require("../controller/authcontroller");
const { protect } = require("../middleware/authMiddleware");

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleAuthSuccess,
);

// Current user route
router.get("/me", protect, getCurrentUser);

// Logout route
router.post("/logout", protect, logout);

module.exports = router;
