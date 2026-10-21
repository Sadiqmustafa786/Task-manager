// views/workflows/WorkflowCard.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import WorkflowDetailModal from "./WorkflowDetailModal";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { useWorkflowStore } from "../../stores/useWorkflowStore";
import { showSuccess, showError } from "../../components/toaster/Toaster";
import { getIconByPath } from "../../constants/workflowIcons";

const WorkflowCard = ({ workflow, isGeneral = false, onWorkflowUpdated, onUseWorkflow }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { deleteWorkflow } = useWorkflowStore();

  // Get icon for this workflow
  const workflowIcon = workflow.defaultImage
    ? {
        ...getIconByPath(workflow.defaultImage),
        color: workflow.iconColor || getIconByPath(workflow.defaultImage).color,
      }
    : { path: null, color: workflow.iconColor || (isGeneral ? "#5A7ACD" : "#4F46E5") };

  const totalPhases = workflow.phases?.length || 0;

  const formattedDate = new Date(workflow.createdAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const handleCardClick = () => {
    setShowDetailModal(true);
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteWorkflow(workflow._id);
      showSuccess("Workflow deleted successfully!");
      if (onWorkflowUpdated) {
        onWorkflowUpdated();
      }
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      showError(error.response?.data?.message || "Failed to delete workflow");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        className="cursor-pointer w-full max-w-[180px] flex flex-col items-center"
        onClick={handleCardClick}
      >
        {/* Colored square with icon */}
        <div className="relative w-full">
          <motion.div
            className="w-full aspect-square max-w-[160px] mx-auto rounded-md flex items-center justify-center mb-3 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{ backgroundColor: workflowIcon.color }}
            whileHover={{ scale: 1.03 }}
          >
            {workflowIcon.path ? (
              <img
                src={workflowIcon.path}
                alt={workflow.name}
                className="object-contain w-16 h-16"
              />
            ) : (
              <span className="text-6xl font-semibold text-white/85">
                {workflow.name?.charAt(0).toUpperCase() || "W"}
              </span>
            )}
          </motion.div>

          {/* Three dots button - Show only for user workflows */}
          {!isGeneral && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="absolute p-1 text-white rounded-full top-2 right-2 hover:bg-white/20"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          )}

          {/* Main Dropdown Menu */}
          {!isGeneral && showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute top-0 z-30 w-40 mt-2 overflow-visible bg-white border border-gray-100 rounded-lg shadow-xl left-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info below the square */}
        <div className="w-full px-1 text-center">
          <h3 className="text-sm font-semibold text-gray-800 mb-0.5 truncate">
            {workflow.name}
          </h3>

          <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-500">
            <span>📋 {totalPhases} phases</span>
          </div>

          <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-400">
            <svg
              className="flex-shrink-0 w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      <WorkflowDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        workflow={workflow}
        isGeneral={isGeneral}
        onUseWorkflow={onUseWorkflow ? () => onUseWorkflow(workflow) : undefined}
      />

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Workflow"
        message={`Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`}
        loading={deleting}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
      />
    </>
  );
};

export default WorkflowCard;
