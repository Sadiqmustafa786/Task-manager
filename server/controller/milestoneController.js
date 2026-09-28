const Milestone = require("../model/Milestone");
const Task = require("../model/Task");
const Project = require("../model/Project");
const { sendMilestoneAssignedEmail } = require("../services/email.service");
const User = require("../model/User");

const populateMilestone = (query) =>
  query
    .populate("assignedTo", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("pickedBy", "name email avatar")
    .populate("completedBy", "name email avatar")
    .populate("rejectedBy", "name email avatar")
    .populate("ratedBy", "name email avatar")
    .populate("reviewComments.user", "name email avatar")
    .populate("comments.user", "name email avatar");

const getMilestonesByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Check if user has access to this task
    const hasAccess = await checkTaskAccess(userId, task);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const milestones = await populateMilestone(
      Milestone.find({ task: taskId, isActive: true }),
    ).sort({ order: 1, createdAt: -1 });

    res.json({ success: true, milestones });
  } catch (error) {
    console.error("Get milestones error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createMilestone = async (req, res) => {
  try {
    const {
      name,
      description,
      taskId,
      assignedTo,
      priority,
      startDate,
      endDate,
    } = req.body;
    const userId = req.user._id;

    const task = await Task.findById(taskId)
      .populate("assignedBy", "name email")
      .populate("project", "name");

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    const canCreate = project.createdBy.toString() === userId.toString();

    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: "Only project creator can create milestones",
      });
    }

    // Get the user being assigned (if any)
    let assignedUser = null;
    if (assignedTo) {
      assignedUser = await User.findById(assignedTo).select("name email");
    }

    const milestone = await Milestone.create({
      name,
      description: description || "",
      task: taskId,
      project: task.project,
      createdBy: userId,
      assignedTo: assignedTo || null,
      priority: priority || "medium",
      startDate: startDate || null,
      endDate: endDate || null,
      status: "pending",
    });

    const populatedMilestone = await Milestone.findById(milestone._id)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("pickedBy", "name email avatar");

    if (assignedUser && assignedUser.email) {
      try {
        // const {
        //   sendMilestoneAssignedEmail,
        // } = require("../services/email.service");
        const assignedByName = await User.findById(userId).select("name");
        const taskUrl = `${process.env.CLIENT_URL}/tasks/${taskId}?milestone=${milestone._id}`;

        await sendMilestoneAssignedEmail({
          toEmail: assignedUser.email,
          memberName: assignedUser.name || "Team Member",
          milestoneName: milestone.name,
          taskName: task.name,
          projectName: task.project.name || "Unknown Project",
          assignedByName: assignedByName?.name || "A team member",
          milestoneUrl: milestoneUrl,
          priority: milestone.priority,
          dueDate: milestone.endDate,
        });
        console.log(
          `Email notification sent to ${assignedUser.email} for milestone assignment`,
        );
      } catch (emailError) {
        console.error("Failed to send milestone assignment email:", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({ success: true, milestone: populatedMilestone });
  } catch (error) {
    console.error("Create milestone error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// controller/milestoneController.js - Update updateMilestone function

const updateMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { name, description, assignedTo, priority, startDate, endDate } =
      req.body;
    const userId = req.user._id;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    }

    const project = await Project.findById(milestone.project);
    const canEdit = project.createdBy.toString() === userId.toString();

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Only project creator can edit milestones",
      });
    }

    // Check if assignedTo is changing
    const isAssignedToChanging =
      assignedTo !== undefined &&
      milestone.assignedTo?.toString() !== assignedTo;

    // Get old assigned user for comparison
    let oldAssignedUser = null;
    if (isAssignedToChanging && milestone.assignedTo) {
      oldAssignedUser = await User.findById(milestone.assignedTo).select(
        "name email",
      );
    }

    // Get new assigned user
    let newAssignedUser = null;
    if (isAssignedToChanging && assignedTo) {
      newAssignedUser = await User.findById(assignedTo).select("name email");
    }

    // Update fields
    if (name) milestone.name = name;
    if (description !== undefined) milestone.description = description;
    if (assignedTo !== undefined) milestone.assignedTo = assignedTo;
    if (priority) milestone.priority = priority;
    if (startDate !== undefined) milestone.startDate = startDate;
    if (endDate !== undefined) milestone.endDate = endDate;

    await milestone.save();

    // Send email notification if assignedTo changed
    if (isAssignedToChanging && newAssignedUser && newAssignedUser.email) {
      try {
        const assignedByName = await User.findById(userId).select("name");
        const task = await Task.findById(milestone.task).populate(
          "project",
          "name",
        );
        const taskUrl = `${process.env.CLIENT_URL}/tasks/${milestone.task}?`;

        await sendMilestoneAssignedEmail({
          toEmail: newAssignedUser.email,
          memberName: newAssignedUser.name || "Team Member",
          milestoneName: milestone.name,
          taskName: task?.name || "Unknown Task",
          projectName: task?.project?.name || "Unknown Project",
          assignedByName: assignedByName?.name || "A team member",
          milestoneUrl: taskUrl,
          priority: milestone.priority,
          dueDate: milestone.endDate,
        });
        console.log(
          `Email notification sent to ${newAssignedUser.email} for milestone assignment update`,
        );
      } catch (emailError) {
        console.error("Failed to send milestone assignment email:", emailError);
      }
    }

    const populatedMilestone = await Milestone.findById(milestoneId)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("pickedBy", "name email avatar");

    res.json({ success: true, milestone: populatedMilestone });
  } catch (error) {
    console.error("Update milestone error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const userId = req.user._id;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    }

    const project = await Project.findById(milestone.project);
    const canDelete = project.createdBy.toString() === userId.toString();

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "Only project creator can delete milestones",
      });
    }

    milestone.isActive = false;
    await milestone.save();

    res.json({ success: true, message: "Milestone deleted successfully" });
  } catch (error) {
    console.error("Delete milestone error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleStarMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const userId = req.user._id;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    }

    // Check if user has access
    const task = await Task.findById(milestone.task);
    const hasAccess = await checkTaskAccess(userId, task);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    milestone.isStarred = !milestone.isStarred;
    await milestone.save();

    const populatedMilestone = await Milestone.findById(milestoneId)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("pickedBy", "name email avatar");

    res.json({ success: true, milestone: populatedMilestone });
  } catch (error) {
    console.error("Toggle star error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// controller/milestoneController.js - Add rejectMilestone function

const rejectMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user._id;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    }

    // Check if user is project creator or supervisor
    const project = await Project.findById(milestone.project);
    const canReject =
      project.createdBy.toString() === userId.toString() ||
      (project.supervisor &&
        project.supervisor.toString() === userId.toString());

    if (!canReject) {
      return res.status(403).json({
        success: false,
        message: "Only project creator or supervisor can reject milestones",
      });
    }

    if (milestone.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed milestones can be rejected",
      });
    }

    // Reject the milestone - reset to pending state
    milestone.status = "pending";
    milestone.pickedBy = null;
    milestone.pickedAt = null;
    milestone.completedAt = null;
    milestone.completedBy = null;
    milestone.rejectedAt = new Date();
    milestone.rejectedBy = userId;
    milestone.rejectionReason = rejectionReason || "No reason provided";
    milestone.progress = 0;

    await milestone.save();

    const populatedMilestone = await Milestone.findById(milestoneId)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("pickedBy", "name email avatar")
      .populate("rejectedBy", "name email avatar");

    res.json({ success: true, milestone: populatedMilestone });
  } catch (error) {
    console.error("Reject milestone error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Also update completeMilestone to track who completed it
const completeMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const userId = req.user._id;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    }

    // Only the user who picked the milestone can complete it
    if (
      !milestone.pickedBy ||
      milestone.pickedBy.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the user who picked this milestone can complete it",
      });
    }

    if (milestone.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Milestone already completed",
      });
    }

    const populatedMilestone = await populateMilestone(
      Milestone.findByIdAndUpdate(
        milestoneId,
        {
          status: "completed",
          completedAt: new Date(),
          completedBy: userId,
          progress: 100,
          starRating: null,
          ratedBy: null,
          ratedAt: null,
        },
        { new: true },
      ),
    );

    res.json({ success: true, milestone: populatedMilestone });
  } catch (error) {
    console.error("Complete milestone error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update pickMilestone to allow picking after rejection
const pickMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const userId = req.user._id;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    }

    // Check if user is a task member
    const task = await Task.findById(milestone.task);
    const isTaskMember = await checkTaskMember(userId, task);

    if (!isTaskMember) {
      return res.status(403).json({
        success: false,
        message: "Only task members can pick milestones",
      });
    }

    // Allow picking if not picked OR if rejected (pickedBy is null after rejection)
    if (milestone.pickedBy && milestone.status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Milestone already picked by another user",
      });
    }

    if (milestone.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot pick a completed milestone",
      });
    }

    milestone.pickedBy = userId;
    milestone.pickedAt = new Date();
    milestone.status = "in-progress";
    milestone.rejectedAt = null;
    milestone.rejectedBy = null;
    milestone.rejectionReason = "";
    await milestone.save();

    const populatedMilestone = await Milestone.findById(milestoneId)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("pickedBy", "name email avatar")
      .populate("rejectedBy", "name email avatar");

    res.json({ success: true, milestone: populatedMilestone });
  } catch (error) {
    console.error("Pick milestone error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper functions
async function checkTaskAccess(userId, task) {
  if (!task) return false;

  const userIdStr = userId.toString();

  const hasTaskAccess =
    task.assignedTo?.toString() === userIdStr ||
    task.assignedBy?.toString() === userIdStr ||
    task.responsible?.some((id) => id.toString() === userIdStr) ||
    task.accountable?.some((id) => id.toString() === userIdStr) ||
    task.consultant?.some((id) => id.toString() === userIdStr) ||
    task.informed?.some((id) => id.toString() === userIdStr);

  if (hasTaskAccess) return true;

  const project = await Project.findById(task.project).select(
    "createdBy supervisor",
  );
  if (!project) return false;

  return (
    project.createdBy?.toString() === userIdStr ||
    (project.supervisor &&
      project.supervisor.toString() === userIdStr)
  );
}

async function checkTaskMember(userId, task) {
  if (!task) return false;

  const userIdStr = userId.toString();
  return (
    task.responsible?.some((id) => id.toString() === userIdStr) ||
    task.accountable?.some((id) => id.toString() === userIdStr) ||
    task.consultant?.some((id) => id.toString() === userIdStr) ||
    task.informed?.some((id) => id.toString() === userIdStr)
  );
}

const rateMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { rating } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    }

    // Only allow rating if milestone is completed
    if (milestone.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed milestones can be rated",
      });
    }

    // Check if user is project creator or supervisor
    const project = await Project.findById(milestone.project);
    const isAuthorized =
      project.createdBy.toString() === userId.toString() ||
      (project.supervisor &&
        project.supervisor.toString() === userId.toString());

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Only project creator or supervisor can rate milestones",
      });
    }

    milestone.starRating = rating;
    milestone.ratedBy = userId;
    milestone.ratedAt = new Date();
    await milestone.save();

    const populatedMilestone = await populateMilestone(
      Milestone.findById(milestoneId),
    );

    res.json({
      success: true,
      message: "Star rating added successfully",
      milestone: populatedMilestone,
    });
  } catch (error) {
    console.error("Rate milestone error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add review comment to completed milestone
const addReviewComment = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Review comment text is required",
      });
    }

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    }

    // Only allow review comments if milestone is completed
    if (milestone.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed milestones can receive review comments",
      });
    }

    // Check if user is project creator or supervisor
    const project = await Project.findById(milestone.project);
    const isAuthorized =
      project.createdBy.toString() === userId.toString() ||
      (project.supervisor &&
        project.supervisor.toString() === userId.toString());

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Only project creator or supervisor can add review comments",
      });
    }

    milestone.reviewComments.push({
      user: userId,
      text: text.trim(),
      createdAt: new Date(),
      isReview: true,
    });

    await milestone.save();

    const populatedMilestone = await populateMilestone(
      Milestone.findById(milestoneId),
    );

    res.json({
      success: true,
      message: "Review comment added successfully",
      milestone: populatedMilestone,
    });
  } catch (error) {
    console.error("Add review comment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete review comment
const deleteReviewComment = async (req, res) => {
  try {
    const { milestoneId, commentId } = req.params;
    const userId = req.user._id;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    }

    const comment = milestone.reviewComments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Review comment not found",
      });
    }

    // Only the comment author or project creator/supervisor can delete
    const project = await Project.findById(milestone.project);
    const isAuthorized =
      comment.user.toString() === userId.toString() ||
      project.createdBy.toString() === userId.toString() ||
      (project.supervisor &&
        project.supervisor.toString() === userId.toString());

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this comment",
      });
    }

    milestone.reviewComments.pull(commentId);
    await milestone.save();

    const populatedMilestone = await populateMilestone(
      Milestone.findById(milestoneId),
    );

    res.json({
      success: true,
      message: "Review comment deleted successfully",
      milestone: populatedMilestone,
    });
  } catch (error) {
    console.error("Delete review comment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
