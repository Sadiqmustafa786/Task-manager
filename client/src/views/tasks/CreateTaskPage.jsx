// views/tasks/CreateTaskPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTaskStore } from "../../stores/useTaskStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { showSuccess, showError } from "../../components/toaster/Toaster";

const CreateTaskPage = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: "",
    phaseId: "",
    assignedTo: "",
    teamId: "",
    priority: "medium",
    dueDate: "",
    estimatedHours: "",
    labels: "",
  });

  const {
    formData: formOptions,
    projectPhases,
    fetchFormData,
    fetchProjectPhases,
    createTask,
    clearProjectPhases,
  } = useTaskStore();

  const { projects, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchFormData();
    fetchProjects();
  }, []);

  // Fetch phases when project is selected
  useEffect(() => {
    if (formData.projectId) {
      fetchProjectPhases(formData.projectId);
      const project = projects.find((p) => p._id === formData.projectId);
      setSelectedProject(project);
    } else {
      clearProjectPhases();
      setSelectedProject(null);
    }
  }, [formData.projectId, projects]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError("Please enter task name");
      return;
    }
    if (!formData.projectId) {
      showError("Please select a project");
      return;
    }
    if (!formData.phaseId) {
      showError("Please select a phase");
      return;
    }

    const labelsArray = formData.labels
      .split(",")
      .map((label) => label.trim())
      .filter((label) => label);

    try {
      setCreating(true);
      await createTask({
        name: formData.name,
        description: formData.description,
        projectId: formData.projectId,
        phaseId: formData.phaseId,
        assignedTo: formData.assignedTo || null,
        teamId: formData.teamId || null,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        estimatedHours: formData.estimatedHours
          ? parseInt(formData.estimatedHours)
          : 0,
        labels: labelsArray,
      });
      showSuccess("Task created successfully!");
      navigate("/tasks");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const priorityOptions = [
    { value: "low", label: "Low", color: "text-gray-600" },
    { value: "medium", label: "Medium", color: "text-blue-600" },
    { value: "high", label: "High", color: "text-orange-600" },
    { value: "urgent", label: "Urgent", color: "text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl px-4 py-8 mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/tasks")}
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
            Back to Tasks
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
          <p className="mt-2 text-gray-600">
            Fill in the details to create a new task
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-white rounded-lg shadow-md"
        >
          {/* Task Name */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task name"
              disabled={creating}
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what this task involves..."
              disabled={creating}
            />
          </div>

          {/* Project Selection */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.projectId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  projectId: e.target.value,
                  phaseId: "",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Phase Selection */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Phase <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.phaseId}
              onChange={(e) =>
                setFormData({ ...formData, phaseId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating || !formData.projectId}
            >
              <option value="">Select a phase</option>
              {projectPhases.map((phase) => (
                <option key={phase._id} value={phase._id}>
                  {phase.name}
                </option>
              ))}
            </select>
            {formData.projectId && projectPhases.length === 0 && (
              <p className="mt-1 text-xs text-yellow-600">
                No phases found for this project
              </p>
            )}
          </div>

          {/* Assigned To */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Assign To
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) =>
                setFormData({ ...formData, assignedTo: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating}
            >
              <option value="">Select a user</option>
              {formOptions.users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Team */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Team
            </label>
            <select
              value={formData.teamId}
              onChange={(e) =>
                setFormData({ ...formData, teamId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating}
            >
              <option value="">Select a team</option>
              {formOptions.teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="mb-4">
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
                    disabled={creating}
                  />
                  <span
                    className={`text-sm font-medium capitalize ${priority.color}`}
                  >
                    {priority.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating}
            />
          </div>

          {/* Estimated Hours */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Estimated Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedHours}
              onChange={(e) =>
                setFormData({ ...formData, estimatedHours: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Hours"
              disabled={creating}
            />
          </div>

          {/* Labels */}
          <div className="mb-6">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Labels (comma separated)
            </label>
            <input
              type="text"
              value={formData.labels}
              onChange={(e) =>
                setFormData({ ...formData, labels: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., frontend, bug, feature"
              disabled={creating}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/tasks")}
              className="px-4 py-2 text-sm text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                creating ||
                !formData.name ||
                !formData.projectId ||
                !formData.phaseId
              }
              className="px-4 py-2 text-sm text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskPage;
