const Project = require("../model/Project");
const Team = require("../model/Team");
const User = require("../model/User");
const Task = require("../model/Task");
const Workflow = require("../model/Workflow");
const { sendTaskMemberAddedEmail } = require("../services/email.service");

const getTaskFormData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId, teamId } = req.query;

    let users = await User.find({}).select("_id name email avatar").lean();

    if (projectId) {
      const project = await Project.findById(projectId)
        .populate("createdBy", "_id name email avatar")
        .populate("supervisor", "_id name email avatar")
        .populate("assignedUsers", "_id name email avatar");

      if (project) {
        const projectMembersSet = new Set();
        const projectMembers = [];

        if (project.createdBy) {
          const creatorId = project.createdBy._id.toString();
          if (!projectMembersSet.has(creatorId)) {
            projectMembersSet.add(creatorId);
            projectMembers.push(project.createdBy);
          }
        }

        if (project.supervisor) {
          const supervisorId = project.supervisor._id.toString();
          if (!projectMembersSet.has(supervisorId)) {
            projectMembersSet.add(supervisorId);
            projectMembers.push(project.supervisor);
          }
        }

        if (project.assignedUsers && project.assignedUsers.length > 0) {
          project.assignedUsers.forEach((user) => {
            const userIdStr = user._id.toString();
            if (!projectMembersSet.has(userIdStr)) {
              projectMembersSet.add(userIdStr);
              projectMembers.push(user);
            }
          });
        }

        const allUsersMap = new Map();

        users.forEach((user) => {
          allUsersMap.set(user._id.toString(), user);
        });

        projectMembers.forEach((member) => {
          allUsersMap.set(member._id.toString(), member);
        });

        users = Array.from(allUsersMap.values());
      }
    }

    // Get all teams - remove isActive filter since it might not exist
    let teams = await Team.find({}).select("_id name color description").lean();

    console.log(`Found ${teams.length} teams`); // Debug log

    res.json({
      success: true,
      users: users || [],
      teams: teams || [],
    });
  } catch (error) {
    console.error("Get task form data error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      users: [],
      teams: [],
    });
  }
};

const getProjectPhasesForTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId)
      .populate("workflow", "name")
      .select("phases name");

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

    // Format phases for dropdown
    const phases = project.phases.map((phase) => ({
      _id: phase._id,
      name: phase.name,
      order: phase.order,
      status: phase.status,
    }));

    res.json({
      success: true,
      phases: phases.sort((a, b) => a.order - b.order),
      projectName: project.name,
    });
  } catch (error) {
    console.error("Get project phases error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const {
      name,
      description,
      projectId,
      phaseId,
      responsible,
      accountable,
      consultant,
      informed,
      teamId,
      priority,
      startDate,
      endDate,
    } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Task name is required" });
    }

    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, message: "Project is required" });
    }

    if (!phaseId) {
      return res
        .status(400)
        .json({ success: false, message: "Phase is required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const phaseExists = project.phases.some(
      (p) => p._id.toString() === phaseId,
    );
    if (!phaseExists) {
      return res
        .status(404)
        .json({ success: false, message: "Phase not found in project" });
    }

    const taskData = {
      name: name.trim(),
      description: description || "",
      project: projectId,
      phase: phaseId,
      assignedBy: req.user._id,
      team: teamId || null,
      priority: priority || "medium",
      startDate: startDate || null,
      dueDate: endDate || null,
      status: "pending",

      responsible: responsible || [],
      accountable: accountable || [],
      consultant: consultant || [],
      informed: informed || [],
    };

    const task = await Task.create(taskData);

    const taskMembers = [
      ...(responsible || []),
      ...(accountable || []),
      ...(consultant || []),
      ...(informed || []),
    ];

    const uniqueUserIds = [...new Set(taskMembers.map((id) => id.toString()))];

    if (uniqueUserIds.length > 0) {
      await Project.findByIdAndUpdate(
        projectId,
        {
          $addToSet: {
            assignedUsers: { $each: uniqueUserIds },
          },
        },
        { new: true },
      );
    }

    const populatedTask = await Task.findById(task._id)
      .populate("responsible", "name email avatar")
      .populate("accountable", "name email avatar")
      .populate("consultant", "name email avatar")
      .populate("informed", "name email avatar")
      .populate("assignedBy", "name email avatar")
      .populate("team", "name color")
      .populate("project", "name")
      .lean();

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTodayTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const tasks = await Task.find({
      $or: [
        { assignedTo: userId },
        { assignedBy: userId },
        { responsible: userId },
        { accountable: userId },
        { consultant: userId },
        { informed: userId },
      ],
      dueDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $ne: "completed" },
    })
      .populate("assignedTo", "name email avatar")
      .populate("assignedBy", "name email avatar")
      .populate("responsible", "name email avatar")
      .populate("accountable", "name email avatar")
      .populate("consultant", "name email avatar")
      .populate("informed", "name email avatar")
      .populate("team", "name color")
      .populate("project", "name")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Get today tasks error:", error);
    res.status(500).json({ success: false, message: error.message, tasks: [] });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, priority, projectId, assignedTo } = req.query;

    let query = {
      $or: [
        { assignedTo: userId },
        { assignedBy: userId },
        { responsible: userId },
        { accountable: userId },
        { consultant: userId },
        { informed: userId },
      ],
    };

    if (projectId) query.project = projectId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email avatar")
      .populate("assignedBy", "name email avatar")
      .populate("responsible", "name email avatar")
      .populate("accountable", "name email avatar")
      .populate("consultant", "name email avatar")
      .populate("informed", "name email avatar")
      .populate("team", "name color")
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Add isStarred flag to each task
    const userIdStr = userId.toString();
    const tasksWithStarred = tasks.map((task) => ({
      ...task,
      isStarred: task.starredBy
        ? task.starredBy.some((id) => id.toString() === userIdStr)
        : false,
    }));

    res.json({
      success: true,
      tasks: tasksWithStarred,
      total: tasksWithStarred.length,
    });
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId)
      .populate("assignedTo", "name email avatar")
      .populate("assignedBy", "name email avatar")
      .populate("responsible", "name email avatar")
      .populate("accountable", "name email avatar")
      .populate("consultant", "name email avatar")
      .populate("informed", "name email avatar")
      .populate("team", "name color")
      .populate("project", "name workflow")
      .populate("comments.user", "name email avatar")
      .lean();

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const userIdStr = userId.toString();

    // REMOVE THIS LINE - it's causing the error
    // const tasksWithStarred = tasks.map((task) => ({
    //   ...task,
    //   isStarred: task.starredBy
    //     ? task.starredBy.some((id) => id.toString() === userIdStr)
    //     : false,
    // }));

    const hasAccess =
      task.assignedTo?._id?.toString() === userIdStr ||
      task.assignedBy?._id?.toString() === userIdStr ||
      task.responsible?.some((u) => u._id?.toString() === userIdStr) ||
      task.accountable?.some((u) => u._id?.toString() === userIdStr) ||
      task.consultant?.some((u) => u._id?.toString() === userIdStr) ||
      task.informed?.some((u) => u._id?.toString() === userIdStr);

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Calculate isStarred flag
    const isStarred = task.starredBy
      ? task.starredBy.some((id) => id.toString() === userIdStr)
      : false;

    // Add isStarred to the task object
    task.isStarred = isStarred;

    res.json({ success: true, task });
  } catch (error) {
    console.error("Get task by ID error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      name,
      description,
      assignedTo,
      teamId,
      priority,
      status,
      startDate,
      dueDate,
      estimatedHours,
      actualHours,
      labels,
      responsible,
      accountable,
      consultant,
      informed,
    } = req.body;
    const userId = req.user._id;

    const task = await Task.findById(taskId);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const canEdit =
      task.assignedTo?.toString() === userId.toString() ||
      task.assignedBy.toString() === userId.toString();

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Only assigned user or creator can update",
      });
    }

    if (name) task.name = name.trim();
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (teamId !== undefined) task.team = teamId;
    if (priority) task.priority = priority;
    if (status) {
      task.status = status;
      if (status === "completed") {
        task.completedAt = new Date();
      }
    }
    if (startDate !== undefined) task.startDate = startDate;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (labels) task.labels = labels;

    if (responsible !== undefined) task.responsible = responsible;
    if (accountable !== undefined) task.accountable = accountable;
    if (consultant !== undefined) task.consultant = consultant;
    if (informed !== undefined) task.informed = informed;

    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email avatar")
      .populate("assignedBy", "name email avatar")
      .populate("responsible", "name email avatar")
      .populate("accountable", "name email avatar")
      .populate("consultant", "name email avatar")
      .populate("informed", "name email avatar")
      .populate("team", "name color")
      .populate("project", "name")
      .lean();

    res.json({
      success: true,
      message: "Task updated successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    if (task.assignedBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only creator can delete task" });
    }

    task.isActive = false;
    await task.save();

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addTaskComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const comment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date(),
    };

    task.comments.push(comment);
    await task.save();

    const user = await User.findById(userId).select("name email avatar");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: {
        ...comment,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const canEdit =
      task.assignedTo?.toString() === userId.toString() ||
      task.assignedBy.toString() === userId.toString();

    if (!canEdit) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    task.status = status;
    if (status === "completed") {
      task.completedAt = new Date();
    }
    await task.save();

    res.json({
      success: true,
      message: "Task status updated successfully",
      task: {
        _id: task._id,
        status: task.status,
        completedAt: task.completedAt,
      },
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addTaskMember = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, role } = req.body;
    const currentUserId = req.user._id;

    // Validate role
    const validRoles = ["responsible", "accountable", "consultant", "informed"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    const canEdit =
      task.assignedBy.toString() === currentUserId.toString() ||
      (project &&
        project.supervisor &&
        project.supervisor.toString() === currentUserId.toString()) ||
      (project && project.createdBy.toString() === currentUserId.toString());

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message:
          "Only task creator, project creator, or project supervisor can add members",
      });
    }

    if (task[role].includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User already assigned to this role",
      });
    }

    task[role].push(userId);
    await task.save();

    if (project && !project.assignedUsers.includes(userId)) {
      project.assignedUsers.push(userId);
      await project.save();
    }

    // Fetch user being added and current user details for email
    const addedUser = await User.findById(userId).select("name email");
    const currentUser = await User.findById(currentUserId).select("name");

    // Send email notification if user has email
    if (addedUser && addedUser.email) {
      try {
        const taskUrl = `${process.env.CLIENT_URL}/projects/${task.project}/tasks/${taskId}`;
        await sendTaskMemberAddedEmail({
          toEmail: addedUser.email,
          memberName: addedUser.name,
          taskName: task.name,
          projectName: project?.name || "Unknown Project",
          role,
          addedByName: currentUser?.name || "A team member",
          taskUrl,
        });
      } catch (emailError) {
        console.error("Error sending task member added email:", emailError);
        // Don't fail the operation if email fails
      }
    }

    const populatedTask = await Task.findById(taskId)
      .populate("responsible", "name email avatar")
      .populate("accountable", "name email avatar")
      .populate("consultant", "name email avatar")
      .populate("informed", "name email avatar")
      .populate("assignedBy", "name email avatar")
      .populate("team", "name color")
      .populate("project", "name")
      .lean();

    res.json({
      success: true,
      message: "Member added successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error("Add task member error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeTaskMember = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, role } = req.body;
    const currentUserId = req.user._id;

    const validRoles = ["responsible", "accountable", "consultant", "informed"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    const canEdit =
      task.assignedBy.toString() === currentUserId.toString() ||
      (project &&
        project.supervisor &&
        project.supervisor.toString() === currentUserId.toString()) ||
      (project && project.createdBy.toString() === currentUserId.toString());

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message:
          "Only task creator, project creator, or project supervisor can remove members",
      });
    }

    task[role] = task[role].filter((id) => id.toString() !== userId);
    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate("responsible", "name email avatar")
      .populate("accountable", "name email avatar")
      .populate("consultant", "name email avatar")
      .populate("informed", "name email avatar")
      .populate("assignedBy", "name email avatar")
      .populate("team", "name color")
      .populate("project", "name")
      .lean();

    res.json({
      success: true,
      message: "Member removed successfully",
      task: populatedTask,
    });
    console.log(`Removed user ${userId} from role ${role} in task ${taskId}`);
  } catch (error) {
    console.error("Remove task member error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleStarTask = async (req, res) => {
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
    const userIdStr = userId.toString();
    const hasAccess =
      task.assignedBy?.toString() === userIdStr ||
      task.responsible?.some((id) => id.toString() === userIdStr) ||
      task.accountable?.some((id) => id.toString() === userIdStr) ||
      task.consultant?.some((id) => id.toString() === userIdStr) ||
      task.informed?.some((id) => id.toString() === userIdStr);

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Initialize starredBy array if it doesn't exist
    if (!task.starredBy) {
      task.starredBy = [];
    }

    // Toggle star
    const isStarred = task.starredBy.some((id) => id.toString() === userIdStr);

    if (isStarred) {
      task.starredBy = task.starredBy.filter(
        (id) => id.toString() !== userIdStr,
      );
      await task.save();
      return res.json({
        success: true,
        message: "Task unstarred successfully",
        isStarred: false,
      });
    } else {
      task.starredBy.push(userId);
      await task.save();
      return res.json({
        success: true,
        message: "Task starred successfully",
        isStarred: true,
      });
    }
  } catch (error) {
    console.error("Toggle star task error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Check if user has permission to complete the task
    const userIdStr = userId.toString();
    const canComplete =
      task.assignedBy?.toString() === userIdStr ||
      task.responsible?.some((id) => id.toString() === userIdStr) ||
      task.accountable?.some((id) => id.toString() === userIdStr) ||
      task.consultant?.some((id) => id.toString() === userIdStr) ||
      task.informed?.some((id) => id.toString() === userIdStr);

    if (!canComplete) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to complete this task",
      });
    }

    // Check if task is already completed
    if (task.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Task is already completed",
      });
    }

    // Update task status to completed
    task.status = "completed";
    task.completedAt = new Date();
    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email avatar")
      .populate("assignedBy", "name email avatar")
      .populate("responsible", "name email avatar")
      .populate("accountable", "name email avatar")
      .populate("consultant", "name email avatar")
      .populate("informed", "name email avatar")
      .populate("team", "name color")
      .populate("project", "name workflow")
      .lean();

    res.json({
      success: true,
      message: "Task completed successfully",
      task: {
        ...populatedTask,
        isStarred: populatedTask.starredBy
          ? populatedTask.starredBy.some((id) => id.toString() === userIdStr)
          : false,
      },
    });
  } catch (error) {
    console.error("Complete task error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTaskFormData,
  getProjectPhasesForTask,
  createTask,
  getTodayTasks,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addTaskComment,
  updateTaskStatus,
  addTaskMember,
  removeTaskMember,
  toggleStarTask,
  completeTask,
};
