// stores/useMilestoneStore.js
import { create } from "zustand";
import { milestoneService } from "../services/milestone.service";

const mergeMilestone = (existing, updated) => ({
  ...existing,
  ...updated,
  ratedBy: updated.ratedBy !== undefined ? updated.ratedBy : existing?.ratedBy,
  ratedAt: updated.ratedAt !== undefined ? updated.ratedAt : existing?.ratedAt,
  reviewComments:
    updated.reviewComments !== undefined
      ? updated.reviewComments
      : existing?.reviewComments,
  starRating:
    updated.starRating !== undefined ? updated.starRating : existing?.starRating,
});

const useMilestoneStore = create((set, get) => ({
  milestones: [],
  currentMilestone: null,
  loading: false,
  error: null,

  fetchMilestonesByTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      const response = await milestoneService.getMilestonesByTask(taskId);
      set({ milestones: response.milestones || [], loading: false });
      return response.milestones;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch milestones",
        loading: false,
      });
      throw error;
    }
  },

  createMilestone: async (milestoneData) => {
    set({ loading: true, error: null });
    try {
      const response = await milestoneService.createMilestone(milestoneData);
      set((state) => ({
        milestones: [response.milestone, ...state.milestones],
        loading: false,
      }));
      return response.milestone;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to create milestone",
        loading: false,
      });
      throw error;
    }
  },

  updateMilestone: async (milestoneId, updateData) => {
    set({ loading: true, error: null });
    try {
      const response = await milestoneService.updateMilestone(
        milestoneId,
        updateData,
      );
      set((state) => ({
        milestones: state.milestones.map((m) =>
          m._id === milestoneId ? response.milestone : m,
        ),
        loading: false,
      }));
      return response.milestone;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update milestone",
        loading: false,
      });
      throw error;
    }
  },

  deleteMilestone: async (milestoneId) => {
    set({ loading: true, error: null });
    try {
      await milestoneService.deleteMilestone(milestoneId);
      set((state) => ({
        milestones: state.milestones.filter((m) => m._id !== milestoneId),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete milestone",
        loading: false,
      });
      throw error;
    }
  },

  updateMilestoneStatus: async (milestoneId, status) => {
    set({ loading: true, error: null });
    try {
      const response = await milestoneService.updateMilestoneStatus(
        milestoneId,
        status,
      );
      set((state) => ({
        milestones: state.milestones.map((m) =>
          m._id === milestoneId
            ? {
                ...m,
                status: response.milestone.status,
                progress: response.milestone.progress,
              }
            : m,
        ),
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to update milestone status",
        loading: false,
      });
      throw error;
    }
  },

  updateMilestoneProgress: async (milestoneId, progress) => {
    set({ loading: true, error: null });
    try {
      const response = await milestoneService.updateMilestoneProgress(
        milestoneId,
        progress,
      );
      set((state) => ({
        milestones: state.milestones.map((m) =>
          m._id === milestoneId
            ? {
                ...m,
                progress: response.milestone.progress,
                status: response.milestone.status,
              }
            : m,
        ),
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to update milestone progress",
        loading: false,
      });
      throw error;
    }
  },

  // stores/useMilestoneStore.js - Add these methods

  pickMilestone: async (milestoneId) => {
    set({ loading: true, error: null });
    try {
      const response = await milestoneService.pickMilestone(milestoneId);
      set((state) => ({
        milestones: state.milestones.map((m) =>
          m._id === milestoneId ? mergeMilestone(m, response.milestone) : m,
        ),
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to pick milestone",
        loading: false,
      });
      throw error;
    }
  },

  completeMilestone: async (milestoneId) => {
    set({ loading: true, error: null });
    try {
      const response = await milestoneService.completeMilestone(milestoneId);
      set((state) => ({
        milestones: state.milestones.map((m) =>
          m._id === milestoneId ? mergeMilestone(m, response.milestone) : m,
        ),
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to complete milestone",
        loading: false,
      });
      throw error;
    }
  },

  rejectMilestone: async (milestoneId, rejectionReason) => {
    console.log("Store: rejectMilestone called with ID:", milestoneId);
    set({ loading: true, error: null });
    try {
      const response = await milestoneService.rejectMilestone(
        milestoneId,
        rejectionReason,
      );
      console.log("Store: rejectMilestone response:", response);
      set((state) => ({
        milestones: state.milestones.map((m) =>
          m._id === milestoneId ? mergeMilestone(m, response.milestone) : m,
        ),
        loading: false,
      }));
      return response;
    } catch (error) {
      console.error("Store: rejectMilestone error:", error);
      set({
        error: error.response?.data?.message || "Failed to reject milestone",
        loading: false,
      });
      throw error;
    }
  },

  rateMilestone: async (milestoneId, rating) => {
    set({ loading: true, error: null });
    try {
      const response = await milestoneService.rateMilestone(
        milestoneId,
        rating,
      );
      set((state) => ({
        milestones: state.milestones.map((m) =>
          m._id === milestoneId ? mergeMilestone(m, response.milestone) : m,
        ),
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to rate milestone",
        loading: false,
      });
      throw error;
    }
  },

  addReviewComment: async (milestoneId, text) => {
    set({ loading: true, error: null });
    try {
      const response = await milestoneService.addReviewComment(
        milestoneId,
        text,
      );
      set((state) => ({
        milestones: state.milestones.map((m) =>
          m._id === milestoneId ? mergeMilestone(m, response.milestone) : m,
        ),
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to add review comment",
        loading: false,
      });
      throw error;
    }
  },

  deleteReviewComment: async (milestoneId, commentId) => {
    set({ loading: true, error: null });
    try {
      const response = await milestoneService.deleteReviewComment(
        milestoneId,
        commentId,
      );
      set((state) => ({
        milestones: state.milestones.map((m) =>
          m._id === milestoneId ? mergeMilestone(m, response.milestone) : m,
        ),
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to delete review comment",
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearMilestones: () => set({ milestones: [] }),
}));

export { useMilestoneStore };
