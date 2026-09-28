// server/route/backlogRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getBacklogs,
  getBacklogById,
  createBacklog,
  updateBacklog,
  deleteBacklog,
  bulkUpdateStatus,
  bulkDeleteBacklogs,
  addComment,
  editComment,
  deleteComment,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  getBacklogStats,
  getAllBacklogsForExport,
  getProjectTasksForBacklog,
} = require("../controller/backlogController");

router.use(protect);

// ─── Backlog Routes ──────────────────────────────────────────────────────────
router.get("/project/:projectId", getBacklogs);
router.get("/project/:projectId/export", getAllBacklogsForExport);
router.get("/project/:projectId/stats", getBacklogStats);
router.get("/project/:projectId/tasks", getProjectTasksForBacklog);
router.get("/:backlogId", getBacklogById);
router.post("/project/:projectId", createBacklog);
router.put("/:backlogId", updateBacklog);
router.delete("/:backlogId", deleteBacklog);

// ─── Bulk Operations ─────────────────────────────────────────────────────────
router.post("/bulk/status", bulkUpdateStatus);
router.post("/bulk/delete", bulkDeleteBacklogs);

// ─── Comments ─────────────────────────────────────────────────────────────────
router.post("/:backlogId/comments", addComment);
router.put("/:backlogId/comments/:commentId", editComment);
router.delete("/:backlogId/comments/:commentId", deleteComment);

// ─── Categories ──────────────────────────────────────────────────────────────
router.get("/project/:projectId/categories", getCategories);
router.post("/project/:projectId/categories", createCategory);
router.put("/categories/:categoryId", updateCategory);
router.delete("/categories/:categoryId", deleteCategory);

// ─── Labels ──────────────────────────────────────────────────────────────────
router.get("/project/:projectId/labels", getLabels);
router.post("/project/:projectId/labels", createLabel);
router.put("/labels/:labelId", updateLabel);
router.delete("/labels/:labelId", deleteLabel);

module.exports = router;
