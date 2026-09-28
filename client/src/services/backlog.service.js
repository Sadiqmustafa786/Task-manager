// client/src/services/backlog.service.js
import http from "./http";

export const backlogService = {
  // ─── Backlog CRUD ──────────────────────────────────────────────────────────

  getBacklogs: async (projectId, params = {}) => {
    const { data } = await http.get(`/backlog/project/${projectId}`, {
      params,
    });
    return data;
  },

  getBacklogById: async (backlogId) => {
    const { data } = await http.get(`/backlog/${backlogId}`);
    return data;
  },

  createBacklog: async (projectId, backlogData) => {
    const { data } = await http.post(
      `/backlog/project/${projectId}`,
      backlogData,
    );
    return data;
  },

  updateBacklog: async (backlogId, updateData) => {
    const { data } = await http.put(`/backlog/${backlogId}`, updateData);
    return data;
  },

  deleteBacklog: async (backlogId) => {
    const { data } = await http.delete(`/backlog/${backlogId}`);
    return data;
  },

  // ─── Bulk Operations ──────────────────────────────────────────────────────

  bulkUpdateStatus: async (backlogIds, status) => {
    const { data } = await http.post(`/backlog/bulk/status`, {
      backlogIds,
      status,
    });
    return data;
  },

  bulkDeleteBacklogs: async (backlogIds) => {
    const { data } = await http.post(`/backlog/bulk/delete`, { backlogIds });
    return data;
  },

  // ─── Comments ─────────────────────────────────────────────────────────────

  addComment: async (backlogId, text) => {
    const { data } = await http.post(`/backlog/${backlogId}/comments`, {
      text,
    });
    return data;
  },

  editComment: async (backlogId, commentId, text) => {
    const { data } = await http.put(
      `/backlog/${backlogId}/comments/${commentId}`,
      { text },
    );
    return data;
  },

  deleteComment: async (backlogId, commentId) => {
    const { data } = await http.delete(
      `/backlog/${backlogId}/comments/${commentId}`,
    );
    return data;
  },

  // ─── Categories ───────────────────────────────────────────────────────────

  getCategories: async (projectId) => {
    const { data } = await http.get(`/backlog/project/${projectId}/categories`);
    return data;
  },

  createCategory: async (projectId, categoryData) => {
    const { data } = await http.post(
      `/backlog/project/${projectId}/categories`,
      categoryData,
    );
    return data;
  },

  updateCategory: async (categoryId, categoryData) => {
    const { data } = await http.put(
      `/backlog/categories/${categoryId}`,
      categoryData,
    );
    return data;
  },

  deleteCategory: async (categoryId) => {
    const { data } = await http.delete(`/backlog/categories/${categoryId}`);
    return data;
  },

  // ─── Labels ───────────────────────────────────────────────────────────────

  getLabels: async (projectId) => {
    const { data } = await http.get(`/backlog/project/${projectId}/labels`);
    return data;
  },

  createLabel: async (projectId, labelData) => {
    const { data } = await http.post(
      `/backlog/project/${projectId}/labels`,
      labelData,
    );
    return data;
  },

  updateLabel: async (labelId, labelData) => {
    const { data } = await http.put(`/backlog/labels/${labelId}`, labelData);
    return data;
  },

  deleteLabel: async (labelId) => {
    const { data } = await http.delete(`/backlog/labels/${labelId}`);
    return data;
  },

  // ─── Tasks ────────────────────────────────────────────────────────────────

  getProjectTasks: async (projectId) => {
    const { data } = await http.get(`/backlog/project/${projectId}/tasks`);
    return data;
  },

  // ─── Stats ────────────────────────────────────────────────────────────────

  getBacklogStats: async (projectId) => {
    const { data } = await http.get(`/backlog/project/${projectId}/stats`);
    return data;
  },

  // ─── Export ───────────────────────────────────────────────────────────────

  exportBacklogs: async (projectId, params = {}) => {
    const { data } = await http.get(`/backlog/project/${projectId}/export`, {
      params,
    });
    return data;
  },
};
