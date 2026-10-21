const express = require("express");
const router = express.Router();
const {
  createTeam,
  inviteMember,
  acceptInvitation,
  acceptInvitationAuthenticated,
  rejectInvitation,
  getUserTeams,
  getTeamById,
  updateTeamColor,
  updateTeamName,
  deleteTeam,
  getUserInvitations,
  deleteInvitation,
} = require("../controller/teamcontroller");
const { protect } = require("../middleware/authMiddleware");

// ── Public magic-link routes (no auth — user clicks from email) ──────────────
router.get("/invite/accept/:token", acceptInvitation);
router.get("/invite/reject/:token", rejectInvitation);

// ── Protected routes ─────────────────────────────────────────────────────────
router.use(protect);
router.post("/invitations/:token/accept", acceptInvitationAuthenticated);

router.get("/", getUserTeams);
router.post("/", createTeam);
router.get("/invitations", getUserInvitations);
router.get("/:teamId", getTeamById);
router.post("/:teamId/invite", inviteMember);
router.put("/:teamId/color", updateTeamColor);
router.put("/:teamId/name", updateTeamName);
router.delete("/:teamId", deleteTeam);
router.delete("/invitations/:invitationId", deleteInvitation);

module.exports = router;
