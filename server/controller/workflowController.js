// controller/workflowController.js
const Workflow = require("../model/Workflow");

// Get all general (default) workflows
const getGeneralWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find({
      type: "general",
      isDefault: true,
      isActive: true,
    }).sort({ createdAt: 1 });

    res.json({ success: true, workflows });
  } catch (error) {
    console.error("Get general workflows error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user-created workflows
const getUserWorkflows = async (req, res) => {
  try {
    const { teamId } = req.query;
    const userId = req.user._id;

    let query = {
      type: "user-created",
      isActive: true,
      createdBy: userId,
    };

    if (teamId) {
      query = {
        type: "user-created",
        isActive: true,
        $or: [{ createdBy: userId }, { team: teamId }],
      };
    }

    const workflows = await Workflow.find(query)
      .populate("createdBy", "name email avatar")
      .populate("team", "name color")
      .sort({ createdAt: -1 });

    res.json({ success: true, workflows });
  } catch (error) {
    console.error("Get user workflows error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single workflow by ID
const getWorkflowById = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const userId = req.user._id;

    const workflow = await Workflow.findById(workflowId)
      .populate("createdBy", "name email avatar")
      .populate("team", "name color");

    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found" });
    }

    if (workflow.type === "user-created") {
      const hasAccess =
        workflow.createdBy._id.toString() === userId.toString() ||
        (workflow.team && req.user.teams?.includes(workflow.team));

      if (!hasAccess) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
    }

    res.json({ success: true, workflow });
  } catch (error) {
    console.error("Get workflow by ID error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createWorkflow = async (req, res) => {
  try {
    const { name, teamId, phases, defaultImage, iconColor } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Workflow name is required" });
    }

    const workflowData = {
      name: name.trim(),
      type: "user-created",
      isDefault: false,
      defaultImage: defaultImage || "/default-workflow.png",
      iconColor: iconColor || "#4F46E5",
      createdBy: req.user._id,
      phases: phases || [],
    };

    if (teamId) {
      workflowData.team = teamId;
    }

    const workflow = await Workflow.create(workflowData);

    res.status(201).json({
      success: true,
      message: "Workflow created successfully",
      workflow,
    });
  } catch (error) {
    console.error("Create workflow error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update workflow
const updateWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found" });
    }

    if (workflow.createdBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only owner can update" });
    }

    if (name) workflow.name = name.trim();

    await workflow.save();

    res.json({
      success: true,
      message: "Workflow updated successfully",
      workflow,
    });
  } catch (error) {
    console.error("Update workflow error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete workflow (soft delete)
const deleteWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const userId = req.user._id;

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found" });
    }

    if (workflow.type === "general") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete general workflows" });
    }

    if (workflow.createdBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only owner can delete" });
    }

    workflow.isActive = false;
    await workflow.save();

    res.json({ success: true, message: "Workflow deleted successfully" });
  } catch (error) {
    console.error("Delete workflow error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add phase to workflow
const addPhase = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Phase name is required" });
    }

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found" });
    }

    if (
      workflow.type === "user-created" &&
      workflow.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Only owner can add phases" });
    }

    const order = workflow.phases.length;

    const newPhase = {
      name: name.trim(),
      order,
    };

    workflow.phases.push(newPhase);
    await workflow.save();

    res.status(201).json({
      success: true,
      message: "Phase added successfully",
      phase: workflow.phases[workflow.phases.length - 1],
      totalPhases: workflow.totalPhases,
    });
  } catch (error) {
    console.error("Add phase error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update phase
const updatePhase = async (req, res) => {
  try {
    const { workflowId, phaseId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found" });
    }

    if (
      workflow.type === "user-created" &&
      workflow.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Only owner can update phases" });
    }

    const phase = workflow.phases.id(phaseId);
    if (!phase) {
      return res
        .status(404)
        .json({ success: false, message: "Phase not found" });
    }

    if (name) phase.name = name.trim();

    await workflow.save();

    res.json({ success: true, message: "Phase updated successfully", phase });
  } catch (error) {
    console.error("Update phase error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete phase
const deletePhase = async (req, res) => {
  try {
    const { workflowId, phaseId } = req.params;
    const userId = req.user._id;

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found" });
    }

    if (
      workflow.type === "user-created" &&
      workflow.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Only owner can delete phases" });
    }

    const phase = workflow.phases.id(phaseId);
    if (!phase) {
      return res
        .status(404)
        .json({ success: false, message: "Phase not found" });
    }

    phase.remove();

    workflow.phases.forEach((phase, index) => {
      phase.order = index;
    });

    await workflow.save();

    res.json({
      success: true,
      message: "Phase deleted successfully",
      phases: workflow.phases,
      totalPhases: workflow.totalPhases,
    });
  } catch (error) {
    console.error("Delete phase error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGeneralWorkflows,
  getUserWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  addPhase,
  updatePhase,
  deletePhase,
};
