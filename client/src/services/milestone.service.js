// services/milestone.service.js
import http from "./http";

export const milestoneService = {
  // Get milestones by task
  getMilestonesByTask: async (taskId) => {
    const { data } = await http.get(`/milestones/task/${taskId}`);
    return data;
  },

  // Get single milestone
  getMilestoneById: async (milestoneId) => {
    const { data } = await http.get(`/milestones/${milestoneId}`);
    return data;
  },

  // Create milestone
  createMilestone: async (milestoneData) => {
    const { data } = await http.post("/milestones", milestoneData);
    return data;
  },

  // Update milestone
  updateMilestone: async (milestoneId, updateData) => {
    const { data } = await http.put(`/milestones/${milestoneId}`, updateData);
    return data;
  },

  // Delete milestone
  deleteMilestone: async (milestoneId) => {
    const { data } = await http.delete(`/milestones/${milestoneId}`);
    return data;
  },

  // Update milestone status
  updateMilestoneStatus: async (milestoneId, status) => {
    const { data } = await http.put(`/milestones/${milestoneId}/status`, {
      status,
    });
    return data;
  },

  updateMilestoneProgress: async (milestoneId, progress) => {
    const { data } = await http.put(`/milestones/${milestoneId}/progress`, {
      progress,
    });
    return data;
  },

  addMilestoneComment: async (milestoneId, text) => {
    const { data } = await http.post(`/milestones/${milestoneId}/comments`, {
      text,
    });
    return data;
  },

  // services/milestone.service.js - Add these methods

  // Pick milestone
  pickMilestone: async (milestoneId) => {
    const { data } = await http.put(`/milestones/${milestoneId}/pick`);
    return data;
  },

  completeMilestone: async (milestoneId) => {
    const { data } = await http.put(`/milestones/${milestoneId}/complete`);
    return data;
  },

  rejectMilestone: async (milestoneId, rejectionReason) => {
    console.log("Service: Rejecting milestone:", milestoneId);
    const { data } = await http.put(`/milestones/${milestoneId}/reject`, {
      rejectionReason,
    });
    console.log("Service: Reject response:", data);
    return data;
  },

  rateMilestone: async (milestoneId, rating) => {
    const { data } = await http.put(`/milestones/${milestoneId}/rate`, {
      rating,
    });
    return data;
  },

  // Add review comment
  addReviewComment: async (milestoneId, text) => {
    const { data } = await http.post(`/milestones/${milestoneId}/review`, {
      text,
    });
    return data;
  },

  // Delete review comment
  deleteReviewComment: async (milestoneId, commentId) => {
    const { data } = await http.delete(
      `/milestones/${milestoneId}/review/${commentId}`,
    );
    return data;
  },
};
