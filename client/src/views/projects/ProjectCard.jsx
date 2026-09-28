// views/projects/ProjectCard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MdStar, MdStarBorder } from "react-icons/md";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import UpdateProjectForm from "./UpdateProjectForm";
import { useProjectStore } from "../../stores/useProjectStore";
import { showSuccess, showError } from "../../components/toaster/Toaster";

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

const ProjectCard = ({ project, onProjectUpdated }) => {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [updatingColor, setUpdatingColor] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [showProgressTooltip, setShowProgressTooltip] = useState(false);
  // Initialize color from persisted project color (fallback to workflow color)
  const [selectedColor, setSelectedColor] = useState(
    project.cardColor || project.workflow?.iconColor || "#3B82F6",
  );
  const { deleteProject, updateProjectColor, toggleStarProject, closeProject } =
    useProjectStore();

  useEffect(() => {
    setSelectedColor(
      project?.cardColor || project?.workflow?.iconColor || "#3B82F6",
    );
  }, [project?.cardColor, project?.workflow?.iconColor]);

  // Subscribe to global menu events
  useEffect(() => {
    const unsubscribe = menuEvents.subscribe((activeCardId) => {
      if (activeCardId !== project._id && showMenu) {
        setShowMenu(false);
      }
    });
    return unsubscribe;
  }, [project._id, showMenu]);

  // Handle click outside
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

  // Check if project is starred by current user
  useEffect(() => {
    if (project) {
      setIsStarred(project.isStarred === true);
    }
  }, [project]);

  if (!project || !project._id || project._id === "create") return null;

  // Check if project can be closed (not already completed or cancelled)
  const canClose =
    project.status !== "completed" && project.status !== "cancelled";

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

  const getDateDisplay = () => {
    if (project.isContinuous) return "Active";
    if (project.endDate) {
      const d = new Date(project.endDate);
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

  const handleCardClick = () => navigate(`/projects/${project._id}`);

  const handleToggleStar = async (e) => {
    e.stopPropagation();
    try {
      const response = await toggleStarProject(project._id);
      setIsStarred(response.isStarred);
      showSuccess(response.message);
      if (onProjectUpdated) onProjectUpdated();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update star");
    }
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    const newState = !showMenu;
    setShowMenu(newState);
    if (newState) {
      menuEvents.notify(project._id);
    }
  };

  const handleCloseProject = async () => {
    try {
      setClosing(true);
      await closeProject(project._id);
      showSuccess("Project closed successfully!");
      if (onProjectUpdated) onProjectUpdated();
      setShowCloseDialog(false);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to close project");
    } finally {
      setClosing(false);
    }
  };

  const handleUpdateColor = async (nextColor) => {
    try {
      setUpdatingColor(true);
      const colorToSave = nextColor || selectedColor;
      const response = await updateProjectColor(project._id, colorToSave);

      // Update local state with the returned project's cardColor
      if (response?.project?.cardColor) {
        setSelectedColor(response.project.cardColor);
        showSuccess("Project color updated!");
      } else {
        showSuccess("Project color updated!");
      }

      setShowMenu(false);

      // Refresh the parent component to update the project list
      if (onProjectUpdated) onProjectUpdated();
    } catch (error) {
      console.error("Update color error:", error);
      showError(error.response?.data?.message || "Failed to update color");
    } finally {
      setUpdatingColor(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteProject(project._id);
      showSuccess("Project deleted!");
      if (onProjectUpdated) onProjectUpdated();
      setShowDeleteDialog(false);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const handleProjectUpdated = () => {
    if (onProjectUpdated) onProjectUpdated();
  };

  const totalTasks = Array.isArray(project?.tasks) ? project.tasks.length : 0;
  const pendingTasks = Array.isArray(project?.tasks)
    ? project.tasks.filter((task) => task?.status !== "completed").length
    : 0;
  const totalMilestones = Array.isArray(project?.milestones)
    ? project.milestones.length
    : 0;
  const pendingMilestones = Array.isArray(project?.milestones)
    ? project.milestones.filter(
        (milestone) => milestone?.status !== "completed",
      ).length
    : 0;

  return (
    <>
      <div
        className="relative w-full max-w-[240px] sm:max-w-[220px] md:max-w-[240px] h-[180px] rounded-lg flex flex-col justify-between p-[12px] sm:p-[14px] cursor-pointer transition-transform shadow-sm mx-auto"
        style={{ backgroundColor: selectedColor }}
        onClick={handleCardClick}
      >
        {/* Top Row: Name + Star + Menu */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white truncate max-w-[130px]">
            {project.name}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Star Button */}
            <button
              onClick={handleToggleStar}
              className="transition-transform hover:scale-110 focus:outline-none"
              aria-label={isStarred ? "Unstar project" : "Star project"}
            >
              {isStarred ? (
                <MdStar className="w-4 h-4 text-yellow-400 drop-shadow-sm" />
              ) : (
                <MdStarBorder className="w-4 h-4 text-white/80" />
              )}
            </button>

            {/* Three dots */}
            <button
              ref={buttonRef}
              onClick={handleMenuToggle}
              className="text-lg leading-none text-white hover:opacity-75 focus:outline-none"
              aria-label="Project menu"
            >
              ⋮
            </button>
          </div>
        </div>

        {/* Middle: Progress */}
        <div>
          <p
            className="text-[11px] mb-1.5"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {project.progress || 0}% Progress
          </p>
          <div
            className="relative w-full h-2 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.35)" }}
            onMouseEnter={() => setShowProgressTooltip(true)}
            onMouseLeave={() => setShowProgressTooltip(false)}
          >
            <div
              className="h-2 transition-all duration-300 bg-white rounded-full"
              style={{ width: `${project.progress || 0}%` }}
            />
            {showProgressTooltip && (
              <div
                className="absolute left-0 z-20 px-3 py-2 text-xs rounded-lg shadow-lg -top-2 translate-y-[-100%] min-w-[180px] border border-white/40"
                style={{
                  backgroundColor: selectedColor,
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                {/* <div className="font-semibold text-white">Project Summary</div> */}
                <div className="mt-1 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span>Total Tasks</span>
                    <span className="font-medium">{totalTasks}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Pending Tasks</span>
                    <span className="font-medium">{pendingTasks}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Total Milestones</span>
                    <span className="font-medium">{totalMilestones}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Pending Milestones</span>
                    <span className="font-medium">{pendingMilestones}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Date / Active */}
        <div
          className="flex items-center justify-between"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          <span className="text-xs">{getDateDisplay()}</span>
          <span className="text-sm">›</span>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute top-0 z-30 flex overflow-hidden bg-white border border-gray-100 rounded-lg shadow-xl left-44 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side - Color Plates */}
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
                      setSelectedColor(color);
                      handleUpdateColor(color);
                    }}
                    disabled={updatingColor}
                    className={`w-8 h-8 rounded-md cursor-pointer hover:scale-110 transition-transform border-2 ${
                      selectedColor === color
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    title="Change color"
                  />
                ))}
              </div>
              {/* Custom Color Picker */}
              <div className="mt-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => {
                    const nextColor = e.target.value;
                    setSelectedColor(nextColor);
                    handleUpdateColor(nextColor);
                  }}
                  className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex-1 p-2">
              <p className="mb-2 text-xs font-medium text-center text-gray-500">
                Actions
              </p>
              <div className="space-y-1">
                {/* Edit Button */}
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

                {/* Close Button */}
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

                {/* Delete Button */}
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
      </div>

      {/* Update Project Modal */}
      <UpdateProjectForm
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        project={project}
        onProjectUpdated={handleProjectUpdated}
      />

      {/* Close Project Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onConfirm={handleCloseProject}
        title="Close Project"
        message={`Are you sure you want to close "${project.name}"? This will mark the project as completed with 100% progress.`}
        loading={closing}
        confirmText="Close Project"
        cancelText="Cancel"
        confirmButtonColor="green"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        loading={deleting}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
      />
    </>
  );
};

export default ProjectCard;
