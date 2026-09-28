// services/task.service.js
import http from "./http";

export const taskService = {
  // Get form data (users and teams)
  getTaskFormData: async (projectId = null, teamId = null) => {
    let url = "/tasks/form-data";
    const params = new URLSearchParams();
    if (projectId) params.append("projectId", projectId);
    if (teamId) params.append("teamId", teamId);
    if (params.toString()) url += `?${params.toString()}`;
    const { data } = await http.get(url);
    return data;
  },

  // Get project phases for task assignment
  getProjectPhases: async (projectId) => {
    const { data } = await http.get(`/tasks/project/${projectId}/phases`);
    return data;
  },

  // Create new task
  createTask: async (taskData) => {
    const { data } = await http.post("/tasks", taskData);
    return data;
  },

  // Get all tasks with filters
  getAllTasks: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const url = params ? `/tasks?${params}` : "/tasks";
    const { data } = await http.get(url);
    return data;
  },

  // Get single task by ID
  getTaskById: async (taskId) => {
    const { data } = await http.get(`/tasks/${taskId}`);
    return data;
  },

  // Update task
  updateTask: async (taskId, updateData) => {
    const { data } = await http.put(`/tasks/${taskId}`, updateData);
    return data;
  },

  // Update task status
  updateTaskStatus: async (taskId, status) => {
    const { data } = await http.put(`/tasks/${taskId}/status`, { status });
    return data;
  },

  // Add comment to task
  addTaskComment: async (taskId, text) => {
    const { data } = await http.post(`/tasks/${taskId}/comments`, { text });
    return data;
  },

  // Delete task
  deleteTask: async (taskId) => {
    const { data } = await http.delete(`/tasks/${taskId}`);
    return data;
  },

  // Add member to task
  addTaskMember: async (taskId, userId, role) => {
    const { data } = await http.post(`/tasks/${taskId}/members`, {
      userId,
      role,
    });
    return data;
  },

  // Remove member from task
  removeTaskMember: async (taskId, userId, role) => {
    const { data } = await http.delete(`/tasks/${taskId}/members`, {
      data: { userId, role },
    });
    return data;
  },

  // Toggle star task
  toggleStarTask: async (taskId) => {
    const { data } = await http.put(`/tasks/${taskId}/star`);
    return data;
  },

  completeTask: async (taskId) => {
    const { data } = await http.put(`/tasks/${taskId}/complete`);
    return data;
  },

  getTodayTasks: async () => {
    const { data } = await http.get("/tasks/today");
    return data;
  },
};
