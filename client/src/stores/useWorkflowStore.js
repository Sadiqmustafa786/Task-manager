// stores/useWorkflowStore.js
import { create } from "zustand";
import { workflowService } from "../services/workflow.service";

const useWorkflowStore = create((set, get) => ({
  generalWorkflows: [],
  userWorkflows: [],
  currentWorkflow: null,
  loading: false,
  error: null,

  // Fetch general workflows
  fetchGeneralWorkflows: async () => {
    set({ loading: true, error: null });
    try {
      const response = await workflowService.getGeneralWorkflows();
      set({ generalWorkflows: response.workflows, loading: false });
      return response.workflows;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to fetch general workflows",
        loading: false,
      });
      throw error;
    }
  },

  // Fetch user workflows
  fetchUserWorkflows: async (teamId = null) => {
    set({ loading: true, error: null });
    try {
      const response = await workflowService.getUserWorkflows(teamId);
      set({ userWorkflows: response.workflows, loading: false });
      return response.workflows;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to fetch user workflows",
        loading: false,
      });
      throw error;
    }
  },

  // Fetch single workflow
  fetchWorkflowById: async (workflowId) => {
    set({ loading: true, error: null });
    try {
      const response = await workflowService.getWorkflowById(workflowId);
      set({ currentWorkflow: response.workflow, loading: false });
      return response.workflow;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch workflow",
        loading: false,
      });
      throw error;
    }
  },

  // Create workflow
  createWorkflow: async (workflowData) => {
    set({ loading: true, error: null });
    try {
      const response = await workflowService.createWorkflow(workflowData);
      set((state) => ({
        userWorkflows: [response.workflow, ...state.userWorkflows],
        loading: false,
      }));
      return response.workflow;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to create workflow",
        loading: false,
      });
      throw error;
    }
  },

  // Delete workflow
  deleteWorkflow: async (workflowId) => {
    set({ loading: true, error: null });
    try {
      await workflowService.deleteWorkflow(workflowId);
      set((state) => ({
        userWorkflows: state.userWorkflows.filter((w) => w._id !== workflowId),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete workflow",
        loading: false,
      });
      throw error;
    }
  },

  // Add phase
  addPhase: async (workflowId, phaseData) => {
    set({ loading: true, error: null });
    try {
      const response = await workflowService.addPhase(workflowId, phaseData);
      set((state) => ({
        currentWorkflow:
          state.currentWorkflow?._id === workflowId
            ? {
                ...state.currentWorkflow,
                phases: [...state.currentWorkflow.phases, response.phase],
              }
            : state.currentWorkflow,
        loading: false,
      }));
      return response.phase;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to add phase",
        loading: false,
      });
      throw error;
    }
  },

  // Update phase
  updatePhase: async (workflowId, phaseId, phaseData) => {
    set({ loading: true, error: null });
    try {
      const response = await workflowService.updatePhase(
        workflowId,
        phaseId,
        phaseData,
      );
      set((state) => ({
        currentWorkflow:
          state.currentWorkflow?._id === workflowId
            ? {
                ...state.currentWorkflow,
                phases: state.currentWorkflow.phases.map((p) =>
                  p._id === phaseId ? response.phase : p,
                ),
              }
            : state.currentWorkflow,
        loading: false,
      }));
      return response.phase;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update phase",
        loading: false,
      });
      throw error;
    }
  },

  // Delete phase
  deletePhase: async (workflowId, phaseId) => {
    set({ loading: true, error: null });
    try {
      await workflowService.deletePhase(workflowId, phaseId);
      set((state) => ({
        currentWorkflow:
          state.currentWorkflow?._id === workflowId
            ? {
                ...state.currentWorkflow,
                phases: state.currentWorkflow.phases.filter(
                  (p) => p._id !== phaseId,
                ),
              }
            : state.currentWorkflow,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete phase",
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentWorkflow: () => set({ currentWorkflow: null }),
}));

export { useWorkflowStore };
