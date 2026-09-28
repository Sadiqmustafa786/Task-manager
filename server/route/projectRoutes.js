// route/projectRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getProjectFormData,
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updatePhaseStatus,
  getProjectPhases,
  updateProjectColor,
  toggleStarProject,
  getStarredProjects,
  closeProject,
} = require("../controller/projectController");

router.use(protect);

// IMPORTANT: Specific/static routes MUST come before dynamic routes (with :projectId)

// Static routes
router.get("/form-data", getProjectFormData);
router.get("/starred", getStarredProjects); // This must come before /:projectId
router.post("/", createProject);
router.get("/", getAllProjects);

// Dynamic routes (with :projectId) - MUST come AFTER static routes
router.get("/:projectId", getProjectById);
router.put("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);
router.put("/:projectId/color", updateProjectColor);
router.put("/:projectId/star", toggleStarProject);
router.get("/:projectId/phases", getProjectPhases);
router.put("/:projectId/phases/:phaseId", updatePhaseStatus);
router.put("/:projectId/close", closeProject);

module.exports = router;
