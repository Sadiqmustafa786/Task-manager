// client/src/views/statistics/OrganizationalStatisticsView.jsx
import React, { useEffect, useRef, useState } from "react";
import { useStatisticsStore } from "../../stores/useStatisticsStore";
import { useAuthStore } from "../../stores/useAuthStore";
import StatisticsChart from "../../components/statistics/StatisticsChart";
import {
  getStackedBarChartOptions,
  getDonutChartOptions,
} from "../../utils/statisticsUtils";

const OrganizationalStatisticsView = () => {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    project_id: "",
    page: 1,
  });

  const tableRef = useRef(null);

  const {
    organizationalStats,
    organizationalCards,
    organizationalTable,
    projectsList,
    organizationalPagination,
    loadingOrganizationalStats,
    loadingOrganizationalCards,
    loadingOrganizationalTable,
    getOrganizationalStats,
    getOrganizationalCards,
    getOrganizationalTable,
    getProjectsList,
  } = useStatisticsStore();

  useEffect(() => {
    getOrganizationalCards();
    getProjectsList();
  }, []);

  useEffect(() => {
    getOrganizationalStats({
      project_id: filters.project_id,
      page: filters.page,
    });
  }, [filters.project_id, filters.page]);

  useEffect(() => {
    getOrganizationalTable({
      project_id: filters.project_id,
    });
  }, [filters.project_id]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      project_id: "",
      page: 1,
    });
  };

  const loadMore = () => {
    if (organizationalPagination.hasMoreRecord && !loadingOrganizationalStats) {
      setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
        const buffer = 50;
        if (scrollTop + clientHeight >= scrollHeight - buffer) {
          loadMore();
        }
      }
    };

    const element = tableRef.current;
    if (element) {
      element.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (element) {
        element.removeEventListener("scroll", handleScroll);
      }
    };
  }, [loadMore]);

  const loading =
    loadingOrganizationalStats ||
    loadingOrganizationalCards ||
    loadingOrganizationalTable;

  // Prepare workload distribution chart data
  const getWorkloadChartData = () => {
    if (!organizationalCards?.workloadDistribution) return null;

    const data = organizationalCards.workloadDistribution;
    if (data.length === 0) return null;

    return {
      categories: data.map((item) => item.name),
      series: data.map((item) => item.tasks),
    };
  };

  // Prepare task status distribution chart data
  const getTaskStatusChartData = () => {
    if (!organizationalCards?.taskStatusDistribution) return null;

    const distribution = organizationalCards.taskStatusDistribution;
    const labels = Object.keys(distribution);
    const series = Object.values(distribution);

    if (labels.length === 0) return null;

    return {
      labels: labels.map(
        (label) => label.charAt(0).toUpperCase() + label.slice(1),
      ),
      series,
    };
  };

  // ✅ Prepare project stats for RED/GREEN horizontal stacked bar chart
  const getProjectStatsChartData = () => {
    if (!organizationalTable || organizationalTable.length === 0) return null;

    const sorted = [...organizationalTable]
      .sort((a, b) => b.totalTasks - a.totalTasks)
      .slice(0, 10);

    return {
      categories: sorted.map((p) => p.name),
      completed: sorted.map((p) => p.completedTasks),
      pending: sorted.map((p) => p.pendingTasks),
    };
  };

  const workloadData = getWorkloadChartData();
  const taskStatusData = getTaskStatusChartData();
  const projectStatsData = getProjectStatsChartData();

  if (loading && !organizationalCards) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto border-b-2 border-blue-500 rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-500">
            Loading organizational statistics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Organizational Statistics
        </h1>
      </div>

      {/* Stats Cards */}
      {organizationalCards && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Projects</p>
            <p className="text-2xl font-bold text-gray-900">
              {organizationalCards.totalProjects}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900">
              {organizationalCards.totalTasks}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Completed Tasks</p>
            <p className="text-2xl font-bold text-gray-900">
              {organizationalCards.completedTasks}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Pending Tasks</p>
            <p className="text-2xl font-bold text-gray-900">
              {organizationalCards.pendingTasks}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Milestones</p>
            <p className="text-2xl font-bold text-gray-900">
              {organizationalCards.totalMilestones}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Completed Milestones</p>
            <p className="text-2xl font-bold text-gray-900">
              {organizationalCards.completedMilestones}
            </p>
          </div>
        </div>
      )}

      {/* Charts Section - RED/GREEN horizontal stacked bars */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Workload Distribution - Horizontal Bar Chart */}
        {workloadData && workloadData.categories.length > 0 && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Workload Distribution (Tasks per Project)
            </h3>
            <StatisticsChart
              options={getStackedBarChartOptions(
                "Project Workload",
                workloadData.categories,
              )}
              series={[
                {
                  name: "Tasks",
                  data: workloadData.series,
                },
              ]}
              type="bar"
              height={Math.max(300, workloadData.categories.length * 35)}
            />
          </div>
        )}

        {/* Task Status Distribution - Donut Chart */}
        {taskStatusData && taskStatusData.labels.length > 0 && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Task Status Distribution
            </h3>
            <StatisticsChart
              options={getDonutChartOptions(
                "Tasks by Status",
                taskStatusData.labels,
              )}
              series={taskStatusData.series}
              type="donut"
              height={300}
            />
          </div>
        )}
      </div>

      {/* ✅ Project Stats Stacked Bar Chart - RED/GREEN design */}
      {projectStatsData && projectStatsData.categories.length > 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Project Task Breakdown (Top 10)
          </h3>
          <StatisticsChart
            options={getStackedBarChartOptions(
              "Tasks by Project",
              projectStatsData.categories,
            )}
            series={[
              {
                name: "✅ Completed",
                data: projectStatsData.completed,
              },
              {
                name: "⏳ Pending",
                data: projectStatsData.pending,
              },
            ]}
            type="bar"
            height={400}
          />
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#0acf97" }}
              ></span>
              <span className="text-sm text-gray-600">✅ Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#ff4979" }}
              ></span>
              <span className="text-sm text-gray-600">⏳ Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Project Filter */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow">
        <div className="flex-1 min-w-[200px]">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Filter by Project
          </label>
          <select
            value={filters.project_id}
            onChange={(e) => handleFilterChange("project_id", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projectsList.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-white transition-colors bg-gray-500 rounded hover:bg-gray-600"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Workload Distribution Table with Infinite Scroll */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Workload Distribution
          </h3>
        </div>
        <div
          ref={tableRef}
          className="overflow-y-auto"
          style={{ maxHeight: "500px" }}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Project Name
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Total Tasks
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Completed
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Pending
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Progress
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Created By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && organizationalTable.length === 0 ? (
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
              ) : organizationalTable.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No projects found
                  </td>
                </tr>
              ) : (
                organizationalTable.map((project) => (
                  <tr key={project._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {project.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {project.totalTasks}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-600">
                      {project.completedTasks}
                    </td>
                    <td className="px-6 py-4 text-sm text-yellow-600">
                      {project.pendingTasks}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 overflow-hidden bg-gray-200 rounded-full">
                          <div
                            className="h-full transition-all duration-500 bg-blue-500 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          {project.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {project.createdBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {loading && organizationalTable.length > 0 && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-500 rounded-full border-b-transparent animate-spin" />
            </div>
          )}
          {!organizationalPagination.hasMoreRecord &&
            organizationalTable.length > 0 && (
              <div className="px-6 py-4 text-sm text-center text-gray-500 border-t border-gray-200">
                No more projects to load
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationalStatisticsView;
