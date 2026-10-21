// views/workflows/WorkflowDetailModal.jsx
import React from "react";
import CustomModal from "../../components/CustomModal";
import { getIconByPath } from "../../constants/workflowIcons";

const WorkflowDetailModal = ({ isOpen, onClose, workflow, isGeneral = false, onUseWorkflow }) => {
  if (!isOpen || !workflow) return null;

  const totalPhases = workflow.phases?.length || 0;
  const workflowIcon = workflow.defaultImage
    ? {
        ...getIconByPath(workflow.defaultImage),
        color: workflow.iconColor || getIconByPath(workflow.defaultImage).color,
      }
    : { path: null, color: workflow.iconColor || "#4F46E5" };

  // Sort phases by order
  const sortedPhases = [...(workflow.phases || [])].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={workflow.name}
      size="lg"
      showFooter={true}
      footerContent={
        <div className="flex justify-between gap-3">
          {isGeneral && onUseWorkflow && (
            <button
              onClick={onUseWorkflow}
              className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Use This Workflow
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      }
    >
      {/* Header with Icon */}
      <div className="flex items-center gap-4 p-4 mb-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
        <div
          className="flex items-center justify-center w-16 h-16 p-2 rounded-xl"
          style={{ backgroundColor: workflowIcon.color }}
        >
          {workflowIcon.path ? (
            <img
              src={workflowIcon.path}
              alt={workflow.name}
              className="object-contain w-12 h-12"
            />
          ) : (
            <span className="text-3xl font-semibold text-white">
              {workflow.name?.charAt(0).toUpperCase() || "W"}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{workflow.name}</h2>
          <p className="text-sm text-gray-500">
            Created: {new Date(workflow.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex gap-6 p-3 mb-4 rounded-lg bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div className="flex items-center justify-center gap-3">
            <p className="text-xs text-gray-500">Total Phases :</p>
            <p className="text-lg font-semibold text-gray-800">{totalPhases}</p>
          </div>
        </div>
      </div>

      {/* Phases List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        <h3 className="mb-3 font-semibold text-gray-800 text-md">Phases</h3>

        <div className="flex flex-wrap items-center justify-start gap-3 mt-1">
          {sortedPhases.map((phase, index) => (
            <div
              key={phase._id || index}
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: workflowIcon.color }}
            >
              <span className="text-sm font-medium text-white">
                {phase.name}
              </span>
              {/* {(phase.name === "Start" || phase.name === "End") && (
                <span className="text-xs text-blue-600 bg-white/80 px-2 py-0.5 rounded-full">
                  Default
                </span>
              )} */}
            </div>
          ))}
        </div>
      </div>
    </CustomModal>
  );
};

export default WorkflowDetailModal;
