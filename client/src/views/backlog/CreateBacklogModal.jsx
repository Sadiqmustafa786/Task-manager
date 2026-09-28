// client/src/views/backlog/CreateBacklogModal.jsx
import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import CustomModal from "../../components/CustomModal";
import { statusOptions, priorityOptions } from "../../utils/backlogUtils";

const CreateBacklogModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  categories = [],
  labels = [],
  tasks = [],
  loadingTasks = false,
  projectId,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "Not started",
    category: "",
    label: "",
    assignTo: "",
    attachment: "",
    taskId: "",
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        status: "Not started",
        category: "",
        label: "",
        assignTo: "",
        attachment: "",
        taskId: "",
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return;
    }

    const payload = { ...formData };
    if (!payload.taskId) {
      delete payload.taskId;
    }

    onSubmit(payload);
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "3px",
  };

  const inputStyle = {
    width: "100%",
    padding: "5px 8px",
    border: "1px solid #e5e7eb",
    borderRadius: "5px",
    fontSize: "12px",
    color: "#111827",
    background: "#f9fafb",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Backlog Item"
      size="md"
      position="right"
      showCloseButton={true}
      closeOnBackdrop={true}
      closeOnEscape={true}
      showFooter={true}
      footerContent={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="backlog-form"
            className="px-3 py-1.5 text-xs text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || !formData.title.trim()}
          >
            {loading ? "Creating..." : "Create Backlog"}
          </button>
        </div>
      }
    >
      <form
        id="backlog-form"
        onSubmit={handleSubmit}
        style={{ padding: "0 2px" }}
      >
        {/* Title */}
        <div style={{ marginBottom: "12px" }}>
          <label style={labelStyle}>
            Title <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter backlog title..."
            style={inputStyle}
            required
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "12px" }}>
          <label style={labelStyle}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="2"
            placeholder="Describe the backlog item..."
            style={{
              ...inputStyle,
              resize: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Priority and Status - Two Column */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: "pointer", background: "#fff" }}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: "pointer", background: "#fff" }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category and Label - Two Column */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: "pointer", background: "#fff" }}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Label</label>
            <select
              name="label"
              value={formData.label}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: "pointer", background: "#fff" }}
            >
              <option value="">Select Label</option>
              {labels.map((label) => (
                <option key={label._id} value={label._id}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Link to Task */}
        <div style={{ marginBottom: "12px" }}>
          <label style={labelStyle}>
            Link to Task <span style={{ color: "#9ca3af" }}>(optional)</span>
          </label>
          <select
            name="taskId"
            value={formData.taskId}
            onChange={handleChange}
            disabled={loadingTasks}
            style={{
              ...inputStyle,
              cursor: loadingTasks ? "not-allowed" : "pointer",
              background: "#fff",
            }}
          >
            <option value="">No task — standalone item</option>
            {tasks.map((task) => (
              <option key={task._id} value={task._id}>
                {task.name} {task.status ? `(${task.status})` : ""}
              </option>
            ))}
          </select>
          <p style={{ marginTop: "2px", fontSize: "9px", color: "#9ca3af" }}>
            {loadingTasks
              ? "Loading tasks..."
              : "Leave unselected to create without linking to a task."}
          </p>
        </div>

        {/* Attachment */}
        <div style={{ marginBottom: "4px" }}>
          <label style={labelStyle}>Attachment URL</label>
          <input
            type="url"
            name="attachment"
            value={formData.attachment}
            onChange={handleChange}
            placeholder="https://example.com/file.pdf"
            style={inputStyle}
          />
        </div>
      </form>
    </CustomModal>
  );
};

export default CreateBacklogModal;
