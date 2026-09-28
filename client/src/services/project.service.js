// services/project.service.js
import http from "./http";

export const projectService = {
  getProjectFormData: async () => {
    const { data } = await http.get("/projects/form-data");
    return data;
  },

  createProject: async (projectData) => {
    const { data } = await http.post("/projects", projectData);
    return data;
  },

  getAllProjects: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const url = params ? `/projects?${params}` : "/projects";
    const { data } = await http.get(url);
    return data;
  },

  getProjectById: async (projectId) => {
    if (!projectId || projectId === "create" || projectId === "form-data") {
      throw new Error("Invalid project ID");
    }
    const { data } = await http.get(`/projects/${projectId}`);
    return data;
  },

  updateProject: async (projectId, updateData) => {
    const { data } = await http.put(`/projects/${projectId}`, updateData);
    return data;
  },

  deleteProject: async (projectId) => {
    const { data } = await http.delete(`/projects/${projectId}`);
    return data;
  },

  updateProjectColor: async (projectId, color) => {
    const { data } = await http.put(`/projects/${projectId}/color`, { color });
    return data;
  },

  updatePhaseStatus: async (projectId, phaseId, updateData) => {
    const { data } = await http.put(
      `/projects/${projectId}/phases/${phaseId}`,
      updateData,
    );
    return data;
  },

  getProjectPhases: async (projectId) => {
    const { data } = await http.get(`/projects/${projectId}/phases`);
    return data;
  },

  toggleStarProject: async (projectId) => {
    const { data } = await http.put(`/projects/${projectId}/star`);
    return data;
  },

  // Get starred projects
  getStarredProjects: async () => {
    const { data } = await http.get("/projects/starred");
    return data;
  },

  closeProject: async (projectId) => {
    const { data } = await http.put(`/projects/${projectId}/close`);
    return data;
  },
};
