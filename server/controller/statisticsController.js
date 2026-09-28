// server/controller/statisticsController.js
const Project = require("../model/Project");
const Task = require("../model/Task");
const Milestone = require("../model/Milestone");
const User = require("../model/User");

/**
 * Get individual statistics cards for an employee
 * @route GET /api/statistics/individual/cards
 */
const getIndividualCards = async (req, res) => {
  try {
    const userId = req.user?._id;
    const empId = req.query.emp_id || userId;
    const viewType = req.query.view_type || "";
    const date = req.query.date || "";

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        data: null,
      });
    }

    // Verify employee exists
    const employee = await User.findById(empId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
        data: null,
      });
    }

    // Build date filter
    let dateFilter = {};
    if (date && viewType) {
      const startDate = new Date(date);
      let endDate = new Date(date);

      if (viewType === "daily") {
        endDate.setHours(23, 59, 59, 999);
      } else if (viewType === "monthly") {
        endDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          0,
        );
        endDate.setHours(23, 59, 59, 999);
      } else if (viewType === "past_30_days") {
        startDate.setDate(startDate.getDate() - 30);
      }

      dateFilter = {
        createdAt: { $gte: startDate, $lte: endDate },
      };
    }

    // Get all projects where user is involved
    const projects = await Project.find({
      isActive: true,
      $or: [
        { createdBy: empId },
        { supervisor: empId },
        { assignedUsers: empId },
      ],
      ...dateFilter,
    });

    // Get all tasks where user is involved
    const tasks = await Task.find({
      isActive: true,
      $or: [
        { assignedBy: empId },
        { responsible: empId },
        { accountable: empId },
        { consultant: empId },
        { informed: empId },
      ],
      ...dateFilter,
    });

    // Get milestones where user is assigned or picked
    const milestones = await Milestone.find({
      isActive: true,
      $or: [{ assignedTo: empId }, { pickedBy: empId }],
      ...dateFilter,
    });

    // Calculate statistics
    const stats = {
      contributedProjects: projects.length,
      contributedTasks: tasks.length,
      assignedMilestones: milestones.filter(
        (m) => m.assignedTo?.toString() === empId.toString(),
      ).length,
      pickedMilestones: milestones.filter(
        (m) => m.pickedBy?.toString() === empId.toString(),
      ).length,
      completedMilestones: milestones.filter(
        (m) =>
          m.status === "completed" &&
          m.pickedBy?.toString() === empId.toString(),
      ).length,
      pendingMilestones: milestones.filter(
        (m) =>
          m.status === "pending" &&
          m.assignedTo?.toString() === empId.toString(),
      ).length,
    };

    return res.status(200).json({
      success: true,
      message: "Individual statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error in getIndividualCards:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

const getIndividualTable = async (req, res) => {
  try {
    const userId = req.user?._id;
    const empId = req.query.emp_id || userId;
    // ✅ Remove parseInt - keep as string for MongoDB ObjectId
    const projectId = req.query.project_id || "0";
    const status = req.query.status || "";
    const startDate = req.query.start_date || "";
    const endDate = req.query.end_date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        data: null,
        pagination: null,
      });
    }

    const skip = (page - 1) * limit;

    // Build query
    let query = {
      isActive: true,
      $or: [
        { assignedBy: empId },
        { responsible: empId },
        { accountable: empId },
        { consultant: empId },
        { informed: empId },
      ],
    };

    // Apply filters
    // ✅ Check if projectId is a valid ObjectId string and not "0" or empty
    if (projectId && projectId !== "0" && projectId !== "") {
      query.project = projectId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.createdAt = { ...query.createdAt, $gte: start };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { ...query.createdAt, $lte: end };
    }

    // Get total count
    const totalItems = await Task.countDocuments(query);

    // Get paginated tasks
    const tasks = await Task.find(query)
      .populate("project", "name")
      .populate("assignedBy", "name email avatar")
      .populate("responsible", "name email avatar")
      .populate("accountable", "name email avatar")
      .populate("consultant", "name email avatar")
      .populate("informed", "name email avatar")
      .populate("team", "name color")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format tasks for table display
    const formattedTasks = tasks.map((task) => ({
      _id: task._id,
      name: task.name,
      project: task.project?.name || "Unknown Project",
      projectId: task.project?._id,
      status: task.status || "pending",
      priority: task.priority || "medium",
      dueDate: task.dueDate,
      assignedBy: task.assignedBy?.name || "Unknown",
      responsible: task.responsible?.map((u) => u.name).join(", ") || "",
      accountable: task.accountable?.map((u) => u.name).join(", ") || "",
      consultant: task.consultant?.map((u) => u.name).join(", ") || "",
      informed: task.informed?.map((u) => u.name).join(", ") || "",
      createdAt: task.createdAt,
      team: task.team?.name || "",
    }));

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      message: "Individual table data retrieved successfully",
      data: formattedTasks,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in getIndividualTable:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
      pagination: null,
    });
  }
};

