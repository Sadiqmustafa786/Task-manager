// views/projects/ProjectsView.jsx
import React, { useEffect, useState } from "react";
import { useProjectStore } from "../../stores/useProjectStore";
import { useTaskStore } from "../../stores/useTaskStore";
import ProjectCard from "./ProjectCard";
import CreateProjectCard from "./CreateProjectCard";
import CreateProjectForm from "./CreateProjectForm";
import { showSuccess, showError } from "../../components/toaster/Toaster";
import {
  FiFolder,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiPause,
  FiRefreshCw,
  FiTrendingUp,
  FiList,
} from "react-icons/fi";

export const ProjectsView = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const {
    projects,
    fetchProjects,
    createProject,
    loading,
    error,
    clearError,
    fetchStarredProjects,
  } = useProjectStore();

  const { tasks, fetchTasks, loading: taskLoading } = useTaskStore();

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProjects(), fetchTasks()]);
      showSuccess("Data refreshed successfully!");
    } catch (error) {
      showError("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleProjectUpdated = () => {
    if (activeFilter === "fav") {
      fetchStarredProjects();
    } else {
      fetchProjects();
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      setCreating(true);
      await createProject(projectData);
      showSuccess("Project created successfully!");
      setShowCreateModal(false);
      if (activeFilter === "fav") {
        fetchStarredProjects();
      } else {
        fetchProjects();
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  // Filter projects based on selected filter
  const getFilteredProjects = () => {
    switch (activeFilter) {
      case "active":
        return projects.filter(
          (p) =>
            p &&
            p._id &&
            p._id !== "create" &&
            p.status !== "completed" &&
            p.status !== "cancelled",
        );
      case "fav":
        return projects.filter(
          (p) => p && p._id && p._id !== "create" && p.isStarred === true,
        );
      case "closed":
        return projects.filter(
          (p) =>
            p &&
            p._id &&
            p._id !== "create" &&
            (p.status === "completed" || p.status === "cancelled"),
        );
      default:
        return projects.filter((p) => p && p._id && p._id !== "create");
    }
  };

  const filteredProjects = getFilteredProjects();

  // ─── Statistics Calculations ──────────────────────────────────────────────

  // Project Statistics
  const totalProjects = projects.filter(
    (p) => p && p._id && p._id !== "create",
  ).length;

  const activeProjectsCount = projects.filter(
    (p) =>
      p &&
      p._id &&
      p._id !== "create" &&
      p.status !== "completed" &&
      p.status !== "cancelled",
  ).length;

  const inactiveProjectsCount = projects.filter(
    (p) =>
      p &&
      p._id &&
      p._id !== "create" &&
      (p.status === "completed" || p.status === "cancelled"),
  ).length;

  // Task Statistics
  const totalTasks = tasks.filter((t) => t && t._id).length;

  const pendingTasks = tasks.filter(
    (t) =>
      t &&
      t._id &&
      (t.status === "pending" ||
        t.status === "in-progress" ||
        t.status === "assigned"),
  ).length;

  const completedTasks = tasks.filter(
    (t) => t && t._id && t.status === "completed",
  ).length;

  const overdueTasks = tasks.filter((t) => {
    if (!t || !t._id) return false;
    if (t.status === "completed") return false;
    if (!t.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;

  const cancelledTasks = tasks.filter(
    (t) => t && t._id && t.status === "cancelled",
  ).length;

  const rejectedTasks = tasks.filter(
    (t) => t && t._id && t.status === "rejected",
  ).length;

  const pausedTasks = tasks.filter(
    (t) => t && t._id && t.status === "paused",
  ).length;

  // Filter buttons configuration
  const filterButtons = [
    { id: "all", label: "All Projects", icon: "📋" },
    { id: "active", label: "Active Projects", icon: "🔄" },
    { id: "fav", label: "Favorite Projects", icon: "⭐" },
    { id: "closed", label: "Closed Projects", icon: "✅" },
  ];

  const handleFilterChange = async (filterId) => {
    setActiveFilter(filterId);
    if (filterId === "fav") {
      await fetchStarredProjects();
    } else {
      await fetchProjects();
    }
  };

  // Small task stat cards configuration (used to render the right-hand grid)
  const taskStatCards = [
    {
      key: "pending",
      label: "Pending",
      value: pendingTasks,
      labelColor: "text-amber-500",
      barColor: "bg-amber-400",
      barWidth: "45%",
      icon: FiClock,
    },
    {
      key: "completed",
      label: "Completed",
      value: completedTasks,
      labelColor: "text-emerald-500",
      barColor: "bg-emerald-400",
      barWidth: "8%",
      icon: FiCheckCircle,
    },
    {
      key: "overdue",
      label: "Overdue",
      value: overdueTasks,
      labelColor: "text-red-500",
      barColor: "bg-red-400",
      barWidth: "70%",
      icon: FiAlertCircle,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      value: cancelledTasks,
      labelColor: "text-gray-400",
      barColor: "bg-gray-300",
      barWidth: "0%",
      icon: FiXCircle,
    },
    {
      key: "rejected",
      label: "Rejected",
      value: rejectedTasks,
      labelColor: "text-orange-500",
      barColor: "bg-orange-400",
      barWidth: "0%",
      icon: FiXCircle,
    },
    {
      key: "paused",
      label: "Paused",
      value: pausedTasks,
      labelColor: "text-blue-500",
      barColor: "bg-blue-400",
      barWidth: "0%",
      icon: FiPause,
    },
  ];

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* ─── Header Section ───────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="mt-2 text-gray-600">
                Manage your projects and track progress
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 text-gray-600 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${
                  refreshing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <FiRefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <svg
                  className="w-5 h-5"
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
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* ─── Error Message ────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center justify-between p-4 mb-4 text-red-700 bg-red-100 border border-red-400 rounded-lg">
            <span>{error}</span>
            <button onClick={clearError} className="font-bold">
              ✗
            </button>
          </div>
        )}

        {/* ─── OVERVIEW STATISTICS SECTION ─────────────────────────────────── */}
        <div className="flex flex-col gap-3 mb-8 lg:flex-row">
          {/* Gradient summary cards: Projects / Active / Tasks */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:flex-[0.95]">
            {/* Projects */}
            <div
              onClick={() => handleFilterChange("all")}
              className={`flex-1 rounded-2xl p-3.5 cursor-pointer bg-gradient-to-br from-rose-100 via-pink-100 to-rose-50 border border-rose-100/80 shadow-sm transition-transform hover:scale-[1.02] ${
                activeFilter === "all" ? "ring-2 ring-rose-300" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500">
                  <FiFolder className="w-5 h-5 text-white" />
                  <span className="absolute w-2 h-2 bg-white rounded-full -top-1 -right-1 opacity-70"></span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Projects</p>
                  <p className="text-sm font-bold text-rose-500">
                    {totalProjects} Total
                  </p>
                </div>
              </div>
            </div>

            {/* Active */}
            <div
              onClick={() => handleFilterChange("active")}
              className={`flex-1 rounded-2xl p-3.5 cursor-pointer bg-gradient-to-br from-violet-100 via-purple-100 to-violet-50 border border-violet-100/80 shadow-sm transition-transform hover:scale-[1.02] ${
                activeFilter === "active" ? "ring-2 ring-violet-300" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500">
                  <FiTrendingUp className="w-5 h-5 text-white" />
                  <span className="absolute w-2 h-2 bg-white rounded-full -top-1 -right-1 opacity-70"></span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {activeProjectsCount}{" "}
                    <span className="font-semibold text-gray-500">Active</span>
                  </p>
                  <p className="text-xs font-semibold text-violet-500">
                    {inactiveProjectsCount} Inactive
                  </p>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="flex-1 p-3.5 bg-gradient-to-br from-sky-100 via-blue-100 to-sky-50 border border-sky-100/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500">
                  <FiList className="w-5 h-5 text-white" />
                  <span className="absolute w-2 h-2 bg-white rounded-full -top-1 -right-1 opacity-70"></span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Tasks</p>
                  <p className="text-sm font-bold text-sky-500">
                    {totalTasks} Total
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Small task stat cards */}
          <div className="grid flex-1 grid-cols-3 gap-3">
            {taskStatCards.map((stat) => (
              <div
                key={stat.key}
                className="flex flex-col justify-center px-4 py-3 bg-white border border-gray-100 shadow-sm rounded-xl"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {stat.value}
                  </span>
                  <span className={`text-xs font-semibold ${stat.labelColor}`}>
                    {stat.label}
                  </span>
                </div>
                <div className="w-full h-1 mt-2 overflow-hidden bg-gray-100 rounded-full">
                  {stat.value > 0 && (
                    <div
                      className={`h-full rounded-full ${stat.barColor}`}
                      style={{ width: stat.barWidth }}
                    ></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Filter Buttons Row ──────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          {filterButtons.map((button) => (
            <button
              key={button.id}
              onClick={() => handleFilterChange(button.id)}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                activeFilter === button.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              <span className="text-lg">{button.icon}</span>
              <span className="text-sm font-medium">{button.label}</span>
              {activeFilter === button.id && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                  {filteredProjects.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Projects Grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="w-full max-w-[240px] sm:max-w-[220px] md:max-w-[240px] justify-self-center sm:justify-self-stretch mx-auto">
            <CreateProjectCard onClick={() => setShowCreateModal(true)} />
          </div>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onProjectUpdated={handleProjectUpdated}
            />
          ))}
        </div>

        {/* ─── No Projects Message ─────────────────────────────────────────── */}
        {filteredProjects.length === 0 && !loading && (
          <div className="mt-8 text-center text-gray-500">
            {projects.length === 0 ? (
              <div>
                <p className="mb-2">No projects yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-2">
                  {activeFilter === "fav"
                    ? "No favorite projects yet"
                    : activeFilter === "active"
                      ? "No active projects"
                      : activeFilter === "closed"
                        ? "No closed projects"
                        : "No projects found"}
                </p>
                {activeFilter !== "all" && (
                  <button
                    onClick={() => handleFilterChange("all")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View all projects
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Create Project Modal ──────────────────────────────────────────── */}
      <CreateProjectForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        loading={creating}
      />
    </div>
  );
};
