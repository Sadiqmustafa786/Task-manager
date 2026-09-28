// views/projects/ProjectDetailPage.jsx - Updated with Filter Empty State

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MdStar, MdStarBorder } from "react-icons/md";
import { useProjectStore } from "../../stores/useProjectStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { getIconByPath } from "../../constants/workflowIcons";
import { showSuccess, showError } from "../../components/toaster/Toaster";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import CreateTaskForm from "../tasks/CreateTaskForm";
import UpdateProjectForm from "./UpdateProjectForm";
import EditTaskModal from "../tasks/EditTaskFormModal";

const menuEvents = {
  listeners: new Set(),
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  notify(activeCardId) {
    this.listeners.forEach((callback) => callback(activeCardId));
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const getPriorityStyle = (priority) => {
  const map = {
    low: { bg: "#6B7280", label: "Low" },
    medium: { bg: "#F59E0B", label: "Medium" },
    high: { bg: "#F97316", label: "High" },
    urgent: { bg: "#EF4444", label: "Urgent" },
  };
  return map[priority] || { bg: "#6B7280", label: priority };
};

const getTaskIconColor = (status) => {
  const map = {
    pending: "#F59E0B",
    "in-progress": "#3B82F6",
    review: "#8B5CF6",
    completed: "#10B981",
    blocked: "#EF4444",
  };
  return map[status] || "#9CA3AF";
};

/** Human-friendly time-until label */
const getTimeRemaining = (dueDate, status) => {
  if (!dueDate) return "No due date";
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;

  if (status === "completed") return "Completed";
  if (diffMs < 0) return "Overdue";

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return "Less than an hour";
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return "Less than a day";
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "1 day left";
  if (diffDays < 7) return `${diffDays} days left`;
  const diffWeeks = Math.floor(diffDays / 7);
  return diffWeeks === 1 ? "1 week left" : `${diffWeeks} weeks left`;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Collapsible phase section with its task table */
const PhaseSection = ({
  phase,
  tasks,
  loading,
  onAddTask,
  onTaskClick,
  onEditTask,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      {/* Phase row / Status header */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 cursor-pointer select-none hover:bg-gray-50"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span
          className="flex-shrink-0 text-gray-400 transition-transform duration-200"
          style={{
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
        <span className="text-sm font-semibold text-gray-800">
          {phase.name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddTask(phase);
          }}
          className="ml-1 text-lg font-bold leading-none text-gray-400 transition-colors hover:text-blue-500"
          title="Add task"
        >
          +
        </button>
        <span className="ml-2 text-xs text-gray-500">({tasks.length})</span>
      </div>

      {/* Task rows */}
      {!collapsed && (
        <div>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-blue-400 rounded-full border-b-transparent animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-6 mx-4 my-2 text-sm text-center text-gray-400 border border-gray-200 border-dashed rounded-lg">
              No tasks yet.{" "}
              <button
                onClick={() => onAddTask(phase)}
                className="text-blue-500 hover:underline"
              >
                Add the first one
              </button>
            </div>
          ) : (
            <div>
              {tasks.map((task) => {
                const timeLabel = getTimeRemaining(task.dueDate, task.status);
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  task.status !== "completed";
                const priority = getPriorityStyle(task.priority);
                const iconColor = getTaskIconColor(task.status);

                return (
                  <div
                    key={task._id}
                    className="flex items-center transition-colors border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                    onClick={() => onTaskClick(task._id)}
                  >
                    {/* Status / time remaining */}
                    <div className="flex items-center w-40 gap-2 px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      <span
                        className="flex-shrink-0 w-2 h-2 rounded-full"
                        style={{ backgroundColor: iconColor }}
                      ></span>
                      {timeLabel}
                    </div>

                    {/* Task Name */}
                    <div className="flex items-center flex-1 gap-2 px-4 py-3">
                      <span className="text-sm font-medium text-gray-800">
                        {task.name}
                      </span>
                    </div>

                    {/* Assigned By */}
                    <div className="w-32 px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {task.assignedBy?.name || "Unknown"}
                    </div>

                    {/* Due Date */}
                    <div
                      className={`px-4 py-3 whitespace-nowrap text-xs w-48 ${
                        isOverdue ? "text-red-500 font-medium" : "text-gray-500"
                      }`}
                    >
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Not set"}
                    </div>

                    {/* Priority badge */}
                    <div className="w-24 px-4 py-3 whitespace-nowrap">
                      <span
                        className="px-3 py-1 text-xs font-medium text-white rounded-full"
                        style={{ backgroundColor: priority.bg }}
                      >
                        {priority.label}
                      </span>
                    </div>

                    {/* Type */}
                    <div className="w-20 px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {task.taskType || "Indoor"}
                    </div>

                    {/* Action */}
                    <div
                      className="w-20 px-4 py-3 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => onEditTask(task, e)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white transition-colors bg-blue-500 rounded hover:bg-blue-600"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
                          />
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Starred Tasks Dropdown Component ──────────────────────────────────────────

const StarredTasksDropdown = ({ starredTasks, onTaskClick, onClose }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (starredTasks.length === 0) {
    return (
      <div
        ref={dropdownRef}
        className="absolute z-30 mt-2 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg w-80"
        style={{ top: "100%", left: 0 }}
      >
        <div className="px-4 py-3 text-sm text-gray-500">
          No starred tasks yet
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-30 mt-2 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg w-96"
      style={{ top: "100%", left: 0 }}
    >
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200 bg-gray-50">
        Starred Tasks ({starredTasks.length})
      </div>
      <div className="overflow-y-auto max-h-80">
        {starredTasks.map((task) => (
          <div
            key={task._id}
            onClick={() => {
              onTaskClick(task._id);
              onClose();
            }}
            className="px-4 py-3 transition-colors border-b border-gray-100 cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MdStar className="flex-shrink-0 w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-800">
                    {task.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>Priority: {task.priority || "Medium"}</span>
                  <span>Status: {task.status || "Pending"}</span>
                  {task.dueDate && (
                    <span>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const starredButtonRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showStarredDropdown, setShowStarredDropdown] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [starredTasks, setStarredTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [updatingColor, setUpdatingColor] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [assignedByFilter, setAssignedByFilter] = useState(null);
  const [showStatusFilterDropdown, setShowStatusFilterDropdown] =
    useState(false);
  const [showAssignedByFilterDropdown, setShowAssignedByFilterDropdown] =
    useState(false);
  const [activeView, setActiveView] = useState("list");

  const {
    currentProject,
    fetchProjectById,
    deleteProject,
    updateProjectColor,
    toggleStarProject,
    closeProject,
    loading,
  } = useProjectStore();

  const { fetchTasks } = useTaskStore();

  const loadProjectTasks = async () => {
    try {
      setLoadingTasks(true);
      const tasks = await fetchTasks({ projectId });
      setProjectTasks(tasks || []);
      // Filter starred tasks
      const starred = (tasks || []).filter((task) => task.isStarred === true);
      setStarredTasks(starred);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId);
      loadProjectTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Refresh data when the page becomes visible
  useEffect(() => {
    const refreshData = () => {
      if (projectId) {
        fetchProjectById(projectId);
        loadProjectTasks();
      }
    };

    const handleFocus = () => {
      refreshData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshData();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [projectId, fetchProjectById]);

  // Handle click outside for starred dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showStarredDropdown &&
        starredButtonRef.current &&
        !starredButtonRef.current.contains(event.target)
      ) {
        setShowStarredDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStarredDropdown]);

  // Handle click outside for filter dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showStatusFilterDropdown &&
        !event.target.closest(".status-filter-btn")
      ) {
        setShowStatusFilterDropdown(false);
      }
      if (
        showAssignedByFilterDropdown &&
        !event.target.closest(".assigned-filter-btn")
      ) {
        setShowAssignedByFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStatusFilterDropdown, showAssignedByFilterDropdown]);

  // Subscribe to global menu events
  useEffect(() => {
    const unsubscribe = menuEvents.subscribe((activeCardId) => {
      if (activeCardId !== projectId && showMenu) {
        setShowMenu(false);
      }
    });
    return unsubscribe;
  }, [projectId, showMenu]);

  // Handle click outside for project menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleTaskClick = (taskId) => navigate(`/tasks/${taskId}`);

  const handleEditTask = (task, e) => {
    if (e) e.stopPropagation();
    setSelectedTask(task);
    setShowEditTaskModal(true);
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId);
      showSuccess("Project deleted");
      navigate("/projects");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete project");
    }
  };

  const handleToggleStar = async (e) => {
    e.stopPropagation();
    try {
      await toggleStarProject(projectId);
      showSuccess("Star updated successfully");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update star");
    }
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    const newState = !showMenu;
    setShowMenu(newState);
    if (newState) {
      menuEvents.notify(projectId);
    }
  };

  const handleCloseProject = async () => {
    try {
      setClosing(true);
      await closeProject(projectId);
      showSuccess("Project closed successfully!");
      setShowCloseDialog(false);
      fetchProjectById(projectId);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to close project");
    } finally {
      setClosing(false);
    }
  };

  const handleUpdateColor = async (nextColor) => {
    try {
      setUpdatingColor(true);
      const response = await updateProjectColor(projectId, nextColor);
      showSuccess("Project color updated!");
      setShowMenu(false);
      fetchProjectById(projectId);
    } catch (error) {
      console.error("Update color error:", error);
      showError(error.response?.data?.message || "Failed to update color");
    } finally {
      setUpdatingColor(false);
    }
  };

  const handleProjectUpdated = () => {
    fetchProjectById(projectId);
  };

  const toggleStarredDropdown = () => {
    setShowStarredDropdown(!showStarredDropdown);
  };

  const getUniqueAssignedByUsers = () => {
    const users = new Map();
    projectTasks.forEach((task) => {
      if (task.assignedBy && task.assignedBy._id) {
        if (!users.has(task.assignedBy._id)) {
          users.set(task.assignedBy._id, {
            _id: task.assignedBy._id,
            name: task.assignedBy.name || "Unknown",
          });
        }
      }
    });
    return Array.from(users.values());
  };

  const getTasksByPhase = (phaseId) => {
    let tasks = projectTasks.filter((t) => t.phase === phaseId);

    // Apply status filter
    if (statusFilter) {
      tasks = tasks.filter((t) => t.status === statusFilter);
      console.log(
        `Filtering by status: ${statusFilter}, found ${tasks.length} tasks`,
      );
    }

    // Apply assigned by filter
    if (assignedByFilter) {
      tasks = tasks.filter((t) => t.assignedBy?._id === assignedByFilter);
      console.log(
        `Filtering by assignedBy: ${assignedByFilter}, found ${tasks.length} tasks`,
      );
    }

    return tasks;
  };

  const hasAnyFilteredTasks = () => {
    return sortedPhases.some((phase) => getTasksByPhase(phase._id).length > 0);
  };

  const getEmptyStateMessage = () => {
    if (statusFilter && assignedByFilter) {
      const user = getUniqueAssignedByUsers().find(
        (u) => u._id === assignedByFilter,
      );
      return `No tasks found with status "${statusFilter}" assigned by ${user?.name || "selected user"}.`;
    } else if (statusFilter) {
      return `No tasks found with status "${statusFilter}".`;
    } else if (assignedByFilter) {
      const user = getUniqueAssignedByUsers().find(
        (u) => u._id === assignedByFilter,
      );
      return `No tasks found assigned by ${user?.name || "selected user"}.`;
    }
    return "No tasks found.";
  };

  // ── Loading / Not found states ──────────────────────────────────────────

  if (loading && !currentProject) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-b-2 border-blue-500 rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-500">Loading project…</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-gray-50">
        <p className="text-gray-500">Project not found</p>
        <button
          onClick={() => navigate("/projects")}
          className="text-sm text-blue-500 hover:underline"
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  const workflowIcon = currentProject.workflow?.defaultImage
    ? getIconByPath(currentProject.workflow.defaultImage)
    : { emoji: "📋", color: "#4F46E5" };

  const cardColor =
    currentProject.cardColor ||
    currentProject.workflow?.iconColor ||
    workflowIcon.color ||
    "#3B82F6";

  const getDateDisplay = () => {
    if (currentProject.isContinuous) return "Active";
    if (currentProject.isClosed) return "Closed";
    if (currentProject.endDate) {
      const d = new Date(currentProject.endDate);
      return d
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/ /g, "-");
    }
    return "No end date";
  };

  const sortedPhases = [...(currentProject.phases || [])].sort(
    (a, b) => a.order - b.order,
  );

  const canClose =
    currentProject.status !== "completed" &&
    currentProject.status !== "cancelled";

  const colorPalette = [
    "#EF4444",
    "#F97316",
    "#EAB308",
    "#84CC16",
    "#06B6D4",
    "#A855F7",
    "#EC4899",
    "#F9A8D4",
    "#6B7280",
    "#92400E",
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#14B8A6",
    "#F59E0B",
  ];

  const statusOptions = [
    "pending",
    "in-progress",
    "review",
    "completed",
    "blocked",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Back */}
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-1.5 mb-5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Projects
        </button>

        {/* Two-column layout */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* ── Left: Project Card ── */}
          <div className="w-full lg:w-[280px] lg:flex-shrink-0">
            <div className="overflow-hidden bg-white border border-gray-100 rounded-lg shadow-sm">
              {/* Colored Top Section */}
              <div
                className="relative w-full h-[200px] flex flex-col justify-between p-4"
                style={{ backgroundColor: cardColor }}
              >
                {/* Top-right: Star + Menu */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleToggleStar}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    aria-label={
                      currentProject?.isStarred
                        ? "Unstar project"
                        : "Star project"
                    }
                  >
                    {currentProject?.isStarred ? (
                      <MdStar className="w-5 h-5 text-yellow-300 drop-shadow-md" />
                    ) : (
                      <MdStarBorder className="w-5 h-5 text-white/80" />
                    )}
                  </button>
                  <button
                    ref={buttonRef}
                    onClick={handleMenuToggle}
                    className="text-xl leading-none text-white hover:opacity-75 focus:outline-none"
                    aria-label="Project menu"
                  >
                    ⋮
                  </button>
                </div>

                {/* Center: Project Name */}
                <h1 className="text-2xl font-semibold leading-tight text-center text-white">
                  {currentProject.name}
                </h1>

                {/* Bottom: Date/Status */}
                <div
                  className="flex items-center justify-end gap-2 text-right text-white"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  <span className="text-lg">{getDateDisplay()}</span>
                  <span className="text-2xl">›</span>
                </div>
              </div>

              {/* White Section with Details */}
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Creator</p>
                  <p className="text-sm text-gray-600">
                    {currentProject.createdBy?.name || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Supervisor
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentProject.supervisor?.name || "—"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-800">
                    Project Visibility:
                  </p>
                  <span className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-full">
                    Public
                  </span>
                </div>

                <div>
                  <p className="mb-1 text-sm font-semibold text-gray-800">
                    Project Description
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {currentProject.description?.trim()
                      ? currentProject.description
                      : "No description"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              ref={menuRef}
              className="absolute z-30 flex overflow-hidden bg-white border border-gray-100 rounded-lg shadow-xl w-80 top-24"
              style={{ left: "20px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-32 p-2 border-r border-gray-200 bg-gray-50">
                <p className="mb-2 text-xs font-medium text-center text-gray-500">
                  Colors
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateColor(color);
                      }}
                      disabled={updatingColor}
                      className={`w-8 h-8 rounded-md cursor-pointer hover:scale-110 transition-transform border-2 ${
                        cardColor === color
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      title="Change color"
                    />
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="color"
                    value={cardColor}
                    onChange={(e) => {
                      const nextColor = e.target.value;
                      handleUpdateColor(nextColor);
                    }}
                    className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="flex-1 p-2">
                <p className="mb-2 text-xs font-medium text-center text-gray-500">
                  Actions
                </p>
                <div className="space-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setShowUpdateModal(true);
                    }}
                    className="w-full px-3 py-1.5 text-sm text-left text-gray-700 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>

                  {canClose && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        setShowCloseDialog(true);
                      }}
                      className="w-full px-3 py-1.5 text-sm text-left text-gray-700 hover:bg-green-50 rounded-md transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Close Project
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setShowDeleteDialog(true);
                    }}
                    className="w-full px-3 py-1.5 text-sm text-left text-gray-700 hover:bg-red-50 rounded-md transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Right: Phases & Tasks ──────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
              {/* Top Navigation */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Show Task In</span>
                  <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setActiveView("list")}
                      className={`px-3 py-1 text-sm font-medium transition-colors rounded ${
                        activeView === "list"
                          ? "text-white bg-blue-500"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      List View
                    </button>
                    <button
                      onClick={() => setActiveView("workflow")}
                      className={`px-3 py-1 text-sm font-medium transition-colors rounded ${
                        activeView === "workflow"
                          ? "text-white bg-blue-500"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Workflow View
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              {activeView === "list" && (
                <div className="relative flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedPhase(sortedPhases[0] || null);
                        setShowCreateTaskModal(true);
                      }}
                      className="px-3 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Task
                    </button>
                    <button
                      onClick={() => navigate(`/backlog/${projectId}`)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors bg-blue-500 rounded hover:bg-blue-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                      Backlog
                    </button>
                    <div className="relative">
                      <button
                        ref={starredButtonRef}
                        onClick={toggleStarredDropdown}
                        className="px-3 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                      >
                        <MdStarBorder className="text-white" size={15} />
                        Show Starred
                        {starredTasks.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-white text-blue-500 rounded-full">
                            {starredTasks.length}
                          </span>
                        )}
                      </button>
                      {showStarredDropdown && (
                        <StarredTasksDropdown
                          starredTasks={starredTasks}
                          onTaskClick={handleTaskClick}
                          onClose={() => setShowStarredDropdown(false)}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Status Filter */}
                    <div className="relative">
                      <button
                        className="status-filter-btn px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                        onClick={() =>
                          setShowStatusFilterDropdown(!showStatusFilterDropdown)
                        }
                      >
                        Filter by Status
                        {statusFilter && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            {statusFilter}
                          </span>
                        )}
                      </button>
                      {showStatusFilterDropdown && (
                        <div className="absolute right-0 z-20 w-48 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg top-full">
                          <button
                            onClick={() => {
                              setStatusFilter(null);
                              setShowStatusFilterDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 border-b border-gray-100 hover:bg-gray-50"
                          >
                            ✓ Show All
                          </button>
                          {statusOptions.map((status) => (
                            <button
                              key={status}
                              onClick={() => {
                                setStatusFilter(status);
                                setShowStatusFilterDropdown(false);
                              }}
                              className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                            >
                              {statusFilter === status && (
                                <span className="text-blue-600">✓</span>
                              )}
                              <span className="capitalize">{status}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assigned By Filter */}
                    <div className="relative">
                      <button
                        className="assigned-filter-btn px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                        onClick={() =>
                          setShowAssignedByFilterDropdown(
                            !showAssignedByFilterDropdown,
                          )
                        }
                      >
                        Filter Assigned By
                        {assignedByFilter && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            Active
                          </span>
                        )}
                      </button>
                      {showAssignedByFilterDropdown && (
                        <div className="absolute right-0 z-20 w-56 mt-2 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg top-full max-h-64">
                          <button
                            onClick={() => {
                              setAssignedByFilter(null);
                              setShowAssignedByFilterDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 border-b border-gray-100 hover:bg-gray-50"
                          >
                            ✓ Show All
                          </button>
                          {getUniqueAssignedByUsers().map((user) => (
                            <button
                              key={user._id}
                              onClick={() => {
                                setAssignedByFilter(user._id);
                                setShowAssignedByFilterDropdown(false);
                              }}
                              className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                            >
                              {assignedByFilter === user._id && (
                                <span className="text-blue-600">✓</span>
                              )}
                              <span>{user.name}</span>
                            </button>
                          ))}
                          {getUniqueAssignedByUsers().length === 0 && (
                            <div className="px-4 py-3 text-sm text-center text-gray-500">
                              No assigned users
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Clear Filters Button */}
                    {(statusFilter || assignedByFilter) && (
                      <button
                        onClick={() => {
                          setStatusFilter(null);
                          setAssignedByFilter(null);
                        }}
                        className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Table header */}
              {activeView === "list" && (
                <div className="flex items-center text-xs font-semibold tracking-wider text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
                  <div className="w-40 px-4 py-3">Status</div>
                  <div className="flex-1 px-4 py-3">Task Name</div>
                  <div className="w-32 px-4 py-3">Assigned By</div>
                  <div className="w-48 px-4 py-3">Due Date</div>
                  <div className="w-24 px-4 py-3">Priority</div>
                  <div className="w-20 px-4 py-3">Type</div>
                  <div className="w-20 px-4 py-3">Action</div>
                </div>
              )}

              {/* Phase sections / Content */}
              {activeView === "list" ? (
                <div className="divide-y divide-gray-100">
                  {sortedPhases.length === 0 ? (
                    <div className="py-16 text-sm text-center text-gray-400">
                      No phases defined for this project.
                    </div>
                  ) : (statusFilter || assignedByFilter) &&
                    !hasAnyFilteredTasks() ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <svg
                        className="w-16 h-16 mb-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="mb-2 text-lg font-semibold text-gray-700">
                        No Tasks Found
                      </h3>
                      <p className="max-w-sm mb-4 text-sm text-center text-gray-500">
                        {getEmptyStateMessage()}
                      </p>
                      <button
                        onClick={() => {
                          setStatusFilter(null);
                          setAssignedByFilter(null);
                        }}
                        className="px-4 py-2 text-sm text-blue-600 transition-colors border border-blue-200 rounded hover:bg-blue-50"
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    sortedPhases.map((phase, i) => (
                      <PhaseSection
                        key={phase._id || i}
                        phase={phase}
                        tasks={getTasksByPhase(phase._id)}
                        loading={loadingTasks}
                        onAddTask={(ph) => {
                          setSelectedPhase(ph);
                          setShowCreateTaskModal(true);
                        }}
                        onTaskClick={handleTaskClick}
                        onEditTask={handleEditTask}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gray-50">
                  {sortedPhases.length === 0 ? (
                    <div className="py-16 text-sm text-center text-gray-400">
                      No phases defined for this project.
                    </div>
                  ) : (statusFilter || assignedByFilter) &&
                    !hasAnyFilteredTasks() ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <svg
                        className="w-16 h-16 mb-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="mb-2 text-lg font-semibold text-gray-700">
                        No Tasks Found
                      </h3>
                      <p className="max-w-sm mb-4 text-sm text-center text-gray-500">
                        {getEmptyStateMessage()}
                      </p>
                      <button
                        onClick={() => {
                          setStatusFilter(null);
                          setAssignedByFilter(null);
                        }}
                        className="px-4 py-2 text-sm text-blue-600 transition-colors border border-blue-200 rounded hover:bg-blue-50"
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {sortedPhases.map((phase, idx) => {
                        const phaseTasks = getTasksByPhase(phase._id);
                        return (
                          <div
                            key={phase._id || idx}
                            className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
                          >
                            {/* Phase Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {phase.name}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {phaseTasks.length} task
                                  {phaseTasks.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedPhase(phase);
                                  setShowCreateTaskModal(true);
                                }}
                                className="px-2 py-1 text-sm text-white transition-colors bg-blue-500 rounded hover:bg-blue-600"
                                title="Add task to this phase"
                              >
                                +
                              </button>
                            </div>

                            {/* Tasks List */}
                            <div className="space-y-2 overflow-y-auto max-h-96">
                              {phaseTasks.length === 0 ? (
                                <div className="py-8 text-xs text-center text-gray-400">
                                  {statusFilter || assignedByFilter
                                    ? `No tasks match the current filter`
                                    : `No tasks in this phase`}
                                </div>
                              ) : (
                                phaseTasks.map((task) => {
                                  const priority = getPriorityStyle(
                                    task.priority,
                                  );
                                  const iconColor = getTaskIconColor(
                                    task.status,
                                  );
                                  return (
                                    <div
                                      key={task._id}
                                      onClick={() => handleTaskClick(task._id)}
                                      className="p-2 transition-colors border border-gray-100 rounded cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-200"
                                    >
                                      <div className="flex items-start gap-2">
                                        <span
                                          className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full"
                                          style={{ backgroundColor: iconColor }}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-800 truncate">
                                            {task.name}
                                          </p>
                                          <div className="flex items-center gap-1.5 mt-1">
                                            <span
                                              className="px-1.5 py-0.5 text-xs text-white rounded"
                                              style={{
                                                backgroundColor: priority.bg,
                                              }}
                                            >
                                              {priority.label}
                                            </span>
                                            <span className="text-xs text-gray-500 truncate">
                                              {task.dueDate
                                                ? new Date(
                                                    task.dueDate,
                                                  ).toLocaleDateString()
                                                : "No due date"}
                                            </span>
                                          </div>
                                          {task.status && (
                                            <span className="inline-block mt-1 text-xs text-gray-400">
                                              Status: {task.status}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskForm
        isOpen={showCreateTaskModal}
        onClose={() => {
          setShowCreateTaskModal(false);
          setSelectedPhase(null);
        }}
        projectId={projectId}
        phaseId={selectedPhase?._id}
        phaseName={selectedPhase?.name}
        onTaskCreated={loadProjectTasks}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={showEditTaskModal}
        onClose={() => {
          setShowEditTaskModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onTaskUpdated={() => {
          loadProjectTasks();
          setShowEditTaskModal(false);
          setSelectedTask(null);
        }}
      />

      {/* Update Project Modal */}
      <UpdateProjectForm
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        project={currentProject}
        onProjectUpdated={handleProjectUpdated}
      />

      {/* Close Project Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onConfirm={handleCloseProject}
        title="Close Project"
        message={`Are you sure you want to close "${currentProject.name}"? This will mark the project as completed with 100% progress.`}
        loading={closing}
        confirmText="Close Project"
        cancelText="Cancel"
        confirmButtonColor="green"
      />

      {/* Delete Project Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${currentProject.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
      />
    </div>
  );
};

export default ProjectDetailPage;
