import { create } from "zustand";
import { teamService } from "../services/team.service";

const useTeamStore = create((set, get) => ({
  teams: [],
  invitations: [],
  loading: false,
  error: null,

  // Fetch all user teams
  fetchTeams: async () => {
    set({ loading: true, error: null });
    try {
      const response = await teamService.getUserTeams();
      set({ teams: response.teams, loading: false });
      return response.teams;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch teams",
        loading: false,
      });
      throw error;
    }
  },

  deleteTeam: async (teamId) => {
    set({ loading: true, error: null });
    try {
      const response = await teamService.deleteTeam(teamId);
      set((state) => ({
        teams: state.teams.filter((team) => team._id !== teamId),
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete team",
        loading: false,
      });
      throw error;
    }
  },

  createTeam: async (teamData) => {
    set({ loading: true, error: null });
    try {
      const response = await teamService.createTeam(teamData);
      set((state) => ({
        teams: [response.team, ...state.teams],
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to create team",
        loading: false,
      });
      throw error;
    }
  },

  // Update team name
  updateTeamName: async (teamId, name) => {
    set({ loading: true, error: null });
    try {
      const response = await teamService.updateTeamName(teamId, name);
      // Update the team in the teams array
      set((state) => ({
        teams: state.teams.map((team) =>
          team._id === teamId ? { ...team, name: response.team.name } : team,
        ),
        loading: false,
      }));
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update team name",
        loading: false,
      });
      throw error;
    }
  },

  fetchInvitations: async () => {
    set({ loading: true, error: null });
    try {
      const response = await teamService.getUserInvitations();
      set({ invitations: response.invitations, loading: false });
      return response.invitations;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch invitations",
        loading: false,
      });
      throw error;
    }
  },

  deleteInvitation: async (invitationId) => {
    set({ loading: true, error: null });
    try {
      const response = await teamService.deleteInvitation(invitationId);

      // Remove the deleted invitation from the invitations list
      const currentInvitations = get().invitations;
      set({
        invitations: currentInvitations.filter(
          (inv) => inv._id !== invitationId,
        ),
        loading: false,
      });

      return response;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete invitation",
        loading: false,
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export { useTeamStore };
