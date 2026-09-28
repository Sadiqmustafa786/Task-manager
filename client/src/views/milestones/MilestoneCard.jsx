// views/milestones/MilestoneCard.jsx
import React, { useState } from "react";
import { MdStar, MdStarBorder } from "react-icons/md";
import { FaCalendarAlt, FaTrash, FaEdit, FaUserPlus } from "react-icons/fa";

const MilestoneCard = ({
  milestone,
  onEdit,
  onDelete,
  onStarToggle,
  onAddMember,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "on-hold":
        return "bg-orange-100 text-orange-700";
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
      case "completed":
        return "Completed";
      case "rejected":
        return "Rejected";
      case "on-hold":
        return "On Hold";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "text-gray-500";
      case "medium":
        return "text-blue-500";
      case "high":
        return "text-orange-500";
      case "urgent":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getPriorityBgColor = (priority) => {
    switch (priority) {
      case "low":
        return "bg-gray-100";
      case "medium":
        return "bg-blue-100";
      case "high":
        return "bg-orange-100";
      case "urgent":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="overflow-hidden transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
      {/* Milestone Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(milestone.status)}`}
            >
              {getStatusText(milestone.status)}
            </span>
            <h3 className="text-base font-semibold text-gray-800">
              {milestone.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStarToggle(milestone._id)}
              className="text-gray-400 transition-colors hover:text-yellow-500"
            >
              {milestone.isStarred ? (
                <MdStar className="w-5 h-5 text-yellow-500" />
              ) : (
                <MdStarBorder className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => onEdit(milestone)}
              className="text-gray-400 transition-colors hover:text-blue-500"
              title="Edit milestone"
            >
              <FaEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(milestone._id, milestone.name)}
              className="text-gray-400 transition-colors hover:text-red-500"
              title="Delete milestone"
            >
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Assigned To */}
        <div className="flex items-center gap-3 mt-3">
          {milestone.assignedTo?.avatar ? (
            <img
              src={milestone.assignedTo.avatar}
              alt=""
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
              {milestone.assignedTo?.name?.charAt(0) || "U"}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-800">
              {milestone.assignedTo?.name}
            </p>
            <p className="text-xs text-gray-500">Assigned to</p>
          </div>
        </div>
      </div>

      {/* Milestone Body */}
      <div className="p-4">
        {/* Dates */}
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          <FaCalendarAlt className="w-3.5 h-3.5" />
          <span>
            {milestone.startDate
              ? formatDate(milestone.startDate)
              : "Start date not set"}{" "}
            →
            {milestone.endDate
              ? formatDate(milestone.endDate)
              : "End date not set"}
          </span>
        </div>

        {/* Priority Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium mb-3"
          style={{ backgroundColor: getPriorityBgColor(milestone.priority) }}
        >
          <span className={getPriorityColor(milestone.priority)}>
            {milestone.priority}
          </span>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-blue-600">
              {milestone.progress || 0}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 transition-all duration-300 bg-blue-500 rounded-full"
              style={{ width: `${milestone.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Add Member Button */}
        <button
          onClick={() => onAddMember(milestone)}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <FaUserPlus className="w-3.5 h-3.5" />
          <span>Add member to milestone</span>
        </button>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center w-full gap-1 mt-3 text-xs text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? "Show less" : "Show more"}
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="pt-4 mt-4 space-y-3 border-t border-gray-100">
            <div>
              <p className="mb-1 text-xs text-gray-500">Description</p>
              <p className="text-sm text-gray-700">
                {milestone.description || "No description provided"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Created By</p>
              <p className="text-sm text-gray-700">
                {milestone.assignedBy?.name}
              </p>
            </div>
            {milestone.completedAt && (
              <div>
                <p className="mb-1 text-xs text-gray-500">Completed At</p>
                <p className="text-sm text-gray-700">
                  {formatDateTime(milestone.completedAt)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MilestoneCard;
