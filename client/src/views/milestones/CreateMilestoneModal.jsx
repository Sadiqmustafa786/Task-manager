// views/milestones/CreateMilestoneModal.jsx
import React, { useState, useEffect } from "react";

const CreateMilestoneModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  taskId,
  projectId,
  users = [],
  milestone = null,
}) => {
  const isEditing = !!milestone;
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    assignedTo: "",
    priority: "low",
    startDate: "",
    endDate: "",
    file: null,
  });

  useEffect(() => {
    if (milestone) {
      setFormData({
        name: milestone.name || "",
        description: milestone.description || "",
        assignedTo: milestone.assignedTo?._id || "",
        priority: milestone.priority || "low",
        startDate: milestone.startDate ? milestone.startDate.slice(0, 16) : "",
        endDate: milestone.endDate ? milestone.endDate.slice(0, 16) : "",
        file: null,
      });
    } else if (!isOpen) {
      setFormData({
        name: "",
        description: "",
        assignedTo: "",
        priority: "low",
        startDate: "",
        endDate: "",
        file: null,
      });
    }
  }, [milestone, isOpen]);

  const handleSubmit = () => {
    if (!formData.description.trim() && !formData.name.trim()) {
      alert("Please enter milestone description");
      return;
    }
    onSubmit({
      ...formData,
      name: formData.name || formData.description,
      taskId,
      projectId,
    });
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
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditing ? "Edit Milestone" : "Add Milestone"}
          </h2>
          <div className="flex items-center gap-3">
            {/* <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center justify-center text-white transition-colors bg-green-500 rounded-full w-7 h-7 hover:bg-green-600 disabled:opacity-50"
              title="Save milestone"
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
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button> */}
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
          {/* Milestone Description */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Milestone Description
            </label>
            <textarea
              value={formData.description || formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                  name: e.target.value,
                })
              }
              rows="5"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 placeholder-gray-400"
              placeholder="Task Milestone Description"
            />
          </div>

          {/* Assigned To + Milestone Priority - side by side */}
          <div className="grid grid-cols-2 gap-5">
            {/* Assigned To */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Assigned To
              </label>
              <div className="relative">
                <select
                  value={formData.assignedTo}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedTo: e.target.value })
                  }
                  className="w-full px-3 py-2 pr-8 text-sm text-gray-700 bg-white border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">For All</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 flex items-center pointer-events-none right-2">
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Milestone Priority */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Milestone Priority
              </label>
              <div className="flex items-center gap-3 pt-1.5">
                {[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
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
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* File + Date - side by side */}
          <div className="grid grid-cols-2 gap-5">
            {/* File */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                File
              </label>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap">
                  Choose file
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setFormData({ ...formData, file: e.target.files[0] })
                    }
                  />
                </label>
                <span className="text-xs text-gray-400 truncate">
                  {formData.file ? formData.file.name : "No file chosen"}
                </span>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={
              loading || (!formData.description.trim() && !formData.name.trim())
            }
            className="px-6 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (isEditing ? "Updating..." : "Creating...") : "Submit"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateMilestoneModal;
