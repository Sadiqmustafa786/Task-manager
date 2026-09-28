// client/src/utils/backlogUtils.js

export const statusColors = {
  "Not started": {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  },
  Assigned: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  "In progress": {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  Complete: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  "On hold": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

export const priorityColors = {
  Low: { bg: "bg-green-100", text: "text-green-700" },
  Medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
  High: { bg: "bg-red-100", text: "text-red-700" },
};

export const statusOptions = [
  { value: "Not started", label: "Not Started" },
  { value: "Assigned", label: "Assigned" },
  { value: "In progress", label: "In Progress" },
  { value: "Complete", label: "Complete" },
  { value: "On hold", label: "On Hold" },
];

export const priorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

export const getStatusBadge = (status) => {
  const color = statusColors[status] || statusColors["Not started"];
  return `${color.bg} ${color.text}`;
};

export const getStatusDot = (status) => {
  const color = statusColors[status] || statusColors["Not started"];
  return color.dot;
};

export const getPriorityBadge = (priority) => {
  const color = priorityColors[priority] || priorityColors.Medium;
  return `${color.bg} ${color.text}`;
};

export const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDateTime = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
