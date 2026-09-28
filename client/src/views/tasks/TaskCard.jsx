// views/tasks/TaskCard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { useTaskStore } from "../../stores/useTaskStore";
import { showSuccess, showError } from "../../components/toaster/Toaster";

const TaskCard = ({ task, onTaskUpdated }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { deleteTask, updateTaskStatus } = useTaskStore();

  if (!task || !task._id) return null;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-600";
      case "medium":
        return "bg-blue-100 text-blue-600";
      case "high":
        return "bg-orange-100 text-orange-600";
      case "urgent":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "review":
        return "bg-purple-100 text-purple-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "blocked":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in-progress":
        return "In Progress";
      case "review":
        return "Review";
      case "completed":
        return "Completed";
      case "blocked":
        return "Blocked";
      default:
        return status;
    }
  };

  const formattedDate = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString()
    : "";
  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString()
    : null;
  const isOverdue =
    dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "completed";

  const handleCardClick = () => {
    navigate(`/tasks/${task._id}`);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTaskStatus(task._id, newStatus);
      showSuccess(`Task marked as ${getStatusText(newStatus)}`);
      if (onTaskUpdated) onTaskUpdated();
    } catch (error) {
      showError("Failed to update task status");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteTask(task._id);
      showSuccess("Task deleted successfully!");
      if (onTaskUpdated) onTaskUpdated();
      setShowDeleteDialog(false);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "review", label: "Review" },
    { value: "completed", label: "Completed" },
    { value: "blocked", label: "Blocked" },
  ];

  return (
    <>
      <div
        className="overflow-hidden transition-all duration-300 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg"
        onClick={handleCardClick}
      >
        {/* Header with priority bar */}
        <div
          className={`h-1 w-full ${getPriorityColor(task.priority).replace("text-", "bg-").replace("600", "500")}`}
        />

        <div className="p-4">
          {/* Task Name and Menu */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="flex-1 text-sm font-semibold text-gray-800 line-clamp-2">
              {task.name}
            </h3>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 text-gray-400 transition-colors hover:text-gray-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div className="absolute right-0 z-20 w-32 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        setShowDeleteDialog(true);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-red-600 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Project Name */}
          <p className="mb-2 text-xs text-gray-500">
            {task.project?.name || "No project"}
          </p>

          {/* Status and Priority Badges */}
          <div className="flex items-center gap-2 mb-3">
            <select
              value={task.status}
              onChange={(e) => {
                e.stopPropagation();
                handleStatusChange(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className={`text-xs px-2 py-1 rounded-full border-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${getStatusColor(task.status)}`}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span
              className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}
            >
              {task.priority}
            </span>
          </div>

          {/* Due Date */}
          {dueDate && (
            <div className="flex items-center gap-1 mb-2 text-xs">
              <svg
                className="w-3 h-3 text-gray-400"
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
              <span
                className={
                  isOverdue ? "text-red-500 font-medium" : "text-gray-500"
                }
              >
                Due: {dueDate}
                {isOverdue && " (Overdue)"}
              </span>
            </div>
          )}

          {/* Assigned To */}
          {task.assignedTo && (
            <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100">
              {task.assignedTo.avatar ? (
                <img
                  src={task.assignedTo.avatar}
                  alt={task.assignedTo.name}
                  className="object-cover w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-[10px] font-medium">
                  {task.assignedTo.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-gray-500">
                {task.assignedTo.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.name}"? This action cannot be undone.`}
        loading={deleting}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
      />
    </>
  );
};

export default TaskCard;
