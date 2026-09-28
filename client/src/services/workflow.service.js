// services/workflow.service.js
import http from "./http";

export const workflowService = {
  // Get all general workflows
  getGeneralWorkflows: async () => {
    const { data } = await http.get("/workflows/general");
    return data;
  },

  // Get user workflows
  getUserWorkflows: async (teamId = null) => {
    const url = teamId ? `/workflows/user?teamId=${teamId}` : "/workflows/user";
    const { data } = await http.get(url);
    return data;
  },

  // Get single workflow by ID
  getWorkflowById: async (workflowId) => {
    const { data } = await http.get(`/workflows/${workflowId}`);
    return data;
  },

  // Create workflow
  createWorkflow: async (workflowData) => {
    const { data } = await http.post("/workflows", workflowData);
    return data;
  },

  // Update workflow
  updateWorkflow: async (workflowId, workflowData) => {
    const { data } = await http.put(`/workflows/${workflowId}`, workflowData);
    return data;
  },

  // Delete workflow
  deleteWorkflow: async (workflowId) => {
    const { data } = await http.delete(`/workflows/${workflowId}`);
    return data;
  },

  // Add phase to workflow
  addPhase: async (workflowId, phaseData) => {
    const { data } = await http.post(
      `/workflows/${workflowId}/phases`,
      phaseData,
    );
    return data;
  },

  // Update phase
  updatePhase: async (workflowId, phaseId, phaseData) => {
    const { data } = await http.put(
      `/workflows/${workflowId}/phases/${phaseId}`,
      phaseData,
    );
    return data;
  },

  // Delete phase
  deletePhase: async (workflowId, phaseId) => {
    const { data } = await http.delete(
      `/workflows/${workflowId}/phases/${phaseId}`,
    );
    return data;
  },
};
