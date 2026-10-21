// controller/projectController.js
const Project = require("../model/Project");
const Workflow = require("../model/Workflow");
const User = require("../model/User");
const Task = require("../model/Task");
const Team = require("../model/Team");

const getProjectFormData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { teamId } = req.query;

    // Get all workflows (general and user-created)
    const workflows = await Workflow.find({
      isActive: true,
      $or: [
        { type: "general", isDefault: true },
        { type: "user-created", createdBy: userId, isActive: true },
      ],
    })
      .select("_id name type defaultImage iconColor")
      .lean();

    // Get users - Modified to work with your user schema
    let users = [];

    if (teamId) {
      // If teamId is provided, get team members
      const team = await Team.findById(teamId).populate(
        "members.user",
        "_id name email avatar",
      );
      if (team && team.members) {
        const teamMembers = team.members.map((m) => m.user);
        users = await User.find({ _id: { $in: teamMembers } })
          .select("_id name email avatar")
          .lean();
      }
    } else {
      // Get all users (without isActive filter since your schema doesn't have it)
      users = await User.find({})
        .select("_id name email avatar")
        .limit(100)
        .lean();
    }

    res.json({
      success: true,
      workflows: workflows || [],
      users: users || [],
    });
  } catch (error) {
    console.error("Get project form data error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      workflows: [],
      users: [],
    });
  }
};

