// views/projects/UpdateProjectForm.jsx
import React, { useState, useEffect } from "react";
import CustomModal from "../../components/CustomModal";
import { useProjectStore } from "../../stores/useProjectStore";
import { showError, showSuccess } from "../../components/toaster/Toaster";

const UpdateProjectForm = ({ isOpen, onClose, project, onProjectUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    supervisorId: "",
    startDate: "",
    endDate: "",
    isContinuous: false,
    priority: "medium",
  });

  const { updateProject } = useProjectStore();
  const { formData: formOptions, fetchFormData } = useProjectStore();

  useEffect(() => {
    if (isOpen && project) {
      fetchFormData();
      setFormData({
        name: project.name || "",
        description: project.description || "",
        supervisorId: project.supervisor?._id || "",
        startDate: project.startDate ? project.startDate.split("T")[0] : "",
        endDate:
          project.endDate && !project.isContinuous
            ? project.endDate.split("T")[0]
            : "",
        isContinuous: project.isContinuous || false,
        priority: project.priority || "medium",
      });
    }
  }, [isOpen, project]);

  const availableUsers = formOptions.users || [];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError("Please enter project name");
      return;
    }

    try {
      setLoading(true);
      await updateProject(project._id, {
        name: formData.name,
        description: formData.description,
        supervisorId: formData.supervisorId || null,
        startDate: formData.startDate || null,
        endDate: formData.isContinuous ? null : formData.endDate || null,
        isContinuous: formData.isContinuous,
        priority: formData.priority,
      });
      showSuccess("Project updated successfully!");
      if (onProjectUpdated) onProjectUpdated();
      onClose();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update project");
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
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Project"
      fullScreen={true}
      showFooter={true}
      footerContent={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name}
            className="px-4 py-2 text-sm text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Project"}
          </button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
        {/* Project Name */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project name"
            disabled={loading}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Project description"
            disabled={loading}
          />
        </div>

        {/* Supervisor */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Supervisor
          </label>
          <select
            value={formData.supervisorId}
            onChange={(e) =>
              setFormData({ ...formData, supervisorId: e.target.value })
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

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
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
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || formData.isContinuous}
            />
          </div>
        </div>

        {/* Continuous Project Checkbox */}
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
            {priorityOptions.map((priority) => (
              <label
                key={priority.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="priority"
                  value={priority.value}
                  checked={formData.priority === priority.value}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-4 h-4"
                  disabled={loading}
                />
                <span
                  className={`text-sm font-medium capitalize ${getPriorityColor(priority.value)}`}
                >
                  {priority.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </CustomModal>
  );
};

export default UpdateProjectForm;
