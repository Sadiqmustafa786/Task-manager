// client/src/views/statistics/IndividualStatisticsView.jsx
import React, { useEffect, useState } from "react";
import { useStatisticsStore } from "../../stores/useStatisticsStore";
import { useAuthStore } from "../../stores/useAuthStore";
import StatisticsChart from "../../components/statistics/StatisticsChart";
import {
  getDonutChartOptions,
  getPieChartOptions,
  getStackedBarChartOptions,
} from "../../utils/statisticsUtils";

const IndividualStatisticsView = () => {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    emp_id: user?._id || "",
    project_id: "",
    status: "",
    start_date: "",
    end_date: "",
    view_type: "",
    date: "",
    page: 1,
    limit: 10,
  });

  const {
    individualCards,
    individualTable,
    individualProjects,
    individualTablePagination,
    employees,
    loadingIndividualCards,
    loadingIndividualTable,
    getIndividualCards,
    getIndividualTable,
    getIndividualProjects,
    getEmployees,
  } = useStatisticsStore();

  useEffect(() => {
    getEmployees();
  }, []);

  useEffect(() => {
    if (filters.emp_id) {
      getIndividualCards({
        emp_id: filters.emp_id,
        view_type: filters.view_type,
        date: filters.date,
      });
    }
  }, [filters.emp_id, filters.view_type, filters.date]);

  useEffect(() => {
    if (filters.emp_id) {
      getIndividualTable({
        emp_id: filters.emp_id,
        project_id: filters.project_id,
        status: filters.status,
        start_date: filters.start_date,
        end_date: filters.end_date,
        page: filters.page,
        limit: filters.limit,
      });
    }
  }, [
    filters.emp_id,
    filters.project_id,
    filters.status,
    filters.start_date,
    filters.end_date,
    filters.page,
  ]);

  useEffect(() => {
    if (filters.emp_id) {
      getIndividualProjects({ emp_id: filters.emp_id });
    }
  }, [filters.emp_id]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value,
    }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const resetFilters = () => {
    setFilters({
      emp_id: user?._id || "",
      project_id: "",
      status: "",
      start_date: "",
      end_date: "",
      view_type: "",
      date: "",
      page: 1,
      limit: 10,
    });
  };

  const loading = loadingIndividualCards || loadingIndividualTable;

  // Prepare chart data based on individual stats
  const getTaskStatusChartData = () => {
    if (!individualCards) return null;

    // Calculate status distribution from individual table data
    const statusCount = {};
    individualTable.forEach((task) => {
      const status = task.status || "pending";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const labels = Object.keys(statusCount);
    const series = Object.values(statusCount);

    if (labels.length === 0) return null;

    return {
      labels: labels.map(
        (label) => label.charAt(0).toUpperCase() + label.slice(1),
      ),
      series,
    };
  };

  // Prepare milestone breakdown chart
  const getMilestoneChartData = () => {
    if (!individualCards) return null;

    const data = {
      labels: ["Assigned", "Picked", "Completed", "Pending"],
      series: [
        individualCards.assignedMilestones || 0,
        individualCards.pickedMilestones || 0,
        individualCards.completedMilestones || 0,
        individualCards.pendingMilestones || 0,
      ],
    };

    if (data.series.every((v) => v === 0)) return null;

    return data;
  };

  // ✅ Prepare individual task breakdown for RED/GREEN stacked bar chart
  const getIndividualTaskBreakdownData = () => {
    if (!individualTable || individualTable.length === 0) return null;

    const completed = individualTable.filter(
      (task) => task.status === "completed",
    ).length;
    const pending = individualTable.filter(
      (task) => task.status !== "completed",
    ).length;

    return {
      completed,
      pending,
      total: individualTable.length,
    };
  };

  const chartData = getTaskStatusChartData();
  const milestoneChartData = getMilestoneChartData();
  const taskBreakdownData = getIndividualTaskBreakdownData();

  if (loading && !individualCards) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto border-b-2 border-blue-500 rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-500">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Individual Statistics
        </h1>
      </div>

      {/* Employee Filter */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow">
        <div className="flex-1 min-w-[200px]">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Select Employee
          </label>
          <select
            value={filters.emp_id}
            onChange={(e) => handleFilterChange("emp_id", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            View Type
          </label>
          <select
            value={filters.view_type}
            onChange={(e) => handleFilterChange("view_type", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="past_30_days">Past 30 Days</option>
          </select>
        </div>

        {filters.view_type && filters.view_type !== "past_30_days" && (
          <div className="flex-1 min-w-[150px]">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-white transition-colors bg-gray-500 rounded hover:bg-gray-600"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {individualCards && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Contributed Projects</p>
            <p className="text-2xl font-bold text-gray-900">
              {individualCards.contributedProjects}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Contributed Tasks</p>
            <p className="text-2xl font-bold text-gray-900">
              {individualCards.contributedTasks}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Assigned Milestones</p>
            <p className="text-2xl font-bold text-gray-900">
              {individualCards.assignedMilestones}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Picked Milestones</p>
            <p className="text-2xl font-bold text-gray-900">
              {individualCards.pickedMilestones}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Completed Milestones</p>
            <p className="text-2xl font-bold text-gray-900">
              {individualCards.completedMilestones}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Pending Milestones</p>
            <p className="text-2xl font-bold text-gray-900">
              {individualCards.pendingMilestones}
            </p>
          </div>
        </div>
      )}

      {/* ✅ RED/GREEN Task Breakdown Stacked Bar Chart - Individual View */}
      {taskBreakdownData && taskBreakdownData.total > 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Your Task Breakdown
          </h3>
          <StatisticsChart
            options={getStackedBarChartOptions("Task Status", ["Your Tasks"])}
            series={[
              {
                name: "✅ Completed",
                data: [taskBreakdownData.completed],
              },
              {
                name: "⏳ Pending",
                data: [taskBreakdownData.pending],
              },
            ]}
            type="bar"
            height={150}
          />
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#0acf97" }}
              ></span>
              <span className="text-sm text-gray-600">
                ✅ Completed ({taskBreakdownData.completed})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#ff4979" }}
              ></span>
              <span className="text-sm text-gray-600">
                ⏳ Pending ({taskBreakdownData.pending})
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Total: {taskBreakdownData.total} tasks
            </div>
          </div>
        </div>
      )}

      {/* Charts Section - Matching reference design */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Task Status Distribution - Donut Chart */}
        {chartData && chartData.labels.length > 0 && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Task Status Distribution
            </h3>
            <StatisticsChart
              options={getDonutChartOptions(
                "Tasks by Status",
                chartData.labels,
              )}
              series={chartData.series}
              type="donut"
              height={300}
            />
          </div>
        )}

        {/* Milestone Breakdown - Pie Chart */}
        {milestoneChartData && milestoneChartData.series.some((v) => v > 0) && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Milestone Breakdown
            </h3>
            <StatisticsChart
              options={getPieChartOptions(
                "Milestone Distribution",
                milestoneChartData.labels,
              )}
              series={milestoneChartData.series}
              type="pie"
              height={300}
            />
          </div>
        )}
      </div>

      {/* Filters for Table */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow">
        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Project
          </label>
          <select
            value={filters.project_id}
            onChange={(e) => handleFilterChange("project_id", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {individualProjects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange("start_date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange("end_date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Task Name
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Project
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Assigned By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-500 rounded-full border-b-transparent animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : individualTable.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No tasks found
                  </td>
                </tr>
              ) : (
                individualTable.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {task.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {task.project}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-800"
                              : task.status === "blocked"
                                ? "bg-red-100 text-red-800"
                                : task.status === "review"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {task.assignedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {individualTablePagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing{" "}
              {(individualTablePagination.currentPage - 1) *
                individualTablePagination.itemsPerPage +
                1}{" "}
              to{" "}
              {Math.min(
                individualTablePagination.currentPage *
                  individualTablePagination.itemsPerPage,
                individualTablePagination.totalItems,
              )}{" "}
              of {individualTablePagination.totalItems} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handlePageChange(individualTablePagination.currentPage - 1)
                }
                disabled={!individualTablePagination.hasPreviousPage}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  handlePageChange(individualTablePagination.currentPage + 1)
                }
                disabled={!individualTablePagination.hasNextPage}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualStatisticsView;
