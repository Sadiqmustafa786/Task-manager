// client/src/stores/useBacklogStore.js
import { create } from "zustand";
import { backlogService } from "../services/backlog.service";
import { showError } from "../components/toaster/Toaster";

export const useBacklogStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────────
  backlogs: [],
  currentBacklog: null,
  categories: [],
  labels: [],
  tasks: [],
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  },

  // Loading states
  loadingBacklogs: false,
  loadingStats: false,
  loadingCategories: false,
  loadingLabels: false,
  loadingTasks: false,
  loadingCreate: false,
  loadingUpdate: false,
  loadingDelete: false,

  // Filters
  filters: {
    search: "",
    status: "",
    priority: "",
    category: "",
    label: "",
    assignTo: "",
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },

  // ─── Backlog Actions ──────────────────────────────────────────────────────

  fetchBacklogs: async (projectId, params = {}) => {
    set({ loadingBacklogs: true });
    try {
      const response = await backlogService.getBacklogs(projectId, {
        ...get().filters,
        ...params,
      });
      if (response.success) {
        set({
          backlogs: response.data,
          pagination: response.pagination,
          stats: response.stats,
          loadingBacklogs: false,
        });
        return response.data;
      }
      set({ loadingBacklogs: false });
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to fetch backlogs");
      set({ loadingBacklogs: false });
      return null;
    }
  },

  fetchBacklogById: async (backlogId) => {
    try {
      const response = await backlogService.getBacklogById(backlogId);
      if (response.success) {
        set({ currentBacklog: response.data });
        return response.data;
      }
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to fetch backlog");
      return null;
    }
  },

  createBacklog: async (projectId, backlogData) => {
    set({ loadingCreate: true });
    try {
      const response = await backlogService.createBacklog(
        projectId,
        backlogData,
      );
      if (response.success) {
        set((state) => ({
          backlogs: [response.data, ...state.backlogs],
          loadingCreate: false,
        }));
        return response.data;
      }
      set({ loadingCreate: false });
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create backlog");
      set({ loadingCreate: false });
      return null;
    }
  },

  updateBacklog: async (backlogId, updateData) => {
    set({ loadingUpdate: true });
    try {
      const response = await backlogService.updateBacklog(
        backlogId,
        updateData,
      );
      if (response.success) {
        set((state) => ({
          backlogs: state.backlogs.map((b) =>
            b._id === backlogId ? response.data : b,
          ),
          currentBacklog: response.data,
          loadingUpdate: false,
        }));
        return response.data;
      }
      set({ loadingUpdate: false });
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update backlog");
      set({ loadingUpdate: false });
      return null;
    }
  },

  deleteBacklog: async (backlogId) => {
    set({ loadingDelete: true });
    try {
      const response = await backlogService.deleteBacklog(backlogId);
      if (response.success) {
        set((state) => ({
          backlogs: state.backlogs.filter((b) => b._id !== backlogId),
          loadingDelete: false,
        }));
        return true;
      }
      set({ loadingDelete: false });
      return false;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete backlog");
      set({ loadingDelete: false });
      return false;
    }
  },

  // ─── Bulk Operations ──────────────────────────────────────────────────────

  bulkUpdateStatus: async (backlogIds, status) => {
    try {
      const response = await backlogService.bulkUpdateStatus(
        backlogIds,
        status,
      );
      if (response.success) {
        set((state) => ({
          backlogs: state.backlogs.map((b) =>
            backlogIds.includes(b._id) ? { ...b, status } : b,
          ),
        }));
        return response.data;
      }
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update status");
      return null;
    }
  },

  bulkDeleteBacklogs: async (backlogIds) => {
    try {
      const response = await backlogService.bulkDeleteBacklogs(backlogIds);
      if (response.success) {
        set((state) => ({
          backlogs: state.backlogs.filter((b) => !backlogIds.includes(b._id)),
        }));
        return true;
      }
      return false;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete backlogs");
      return false;
    }
  },

  // ─── Comments ─────────────────────────────────────────────────────────────

  addComment: async (backlogId, text) => {
    try {
      const response = await backlogService.addComment(backlogId, text);
      if (response.success) {
        set((state) => ({
          backlogs: state.backlogs.map((b) =>
            b._id === backlogId ? response.data : b,
          ),
          currentBacklog:
            state.currentBacklog?._id === backlogId
              ? response.data
              : state.currentBacklog,
        }));
        return response.data;
      }
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to add comment");
      return null;
    }
  },

  editComment: async (backlogId, commentId, text) => {
    try {
      const response = await backlogService.editComment(
        backlogId,
        commentId,
        text,
      );
      if (response.success) {
        set((state) => ({
          backlogs: state.backlogs.map((b) =>
            b._id === backlogId ? response.data : b,
          ),
          currentBacklog:
            state.currentBacklog?._id === backlogId
              ? response.data
              : state.currentBacklog,
        }));
        return response.data;
      }
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to edit comment");
      return null;
    }
  },

  deleteComment: async (backlogId, commentId) => {
    try {
      const response = await backlogService.deleteComment(backlogId, commentId);
      if (response.success) {
        set((state) => ({
          backlogs: state.backlogs.map((b) =>
            b._id === backlogId ? response.data : b,
          ),
          currentBacklog:
            state.currentBacklog?._id === backlogId
              ? response.data
              : state.currentBacklog,
        }));
        return true;
      }
      return false;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete comment");
      return false;
    }
  },

  // ─── Categories ───────────────────────────────────────────────────────────

  fetchCategories: async (projectId) => {
    set({ loadingCategories: true });
    try {
      const response = await backlogService.getCategories(projectId);
      if (response.success) {
        set({ categories: response.data, loadingCategories: false });
        return response.data;
      }
      set({ loadingCategories: false });
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to fetch categories");
      set({ loadingCategories: false });
      return null;
    }
  },

  createCategory: async (projectId, categoryData) => {
    try {
      const response = await backlogService.createCategory(
        projectId,
        categoryData,
      );
      if (response.success) {
        set((state) => ({
          categories: [...state.categories, response.data],
        }));
        return response.data;
      }
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create category");
      return null;
    }
  },

  updateCategory: async (categoryId, categoryData) => {
    try {
      const response = await backlogService.updateCategory(
        categoryId,
        categoryData,
      );
      if (response.success) {
        set((state) => ({
          categories: state.categories.map((c) =>
            c._id === categoryId ? response.data : c,
          ),
        }));
        return response.data;
      }
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update category");
      return null;
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      const response = await backlogService.deleteCategory(categoryId);
      if (response.success) {
        set((state) => ({
          categories: state.categories.filter((c) => c._id !== categoryId),
        }));
        return true;
      }
      return false;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete category");
      return false;
    }
  },

  // ─── Labels ───────────────────────────────────────────────────────────────

  fetchLabels: async (projectId) => {
    set({ loadingLabels: true });
    try {
      const response = await backlogService.getLabels(projectId);
      if (response.success) {
        set({ labels: response.data, loadingLabels: false });
        return response.data;
      }
      set({ loadingLabels: false });
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to fetch labels");
      set({ loadingLabels: false });
      return null;
    }
  },

  createLabel: async (projectId, labelData) => {
    try {
      const response = await backlogService.createLabel(projectId, labelData);
      if (response.success) {
        set((state) => ({
          labels: [...state.labels, response.data],
        }));
        return response.data;
      }
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create label");
      return null;
    }
  },

  updateLabel: async (labelId, labelData) => {
    try {
      const response = await backlogService.updateLabel(labelId, labelData);
      if (response.success) {
        set((state) => ({
          labels: state.labels.map((l) =>
            l._id === labelId ? response.data : l,
          ),
        }));
        return response.data;
      }
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update label");
      return null;
    }
  },

  deleteLabel: async (labelId) => {
    try {
      const response = await backlogService.deleteLabel(labelId);
      if (response.success) {
        set((state) => ({
          labels: state.labels.filter((l) => l._id !== labelId),
        }));
        return true;
      }
      return false;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete label");
      return false;
    }
  },

  // ─── Tasks ────────────────────────────────────────────────────────────────

  fetchTasks: async (projectId) => {
    set({ loadingTasks: true });
    try {
      const response = await backlogService.getProjectTasks(projectId);
      if (response.success) {
        set({ tasks: response.data, loadingTasks: false });
        return response.data;
      }
      set({ loadingTasks: false });
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to fetch tasks");
      set({ loadingTasks: false });
      return null;
    }
  },

  // ─── Stats ────────────────────────────────────────────────────────────────

  fetchStats: async (projectId) => {
    set({ loadingStats: true });
    try {
      const response = await backlogService.getBacklogStats(projectId);
      if (response.success) {
        set({ stats: response.data, loadingStats: false });
        return response.data;
      }
      set({ loadingStats: false });
      return null;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to fetch stats");
      set({ loadingStats: false });
      return null;
    }
  },

  // ─── Filters ──────────────────────────────────────────────────────────────

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  resetFilters: () => {
    set({
      filters: {
        search: "",
        status: "",
        priority: "",
        category: "",
        label: "",
        assignTo: "",
        startDate: "",
        endDate: "",
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    });
  },

  // ─── Clear State ──────────────────────────────────────────────────────────

  clearBacklogs: () => {
    set({
      backlogs: [],
      currentBacklog: null,
      stats: null,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  },
}));
