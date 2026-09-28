const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getGeneralWorkflows,
  getUserWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  addPhase,
  updatePhase,
  deletePhase,
} = require("../controller/workflowController");

router.use(protect);

// Workflow routes
router.get("/general", getGeneralWorkflows);
router.get("/user", getUserWorkflows);
router.get("/:workflowId", getWorkflowById);
router.post("/", createWorkflow);
router.put("/:workflowId", updateWorkflow);
router.delete("/:workflowId", deleteWorkflow);

// Phase routes
router.post("/:workflowId/phases", addPhase);
router.put("/:workflowId/phases/:phaseId", updatePhase);
router.delete("/:workflowId/phases/:phaseId", deletePhase);

module.exports = router;