/**
 * Get individual project list for an employee
 * @route GET /api/statistics/individual/projects
 */
const getIndividualProjects = async (req, res) => {
  try {
    const userId = req.user?._id;
    const empId = req.query.emp_id || userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        data: null,
      });
    }

    const projects = await Project.find({
      isActive: true,
      $or: [
        { createdBy: empId },
        { supervisor: empId },
        { assignedUsers: empId },
      ],
    })
      .select("_id name description status")
      .lean();

    const formattedProjects = projects.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description || "",
      status: p.status || "active",
    }));

    return res.status(200).json({
      success: true,
      message: "Individual project list retrieved successfully",
      data: formattedProjects,
    });
  } catch (error) {
    console.error("Error in getIndividualProjects:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

/**
 * Get organizational statistics with pagination
 * @route GET /api/statistics/organizational
 */
const getOrganizationalStats = async (req, res) => {
  try {
    const userId = req.user?._id;
    const page = parseInt(req.query.page) || 1;
    const projectId = parseInt(req.query.project_id) || 0;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        data: null,
      });
    }

    const limit = 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isActive: true };
    if (projectId > 0) {
      query._id = projectId;
    }

    // Get total count
    const totalItems = await Project.countDocuments(query);

    // Get projects with pagination
    const projects = await Project.find(query)
      .populate("createdBy", "name email avatar")
      .populate("supervisor", "name email avatar")
      .populate("assignedUsers", "name email avatar")
      .populate("workflow", "name")
      .populate("team", "name color")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get task stats for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({ project: project._id, isActive: true });
        const completedTasks = tasks.filter((t) => t.status === "completed");
        const pendingTasks = tasks.filter(
          (t) => t.status === "pending" || t.status === "in-progress",
        );

        return {
          _id: project._id,
          name: project.name,
          description: project.description || "",
          status: project.status || "active",
          createdBy: project.createdBy?.name || "Unknown",
          supervisor: project.supervisor?.name || "Unknown",
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          pendingTasks: pendingTasks.length,
          progress:
            tasks.length > 0
              ? Math.round((completedTasks.length / tasks.length) * 100)
              : 0,
          createdAt: project.createdAt,
          workflow: project.workflow?.name || "Default",
          team: project.team?.name || "",
        };
      }),
    );

    const totalPages = Math.ceil(totalItems / limit);
    const hasMoreRecord = page < totalPages;

    return res.status(200).json({
      success: true,
      message: "Organizational statistics retrieved successfully",
      data: {
        projects: projectsWithStats,
        has_more_record: hasMoreRecord,
        page: page,
        total: totalItems,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error("Error in getOrganizationalStats:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

/**
 * Get organizational statistics cards
 * @route GET /api/statistics/organizational/cards
 */
const getOrganizationalCards = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        data: null,
      });
    }

    // Get counts
    const totalProjects = await Project.countDocuments({ isActive: true });
    const totalTasks = await Task.countDocuments({ isActive: true });
    const completedTasks = await Task.countDocuments({
      isActive: true,
      status: "completed",
    });
    const pendingTasks = await Task.countDocuments({
      isActive: true,
      status: { $in: ["pending", "in-progress"] },
    });
    const totalMilestones = await Milestone.countDocuments({ isActive: true });
    const completedMilestones = await Milestone.countDocuments({
      isActive: true,
      status: "completed",
    });

    // Get task status distribution
    const taskStatusDistribution = await Task.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Get workload distribution (tasks per project)
    const workloadDistribution = await Task.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$project", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $project: {
          projectName: { $arrayElemAt: ["$project.name", 0] },
          count: 1,
        },
      },
    ]);

    const stats = {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalMilestones,
      completedMilestones,
      taskStatusDistribution: taskStatusDistribution.reduce((acc, curr) => {
        acc[curr._id || "unknown"] = curr.count;
        return acc;
      }, {}),
      workloadDistribution: workloadDistribution.map((w) => ({
        name: w.projectName || "Unknown Project",
        tasks: w.count,
      })),
    };

    return res.status(200).json({
      success: true,
      message: "Organizational cards retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error in getOrganizationalCards:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

/**
 * Get organizational table data
 * @route GET /api/statistics/organizational/table
 */
const getOrganizationalTable = async (req, res) => {
  try {
    const userId = req.user?._id;
    const projectId = parseInt(req.query.project_id) || 0;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        data: null,
      });
    }

    let query = { isActive: true };
    if (projectId > 0) {
      query._id = projectId;
    }

    const projects = await Project.find(query)
      .populate("createdBy", "name email avatar")
      .populate("supervisor", "name email avatar")
      .populate("assignedUsers", "name email avatar")
      .select("_id name description status createdBy supervisor createdAt")
      .lean();

    // Get task counts for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({
          project: project._id,
          isActive: true,
        });
        const completedCount = await Task.countDocuments({
          project: project._id,
          isActive: true,
          status: "completed",
        });
        const pendingCount = await Task.countDocuments({
          project: project._id,
          isActive: true,
          status: { $in: ["pending", "in-progress"] },
        });

        return {
          _id: project._id,
          name: project.name,
          description: project.description || "",
          status: project.status || "active",
          createdBy: project.createdBy?.name || "Unknown",
          supervisor: project.supervisor?.name || "Unknown",
          totalTasks: taskCount,
          completedTasks: completedCount,
          pendingTasks: pendingCount,
          progress:
            taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0,
          createdAt: project.createdAt,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Organizational table data retrieved successfully",
      data: projectsWithStats,
    });
  } catch (error) {
    console.error("Error in getOrganizationalTable:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

/**
 * Get projects list (simple list for dropdowns)
 * @route GET /api/statistics/projects/list
 */
const getProjectsList = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        data: null,
      });
    }

    const projects = await Project.find({
      isActive: true,
      $or: [
        { createdBy: userId },
        { supervisor: userId },
        { assignedUsers: userId },
      ],
    })
      .select("_id name description")
      .lean();

    const formattedProjects = projects.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description || "",
    }));

    return res.status(200).json({
      success: true,
      message: "Projects list retrieved successfully",
      data: formattedProjects,
    });
  } catch (error) {
    console.error("Error in getProjectsList:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

/**
 * Get employees list
 * @route GET /api/statistics/employees
 */
const getEmployees = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        data: null,
      });
    }

    // Get users who are involved in projects or tasks
    const projectUsers = await Project.distinct("assignedUsers", {
      isActive: true,
    });
    const taskUsers = await Task.distinct("assignedBy", { isActive: true });
    const supervisorUsers = await Project.distinct("supervisor", {
      isActive: true,
    });
    const creatorUsers = await Project.distinct("createdBy", {
      isActive: true,
    });

    const allUserIds = [
      ...new Set([
        ...projectUsers,
        ...taskUsers,
        ...supervisorUsers,
        ...creatorUsers,
      ]),
    ];

    const users = await User.find({
      _id: { $in: allUserIds },
    })
      .select("_id name email avatar")
      .lean();

    const formattedUsers = users.map((u) => ({
      _id: u._id,
      name: u.name || u.email || "Unknown User",
      email: u.email,
      avatar: u.avatar,
    }));

    return res.status(200).json({
      success: true,
      message: "Employees list retrieved successfully",
      data: formattedUsers,
    });
  } catch (error) {
    console.error("Error in getEmployees:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

module.exports = {
  getIndividualCards,
  getIndividualTable,
  getIndividualProjects,
  getOrganizationalStats,
  getOrganizationalCards,
  getOrganizationalTable,
  getProjectsList,
  getEmployees,
};
