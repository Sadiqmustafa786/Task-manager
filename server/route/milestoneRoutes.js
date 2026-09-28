const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getMilestonesByTask,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  toggleStarMilestone,
  pickMilestone,
  completeMilestone,
  rejectMilestone,
  rateMilestone,
  addReviewComment,
  deleteReviewComment,
} = require("../controller/milestoneController");

router.use(protect);

router.get("/task/:taskId", getMilestonesByTask);
router.post("/", createMilestone);
router.put("/:milestoneId", updateMilestone);
router.delete("/:milestoneId", deleteMilestone);
router.put("/:milestoneId/star", toggleStarMilestone);
router.put("/:milestoneId/pick", pickMilestone);
router.put("/:milestoneId/complete", completeMilestone);
router.put("/:milestoneId/reject", rejectMilestone);
router.put("/:milestoneId/rate", rateMilestone);
router.post("/:milestoneId/review", addReviewComment);
router.delete("/:milestoneId/review/:commentId", deleteReviewComment);

module.exports = router;
