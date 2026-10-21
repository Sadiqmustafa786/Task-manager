// stores/useProjectStore.js
import { create } from "zustand";
import { projectService } from "../services/project.service";

const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,
  formData: { workflows: [], users: [] },
  formDataLoading: false,
  loading: false,
  error: null,

  fetchFormData: async () => {
    set({ formDataLoading: true, error: null });
    try {
      const response = await projectService.getProjectFormData();
      set({
        formData: { workflows: response.workflows, users: response.users },
        formDataLoading: false,
      });
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch form data",
        formDataLoading: false,
      });
      throw error;
    }
  },

  fetchProjects: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await projectService.getAllProjects(filters);
      const validProjects = (response.projects || []).filter(
        (p) => p && p._id && p._id !== "create",
      );
      set({ projects: validProjects, loading: false });
      return validProjects;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch projects",
        loading: false,
      });
      throw error;
    }
  },

  fetchProjectById: async (projectId) => {
    if (!projectId || projectId === "create" || projectId === "form-data") {
      set({ error: "Invalid project ID", loading: false });
      return null;
    }
    set({ loading: true, error: null });
    try {
      const response = await projectService.getProjectById(projectId);
      set({ currentProject: response.project, loading: false });
      return response.project;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch project",
        loading: false,
      });
      throw error;
    }
  },

  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const response = await projectService.createProject(projectData);
      set((state) => ({
        projects: [response.project, ...state.projects],
        loading: false,
      }));
      return response.project;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to create project",
        loading: false,
      });
      throw error;
    }
  },

  updateProject: async (projectId, updateData) => {
    set({ loading: true, error: null });
    try {
      const response = await projectService.updateProject(
        projectId,
        updateData,
      );
      set((state) => ({
        projects: state.projects.map((p) =>
          p._id === projectId ? response.project : p,
        ),
        currentProject: response.project,
        loading: false,
      }));
      return response.project;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update project",
        loading: false,
      });
      throw error;
    }
  },

  deleteProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await projectService.deleteProject(projectId);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== projectId),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete project",
        loading: false,
      });
      throw error;
    }
  },

  updateProjectColor: async (projectId, color) => {
    set({ loading: true, error: null });
    try {
      const response = await projectService.updateProjectColor(
        projectId,
        color,
      );

      // Update the project with the full response project which includes cardColor
      set((state) => ({
        projects: state.projects.map((p) =>
          p._id === projectId ? response.project : p,
        ),
        currentProject:
          state.currentProject?._id === projectId
            ? response.project
            : state.currentProject,
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update color",
        loading: false,
      });
      throw error;
    }
  },

  updatePhaseStatus: async (projectId, phaseId, updateData) => {
    set({ loading: true, error: null });
    try {
      const response = await projectService.updatePhaseStatus(
        projectId,
        phaseId,
        updateData,
      );
      set((state) => ({
        currentProject:
          state.currentProject?._id === projectId
            ? {
                ...state.currentProject,
                phases: state.currentProject.phases.map((p) =>
                  p._id === phaseId ? { ...p, ...updateData } : p,
                ),
                progress: response.project.progress,
                status: response.project.status,
              }
            : state.currentProject,
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update phase",
        loading: false,
      });
      throw error;
    }
  },

  toggleStarProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const response = await projectService.toggleStarProject(projectId);

      // Update the star status in projects list
      set((state) => ({
        projects: state.projects.map((p) =>
          p._id === projectId ? { ...p, isStarred: response.isStarred } : p,
        ),
        currentProject:
          state.currentProject?._id === projectId
            ? { ...state.currentProject, isStarred: response.isStarred }
            : state.currentProject,
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

  fetchStarredProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await projectService.getStarredProjects();
      // Ensure each project has isStarred = true since they come from starred API
      const starredProjects = (response.projects || []).map((p) => ({
        ...p,
        isStarred: true,
      }));
      set({ projects: starredProjects, loading: false });
      return starredProjects;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to fetch starred projects",
        loading: false,
      });
      throw error;
    }
  },

  closeProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const response = await projectService.closeProject(projectId);

      // Update the project status and progress in the projects list
      set((state) => ({
        projects: state.projects.map((p) =>
          p._id === projectId
            ? { ...p, status: "completed", progress: 100 }
            : p,
        ),
        currentProject:
          state.currentProject?._id === projectId
            ? { ...state.currentProject, status: "completed", progress: 100 }
            : state.currentProject,
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to close project",
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentProject: () => set({ currentProject: null }),
}));

export { useProjectStore };
