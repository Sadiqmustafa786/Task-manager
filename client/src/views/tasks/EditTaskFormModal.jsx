// views/tasks/EditTaskModal.jsx
import React, { useState, useEffect } from "react";
import { useTaskStore } from "../../stores/useTaskStore";
import { showError, showSuccess } from "../../components/toaster/Toaster";

const EditTaskModal = ({ isOpen, onClose, task, onTaskUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    dueDate: "",
    priority: "normal",
  });

  const { updateTask } = useTaskStore();

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || "",
        startDate: task.startDate ? task.startDate.split("T")[0] : "",
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        priority: task.priority || "normal",
      });
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: "",
        startDate: "",
        dueDate: "",
        priority: "normal",
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError("Please enter task name");
      return;
    }

    try {
      setLoading(true);
      await updateTask(task._id, {
        name: formData.name,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
        priority: formData.priority,
      });
      showSuccess("Task updated successfully!");
      if (onTaskUpdated) onTaskUpdated();
      onClose();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Right-side drawer panel */}
      <div className="fixed top-0 right-0 z-50 flex flex-col w-full h-full max-w-lg bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Edit Task</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-600"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">
          {/* Task Name */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 placeholder-gray-400"
              placeholder="Enter task name"
              disabled={loading}
            />
          </div>

          {/* Priority - Radio buttons */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Priority
            </label>
            <div className="flex items-center gap-4 pt-1.5">
              {[
                { value: "low", label: "Low" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
              ].map((p) => (
                <label
                  key={p.value}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    checked={formData.priority === p.value}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    disabled={loading}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Start Date & End Date - side by side */}
          <div className="grid grid-cols-2 gap-5">
            {/* Start Date */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                disabled={loading}
                className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                disabled={loading}
                className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="px-6 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </>
  );
};

export default EditTaskModal;
