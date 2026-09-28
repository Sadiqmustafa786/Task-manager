import http from "./http";

export const teamService = {
  createTeam: async (teamData) => {
    const { data } = await http.post("/teams", teamData);
    return data;
  },
  // Get all teams for current user
  getUserTeams: async () => {
    const { data } = await http.get("/teams");
    return data;
  },

  updateTeamColor: async (teamId, color) => {
    const { data } = await http.put(`/teams/${teamId}/color`, { color });
    return data;
  },

  updateTeamName: async (teamId, name) => {
    const { data } = await http.put(`/teams/${teamId}/name`, { name });
    return data;
  },

  deleteTeam: async (teamId) => {
    const { data } = await http.delete(`/teams/${teamId}`);
    return data;
  },

  getUserInvitations: async () => {
    const { data } = await http.get("/teams/invitations");
    return data;
  },

  getTeamById: async (teamId) => {
    const { data } = await http.get(`/teams/${teamId}`);
    return data;
  },

  // Invite member to team
  inviteMember: async (teamId, email) => {
    const { data } = await http.post(`/teams/${teamId}/invite`, { email });
    return data;
  },

  deleteInvitation: async (invitationId) => {
    const response = await http.delete(`/teams/invitations/${invitationId}`);
    return response.data;
  },
};
