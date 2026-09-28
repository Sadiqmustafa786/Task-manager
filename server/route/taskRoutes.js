// route/taskRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getTaskFormData,
  createTask,
  getAllTasks,
  getProjectPhasesForTask,
  getTaskById,
  updateTask,
  deleteTask,
  addTaskComment,
  updateTaskStatus,
  addTaskMember,
  removeTaskMember,
  toggleStarTask,
  completeTask,
  getTodayTasks,
} = require("../controller/taskController");

router.use(protect);

router.get("/today", getTodayTasks);
router.get("/form-data", getTaskFormData);
router.post("/", createTask);
router.get("/", getAllTasks);
router.get("/project/:projectId/phases", getProjectPhasesForTask);
router.get("/:taskId", getTaskById);
router.put("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);
router.post("/:taskId/comments", addTaskComment);
router.put("/:taskId/status", updateTaskStatus);
router.post("/:taskId/members", addTaskMember);
router.delete("/:taskId/members", removeTaskMember);
router.put("/:taskId/star", toggleStarTask);
router.put("/:taskId/complete", completeTask);

module.exports = router;
