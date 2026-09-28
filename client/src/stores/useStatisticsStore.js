// client/src/stores/useStatisticsStore.js
import { create } from "zustand";
import { statisticsService } from "../services/statistics.service";
import { showError } from "../components/toaster/Toaster";

export const useStatisticsStore = create((set, get) => ({
  // State
  individualCards: null,
  individualTable: [],
  individualProjects: [],
  organizationalStats: null,
  organizationalCards: null,
  organizationalTable: [],
  projectsList: [],
  employees: [],

  // Loading states
  loadingIndividualCards: false,
  loadingIndividualTable: false,
  loadingOrganizationalStats: false,
  loadingOrganizationalCards: false,
  loadingOrganizationalTable: false,

  // Pagination
  individualTablePagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  organizationalPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasMoreRecord: false,
  },

  // Actions
  getIndividualCards: async (params = {}) => {
    set({ loadingIndividualCards: true });
    try {
      const response = await statisticsService.getIndividualCards(params);
      if (response.success) {
        set({ individualCards: response.data, loadingIndividualCards: false });
        return response.data;
      }
      set({ loadingIndividualCards: false });
      return null;
    } catch (error) {
      showError(
        error.response?.data?.message || "Failed to fetch individual cards",
      );
      set({ loadingIndividualCards: false });
      return null;
    }
  },

  getIndividualTable: async (params = {}) => {
    set({ loadingIndividualTable: true });
    try {
      const response = await statisticsService.getIndividualTable(params);
      if (response.success) {
        set({
          individualTable: response.data || [],
          individualTablePagination: response.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          loadingIndividualTable: false,
        });
        return response.data;
      }
      set({ loadingIndividualTable: false });
      return null;
    } catch (error) {
      showError(
        error.response?.data?.message || "Failed to fetch individual table",
      );
      set({ loadingIndividualTable: false });
      return null;
    }
  },

  getIndividualProjects: async (params = {}) => {
    try {
      const response = await statisticsService.getIndividualProjects(params);
      if (response.success) {
        set({ individualProjects: response.data || [] });
        return response.data;
      }
      return null;
    } catch (error) {
      showError(
        error.response?.data?.message || "Failed to fetch individual projects",
      );
      return null;
    }
  },

  getOrganizationalStats: async (params = {}) => {
    set({ loadingOrganizationalStats: true });
    try {
      const response = await statisticsService.getOrganizationalStats(params);
      if (response.success) {
        set({
          organizationalStats: response.data,
          organizationalPagination: {
            currentPage: response.data?.page || 1,
            totalPages: response.data?.totalPages || 1,
            totalItems: response.data?.total || 0,
            hasMoreRecord: response.data?.has_more_record || false,
          },
          loadingOrganizationalStats: false,
        });
        return response.data;
      }
      set({ loadingOrganizationalStats: false });
      return null;
    } catch (error) {
      showError(
        error.response?.data?.message || "Failed to fetch organizational stats",
      );
      set({ loadingOrganizationalStats: false });
      return null;
    }
  },

  getOrganizationalCards: async (params = {}) => {
    set({ loadingOrganizationalCards: true });
    try {
      const response = await statisticsService.getOrganizationalCards(params);
      if (response.success) {
        const data = response.data;

        // Prepare chart data
        const taskStatusDistribution = data?.taskStatusDistribution || {};
        const workloadDistribution = data?.workloadDistribution || [];

        set({
          organizationalCards: data,
          chartData: {
            taskStatusDistribution: Object.entries(taskStatusDistribution).map(
              ([key, value]) => ({
                name: key.charAt(0).toUpperCase() + key.slice(1),
                value: value,
              }),
            ),
            workloadDistribution: workloadDistribution,
          },
          loadingOrganizationalCards: false,
        });
        return response.data;
      }
      set({ loadingOrganizationalCards: false });
      return null;
    } catch (error) {
      showError(
        error.response?.data?.message || "Failed to fetch organizational cards",
      );
      set({ loadingOrganizationalCards: false });
      return null;
    }
  },

  getOrganizationalTable: async (params = {}) => {
    set({ loadingOrganizationalTable: true });
    try {
      const response = await statisticsService.getOrganizationalTable(params);
      if (response.success) {
        set({
          organizationalTable: response.data || [],
          loadingOrganizationalTable: false,
        });
        return response.data;
      }
      set({ loadingOrganizationalTable: false });
      return null;
    } catch (error) {
      showError(
        error.response?.data?.message || "Failed to fetch organizational table",
      );
      set({ loadingOrganizationalTable: false });
      return null;
    }
  },

  getProjectsList: async (params = {}) => {
    try {
      const response = await statisticsService.getProjectsList(params);
      if (response.success) {
        set({ projectsList: response.data || [] });
        return response.data;
      }
      return null;
    } catch (error) {
      showError(
        error.response?.data?.message || "Failed to fetch projects list",
      );
      return null;
    }
  },

  getEmployees: async (params = {}) => {
    try {
      const response = await statisticsService.getEmployees(params);
      if (response.success) {
        set({ employees: response.data || [] });
        return response.data;
      }
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to fetch employees");
      return null;
    }
  },

  clearStatistics: () => {
    set({
      individualCards: null,
      individualTable: [],
      individualProjects: [],
      organizationalStats: null,
      organizationalCards: null,
      organizationalTable: [],
      projectsList: [],
      employees: [],
      chartData: {
        taskStatusDistribution: [],
        workloadDistribution: [],
      },
    });
  },
}));
