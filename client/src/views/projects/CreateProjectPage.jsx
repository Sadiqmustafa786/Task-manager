// views/projects/CreateProjectPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../../stores/useProjectStore";
import { useWorkflowStore } from "../../stores/useWorkflowStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { showError, showSuccess } from "../../components/toaster/Toaster";
import { getIconByPath } from "../../constants/workflowIcons";

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
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

  const {
    formData: formOptions,
    fetchFormData,
    createProject,
  } = useProjectStore();
  const {
    fetchUserWorkflows,
    userWorkflows,
    fetchGeneralWorkflows,
    generalWorkflows,
  } = useWorkflowStore();

  useEffect(() => {
    fetchFormData();
    fetchUserWorkflows();
    fetchGeneralWorkflows();
  }, []);

  useEffect(() => {
    if (user?._id) {
      setFormData((prev) => ({ ...prev, creatorId: user._id }));
    }
  }, [user]);

  const allWorkflows = [...(generalWorkflows || []), ...(userWorkflows || [])];
  const availableUsers = formOptions.users || [];

  const handleWorkflowSelect = (workflow) => {
    setSelectedWorkflow(workflow);
    setFormData({ ...formData, workflowId: workflow._id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    try {
      setLoading(true);
      await createProject({
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
      showSuccess("Project created successfully!");
      navigate("/projects");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/projects")}
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
            Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Project
          </h1>
          <p className="mt-2 text-gray-600">
            Fill in the details to create a new project
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Form Fields */}
            <div className="lg:col-span-2">
              <div className="p-6 bg-white rounded-lg shadow-md">
                {/* Project Name */}
                <div className="mb-4">
                  <label className="block mb-1 text-[14px] font-medium text-gray-700">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter project name"
                    disabled={loading}
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block mb-1 text-[14px] font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows="3"
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what this project is about..."
                    disabled={loading}
                  />
                </div>

                {/* Creator and Supervisor */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-1 text-[14px] font-medium text-gray-700">
                      Creator <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.creatorId}
                      onChange={(e) =>
                        setFormData({ ...formData, creatorId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block mb-1 text-[14px] font-medium text-gray-700">
                      Supervisor
                    </label>
                    <select
                      value={formData.supervisorId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          supervisorId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading || formData.isContinuous}
                    />
                  </div>
                </div>

                {/* Continuous Project Checkbox */}
                <div className="mb-4">
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
                    <span className="text-sm text-gray-700">
                      Continuous Project (No end date)
                    </span>
                  </label>
                </div>

                {/* Priority */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <div className="flex gap-4">
                    {["low", "medium", "high", "urgent"].map((priority) => (
                      <label
                        key={priority}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={formData.priority === priority}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              priority: e.target.value,
                            })
                          }
                          className="w-4 h-4"
                          disabled={loading}
                        />
                        <span
                          className={`text-sm font-medium capitalize ${getPriorityColor(priority)}`}
                        >
                          {priority}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Workflows */}
            <div className="lg:col-span-1">
              <div className="sticky p-6 bg-white rounded-lg shadow-md top-4">
                <h2 className="mb-4 text-base font-semibold text-gray-800">
                  Select Workflow
                </h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {allWorkflows.map((workflow) => {
                    const workflowIcon = workflow.defaultImage
                      ? getIconByPath(workflow.defaultImage)
                      : { emoji: "📋", color: workflow.iconColor || "#4F46E5" };
                    const isSelected = selectedWorkflow?._id === workflow._id;
                    return (
                      <div
                        key={workflow._id}
                        onClick={() => handleWorkflowSelect(workflow)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center w-10 h-10 rounded-lg"
                            style={{ backgroundColor: workflowIcon.color }}
                          >
                            {workflowIcon.path ? (
                              <img
                                src={workflowIcon.path}
                                alt={workflow.name}
                                className="object-contain w-6 h-6"
                              />
                            ) : (
                              <span className="text-lg text-white">
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
                              className="w-5 h-5 text-blue-500"
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
                  {allWorkflows.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-gray-500">No workflows available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="px-4 py-2 text-sm text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.name ||
                !formData.workflowId ||
                !formData.creatorId
              }
              className="px-4 py-2 text-sm text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectPage;
