// views/projects/CreateProjectForm.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import CustomModal from "../../components/CustomModal";
import { useProjectStore } from "../../stores/useProjectStore";
import { useWorkflowStore } from "../../stores/useWorkflowStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { showError } from "../../components/toaster/Toaster";
import { getIconByPath } from "../../constants/workflowIcons";

const CreateProjectForm = ({ isOpen, onClose, onSubmit, loading }) => {
  const { user } = useAuthStore();
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    workflowId: "",
    creatorId: user?._id || "",
    supervisorId: "",
    startDate: "",
    endDate: "",
    isContinuous: false,
    priority: "medium",
  });

  const { formData: formOptions, fetchFormData } = useProjectStore();
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const optionsRequestStarted = useRef(false);
  const {
    fetchUserWorkflows,
    userWorkflows,
    fetchGeneralWorkflows,
    generalWorkflows,
  } = useWorkflowStore();

  const loadFormOptions = useCallback(async () => {
    if (optionsRequestStarted.current) return;
    optionsRequestStarted.current = true;
    setOptionsLoading(true);
    setOptionsError("");
    try {
      await Promise.all([
        fetchFormData(),
        fetchUserWorkflows(),
        fetchGeneralWorkflows(),
      ]);
    } catch (error) {
      optionsRequestStarted.current = false;
      const message = error.response?.data?.message || "Could not load project form data. Please try again.";
      setOptionsError(message);
      showError(message);
    } finally {
      setOptionsLoading(false);
    }
  }, [fetchFormData, fetchUserWorkflows, fetchGeneralWorkflows]);

  useEffect(() => {
    if (isOpen) loadFormOptions();
    else optionsRequestStarted.current = false;
  }, [isOpen, loadFormOptions]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        description: "",
        workflowId: "",
        creatorId: user?._id || "",
        supervisorId: "",
        startDate: "",
        endDate: "",
        isContinuous: false,
        priority: "medium",
      });
      setSelectedWorkflow(null);
    }
  }, [isOpen, user]);

  const allWorkflows = [...(generalWorkflows || []), ...(userWorkflows || [])];
  const availableUsers = formOptions.users || [];

  useEffect(() => {
    if (availableUsers.length > 0 && !formData.creatorId && user?._id) {
      const currentUser = availableUsers.find((u) => u._id === user._id);
      if (currentUser) {
        setFormData((prev) => ({ ...prev, creatorId: currentUser._id }));
      }
    }
  }, [availableUsers, user]);

  const handleWorkflowSelect = (workflow) => {
    setSelectedWorkflow(workflow);
    setFormData({ ...formData, workflowId: workflow._id });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      showError("Please enter project name");
      return;
    }
    if (!formData.workflowId) {
      showError("Please select a workflow");
      return;
    }
    if (!formData.creatorId) {
      showError("Please select a creator");
      return;
    }

    onSubmit({
      name: formData.name,
      description: formData.description,
      workflowId: formData.workflowId,
      createdBy: formData.creatorId,
      supervisorId: formData.supervisorId || null,
      assignedUserIds: [],
      startDate: formData.startDate || null,
      endDate: formData.isContinuous ? null : formData.endDate || null,
      isContinuous: formData.isContinuous,
      priority: formData.priority,
      tags: [],
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "text-gray-600";
      case "medium":
        return "text-blue-600";
      case "high":
        return "text-orange-600";
      case "urgent":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      position="right"
      fullScreen={true}
      showFooter={true}
      footerContent={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.name ||
              !formData.workflowId ||
              !formData.creatorId
            }
            className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full lg:flex-row lg:gap-6">
        {/* Left Column - Form Fields */}
        <div className="flex-1 pb-4 space-y-3">
          <div>
            <label className="block mb-0.5 text-xs font-medium text-gray-700">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-0.5 text-xs font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="2"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what this project is about..."
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block mb-0.5 text-xs font-medium text-gray-700">
                Creator <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.creatorId}
                onChange={(e) =>
                  setFormData({ ...formData, creatorId: e.target.value })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select creator</option>
                {availableUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-0.5 text-xs font-medium text-gray-700">
                Supervisor
              </label>
              <select
                value={formData.supervisorId}
                onChange={(e) =>
                  setFormData({ ...formData, supervisorId: e.target.value })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select supervisor</option>
                {availableUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block mb-0.5 text-xs font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block mb-0.5 text-xs font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || formData.isContinuous}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isContinuous}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    isContinuous: e.target.checked,
                    endDate: e.target.checked ? "" : formData.endDate,
                  });
                }}
                className="rounded"
                disabled={loading}
              />
              <span className="text-xs text-gray-700">
                Continuous Project (No end date)
              </span>
            </label>
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700">
              Priority
            </label>
            <div className="flex flex-wrap gap-3">
              {["low", "medium", "high", "urgent"].map((priority) => (
                <label
                  key={priority}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    checked={formData.priority === priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-3.5 h-3.5"
                    disabled={loading}
                  />
                  <span
                    className={`text-xs font-medium capitalize ${getPriorityColor(priority)}`}
                  >
                    {priority}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Workflows */}
        <div className="mt-4 lg:w-80 lg:mt-0">
          <div className="sticky top-0">
            <h2 className="mb-2 text-sm font-semibold text-gray-800">
              Select Workflow
            </h2>
            {optionsError && (
              <div className="mb-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
                {optionsError}
                <button
                  type="button"
                  onClick={() => {
                    optionsRequestStarted.current = false;
                    loadFormOptions();
                  }}
                  className="ml-1 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}
            <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto">
              {optionsLoading && allWorkflows.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">Loading project form data...</p>
              )}
              {allWorkflows.map((workflow) => {
                const workflowIcon = workflow.defaultImage
                  ? getIconByPath(workflow.defaultImage)
                  : { emoji: "📋", color: workflow.iconColor || "#4F46E5" };
                const isSelected = selectedWorkflow?._id === workflow._id;
                return (
                  <div
                    key={workflow._id}
                    onClick={() => handleWorkflowSelect(workflow)}
                    className={`p-2 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg"
                        style={{ backgroundColor: workflowIcon.color }}
                      >
                        {workflowIcon.path ? (
                          <img
                            src={workflowIcon.path}
                            alt={workflow.name}
                            className="object-contain w-5 h-5"
                          />
                        ) : (
                          <span className="text-base text-white">
                            {workflowIcon.emoji}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-800">
                          {workflow.name}
                        </h3>
                      </div>
                      {isSelected && (
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
              {allWorkflows.length === 0 && !optionsLoading && !optionsError && (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-500">
                    No workflows available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CustomModal>
  );
};

export default CreateProjectForm;
