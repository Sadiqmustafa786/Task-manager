// server/controller/backlogController.js
const mongoose = require("mongoose");
const Backlog = require("../model/Backlog");
const Category = require("../model/Category");
const Label = require("../model/Label");
const Project = require("../model/Project");
const Task = require("../model/Task");
const Milestone = require("../model/Milestone");
const User = require("../model/User");

const mapBacklogPriorityToMilestone = (priority) => {
  const map = {
    Low: "low",
    Medium: "medium",
    High: "high",
  };
  return map[priority] || "medium";
};

const createMilestoneFromBacklog = async (
  { title, description, priority, assignTo },
  task,
  userId,
) => {
  const milestoneName =
    title?.trim() || description?.trim()?.slice(0, 120) || "Backlog item";

  // Get the task to access its project
  const taskDoc = await Task.findById(task._id).populate("project");

  // Create milestone with all necessary fields
  const milestone = await Milestone.create({
    name: milestoneName,
    description: description?.trim() || "",
    task: task._id,
    project: task.project,
    createdBy: userId,
    assignedTo: assignTo || userId,
    priority: mapBacklogPriorityToMilestone(priority),
    status: "pending",
    // These fields are important for milestone management
    isActive: true,
    isStarred: false,
    progress: 0,
    // Initialize these as null
    pickedBy: null,
    pickedAt: null,
    completedAt: null,
    completedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
  });

  // Populate the milestone with user details before returning
  const populatedMilestone = await Milestone.findById(milestone._id)
    .populate("assignedTo", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("pickedBy", "name email avatar")
    .populate("completedBy", "name email avatar")
    .populate("rejectedBy", "name email avatar");

  return populatedMilestone;
};

// ─── Backlog CRUD Operations ────────────────────────────────────────────────

// Get all backlogs for a project with pagination
const getBacklogs = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      priority = "",
      category = "",
      label = "",
      assignTo = "",
      startDate = "",
      endDate = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const userId = req.user._id;

    // Check project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Build query
    const query = {
      project: projectId,
      isActive: true,
    };

    // Apply filters
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (label) query.label = label;
    if (assignTo) query.assignTo = assignTo;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const total = await Backlog.countDocuments(query);

    // Get backlogs with pagination
    const backlogs = await Backlog.find(query)
      .populate("createdBy", "name email avatar")
      .populate("assignTo", "name email avatar")
      .populate("category", "name color")
      .populate("label", "name color")
      .populate("referenceData.taskId", "name status")
      .populate("referenceData.milestoneId", "name status")
      .populate("comments.user", "name email avatar")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get summary stats
    const stats = {
      total: await Backlog.countDocuments({
        project: projectId,
        isActive: true,
      }),
      pending: await Backlog.countDocuments({
        project: projectId,
        isActive: true,
        status: { $in: ["Not started", "Assigned"] },
      }),
      inProgress: await Backlog.countDocuments({
        project: projectId,
        isActive: true,
        status: "In progress",
      }),
      completed: await Backlog.countDocuments({
        project: projectId,
        isActive: true,
        status: "Complete",
      }),
      onHold: await Backlog.countDocuments({
        project: projectId,
        isActive: true,
        status: "On hold",
      }),
    };

    res.json({
      success: true,
      data: backlogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPreviousPage: parseInt(page) > 1,
      },
      stats,
    });
  } catch (error) {
    console.error("Get backlogs error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single backlog
const getBacklogById = async (req, res) => {
  try {
    const { backlogId } = req.params;
    const userId = req.user._id;

    const backlog = await Backlog.findById(backlogId)
      .populate("createdBy", "name email avatar")
      .populate("assignTo", "name email avatar")
      .populate("category", "name color")
      .populate("label", "name color")
      .populate("referenceData.taskId", "name status")
      .populate("referenceData.milestoneId", "name status")
      .populate("comments.user", "name email avatar");

    if (!backlog) {
      return res.status(404).json({
        success: false,
        message: "Backlog not found",
      });
    }

    res.json({
      success: true,
      data: backlog,
    });
  } catch (error) {
    console.error("Get backlog error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create backlog
const createBacklog = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      priority,
      status,
      category,
      label,
      assignTo,
      attachment,
      taskId,
      referenceData,
    } = req.body;
    const userId = req.user._id;

    // Check project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    let resolvedReferenceData = referenceData || null;
    let createdMilestone = null;

    if (taskId) {
      const task = await Task.findOne({ _id: taskId, project: projectId });
      if (!task) {
        return res.status(400).json({
          success: false,
          message: "Selected task was not found in this project",
        });
      }

      // Create a milestone from the backlog data
      createdMilestone = await createMilestoneFromBacklog(
        {
          title: title || "Backlog item",
          description: description || "",
          priority: priority || "Medium",
          assignTo: assignTo || userId,
        },
        task,
        userId,
      );

      // Set reference data with milestone info
      resolvedReferenceData = {
        taskId: task._id,
        milestoneId: createdMilestone._id,
        type: "milestone",
      };

      // Auto-set status to "Assigned" if it was "Not started"
      const autoStatus =
        status === "Not started" ? "Assigned" : status || "Assigned";

      const backlog = await Backlog.create({
        project: projectId,
        createdBy: userId,
        assignTo: assignTo || null,
        title,
        description: description || "",
        priority: priority || "Medium",
        status: autoStatus,
        category: category || null,
        label: label || null,
        attachment: attachment || "",
        referenceData: resolvedReferenceData,
        // Store the milestone creation info for reference
        metadata: {
          createdFromBacklog: true,
          milestoneCreatedAt: new Date(),
        },
      });

      const populatedBacklog = await Backlog.findById(backlog._id)
        .populate("createdBy", "name email avatar")
        .populate("assignTo", "name email avatar")
        .populate("category", "name color")
        .populate("label", "name color")
        .populate("referenceData.taskId", "name status")
        .populate(
          "referenceData.milestoneId",
          "name status assignTo createdBy pickedBy completedBy rejectedBy",
        );

      return res.status(201).json({
        success: true,
        message: "Backlog created successfully with milestone linked to task",
        data: populatedBacklog,
        milestone: createdMilestone,
      });
    }

    // If no taskId provided, create backlog without milestone
    const backlog = await Backlog.create({
      project: projectId,
      createdBy: userId,
      assignTo: assignTo || null,
      title,
      description: description || "",
      priority: priority || "Medium",
      status: status || "Not started",
      category: category || null,
      label: label || null,
      attachment: attachment || "",
      referenceData: resolvedReferenceData,
    });

    const populatedBacklog = await Backlog.findById(backlog._id)
      .populate("createdBy", "name email avatar")
      .populate("assignTo", "name email avatar")
      .populate("category", "name color")
      .populate("label", "name color")
      .populate("referenceData.taskId", "name status")
      .populate(
        "referenceData.milestoneId",
        "name status assignTo createdBy pickedBy completedBy rejectedBy",
      );

    res.status(201).json({
      success: true,
      message: "Backlog created successfully",
      data: populatedBacklog,
    });
  } catch (error) {
    console.error("Create backlog error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update backlog
// Update backlog
const updateBacklog = async (req, res) => {
  try {
    const { backlogId } = req.params;
    const {
      title,
      description,
      priority,
      status,
      category,
      label,
      assignTo,
      attachment,
      taskId,
    } = req.body;
    const userId = req.user._id;

    const backlog = await Backlog.findById(backlogId);
    if (!backlog) {
      return res.status(404).json({
        success: false,
        message: "Backlog not found",
      });
    }

    // Track status change for date updates
    const oldStatus = backlog.status;

    // Update fields
    if (title) backlog.title = title;
    if (description !== undefined) backlog.description = description;
    if (priority) backlog.priority = priority;
    if (status) {
      backlog.status = status;
      // Update dates based on status
      if (status === "Assigned" && oldStatus !== "Assigned") {
        backlog.pickedDate = new Date();
      }
      if (status === "Complete" && oldStatus !== "Complete") {
        backlog.completionDate = new Date();
      }
    }
    if (category !== undefined) backlog.category = category;
    if (label !== undefined) backlog.label = label;
    if (assignTo !== undefined) backlog.assignTo = assignTo;
    if (attachment !== undefined) backlog.attachment = attachment;

    // Handle task linking with milestone creation/update
    if (taskId !== undefined) {
      if (!taskId) {
        // If unlink, we should also delete the associated milestone
        if (backlog.referenceData?.milestoneId) {
          try {
            await Milestone.findByIdAndDelete(
              backlog.referenceData.milestoneId,
            );
          } catch (err) {
            console.error("Error deleting milestone on unlink:", err);
          }
        }
        backlog.referenceData = null;
      } else {
        const task = await Task.findOne({
          _id: taskId,
          project: backlog.project,
        });

        if (!task) {
          return res.status(400).json({
            success: false,
            message: "Selected task was not found in this project",
          });
        }

        // Check if this backlog is already linked to the same task
        const alreadyLinkedToSameTask =
          backlog.referenceData?.milestoneId &&
          backlog.referenceData?.taskId?.toString() === taskId.toString();

        if (!alreadyLinkedToSameTask) {
          // If there's an existing milestone, delete it first
          if (backlog.referenceData?.milestoneId) {
            try {
              await Milestone.findByIdAndDelete(
                backlog.referenceData.milestoneId,
              );
            } catch (err) {
              console.error("Error deleting existing milestone:", err);
            }
          }

          // Create a new milestone from the backlog data
          const milestone = await createMilestoneFromBacklog(
            {
              title: backlog.title || "Backlog item",
              description: backlog.description || "",
              priority: backlog.priority || "Medium",
              assignTo: backlog.assignTo || userId,
            },
            task,
            userId,
          );

          backlog.referenceData = {
            taskId: task._id,
            milestoneId: milestone._id,
            type: "milestone",
          };

          if (backlog.status === "Not started") {
            backlog.status = "Assigned";
          }
        } else {
          // If already linked to the same task, update the milestone data
          if (backlog.referenceData?.milestoneId) {
            try {
              await Milestone.findByIdAndUpdate(
                backlog.referenceData.milestoneId,
                {
                  name: backlog.title || "Backlog item",
                  description: backlog.description || "",
                  priority: mapBacklogPriorityToMilestone(
                    backlog.priority || "Medium",
                  ),
                  assignedTo: backlog.assignTo || userId,
                },
              );
            } catch (err) {
              console.error("Error updating milestone:", err);
            }
          }

          backlog.referenceData = {
            taskId: task._id,
            milestoneId: backlog.referenceData.milestoneId,
            type: "milestone",
          };
        }
      }
    }

    await backlog.save();

    const populatedBacklog = await Backlog.findById(backlogId)
      .populate("createdBy", "name email avatar")
      .populate("assignTo", "name email avatar")
      .populate("category", "name color")
      .populate("label", "name color")
      .populate("referenceData.taskId", "name status")
      .populate(
        "referenceData.milestoneId",
        "name status assignTo createdBy pickedBy completedBy rejectedBy",
      )
      .populate("comments.user", "name email avatar");

    res.json({
      success: true,
      message: "Backlog updated successfully",
      data: populatedBacklog,
    });
  } catch (error) {
    console.error("Update backlog error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete backlog (soft delete)
// Delete backlog (soft delete)
const deleteBacklog = async (req, res) => {
  try {
    const { backlogId } = req.params;
    const userId = req.user._id;

    const backlog = await Backlog.findById(backlogId);
    if (!backlog) {
      return res.status(404).json({
        success: false,
        message: "Backlog not found",
      });
    }

    if (backlog.referenceData?.milestoneId) {
      try {
        await Milestone.findByIdAndDelete(backlog.referenceData.milestoneId);
      } catch (err) {
        console.error("Error deleting associated milestone:", err);
        // Continue with backlog deletion even if milestone deletion fails
      }
    }

    backlog.isActive = false;
    await backlog.save();

    res.json({
      success: true,
      message: "Backlog deleted successfully",
    });
  } catch (error) {
    console.error("Delete backlog error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Bulk Operations ──────────────────────────────────────────────────────────

// Bulk update status
const bulkUpdateStatus = async (req, res) => {
  try {
    const { backlogIds, status } = req.body;
    const userId = req.user._id;

    if (!backlogIds || !backlogIds.length) {
      return res.status(400).json({
        success: false,
        message: "Backlog IDs are required",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const result = await Backlog.updateMany(
      { _id: { $in: backlogIds }, isActive: true },
      { status },
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} backlogs updated successfully`,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Bulk update status error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Bulk delete
const bulkDeleteBacklogs = async (req, res) => {
  try {
    const { backlogIds } = req.body;
    const userId = req.user._id;

    if (!backlogIds || !backlogIds.length) {
      return res.status(400).json({
        success: false,
        message: "Backlog IDs are required",
      });
    }

    const result = await Backlog.updateMany(
      { _id: { $in: backlogIds }, isActive: true },
      { isActive: false },
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} backlogs deleted successfully`,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Comments ──────────────────────────────────────────────────────────────────

// Add comment to backlog
const addComment = async (req, res) => {
  try {
    const { backlogId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const backlog = await Backlog.findById(backlogId);
    if (!backlog) {
      return res.status(404).json({
        success: false,
        message: "Backlog not found",
      });
    }

    backlog.comments.push({
      user: userId,
      text: text.trim(),
    });

    await backlog.save();

    const updatedBacklog = await Backlog.findById(backlogId)
      .populate("comments.user", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("assignTo", "name email avatar")
      .populate("category", "name color")
      .populate("label", "name color");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: updatedBacklog,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Edit comment
const editComment = async (req, res) => {
  try {
    const { backlogId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const backlog = await Backlog.findById(backlogId);
    if (!backlog) {
      return res.status(404).json({
        success: false,
        message: "Backlog not found",
      });
    }

    const comment = backlog.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments",
      });
    }

    comment.text = text.trim();
    await backlog.save();

    const updatedBacklog = await Backlog.findById(backlogId)
      .populate("comments.user", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("assignTo", "name email avatar")
      .populate("category", "name color")
      .populate("label", "name color");

    res.json({
      success: true,
      message: "Comment updated successfully",
      data: updatedBacklog,
    });
  } catch (error) {
    console.error("Edit comment error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const { backlogId, commentId } = req.params;
    const userId = req.user._id;

    const backlog = await Backlog.findById(backlogId);
    if (!backlog) {
      return res.status(404).json({
        success: false,
        message: "Backlog not found",
      });
    }

    const comment = backlog.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    backlog.comments.pull(commentId);
    await backlog.save();

    const updatedBacklog = await Backlog.findById(backlogId)
      .populate("comments.user", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("assignTo", "name email avatar")
      .populate("category", "name color")
      .populate("label", "name color");

    res.json({
      success: true,
      message: "Comment deleted successfully",
      data: updatedBacklog,
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Category Operations ──────────────────────────────────────────────────────

// Get categories for a project
const getCategories = async (req, res) => {
  try {
    const { projectId } = req.params;

    const categories = await Category.find({
      project: projectId,
      isActive: true,
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check if category already exists for this project
    const existing = await Category.findOne({
      project: projectId,
      name: name.trim(),
      isActive: true,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category already exists in this project",
      });
    }

    const category = await Category.create({
      project: projectId,
      name: name.trim(),
      color: color || "#6B7280",
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, color } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name) category.name = name.trim();
    if (color) category.color = color;

    await category.save();

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.isActive = false;
    await category.save();

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Label Operations ─────────────────────────────────────────────────────────

// Get labels for a project
const getLabels = async (req, res) => {
  try {
    const { projectId } = req.params;

    const labels = await Label.find({
      project: projectId,
      isActive: true,
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: labels,
    });
  } catch (error) {
    console.error("Get labels error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create label
const createLabel = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Label name is required",
      });
    }

    // Check if label already exists for this project
    const existing = await Label.findOne({
      project: projectId,
      name: name.trim(),
      isActive: true,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Label already exists in this project",
      });
    }

    const label = await Label.create({
      project: projectId,
      name: name.trim(),
      color: color || "#6B7280",
    });

    res.status(201).json({
      success: true,
      message: "Label created successfully",
      data: label,
    });
  } catch (error) {
    console.error("Create label error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update label
const updateLabel = async (req, res) => {
  try {
    const { labelId } = req.params;
    const { name, color } = req.body;

    const label = await Label.findById(labelId);
    if (!label) {
      return res.status(404).json({
        success: false,
        message: "Label not found",
      });
    }

    if (name) label.name = name.trim();
    if (color) label.color = color;

    await label.save();

    res.json({
      success: true,
      message: "Label updated successfully",
      data: label,
    });
  } catch (error) {
    console.error("Update label error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete label
const deleteLabel = async (req, res) => {
  try {
    const { labelId } = req.params;

    const label = await Label.findById(labelId);
    if (!label) {
      return res.status(404).json({
        success: false,
        message: "Label not found",
      });
    }

    label.isActive = false;
    await label.save();

    res.json({
      success: true,
      message: "Label deleted successfully",
    });
  } catch (error) {
    console.error("Delete label error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Tasks (for linking) ───────────────────────────────────────────────────────

// Get tasks for a project, used to populate the "link to existing task" dropdown
const getProjectTasksForBacklog = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const tasks = await Task.find({ project: projectId })
      .select("name status")
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get project tasks error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Stats ─────────────────────────────────────────────────────────────────────

// Get backlog stats
const getBacklogStats = async (req, res) => {
  try {
    const { projectId } = req.params;

    const stats = {
      total: await Backlog.countDocuments({
        project: projectId,
        isActive: true,
      }),
      pending: await Backlog.countDocuments({
        project: projectId,
        isActive: true,
        status: { $in: ["Not started", "Assigned"] },
      }),
      inProgress: await Backlog.countDocuments({
        project: projectId,
        isActive: true,
        status: "In progress",
      }),
      completed: await Backlog.countDocuments({
        project: projectId,
        isActive: true,
        status: "Complete",
      }),
      onHold: await Backlog.countDocuments({
        project: projectId,
        isActive: true,
        status: "On hold",
      }),
    };

    // Get weekly insights (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyData = await Backlog.aggregate([
      {
        $match: {
          project: new mongoose.Types.ObjectId(projectId),
          isActive: true,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: "$createdAt" },
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json({
      success: true,
      data: {
        stats,
        weeklyInsights: weeklyData,
      },
    });
  } catch (error) {
    console.error("Get backlog stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Export ────────────────────────────────────────────────────────────────────

// Get all backlogs for export (without pagination)
const getAllBacklogsForExport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, category, label } = req.query;

    const query = { project: projectId, isActive: true };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (label) query.label = label;

    const backlogs = await Backlog.find(query)
      .populate("createdBy", "name email")
      .populate("assignTo", "name email")
      .populate("category", "name")
      .populate("label", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: backlogs,
    });
  } catch (error) {
    console.error("Export backlogs error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
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
  getProjectTasksForBacklog,
  getBacklogStats,
  getAllBacklogsForExport,
};
