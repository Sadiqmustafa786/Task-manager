// client/src/views/backlog/BacklogView.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiClock,
  FiDownload,
} from "react-icons/fi";
import { MdStar, MdStarBorder } from "react-icons/md";
import { useBacklogStore } from "../../stores/useBacklogStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { showSuccess, showError } from "../../components/toaster/Toaster";
import {
  statusOptions,
  priorityOptions,
  getStatusBadge,
  getPriorityBadge,
  formatDate,
} from "../../utils/backlogUtils";
import CreateBacklogModal from "./CreateBacklogModal";
import { generateBacklogPDF } from "../../services/backlogPdf.service";

const BacklogView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedBacklogs, setSelectedBacklogs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const searchInputRef = useRef(null);

  // Category state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6B7280");
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // Label state
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#6B7280");
  const [labelLoading, setLabelLoading] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editingLabelName, setEditingLabelName] = useState("");

  const {
    backlogs,
    categories,
    labels,
    tasks,
    stats,
    pagination,
    filters,
    loadingBacklogs,
    loadingStats,
    loadingCategories,
    loadingLabels,
    loadingTasks,
    fetchBacklogs,
    fetchCategories,
    fetchLabels,
    fetchTasks,
    fetchStats,
    createBacklog,
    updateBacklog,
    deleteBacklog,
    createCategory,
    updateCategory,
    deleteCategory,
    createLabel,
    updateLabel,
    deleteLabel,
    setFilters,
    resetFilters,
    clearBacklogs,
  } = useBacklogStore();

  const { currentProject, fetchProjectById } = useProjectStore();

  // ─── Load Data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId);
      fetchBacklogs(projectId);
      fetchStats(projectId);
      fetchCategories(projectId);
      fetchLabels(projectId);
      fetchTasks(projectId);
    }
    return () => {
      clearBacklogs();
    };
  }, [projectId]);

  // ─── PDF Download Handler ──────────────────────────────────────────────────

  const handleDownloadPDF = async () => {
    if (backlogs.length === 0) {
      showError("No backlogs to download");
      return;
    }

    try {
      setDownloading(true);
      showSuccess("Generating PDF report...");

      const doc = await generateBacklogPDF(
        backlogs,
        currentProject?.name || "All Projects",
        stats?.stats || { total: 0, pending: 0, inProgress: 0, completed: 0 },
      );

      // Save the PDF
      const fileName = `Backlog_Report_${currentProject?.name || "All"}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      showSuccess("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      showError("Failed to generate PDF report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ─── Category Handlers ─────────────────────────────────────────────────────

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showError("Please enter a category name");
      return;
    }

    try {
      setCategoryLoading(true);
      const result = await createCategory(projectId, {
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });
      if (result) {
        showSuccess("Category created successfully");
        setNewCategoryName("");
        setNewCategoryColor("#6B7280");
        fetchCategories(projectId);
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create category");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleUpdateCategory = async (categoryId) => {
    if (!editingCategoryName.trim()) {
      showError("Please enter a category name");
      return;
    }

    try {
      setCategoryLoading(true);
      const result = await updateCategory(categoryId, {
        name: editingCategoryName.trim(),
      });
      if (result) {
        showSuccess("Category updated successfully");
        setEditingCategoryId(null);
        setEditingCategoryName("");
        fetchCategories(projectId);
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update category");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(categoryId);
        showSuccess("Category deleted successfully");
        fetchCategories(projectId);
      } catch (error) {
        showError(error.response?.data?.message || "Failed to delete category");
      }
    }
  };

  const startEditingCategory = (category) => {
    setEditingCategoryId(category._id);
    setEditingCategoryName(category.name);
  };

  const cancelEditingCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  // ─── Label Handlers ───────────────────────────────────────────────────────

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      showError("Please enter a label name");
      return;
    }

    try {
      setLabelLoading(true);
      const result = await createLabel(projectId, {
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      if (result) {
        showSuccess("Label created successfully");
        setNewLabelName("");
        setNewLabelColor("#6B7280");
        fetchLabels(projectId);
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create label");
    } finally {
      setLabelLoading(false);
    }
  };

  const handleUpdateLabel = async (labelId) => {
    if (!editingLabelName.trim()) {
      showError("Please enter a label name");
      return;
    }

    try {
      setLabelLoading(true);
      const result = await updateLabel(labelId, {
        name: editingLabelName.trim(),
      });
      if (result) {
        showSuccess("Label updated successfully");
        setEditingLabelId(null);
        setEditingLabelName("");
        fetchLabels(projectId);
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update label");
    } finally {
      setLabelLoading(false);
    }
  };

  const handleDeleteLabel = async (labelId) => {
    if (window.confirm("Are you sure you want to delete this label?")) {
      try {
        await deleteLabel(labelId);
        showSuccess("Label deleted successfully");
        fetchLabels(projectId);
      } catch (error) {
        showError("Failed to delete label");
      }
    }
  };

  const startEditingLabel = (label) => {
    setEditingLabelId(label._id);
    setEditingLabelName(label.name);
  };

  const cancelEditingLabel = () => {
    setEditingLabelId(null);
    setEditingLabelName("");
  };

  // ─── Backlog Handlers ─────────────────────────────────────────────────────

  const handleFilterChange = useCallback(
    (key, value) => {
      setFilters({ [key]: value });
      fetchBacklogs(projectId, { [key]: value, page: 1 });
    },
    [projectId],
  );

  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters({ search: value });
    clearTimeout(searchInputRef.current);
    searchInputRef.current = setTimeout(() => {
      fetchBacklogs(projectId, { search: value, page: 1 });
    }, 500);
  };

  const handleRefresh = () => {
    fetchBacklogs(projectId);
    fetchStats(projectId);
    showSuccess("Backlog refreshed");
  };

  const handleResetFilters = () => {
    resetFilters();
    fetchBacklogs(projectId, { page: 1 });
  };

  const handlePageChange = (page) => {
    fetchBacklogs(projectId, { page });
  };

  const handleCreateBacklog = async (backlogData) => {
    try {
      setCreating(true);
      const result = await createBacklog(projectId, backlogData);
      if (result) {
        showSuccess("Backlog created successfully");
        setShowCreateModal(false);
        fetchBacklogs(projectId);
        fetchStats(projectId);
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create backlog");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (backlogId, status) => {
    try {
      await updateBacklog(backlogId, { status });
      showSuccess("Status updated");
      fetchBacklogs(projectId);
      fetchStats(projectId);
    } catch (error) {
      showError("Failed to update status");
    }
  };

  const handleDeleteBacklog = async (backlogId) => {
    if (window.confirm("Are you sure you want to delete this backlog item?")) {
      try {
        await deleteBacklog(backlogId);
        showSuccess("Backlog deleted");
        fetchBacklogs(projectId);
        fetchStats(projectId);
      } catch (error) {
        showError("Failed to delete backlog");
      }
    }
  };

  const handleBulkAction = async (action, value = null) => {
    if (selectedBacklogs.length === 0) {
      showError("Please select at least one backlog item");
      return;
    }

    if (action === "delete") {
      if (window.confirm(`Delete ${selectedBacklogs.length} backlog items?`)) {
        try {
          for (const id of selectedBacklogs) {
            await deleteBacklog(id);
          }
          showSuccess(`${selectedBacklogs.length} items deleted`);
          setSelectedBacklogs([]);
          fetchBacklogs(projectId);
          fetchStats(projectId);
        } catch (error) {
          showError("Failed to delete items");
        }
      }
    }

    if (action === "status" && value) {
      try {
        for (const id of selectedBacklogs) {
          await updateBacklog(id, { status: value });
        }
        showSuccess(`Updated ${selectedBacklogs.length} items to ${value}`);
        setSelectedBacklogs([]);
        fetchBacklogs(projectId);
        fetchStats(projectId);
      } catch (error) {
        showError("Failed to update status");
      }
    }
  };

  const toggleBacklogSelection = (backlogId) => {
    setSelectedBacklogs((prev) =>
      prev.includes(backlogId)
        ? prev.filter((id) => id !== backlogId)
        : [...prev, backlogId],
    );
  };

  const toggleAllBacklogs = () => {
    if (selectedBacklogs.length === backlogs.length) {
      setSelectedBacklogs([]);
    } else {
      setSelectedBacklogs(backlogs.map((b) => b._id));
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loadingBacklogs && backlogs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto border-b-2 border-blue-500 rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-500">Loading backlogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* ─── LEFT SIDEBAR - Project Card ─────────────────────────────────── */}
        <div className="w-[280px] flex-shrink-0 p-4 border-r border-gray-200 bg-white min-h-screen">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-2 mb-4 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            <FiChevronLeft className="w-4 h-4" />
            Back to Project
          </button>

          {/* Project Card */}
          {currentProject && (
            <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
              <div
                className="relative w-full h-[120px] flex flex-col justify-between p-4"
                style={{
                  backgroundColor:
                    currentProject.cardColor ||
                    currentProject.workflow?.iconColor ||
                    "#3B82F6",
                }}
              >
                <div className="flex justify-end">
                  <button className="transition-colors text-white/80 hover:text-white">
                    {currentProject?.isStarred ? (
                      <MdStar className="w-5 h-5 text-yellow-300" />
                    ) : (
                      <MdStarBorder className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <h2 className="text-lg font-semibold text-white truncate">
                  {currentProject.name}
                </h2>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Creator
                  </p>
                  <p className="text-sm text-gray-700">
                    {currentProject.createdBy?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Supervisor
                  </p>
                  <p className="text-sm text-gray-700">
                    {currentProject.supervisor?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Status
                  </p>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      currentProject.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : currentProject.status === "in-progress"
                          ? "bg-blue-100 text-blue-700"
                          : currentProject.status === "planning"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {currentProject.status || "Planning"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Categories Section ────────────────────────────────────────── */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Categories
              </h3>
            </div>

            {/* Add Category Input */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category..."
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleCreateCategory()}
              />
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-8 h-8 p-0 border border-gray-300 rounded cursor-pointer"
              />
              <button
                onClick={handleCreateCategory}
                disabled={categoryLoading || !newCategoryName.trim()}
                className="px-2 py-1 text-xs text-white transition-colors bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {categoryLoading ? "..." : "Add"}
              </button>
            </div>

            <div className="space-y-1.5">
              {categories.length === 0 ? (
                <p className="text-xs text-gray-400">No categories yet</p>
              ) : (
                categories.map((category) => (
                  <div
                    key={category._id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-gray-50 group"
                  >
                    {editingCategoryId === category._id ? (
                      <div className="flex items-center flex-1 gap-2">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) =>
                            setEditingCategoryName(e.target.value)
                          }
                          className="flex-1 px-2 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            handleUpdateCategory(category._id)
                          }
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateCategory(category._id)}
                          className="text-xs text-green-600 hover:text-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditingCategory}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-gray-700">
                            {category.name}
                          </span>
                        </div>
                        <div className="items-center hidden gap-1 group-hover:flex">
                          <button
                            onClick={() => startEditingCategory(category)}
                            className="p-0.5 text-gray-400 hover:text-gray-600"
                          >
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category._id)}
                            className="p-0.5 text-gray-400 hover:text-red-500"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ─── Labels Section ────────────────────────────────────────────── */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Labels</h3>
            </div>

            {/* Add Label Input */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="New label..."
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleCreateLabel()}
              />
              <input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="w-8 h-8 p-0 border border-gray-300 rounded cursor-pointer"
              />
              <button
                onClick={handleCreateLabel}
                disabled={labelLoading || !newLabelName.trim()}
                className="px-2 py-1 text-xs text-white transition-colors bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {labelLoading ? "..." : "Add"}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {labels.length === 0 ? (
                <p className="text-xs text-gray-400">No labels yet</p>
              ) : (
                labels.map((label) => (
                  <span
                    key={label._id}
                    className="group flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                    style={{
                      backgroundColor: label.color + "20",
                      color: label.color,
                    }}
                  >
                    {editingLabelId === label._id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingLabelName}
                          onChange={(e) => setEditingLabelName(e.target.value)}
                          className="w-20 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleUpdateLabel(label._id)
                          }
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateLabel(label._id)}
                          className="text-xs text-green-600 hover:text-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditingLabel}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {label.name}
                        <button
                          onClick={() => startEditingLabel(label)}
                          className="transition-opacity opacity-0 group-hover:opacity-100 hover:text-gray-700"
                        >
                          <FiEdit2 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLabel(label._id)}
                          className="transition-opacity opacity-0 group-hover:opacity-100 hover:text-red-500"
                        >
                          <FiTrash2 className="w-2.5 h-2.5" />
                        </button>
                      </>
                    )}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT MAIN CONTENT ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Backlog</h1>
              <p className="text-sm text-gray-500">
                Manage and prioritize your project work items
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* ─── DOWNLOAD PDF BUTTON ──────────────────────────────────── */}
              <button
                onClick={handleDownloadPDF}
                disabled={downloading || backlogs.length === 0}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-lg ${
                  downloading || backlogs.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
                title={
                  backlogs.length === 0
                    ? "No backlogs to download"
                    : "Download PDF Report"
                }
              >
                <FiDownload className="w-4 h-4" />
                {downloading ? "Generating..." : "Download PDF"}
              </button>
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100"
                title="Refresh"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <FiPlus className="w-4 h-4" />
                Add Backlog
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">
                {stats?.stats?.total || 0}
              </p>
            </div>
            <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600">
                {stats?.stats?.pending || 0}
              </p>
            </div>
            <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500">In Progress</p>
              <p className="text-xl font-bold text-blue-600">
                {stats?.stats?.inProgress || 0}
              </p>
            </div>
            <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-xl font-bold text-green-600">
                {stats?.stats?.completed || 0}
              </p>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex-1 min-w-[200px] relative">
              <FiSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search backlogs..."
                defaultValue={filters.search || ""}
                onChange={handleSearch}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiFilter className="w-4 h-4" />
                Filters
                {(filters.status ||
                  filters.priority ||
                  filters.category ||
                  filters.label) && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>

              <select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.priority || ""}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priority</option>
                {priorityOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedBacklogs.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500">
                  {selectedBacklogs.length} selected
                </span>
                <select
                  onChange={(e) => handleBulkAction("status", e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Bulk Status</option>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          {/* Filter Chips */}
          {(filters.status ||
            filters.priority ||
            filters.category ||
            filters.label) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {filters.status && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs text-blue-700 rounded-full bg-blue-50">
                  Status: {filters.status}
                  <button onClick={() => handleFilterChange("status", "")}>
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.priority && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs text-blue-700 rounded-full bg-blue-50">
                  Priority: {filters.priority}
                  <button onClick={() => handleFilterChange("priority", "")}>
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Backlog Table */}
          <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedBacklogs.length === backlogs.length &&
                          backlogs.length > 0
                        }
                        onChange={toggleAllBacklogs}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Assignee
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Created
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingBacklogs ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        <div className="flex justify-center">
                          <div className="w-6 h-6 border-2 border-blue-500 rounded-full border-b-transparent animate-spin" />
                        </div>
                      </td>
                    </tr>
                  ) : backlogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        <FiClock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No backlogs found</p>
                        <p className="mt-1 text-sm text-gray-400">
                          {filters.search || filters.status || filters.priority
                            ? "Try adjusting your filters"
                            : "Create your first backlog item"}
                        </p>
                        {!filters.search &&
                          !filters.status &&
                          !filters.priority && (
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                            >
                              + Add Backlog
                            </button>
                          )}
                      </td>
                    </tr>
                  ) : (
                    backlogs.map((backlog) => (
                      <tr
                        key={backlog._id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedBacklogs.includes(backlog._id)}
                            onChange={() => toggleBacklogSelection(backlog._id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          #{backlog._id.toString().slice(-6)}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="max-w-xs text-sm font-medium text-gray-900 truncate">
                              {backlog.title || "Untitled"}
                            </p>
                            {backlog.referenceData?.taskId && (
                              <p className="max-w-xs text-xs text-indigo-500 truncate">
                                Linked to task:{" "}
                                {backlog.referenceData.taskId.name}
                              </p>
                            )}
                            {backlog.description && (
                              <p className="max-w-xs text-xs text-gray-500 truncate">
                                {backlog.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={backlog.status}
                            onChange={(e) =>
                              handleStatusChange(backlog._id, e.target.value)
                            }
                            className={`text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusBadge(backlog.status)}`}
                          >
                            {statusOptions.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(backlog.priority)}`}
                          >
                            {backlog.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {backlog.category ? (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: backlog.category.color + "20",
                                color: backlog.category.color,
                              }}
                            >
                              {backlog.category.name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {backlog.assignTo ? (
                            <div className="flex items-center gap-1.5">
                              <img
                                src={
                                  backlog.assignTo.avatar ||
                                  `https://ui-avatars.com/api/?name=${backlog.assignTo.name}`
                                }
                                alt={backlog.assignTo.name}
                                className="w-6 h-6 rounded-full"
                              />
                              <span className="text-xs text-gray-700 truncate max-w-[80px]">
                                {backlog.assignTo.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatDate(backlog.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDeleteBacklog(backlog._id)}
                              className="p-1 text-gray-400 transition-colors hover:text-red-500"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-500">
                  {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} -{" "}
                  {Math.min(
                    pagination.currentPage * pagination.itemsPerPage,
                    pagination.totalItems,
                  )}{" "}
                  of {pagination.totalItems}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="px-3 py-1 text-sm transition-colors border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-1 text-sm transition-colors border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Backlog Modal */}
      <CreateBacklogModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBacklog}
        loading={creating}
        categories={categories}
        labels={labels}
        tasks={tasks}
        loadingTasks={loadingTasks}
        projectId={projectId}
      />
    </div>
  );
};

export default BacklogView;