const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      workflowId,
      teamId,
      createdBy,
      supervisorId,
      assignedUserIds,
      startDate,
      endDate,
      isContinuous,
      priority,
      tags,
    } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Project name is required" });
    }

    if (!workflowId) {
      return res
        .status(400)
        .json({ success: false, message: "Workflow is required" });
    }

    // Get the workflow to copy its phases
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found" });
    }

    // Create phases from workflow phases - only take name and order
    const phases = workflow.phases.map((phase, index) => ({
      phaseId: phase._id,
      name: phase.name,
      order: phase.order !== undefined ? phase.order : index,
      status: "pending",
      progress: 0,
    }));

    const projectData = {
      name: name.trim(),
      description: description || "",
      workflow: workflowId,
      team: teamId || null,
      createdBy: createdBy || req.user._id,
      supervisor: supervisorId || null,
      assignedUsers: assignedUserIds || [],
      startDate: startDate || null,
      endDate: isContinuous ? null : endDate || null,
      isContinuous: isContinuous || false,
      priority: priority || "medium",
      tags: tags || [],
      phases,
      status: "planning",
      progress: 0,
    };

    const project = await Project.create(projectData);

    // Populate references for response
    const populatedProject = await Project.findById(project._id)
      .populate("workflow", "name type defaultImage iconColor")
      .populate("createdBy", "name email avatar")
      .populate("supervisor", "name email avatar")
      .populate("assignedUsers", "name email avatar")
      .populate("team", "name color");

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, priority, teamId } = req.query;

    // First, find all projects where user is directly assigned
    let directProjectsQuery = {
      isActive: true,
      $or: [
        { createdBy: userId },
        { supervisor: userId },
        { assignedUsers: userId },
      ],
    };

    if (teamId) directProjectsQuery.team = teamId;
    if (status) directProjectsQuery.status = status;
    if (priority) directProjectsQuery.priority = priority;

    let directProjects = await Project.find(directProjectsQuery)
      .populate("workflow", "name type defaultImage iconColor")
      .populate("createdBy", "name email avatar")
      .populate("supervisor", "name email avatar")
      .populate("assignedUsers", "name email avatar")
      .populate("team", "name color")
      .sort({ createdAt: -1 })
      .lean();

    // Find all tasks where user is in any RACI field
    const tasksWithUser = await Task.find({
      isActive: true,
      $or: [
        { responsible: userId },
        { accountable: userId },
        { consultant: userId },
        { informed: userId },
      ],
    })
      .select("project")
      .lean();

    // Extract unique project IDs from tasks
    const projectIdsFromTasks = [
      ...new Set(
        tasksWithUser
          .filter((task) => task.project)
          .map((task) => task.project.toString()),
      ),
    ];

    // Find additional projects that user has access to via tasks
    let additionalProjects = [];
    if (projectIdsFromTasks.length > 0) {
      const existingProjectIds = directProjects.map((p) => p._id.toString());
      const newProjectIds = projectIdsFromTasks.filter(
        (id) => !existingProjectIds.includes(id),
      );

      if (newProjectIds.length > 0) {
        let additionalQuery = {
          _id: { $in: newProjectIds },
          isActive: true,
        };

        if (teamId) additionalQuery.team = teamId;
        if (status) additionalQuery.status = status;
        if (priority) additionalQuery.priority = priority;

        additionalProjects = await Project.find(additionalQuery)
          .populate("workflow", "name type defaultImage iconColor")
          .populate("createdBy", "name email avatar")
          .populate("supervisor", "name email avatar")
          .populate("assignedUsers", "name email avatar")
          .populate("team", "name color")
          .sort({ createdAt: -1 })
          .lean();
      }
    }

    // Combine both sets of projects
    let allProjects = [...directProjects, ...additionalProjects];

    // Remove duplicates (in case a project appears in both)
    const uniqueProjects = Array.from(
      new Map(
        allProjects.map((project) => [project._id.toString(), project]),
      ).values(),
    );

    // Add isStarred flag to each project
    const projectsWithStarred = uniqueProjects.map((project) => {
      return {
        ...project,
        isStarred: project.starredBy
          ? project.starredBy.some(
              (id) => id && id.toString() === userId.toString(),
            )
          : false,
      };
    });

    res.json({
      success: true,
      projects: projectsWithStarred,
      total: projectsWithStarred.length,
    });
  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId)
      .populate("workflow", "name type defaultImage iconColor phases")
      .populate("createdBy", "name email avatar")
      .populate("supervisor", "name email avatar")
      .populate("assignedUsers", "name email avatar")
      .populate("team", "name color");

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check direct access
    let hasAccess =
      project.createdBy._id.toString() === userId.toString() ||
      (project.supervisor &&
        project.supervisor._id.toString() === userId.toString()) ||
      project.assignedUsers.some((u) => u._id.toString() === userId.toString());

    // If no direct access, check if user has access via task RACI fields
    if (!hasAccess) {
      const taskAccess = await Task.findOne({
        project: projectId,
        isActive: true,
        $or: [
          { responsible: userId },
          { accountable: userId },
          { consultant: userId },
          { informed: userId },
        ],
      });
      hasAccess = !!taskAccess;
    }

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Calculate isStarred for current user
    const isStarred = project.starredBy
      ? project.starredBy.some((id) => id.toString() === userId.toString())
      : false;

    const projectData = project.toObject();
    projectData.isStarred = isStarred;

    res.json({
      success: true,
      project: projectData,
    });
  } catch (error) {
    console.error("Get project by ID error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/projects/:projectId ────────────────────────────────────────────
// Update project
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      name,
      description,
      supervisorId,
      assignedUserIds,
      startDate,
      endDate,
      isContinuous,
      priority,
      status,
      tags,
    } = req.body;
    const userId = req.user._id;

    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check if user is creator or supervisor
    const canEdit =
      project.createdBy.toString() === userId.toString() ||
      (project.supervisor &&
        project.supervisor.toString() === userId.toString());

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Only creator or supervisor can update",
      });
    }

    // Update fields
    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (supervisorId !== undefined) project.supervisor = supervisorId;
    if (assignedUserIds) project.assignedUsers = assignedUserIds;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined && !project.isContinuous)
      project.endDate = endDate;
    if (isContinuous !== undefined) {
      project.isContinuous = isContinuous;
      if (isContinuous) project.endDate = null;
    }
    if (priority) project.priority = priority;
    if (status) project.status = status;
    if (tags) project.tags = tags;

    await project.save();

    const populatedProject = await Project.findById(projectId)
      .populate("workflow", "name type defaultImage iconColor")
      .populate("createdBy", "name email avatar")
      .populate("supervisor", "name email avatar")
      .populate("assignedUsers", "name email avatar")
      .populate("team", "name color");

    res.json({
      success: true,
      message: "Project updated successfully",
      project: populatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/projects/:projectId ─────────────────────────────────────────
// Soft delete project
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Only creator can delete
    if (project.createdBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only creator can delete project" });
    }

    project.isActive = false;
    await project.save();

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/projects/:projectId/phases/:phaseId ────────────────────────────
// Update phase status and progress
const updatePhaseStatus = async (req, res) => {
  try {
    const { projectId, phaseId } = req.params;
    const { status, progress } = req.body;
    const userId = req.user._id;

    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check access
    const hasAccess =
      project.createdBy.toString() === userId.toString() ||
      (project.supervisor &&
        project.supervisor.toString() === userId.toString()) ||
      project.assignedUsers.some((u) => u.toString() === userId.toString());

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const phase = project.phases.id(phaseId);
    if (!phase) {
      return res
        .status(404)
        .json({ success: false, message: "Phase not found" });
    }

    if (status) phase.status = status;
    if (progress !== undefined) phase.progress = progress;

    // Update overall project progress based on phases
    const totalPhases = project.phases.length;
    const completedPhases = project.phases.filter(
      (p) => p.status === "completed",
    ).length;
    const totalProgress = project.phases.reduce(
      (sum, p) => sum + (p.progress || 0),
      0,
    );

    project.progress =
      totalPhases > 0 ? Math.round(totalProgress / totalPhases) : 0;

    // Auto-update project status based on phases
    if (completedPhases === totalPhases && totalPhases > 0) {
      project.status = "completed";
    } else if (project.status !== "on-hold" && project.status !== "cancelled") {
      project.status = "in-progress";
    }

    await project.save();

    res.json({
      success: true,
      message: "Phase updated successfully",
      phase,
      project: {
        progress: project.progress,
        status: project.status,
      },
    });
  } catch (error) {
    console.error("Update phase status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/projects/:projectId/phases ─────────────────────────────────────
// Get all phases for a project
const getProjectPhases = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId).populate(
      "workflow",
      "phases",
    );

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const hasAccess =
      project.createdBy.toString() === userId.toString() ||
      (project.supervisor &&
        project.supervisor.toString() === userId.toString()) ||
      project.assignedUsers.some((u) => u.toString() === userId.toString());

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const phasesWithWorkflowInfo = project.phases.map((phase) => {
      const workflowPhase = project.workflow?.phases?.find(
        (p) => p._id.toString() === phase.phaseId?.toString(),
      );
      return {
        ...phase.toObject(),
        workflowPhaseDetails: workflowPhase || null,
      };
    });

    res.json({
      success: true,
      phases: phasesWithWorkflowInfo,
    });
  } catch (error) {
    console.error("Get project phases error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProjectColor = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { color } = req.body;
    const userId = req.user._id;

    if (!color) {
      return res
        .status(400)
        .json({ success: false, message: "Color is required" });
    }

    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      return res.status(400).json({
        success: false,
        message: "Invalid color format. Use hex color (e.g., #5A7ACD, #FFF).",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check if user is creator or supervisor
    const canEdit =
      project.createdBy.toString() === userId.toString() ||
      (project.supervisor &&
        project.supervisor.toString() === userId.toString());

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Only creator or supervisor can update project color",
      });
    }

    // Update the project's cardColor directly
    project.cardColor = color;
    await project.save();

    // Log to verify the update
    console.log(`Project ${projectId} color updated to: ${color}`);

    // Return the FULL updated project with populated references
    const updatedProject = await Project.findById(projectId)
      .populate("workflow", "name type defaultImage iconColor")
      .populate("createdBy", "name email avatar")
      .populate("supervisor", "name email avatar")
      .populate("assignedUsers", "name email avatar")
      .populate("team", "name color");

    res.json({
      success: true,
      message: "Project color updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update project color error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// controller/projectController.js - Update toggleStarProject function

const toggleStarProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check direct access
    let hasAccess =
      project.createdBy.toString() === userId.toString() ||
      (project.supervisor &&
        project.supervisor.toString() === userId.toString()) ||
      project.assignedUsers.some((u) => u.toString() === userId.toString());

    // If no direct access, check task-based access
    if (!hasAccess) {
      const taskAccess = await Task.findOne({
        project: projectId,
        isActive: true,
        $or: [
          { responsible: userId },
          { accountable: userId },
          { consultant: userId },
          { informed: userId },
        ],
      });
      hasAccess = !!taskAccess;
    }

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Initialize starredBy array if it doesn't exist
    if (!project.starredBy) {
      project.starredBy = [];
    }

    // Toggle star
    const isStarred = project.starredBy.some(
      (id) => id.toString() === userId.toString(),
    );

    if (isStarred) {
      project.starredBy = project.starredBy.filter(
        (id) => id.toString() !== userId.toString(),
      );
      await project.save();
      return res.json({
        success: true,
        message: "Project unstarred successfully",
        isStarred: false,
        projectId: project._id,
      });
    } else {
      project.starredBy.push(userId);
      await project.save();
      return res.json({
        success: true,
        message: "Project starred successfully",
        isStarred: true,
        projectId: project._id,
      });
    }
  } catch (error) {
    console.error("Toggle star project error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/projects/starred ───────────────────────────────────────────────
// Get all starred projects for the authenticated user
const getStarredProjects = async (req, res) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({
      starredBy: userId,
      isActive: true,
    })
      .populate("workflow", "name type defaultImage iconColor")
      .populate("createdBy", "name email avatar")
      .populate("supervisor", "name email avatar")
      .populate("assignedUsers", "name email avatar")
      .populate("team", "name color")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      projects,
      total: projects.length,
    });
  } catch (error) {
    console.error("Get starred projects error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const closeProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check if user has permission (creator or supervisor)
    const canClose =
      project.createdBy.toString() === userId.toString() ||
      (project.supervisor &&
        project.supervisor.toString() === userId.toString());

    if (!canClose) {
      return res.status(403).json({
        success: false,
        message: "Only creator or supervisor can close the project",
      });
    }

    // Check if project is already completed or cancelled
    if (project.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Project is already completed",
      });
    }

    if (project.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Project is already cancelled",
      });
    }

    // Close the project
    project.status = "completed";
    project.progress = 100;
    project.completedAt = new Date();

    // Mark all phases as completed
    if (project.phases && project.phases.length > 0) {
      project.phases.forEach((phase) => {
        phase.status = "completed";
        phase.progress = 100;
      });
    }

    await project.save();

    res.json({
      success: true,
      message: "Project closed successfully",
      project: {
        _id: project._id,
        status: project.status,
        progress: project.progress,
        completedAt: project.completedAt,
      },
    });
  } catch (error) {
    console.error("Close project error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
