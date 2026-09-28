// views/tasks/TaskDetailPage.jsx - Updated with Direct Star Rating

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdStar, MdStarBorder, MdAdd, MdDeleteForever } from "react-icons/md";
import { GoPlusCircle } from "react-icons/go";
import { FaStar, FaRegStar } from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { useTaskStore } from "../../stores/useTaskStore";
import { useMilestoneStore } from "../../stores/useMilestoneStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { showSuccess, showError } from "../../components/toaster/Toaster";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import CreateMilestoneModal from "../milestones/CreateMilestoneModal";
import UpdateProjectForm from "../projects/UpdateProjectForm";
import AddTaskMemberModal from "./AddTaskMemberModal";

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

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);
  const [showCloseProjectDialog, setShowCloseProjectDialog] = useState(false);
  const [showUpdateProjectModal, setShowUpdateProjectModal] = useState(false);
  const [showCreateMilestoneModal, setShowCreateMilestoneModal] =
    useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [projectDeleting, setProjectDeleting] = useState(false);
  const [projectClosing, setProjectClosing] = useState(false);
  const [projectUpdatingColor, setProjectUpdatingColor] = useState(false);
  const [showCompleteMilestoneDialog, setShowCompleteMilestoneDialog] =
    useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  const [completingMilestone, setCompletingMilestone] = useState(false);

  const [showRejectMilestoneDialog, setShowRejectMilestoneDialog] =
    useState(false);
  const [selectedRejectMilestoneId, setSelectedRejectMilestoneId] =
    useState(null);
  const [rejectingMilestone, setRejectingMilestone] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewInput, setShowReviewInput] = useState(null);

  const {
    currentTask,
    fetchTaskById,
    loading,
    clearCurrentTask,
    updateTask,
    addTaskMember,
    removeTaskMember,
    toggleStarTask,
    completeTask,
  } = useTaskStore();

  const {
    milestones,
    fetchMilestonesByTask,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    toggleStarMilestone,
    clearMilestones,
    pickMilestone,
    completeMilestone,
    rejectMilestone,
    rateMilestone,
    addReviewComment,
    deleteReviewComment,
  } = useMilestoneStore();

  const {
    currentProject,
    formData: formOptions,
    fetchFormData,
    fetchProjectById,
    deleteProject,
    updateProjectColor,
    toggleStarProject,
    closeProject,
  } = useProjectStore();

  useEffect(() => {
    if (taskId) {
      fetchTaskById(taskId);
      fetchMilestonesByTask(taskId);
      fetchFormData();
    }
    return () => {
      clearCurrentTask();
      clearMilestones();
    };
  }, [taskId]);

  // Refetch milestones when the tab regains focus so members see new ratings/comments
  useEffect(() => {
    if (!taskId) return;

    const refetchMilestones = () => {
      if (document.visibilityState === "visible") {
        fetchMilestonesByTask(taskId);
      }
    };

    window.addEventListener("focus", refetchMilestones);
    document.addEventListener("visibilitychange", refetchMilestones);

    return () => {
      window.removeEventListener("focus", refetchMilestones);
      document.removeEventListener("visibilitychange", refetchMilestones);
    };
  }, [taskId, fetchMilestonesByTask]);

  // Fetch project details when task's project ID is available
  useEffect(() => {
    if (
      currentTask?.project?._id &&
      currentTask.project._id !== currentProject?._id
    ) {
      fetchProjectById(currentTask.project._id);
    }
  }, [currentTask?.project?._id]);

  // Subscribe to global menu events for project card
  useEffect(() => {
    const unsubscribe = menuEvents.subscribe((activeCardId) => {
      if (activeCardId !== currentProject?._id && showProjectMenu) {
        setShowProjectMenu(false);
      }
    });
    return unsubscribe;
  }, [currentProject?._id, showProjectMenu]);

  // Handle click outside for project menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showProjectMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowProjectMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProjectMenu]);

  const getProjectDateDisplay = () => {
    if (!currentProject) return "No date";
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

  const handleProjectMenuToggle = (e) => {
    e.stopPropagation();
    const newState = !showProjectMenu;
    setShowProjectMenu(newState);
    if (newState) {
      menuEvents.notify(currentProject?._id);
    }
  };

  const handleToggleProjectStar = async (e) => {
    e.stopPropagation();
    try {
      await toggleStarProject(currentProject._id);
      showSuccess("Star updated successfully");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update star");
    }
  };

  const handleUpdateProjectColor = async (nextColor) => {
    try {
      setProjectUpdatingColor(true);
      await updateProjectColor(currentProject._id, nextColor);
      showSuccess("Project color updated!");
      setShowProjectMenu(false);
      fetchProjectById(currentProject._id);
    } catch (error) {
      console.error("Update color error:", error);
      showError(error.response?.data?.message || "Failed to update color");
    } finally {
      setProjectUpdatingColor(false);
    }
  };

  const handleCloseProject = async () => {
    try {
      setProjectClosing(true);
      await closeProject(currentProject._id);
      showSuccess("Project closed successfully!");
      setShowCloseProjectDialog(false);
      fetchProjectById(currentProject._id);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to close project");
    } finally {
      setProjectClosing(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setProjectDeleting(true);
      await deleteProject(currentProject._id);
      showSuccess("Project deleted");
      navigate("/projects");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete project");
    } finally {
      setProjectDeleting(false);
    }
  };

  const handleProjectUpdated = () => {
    fetchProjectById(currentProject._id);
    setShowUpdateProjectModal(false);
  };

  const canProjectClose =
    currentProject &&
    currentProject.status !== "completed" &&
    currentProject.status !== "cancelled";

  // Milestone handlers
  const handleCreateMilestone = async (milestoneData) => {
    if (currentTask?.status === "completed") {
      showError("Cannot add milestones to a completed task");
      return;
    }

    try {
      setCreating(true);
      await createMilestone(milestoneData);
      showSuccess("Milestone created successfully");
      setShowCreateMilestoneModal(false);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create milestone");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateMilestone = async (milestoneData) => {
    try {
      setCreating(true);
      await updateMilestone(editingMilestone._id, milestoneData);
      showSuccess("Milestone updated successfully");
      setEditingMilestone(null);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update milestone");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId, milestoneName) => {
    if (window.confirm(`Are you sure you want to delete "${milestoneName}"?`)) {
      try {
        await deleteMilestone(milestoneId);
        showSuccess("Milestone deleted successfully");
      } catch (error) {
        showError(
          error.response?.data?.message || "Failed to delete milestone",
        );
      }
    }
  };

  const handlePickMilestone = async (milestoneId) => {
    try {
      await pickMilestone(milestoneId);
      showSuccess("Milestone picked successfully!");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to pick milestone");
    }
  };

  const handleCompleteMilestone = (milestoneId) => {
    setSelectedMilestoneId(milestoneId);
    setShowCompleteMilestoneDialog(true);
  };

  const confirmCompleteMilestone = async () => {
    if (!selectedMilestoneId) return;

    try {
      setCompletingMilestone(true);
      await completeMilestone(selectedMilestoneId);
      showSuccess("Milestone completed successfully!");
      setShowCompleteMilestoneDialog(false);
      setSelectedMilestoneId(null);
    } catch (error) {
      console.error("Complete milestone error:", error);
      showError(
        error.response?.data?.message || "Failed to complete milestone",
      );
    } finally {
      setCompletingMilestone(false);
    }
  };

  const handleRejectMilestone = (milestoneId) => {
    setSelectedRejectMilestoneId(milestoneId);
    setRejectionReason("");
    setShowRejectMilestoneDialog(true);
  };

  const confirmRejectMilestone = async () => {
    if (!selectedRejectMilestoneId) return;

    try {
      setRejectingMilestone(true);
      await rejectMilestone(selectedRejectMilestoneId, rejectionReason);
      showSuccess(
        "Milestone rejected successfully! The task member can pick it again.",
      );
      setShowRejectMilestoneDialog(false);
      setSelectedRejectMilestoneId(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Reject milestone error:", error);
      showError(error.response?.data?.message || "Failed to reject milestone");
    } finally {
      setRejectingMilestone(false);
    }
  };

  const handleAddTaskMember = async (userId, role) => {
    if (!currentTask) return;
    try {
      const updatedTask = await addTaskMember(currentTask._id, userId, role);
      if (updatedTask) {
        await fetchTaskById(currentTask._id);
        showSuccess("Member added successfully");
      }
    } catch (error) {
      console.error("Failed to add member:", error);
      showError(error.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveTaskMember = async (userId, role) => {
    if (!currentTask) return;
    try {
      const updatedTask = await removeTaskMember(currentTask._id, userId, role);
      if (updatedTask) {
        await fetchTaskById(currentTask._id);
        showSuccess("Member removed successfully");
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
      showError(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleToggleTaskStar = async () => {
    if (!currentTask) return;
    try {
      await toggleStarTask(currentTask._id);
      showSuccess(currentTask.isStarred ? "Task unstarred" : "Task starred");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update star");
    }
  };

  const handleCompleteTask = async () => {
    if (!currentTask) return;

    if (currentTask.status === "completed") {
      showError("Task is already completed");
      return;
    }

    if (
      window.confirm("Are you sure you want to mark this task as completed?")
    ) {
      try {
        await completeTask(currentTask._id);
        showSuccess("Task completed successfully!");
        await fetchTaskById(currentTask._id);
      } catch (error) {
        console.error("Complete task error:", error);
        showError(error.response?.data?.message || "Failed to complete task");
      }
    }
  };

  // Direct star rating handler - no modal
  const handleDirectRateMilestone = async (milestoneId, rating) => {
    try {
      await rateMilestone(milestoneId, rating);
      showSuccess(
        `Rating ${rating} star${rating > 1 ? "s" : ""} added successfully!`,
      );
      await fetchMilestonesByTask(taskId);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to rate milestone");
    }
  };

  // Review comment handlers
  const handleAddReviewComment = async (milestoneId) => {
    if (!reviewText.trim()) {
      showError("Please enter a review comment");
      return;
    }

    try {
      setSubmittingReview(true);
      await addReviewComment(milestoneId, reviewText.trim());
      showSuccess("Review comment added successfully!");
      setReviewText("");
      setShowReviewInput(null);
      await fetchMilestonesByTask(taskId);
    } catch (error) {
      showError(
        error.response?.data?.message || "Failed to add review comment",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReviewComment = async (milestoneId, commentId) => {
    if (
      window.confirm("Are you sure you want to delete this review comment?")
    ) {
      try {
        await deleteReviewComment(milestoneId, commentId);
        showSuccess("Review comment deleted successfully");
        await fetchMilestonesByTask(taskId);
      } catch (error) {
        showError(
          error.response?.data?.message || "Failed to delete review comment",
        );
      }
    }
  };

  if (loading && !currentTask) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div className="min-h-screen py-8 bg-gray-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Task not found</p>
            <button
              onClick={() => navigate("/tasks")}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Back to Tasks
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(
    (m) => m.status === "completed",
  ).length;

  const taskMembers = {
    responsible: currentTask.responsible || [],
    accountable: currentTask.accountable || [],
    consultant: currentTask.consultant || [],
    informed: currentTask.informed || [],
  };

  const roleLabels = {
    responsible: "Responsible",
    accountable: "Accountable",
    consultant: "Consultant",
    informed: "Informed",
  };

  const roleColors = {
    responsible: "bg-blue-100 text-blue-700",
    accountable: "bg-green-100 text-green-700",
    consultant: "bg-purple-100 text-purple-700",
    informed: "bg-gray-100 text-gray-700",
  };

  const getTaskMembersArray = () => {
    const memberMap = new Map();
    Object.values(taskMembers).forEach((members) => {
      members.forEach((member) => {
        if (!memberMap.has(member._id)) {
          memberMap.set(member._id, member);
        }
      });
    });
    return Array.from(memberMap.values());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(`/projects/${currentTask?.project?._id}`)}
          className="flex items-center gap-2 mb-4 text-gray-600 transition-colors hover:text-gray-800"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Project
        </button>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left Column - Project Card */}
          {currentProject && (
            <div className="w-full lg:w-[280px] lg:flex-shrink-0">
              <div className="overflow-hidden bg-white border border-gray-100 rounded-lg shadow-sm">
                <div
                  className="relative w-full h-[200px] flex flex-col justify-between p-4"
                  style={{
                    backgroundColor:
                      currentProject.cardColor ||
                      currentProject.workflow?.iconColor ||
                      "#3B82F6",
                  }}
                >
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleToggleProjectStar}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      {currentProject?.isStarred ? (
                        <MdStar className="w-5 h-5 text-yellow-300 drop-shadow-md" />
                      ) : (
                        <MdStarBorder className="w-5 h-5 text-white/80" />
                      )}
                    </button>
                    <button
                      ref={buttonRef}
                      onClick={handleProjectMenuToggle}
                      className="text-xl leading-none text-white hover:opacity-75 focus:outline-none"
                    >
                      ⋮
                    </button>
                  </div>
                  <h1 className="text-2xl font-semibold leading-tight text-center text-white">
                    {currentProject.name}
                  </h1>
                  <div
                    className="flex items-center justify-end gap-2 text-right text-white"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    <span className="text-lg">{getProjectDateDisplay()}</span>
                    <span className="text-2xl">›</span>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Creator
                    </p>
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

                  {currentTask && (
                    <div>
                      {(currentProject?.createdBy?._id === user?._id ||
                        currentProject?.supervisor?._id === user?._id) && (
                        <button
                          onClick={() => setShowAddMemberModal(true)}
                          className="flex items-center justify-center w-full gap-2 px-4 py-2 mb-3 text-sm text-gray-600 transition-colors bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
                          title="Add member to task"
                        >
                          <GoPlusCircle className="w-5 h-5 text-gray-500" />
                          Add member to task
                        </button>
                      )}

                      <div className="space-y-2">
                        {Object.entries(taskMembers).map(
                          ([role, members]) =>
                            members.length > 0 &&
                            members.map((member) => (
                              <div
                                key={`${role}-${member._id}`}
                                className="flex flex-col px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center flex-shrink-0 overflow-hidden text-sm font-semibold text-white bg-blue-500 rounded-full w-9 h-9">
                                      {member.avatar ? (
                                        <img
                                          src={member.avatar}
                                          alt={member.name}
                                          className="object-cover w-full h-full"
                                        />
                                      ) : (
                                        member.name?.charAt(0).toUpperCase() ||
                                        "U"
                                      )}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800">
                                      {member.name}
                                    </span>
                                  </div>

                                  {(currentProject?.createdBy?._id ===
                                    user?._id ||
                                    currentProject?.supervisor?._id ===
                                      user?._id) && (
                                    <button
                                      onClick={() =>
                                        handleRemoveTaskMember(member._id, role)
                                      }
                                      className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 transition-colors"
                                      title="Remove member"
                                    >
                                      <MdDeleteForever className="w-6 h-6" />
                                    </button>
                                  )}
                                </div>
                                <span
                                  className={`text-xs font-medium px-2 py-1 mt-2 rounded-full w-fit ${roleColors[role]}`}
                                >
                                  {roleLabels[role]}
                                </span>
                              </div>
                            )),
                        )}
                        {Object.values(taskMembers).every(
                          (members) => members.length === 0,
                        ) && (
                          <p className="py-2 text-xs text-center text-gray-400">
                            No members assigned yet.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right Column - Milestones Section */}
          <div className="flex-1 min-w-0">
            <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-5 pt-4 pb-3 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-900">
                  {currentTask.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {currentTask.tags?.map((tag, i) => (
                    <span key={i} className="text-xs text-gray-500">
                      {tag}
                    </span>
                  ))}
                  {currentTask.category && (
                    <span className="text-xs text-gray-500">
                      {currentTask.category}
                    </span>
                  )}
                </div>
                {currentTask.description && (
                  <p className="mt-1 text-xs text-gray-400">
                    {currentTask.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs text-gray-600">
                    {currentTask?.createdAt
                      ? new Date(currentTask.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "N/A"}
                  </span>
                  <span className="text-gray-400">→</span>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs text-gray-600">
                    {currentTask?.dueDate
                      ? new Date(currentTask.dueDate).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "No due date"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {(currentProject?.createdBy?._id === user?._id ||
                    currentProject?.supervisor?._id === user?._id) &&
                    currentTask?.status !== "completed" && (
                      <button
                        onClick={() => setShowCreateMilestoneModal(true)}
                        className="text-gray-400 transition-colors hover:text-blue-600"
                        title="Add milestone"
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
                      </button>
                    )}
                  <button
                    onClick={handleToggleTaskStar}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    title={currentTask.isStarred ? "Unstar task" : "Star task"}
                  >
                    {currentTask?.isStarred ? (
                      <MdStar className="w-5 h-5 text-yellow-300 drop-shadow-lg " />
                    ) : (
                      <MdStarBorder className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={handleCompleteTask}
                    className={`transition-colors ${
                      currentTask?.status === "completed"
                        ? "text-green-500 cursor-default"
                        : "text-gray-400 hover:text-green-500"
                    }`}
                    title={
                      currentTask?.status === "completed"
                        ? "Task already completed"
                        : "Complete task"
                    }
                    disabled={currentTask?.status === "completed"}
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {milestones.length > 0 && (
                <div className="px-5 py-5 bg-white border-b border-gray-200">
                  <div className="flex items-center justify-around">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center justify-center bg-gray-100 rounded-full w-14 h-14">
                        <svg
                          className="text-blue-500 w-7 h-7"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {totalMilestones} Milestones
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="relative flex items-center justify-center w-16 h-16">
                        <svg
                          className="w-16 h-16 -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#d1d5db"
                            strokeWidth="8"
                            strokeDasharray={`${(completedMilestones / totalMilestones) * 264} 264`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-sm font-bold text-gray-700">
                          {Math.round(
                            (completedMilestones / totalMilestones) * 100,
                          )}
                          %
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        Progress
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="relative flex items-center justify-center w-16 h-16">
                        <svg
                          className="w-16 h-16 -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#ec4899"
                            strokeWidth="8"
                            strokeDasharray="211 264"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-sm font-bold text-pink-500">
                          80%
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        Deadline
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="px-5 py-3 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-800">Milestones</h3>
              </div>

              <div className="p-5">
                {milestones.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="mb-3 text-gray-500">No milestones yet</p>
                    {currentProject?.createdBy?._id === user?._id &&
                      currentTask?.status !== "completed" && (
                        <button
                          onClick={() => setShowCreateMilestoneModal(true)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Create your first milestone
                        </button>
                      )}
                    {currentTask?.status === "completed" && (
                      <p className="text-sm text-gray-400">
                        Task is completed. No more milestones can be added.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {milestones.map((milestone, index) => {
                      const isTaskMember = getTaskMembersArray().some(
                        (member) => member._id === user?._id,
                      );
                      const isProjectCreator =
                        currentProject?.createdBy?._id === user?._id;
                      const isProjectCreatorOrSupervisor =
                        currentProject?.createdBy?._id === user?._id ||
                        currentProject?.supervisor?._id === user?._id;
                      const hasPickPermission =
                        isTaskMember &&
                        !milestone.pickedBy &&
                        milestone.status !== "completed";
                      const hasCompletePermission =
                        isTaskMember &&
                        milestone.pickedBy?._id === user?._id &&
                        milestone.status !== "completed";
                      const canEditDelete = isProjectCreator;
                      const showRejectButton =
                        isProjectCreatorOrSupervisor &&
                        milestone.status === "completed";

                      return (
                        <div
                          key={milestone._id}
                          className="p-4 transition-shadow border border-gray-200 rounded-lg hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center justify-center text-sm text-white bg-teal-500 rounded w-7 h-7">
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
                                </svg>
                              </div>
                              <span className="text-sm font-bold text-gray-800">
                                #{index + 1}
                              </span>

                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  milestone.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : milestone.status === "in-progress"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-orange-50 text-orange-500"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    milestone.status === "completed"
                                      ? "bg-green-500"
                                      : milestone.status === "in-progress"
                                        ? "bg-blue-500"
                                        : "bg-orange-400"
                                  }`}
                                />
                                {milestone.status
                                  ? milestone.status.charAt(0).toUpperCase() +
                                    milestone.status.slice(1)
                                  : "Pending"}
                              </span>

                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  milestone.priority === "high"
                                    ? "bg-red-100 text-red-600"
                                    : milestone.priority === "medium"
                                      ? "bg-orange-100 text-orange-600"
                                      : "bg-green-100 text-green-600"
                                }`}
                              >
                                {milestone.priority
                                  ? milestone.priority.charAt(0).toUpperCase() +
                                    milestone.priority.slice(1)
                                  : "Low"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {hasPickPermission && (
                                <button
                                  onClick={() =>
                                    handlePickMilestone(milestone._id)
                                  }
                                  className="px-3 py-1 text-xs text-gray-600 transition-colors border border-gray-300 rounded-full hover:bg-gray-50"
                                >
                                  Pick
                                </button>
                              )}

                              {hasCompletePermission && (
                                <button
                                  onClick={() =>
                                    handleCompleteMilestone(milestone._id)
                                  }
                                  disabled={milestone.status === "completed"}
                                  className="px-3 py-1 text-xs text-green-700 transition-colors border border-green-300 rounded-full hover:bg-green-50 disabled:opacity-50"
                                >
                                  Complete
                                </button>
                              )}

                              {showRejectButton && (
                                <button
                                  onClick={() =>
                                    handleRejectMilestone(milestone._id)
                                  }
                                  className="px-3 py-1 text-xs text-red-600 transition-colors border border-red-300 rounded-full hover:bg-red-50"
                                >
                                  Reject
                                </button>
                              )}

                              {milestone.pickedBy &&
                                milestone.pickedBy._id !== user?._id &&
                                milestone.status !== "completed" && (
                                  <span className="text-xs italic text-gray-400">
                                    Picked by {milestone.pickedBy.name}
                                  </span>
                                )}

                              {canEditDelete && (
                                <button
                                  onClick={() => setEditingMilestone(milestone)}
                                  className="px-3 py-1 text-xs text-gray-600 transition-colors border border-gray-300 rounded-full hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                              )}

                              {canEditDelete && (
                                <button
                                  onClick={() =>
                                    handleDeleteMilestone(
                                      milestone._id,
                                      milestone.name,
                                    )
                                  }
                                  className="px-3 py-1 text-xs text-gray-600 transition-colors border border-gray-300 rounded-full hover:bg-red-50 hover:text-red-600"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="mb-3 text-sm text-gray-700">
                            {milestone.name}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                              <span className="text-xs text-gray-500">
                                Assigned To :
                              </span>
                              <span className="text-xs font-semibold text-gray-800">
                                {milestone.assignedTo?.name || "Unassigned"}
                              </span>
                            </div>

                            {milestone.endDate && (
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center justify-center w-4 h-4 bg-blue-500 rounded">
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                                  </svg>
                                </div>
                                <span className="text-xs text-gray-500">
                                  Deadline :
                                </span>
                                <span className="text-xs font-semibold text-gray-800">
                                  {new Date(
                                    milestone.endDate,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {milestone.pickedBy && (
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
                              <svg
                                className="w-4 h-4 text-green-500"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                              </svg>
                              <span className="text-xs text-gray-500">
                                Picked By:
                              </span>
                              <span className="text-xs font-semibold text-gray-800">
                                {milestone.pickedBy.name}
                              </span>
                              {milestone.pickedAt && (
                                <span className="text-xs text-gray-400">
                                  {new Date(
                                    milestone.pickedAt,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}

                          {milestone.rejectedBy && (
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-red-100">
                              <svg
                                className="w-4 h-4 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                              </svg>
                              <span className="text-xs text-gray-500">
                                Rejected By:
                              </span>
                              <span className="text-xs font-semibold text-red-600">
                                {milestone.rejectedBy?.name}
                              </span>
                              {milestone.rejectedAt && (
                                <span className="text-xs text-gray-400">
                                  {new Date(
                                    milestone.rejectedAt,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                              {milestone.rejectionReason && (
                                <span className="ml-2 text-xs text-gray-500">
                                  Reason: {milestone.rejectionReason}
                                </span>
                              )}
                            </div>
                          )}

                          {/* ⭐ Completed Milestone Review Section - Visible to everyone */}
                          {milestone.status === "completed" && (
                            <div className="pt-3 mt-4 border-t border-gray-200">
                              {/* Star Rating - Visible to everyone */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Rating:
                                  </span>
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => {
                                          if (isProjectCreatorOrSupervisor) {
                                            handleDirectRateMilestone(
                                              milestone._id,
                                              star,
                                            );
                                          }
                                        }}
                                        disabled={!isProjectCreatorOrSupervisor}
                                        className={`transition-transform focus:outline-none ${
                                          isProjectCreatorOrSupervisor
                                            ? "hover:scale-110 cursor-pointer"
                                            : "cursor-default"
                                        }`}
                                        title={
                                          isProjectCreatorOrSupervisor
                                            ? `Rate ${star} star${star > 1 ? "s" : ""}`
                                            : milestone.starRating
                                              ? `Rated ${milestone.starRating}/5 by ${milestone.ratedBy?.name || "someone"}`
                                              : "Not rated yet"
                                        }
                                      >
                                        {star <= (milestone.starRating || 0) ? (
                                          <FaStar className="w-4 h-4 text-yellow-400" />
                                        ) : (
                                          <FaRegStar className="w-4 h-4 text-gray-300" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                  {milestone.starRating && (
                                    <span className="ml-1 text-sm text-gray-600">
                                      ({milestone.starRating}/5)
                                    </span>
                                  )}
                                  {/* Show who rated it - visible to everyone */}
                                  {milestone.ratedBy && (
                                    <div className="flex items-center gap-1.5 ml-2">
                                      <img
                                        src={
                                          milestone.ratedBy.avatar ||
                                          `https://ui-avatars.com/api/?name=${milestone.ratedBy.name}&background=random`
                                        }
                                        alt={milestone.ratedBy.name}
                                        className="w-5 h-5 rounded-full"
                                      />
                                      <span className="text-xs text-gray-500">
                                        by {milestone.ratedBy.name}
                                      </span>
                                      {milestone.ratedAt && (
                                        <span className="text-xs text-gray-400">
                                          {new Date(
                                            milestone.ratedAt,
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {!milestone.starRating && (
                                    <span className="text-sm text-gray-400">
                                      {isProjectCreatorOrSupervisor
                                        ? "Click a star to rate"
                                        : "Not rated yet"}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Review Comments Section - Visible to everyone */}
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-gray-700">
                                    Review Comments (
                                    {milestone.reviewComments?.length || 0})
                                  </h4>
                                  {isProjectCreatorOrSupervisor && (
                                    <button
                                      onClick={() =>
                                        setShowReviewInput(
                                          showReviewInput === milestone._id
                                            ? null
                                            : milestone._id,
                                        )
                                      }
                                      className="text-xs text-blue-600 hover:text-blue-700"
                                    >
                                      {showReviewInput === milestone._id
                                        ? "Cancel"
                                        : "Add Review"}
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  {milestone.reviewComments &&
                                  milestone.reviewComments.length > 0 ? (
                                    milestone.reviewComments.map((comment) => (
                                      <div
                                        key={comment._id}
                                        className="flex items-start justify-between p-2 rounded-lg bg-gray-50"
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <img
                                              src={
                                                comment.user?.avatar ||
                                                `https://ui-avatars.com/api/?name=${comment.user?.name || "User"}&background=random`
                                              }
                                              alt={comment.user?.name || "User"}
                                              className="w-5 h-5 rounded-full"
                                            />
                                            <span className="text-xs font-medium text-gray-700">
                                              {comment.user?.name ||
                                                "Unknown User"}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              {new Date(
                                                comment.createdAt,
                                              ).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <p className="mt-1 text-sm text-gray-600 ml-7">
                                            {comment.text}
                                          </p>
                                        </div>
                                        {/* Only show delete button for comment author or project creators/supervisors */}
                                        {(comment.user?._id === user?._id ||
                                          isProjectCreatorOrSupervisor) && (
                                          <button
                                            onClick={() =>
                                              handleDeleteReviewComment(
                                                milestone._id,
                                                comment._id,
                                              )
                                            }
                                            className="ml-2 text-gray-400 hover:text-red-500"
                                            title="Delete comment"
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                              />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-gray-400">
                                      No review comments yet
                                    </p>
                                  )}
                                </div>

                                {/* Review Input - Only visible to project creators/supervisors */}
                                {showReviewInput === milestone._id &&
                                  isProjectCreatorOrSupervisor && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <input
                                        type="text"
                                        value={reviewText}
                                        onChange={(e) =>
                                          setReviewText(e.target.value)
                                        }
                                        placeholder="Write a review comment..."
                                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyPress={(e) => {
                                          if (
                                            e.key === "Enter" &&
                                            !e.shiftKey
                                          ) {
                                            e.preventDefault();
                                            handleAddReviewComment(
                                              milestone._id,
                                            );
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() =>
                                          handleAddReviewComment(milestone._id)
                                        }
                                        disabled={
                                          submittingReview || !reviewText.trim()
                                        }
                                        className="px-3 py-1.5 text-sm text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        <FiSend className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All modals remain the same */}
      {showProjectMenu && currentProject && (
        <div
          ref={menuRef}
          className="absolute z-30 flex overflow-hidden bg-white border border-gray-100 rounded-lg shadow-xl w-80"
          style={{ left: "20px", top: "120px" }}
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
                    handleUpdateProjectColor(color);
                  }}
                  disabled={projectUpdatingColor}
                  className={`w-8 h-8 rounded-md cursor-pointer hover:scale-110 transition-transform border-2 ${
                    (currentProject.cardColor ||
                      currentProject.workflow?.iconColor ||
                      "#3B82F6") === color
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
                value={
                  currentProject.cardColor ||
                  currentProject.workflow?.iconColor ||
                  "#3B82F6"
                }
                onChange={(e) => {
                  const nextColor = e.target.value;
                  handleUpdateProjectColor(nextColor);
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
                  setShowProjectMenu(false);
                  setShowUpdateProjectModal(true);
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
              {canProjectClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProjectMenu(false);
                    setShowCloseProjectDialog(true);
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
                  setShowProjectMenu(false);
                  setShowDeleteProjectDialog(true);
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

      <UpdateProjectForm
        isOpen={showUpdateProjectModal}
        onClose={() => setShowUpdateProjectModal(false)}
        projectId={currentProject?._id}
        onProjectUpdated={handleProjectUpdated}
      />

      <ConfirmationDialog
        isOpen={showCloseProjectDialog}
        onClose={() => setShowCloseProjectDialog(false)}
        onConfirm={handleCloseProject}
        title="Close Project"
        message="Are you sure you want to close this project? This action cannot be undone."
        loading={projectClosing}
        confirmText="Close"
        cancelText="Cancel"
        confirmButtonColor="green"
      />

      <ConfirmationDialog
        isOpen={showDeleteProjectDialog}
        onClose={() => setShowDeleteProjectDialog(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        loading={projectDeleting}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
      />

      <CreateMilestoneModal
        isOpen={showCreateMilestoneModal || !!editingMilestone}
        onClose={() => {
          setShowCreateMilestoneModal(false);
          setEditingMilestone(null);
        }}
        onSubmit={
          editingMilestone ? handleUpdateMilestone : handleCreateMilestone
        }
        loading={creating}
        taskId={taskId}
        projectId={currentTask.project?._id}
        users={getTaskMembersArray()}
        milestone={editingMilestone}
      />

      <AddTaskMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        taskMembers={taskMembers}
        onAddMember={handleAddTaskMember}
        taskTeamId={currentTask?.team?._id}
        taskTeamName={currentTask?.team?.name}
      />

      <ConfirmationDialog
        isOpen={showCompleteMilestoneDialog}
        onClose={() => {
          setShowCompleteMilestoneDialog(false);
          setSelectedMilestoneId(null);
        }}
        onConfirm={confirmCompleteMilestone}
        title="Complete Milestone"
        message="Are you sure you want to mark this milestone as completed?"
        loading={completingMilestone}
        confirmText="Complete"
        cancelText="Cancel"
        confirmButtonColor="green"
      />

      <ConfirmationDialog
        isOpen={showRejectMilestoneDialog}
        onClose={() => {
          setShowRejectMilestoneDialog(false);
          setSelectedRejectMilestoneId(null);
          setRejectionReason("");
        }}
        onConfirm={confirmRejectMilestone}
        title="Reject Milestone"
        message="Are you sure you want to reject this milestone? The task member will need to pick and complete it again."
        loading={rejectingMilestone}
        confirmText="Reject"
        cancelText="Cancel"
        confirmButtonColor="red"
      >
        <div className="mt-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Reason for rejection (optional)
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            rows="3"
            placeholder="Enter reason for rejection..."
          />
        </div>
      </ConfirmationDialog>
    </div>
  );
};

export default TaskDetailPage;
