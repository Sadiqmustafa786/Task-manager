// client/src/stores/useTaskStore.js
import { create } from "zustand";
import { taskService } from "../services/task.service";

const useTaskStore = create((set, get) => ({
  // State
  tasks: [],
  todayTasks: [],
  currentTask: null,
  formData: { users: [], teams: [] },
  projectPhases: [],
  loading: false,
  loadingTodayTasks: false,
  error: null,

  // Fetch form data (users and teams)
  fetchFormData: async (projectId = null, teamId = null) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.getTaskFormData(projectId, teamId);
      set({
        formData: { users: response.users || [], teams: response.teams || [] },
        loading: false,
      });
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch form data",
        loading: false,
      });
      throw error;
    }
  },

  // Fetch project phases
  fetchProjectPhases: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.getProjectPhases(projectId);
      set({
        projectPhases: response.phases || [],
        loading: false,
      });
      return response.phases;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to fetch project phases",
        loading: false,
      });
      throw error;
    }
  },

  // Fetch all tasks
  fetchTasks: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.getAllTasks(filters);
      set({ tasks: response.tasks || [], loading: false });
      return response.tasks;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch tasks",
        loading: false,
      });
      throw error;
    }
  },

  // Fetch today's tasks
  fetchTodayTasks: async () => {
    set({ loadingTodayTasks: true, error: null });
    try {
      const response = await taskService.getTodayTasks();
      set({
        todayTasks: response.tasks || [],
        loadingTodayTasks: false,
      });
      return response.tasks;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch today's tasks",
        loadingTodayTasks: false,
      });
      throw error;
    }
  },

  // Fetch single task
  fetchTaskById: async (taskId) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.getTaskById(taskId);
      set({ currentTask: response.task, loading: false });
      return response.task;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch task",
        loading: false,
      });
      throw error;
    }
  },

  // Create task
  createTask: async (taskData) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.createTask(taskData);
      set((state) => ({
        tasks: [response.task, ...state.tasks],
        loading: false,
      }));
      return response.task;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to create task",
        loading: false,
      });
      throw error;
    }
  },

  // Update task
  updateTask: async (taskId, updateData) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.updateTask(taskId, updateData);
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === taskId ? response.task : t)),
        currentTask: response.task,
        loading: false,
      }));
      return response.task;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update task",
        loading: false,
      });
      throw error;
    }
  },

  // Update task status
  updateTaskStatus: async (taskId, status) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.updateTaskStatus(taskId, status);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === taskId ? { ...t, status: response.task.status } : t,
        ),
        currentTask:
          state.currentTask?._id === taskId
            ? { ...state.currentTask, status: response.task.status }
            : state.currentTask,
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update task status",
        loading: false,
      });
      throw error;
    }
  },

  // Add comment to task
  addTaskComment: async (taskId, text) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.addTaskComment(taskId, text);
      set((state) => ({
        currentTask:
          state.currentTask?._id === taskId
            ? {
                ...state.currentTask,
                comments: [
                  ...(state.currentTask.comments || []),
                  response.comment,
                ],
              }
            : state.currentTask,
        loading: false,
      }));
      return response.comment;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to add comment",
        loading: false,
      });
      throw error;
    }
  },

  // Delete task
  deleteTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      await taskService.deleteTask(taskId);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== taskId),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete task",
        loading: false,
      });
      throw error;
    }
  },

  // Add member to task
  addTaskMember: async (taskId, userId, role) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.addTaskMember(taskId, userId, role);
      set((state) => ({
        currentTask: response.task,
        tasks: state.tasks.map((t) => (t._id === taskId ? response.task : t)),
        loading: false,
      }));
      return response.task;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to add member",
        loading: false,
      });
      throw error;
    }
  },

  // Remove member from task
  removeTaskMember: async (taskId, userId, role) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.removeTaskMember(taskId, userId, role);
      set((state) => ({
        currentTask: response.task,
        tasks: state.tasks.map((t) => (t._id === taskId ? response.task : t)),
        loading: false,
      }));
      return response.task;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to remove member",
        loading: false,
      });
      throw error;
    }
  },

  toggleStarTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.toggleStarTask(taskId);
      set((state) => ({
        currentTask:
          state.currentTask?._id === taskId
            ? { ...state.currentTask, isStarred: response.isStarred }
            : state.currentTask,
        tasks: state.tasks.map((t) =>
          t._id === taskId ? { ...t, isStarred: response.isStarred } : t,
        ),
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to toggle star",
        loading: false,
      });
      throw error;
    }
  },

  completeTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.completeTask(taskId);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === taskId
            ? { ...t, status: "completed", completedAt: new Date() }
            : t,
        ),
        currentTask:
          state.currentTask?._id === taskId
            ? {
                ...state.currentTask,
                status: "completed",
                completedAt: new Date(),
              }
            : state.currentTask,
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to complete task",
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentTask: () => set({ currentTask: null }),
  clearProjectPhases: () => set({ projectPhases: [] }),
  clearTodayTasks: () => set({ todayTasks: [] }),
}));

export { useTaskStore };
