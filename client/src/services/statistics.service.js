// client/src/services/statistics.service.js
import http from "./http";

export const statisticsService = {
  // Individual Statistics
  getIndividualCards: async (params = {}) => {
    const { data } = await http.get("/statistics/individual/cards", { params });
    return data;
  },

  getIndividualTable: async (params = {}) => {
    const { data } = await http.get("/statistics/individual/table", { params });
    return data;
  },

  getIndividualProjects: async (params = {}) => {
    const { data } = await http.get("/statistics/individual/projects", {
      params,
    });
    return data;
  },

  // Organizational Statistics
  getOrganizationalStats: async (params = {}) => {
    const { data } = await http.get("/statistics/organizational", { params });
    return data;
  },

  getOrganizationalCards: async (params = {}) => {
    const { data } = await http.get("/statistics/organizational/cards", {
      params,
    });
    return data;
  },

  getOrganizationalTable: async (params = {}) => {
    const { data } = await http.get("/statistics/organizational/table", {
      params,
    });
    return data;
  },

  // Lists
  getProjectsList: async (params = {}) => {
    const { data } = await http.get("/statistics/projects/list", { params });
    return data;
  },

  getEmployees: async (params = {}) => {
    const { data } = await http.get("/statistics/employees", { params });
    return data;
  },
};
