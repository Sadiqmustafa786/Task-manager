// client/src/utils/statisticsUtils.js

// ✅ Status colors aligned with RED/GREEN chart design
export const statusColors = {
  completed: { bg: "green-100", color: "green-800", border: "green-400" }, // 🟢 GREEN - Success
  pending: { bg: "yellow-100", color: "yellow-800", border: "yellow-400" }, // 🟡 YELLOW - In queue
  "in-progress": { bg: "blue-100", color: "blue-800", border: "blue-400" }, // 🔵 BLUE - Active
  review: { bg: "purple-100", color: "purple-800", border: "purple-400" }, // 🟣 PURPLE - Review
  blocked: { bg: "red-100", color: "red-800", border: "red-400" }, // 🔴 RED - Issue
  rejected: { bg: "red-100", color: "red-800", border: "red-400" }, // 🔴 RED - Issue
};

export const priorityColors = {
  low: { bg: "gray-100", color: "gray-700" },
  medium: { bg: "yellow-100", color: "yellow-700" },
  high: { bg: "orange-100", color: "orange-700" },
  urgent: { bg: "red-100", color: "red-700" },
};

// ✅ RED & GREEN DESIGN SYSTEM
// Color order for stacked charts: [Completed/Success, Pending/Issues, Accent]
export const CHART_COLORS = [
  "#0acf97", // 🟢 GREEN - Completed tasks, successful outcomes
  "#ff4979", // 🔴 RED   - Pending/Blocked tasks, issues needing attention
  "#fda006", // 🟠 ORANGE - Accent/Secondary metrics
  "#3B82F6", // 🔵 BLUE
  "#8B5CF6", // 🟣 PURPLE
  "#EC4899", // 🌸 PINK
];

export const getStatusClass = (status) => {
  const statusInfo = statusColors[status?.toLowerCase()];
  return statusInfo
    ? `bg-${statusInfo.bg} text-${statusInfo.color}`
    : "bg-gray-100 text-gray-700";
};

export const getPriorityClass = (priority) => {
  const priorityInfo = priorityColors[priority?.toLowerCase()];
  return priorityInfo
    ? `bg-${priorityInfo.bg} text-${priorityInfo.color}`
    : "bg-gray-100 text-gray-700";
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

// ✅ Stacked bar chart with RED/GREEN design
export const getStackedBarChartOptions = (title, xaxisCategories = []) => ({
  chart: {
    type: "bar",
    stacked: true,
    toolbar: {
      show: true,
    },
    zoom: {
      enabled: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: true, // Horizontal bars for better readability
      barHeight: "50%",
      endingShape: "rounded",
    },
  },
  dataLabels: {
    enabled: true,
  },
  colors: CHART_COLORS, // First = Green (completed), Second = Red (pending)
  xaxis: {
    categories: xaxisCategories,
  },
  yaxis: {
    title: {
      text: "",
    },
  },
  legend: {
    position: "top",
    horizontalAlign: "center",
  },
  title: {
    text: title,
    align: "center",
    style: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#333",
    },
  },
  tooltip: {
    y: {
      formatter: function (val) {
        return val + " tasks";
      },
    },
  },
});

// ✅ Pie chart using RED/GREEN design system
export const getPieChartOptions = (title, labels = []) => ({
  chart: {
    type: "pie",
    toolbar: {
      show: true,
    },
  },
  labels: labels,
  colors: CHART_COLORS,
  legend: {
    position: "bottom",
  },
  title: {
    text: title,
    align: "center",
    style: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#333",
    },
  },
  dataLabels: {
    enabled: true,
    formatter: function (val, opts) {
      return opts.w.globals.series[opts.seriesIndex] + " tasks";
    },
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 300,
        },
        legend: {
          position: "bottom",
        },
      },
    },
  ],
});

// ✅ Donut chart using RED/GREEN design system
export const getDonutChartOptions = (title, labels = []) => ({
  chart: {
    type: "donut",
    toolbar: {
      show: true,
    },
  },
  labels: labels,
  colors: CHART_COLORS,
  legend: {
    position: "bottom",
  },
  title: {
    text: title,
    align: "center",
    style: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#333",
    },
  },
  dataLabels: {
    enabled: true,
    formatter: function (val, opts) {
      return opts.w.globals.series[opts.seriesIndex] + " tasks";
    },
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 300,
        },
        legend: {
          position: "bottom",
        },
      },
    },
  ],
});

// Default chart options from reference
export const defaultChartOptions = {
  chart: { type: "bar", stacked: true },
  plotOptions: { bar: { horizontal: true } },
  dataLabels: { enabled: true },
  legend: { position: "top" },
};
