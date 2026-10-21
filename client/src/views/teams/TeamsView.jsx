import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTeamStore } from "../../stores/useTeamStore";
import { useAuthStore } from "../../stores/useAuthStore";
import TeamCard from "./TeamCard";
import CreateTeamCard from "./CreateTeamCard";
import CreateTeamForm from "./CreateTeamForm";
import CustomDrawer from "../../components/CustomDrawer";
import { showSuccess, showError } from "../../components/toaster/Toaster";

export const TeamsView = () => {
  const { teams, fetchTeams, loading, error, clearError, createTeam } =
    useTeamStore();
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const selectedTeamId = searchParams.get("teamId");
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleColorUpdated = () => {
    fetchTeams();
  };

  const handleTeamUpdated = () => {
    fetchTeams();
  };

  const handleCreateTeam = async (teamData) => {
    try {
      setCreating(true);
      await createTeam(teamData);
      showSuccess("Team created successfully!");
      setShowCreateDrawer(false);
    } catch (error) {
      console.error("Failed to create team:", error);
      showError(error.response?.data?.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  if (loading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
              {/* <p className="mt-2 text-gray-600">
                Welcome back, {user?.name?.split(" ")[0]}!
              </p> */}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-between p-4 mb-4 text-red-700 bg-red-100 border border-red-400 rounded-lg">
            <span>{error}</span>
            <button onClick={clearError} className="font-bold">
              ✗
            </button>
          </div>
        )}

        {/* Teams Grid with Create Team Card */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center">
          {/* Create Team Card - First in the grid */}
          <CreateTeamCard onClick={() => setShowCreateDrawer(true)} />

          {/* Existing Team Cards */}
          {teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              autoOpen={team._id === selectedTeamId}
              onColorUpdated={handleColorUpdated}
              onTeamUpdated={handleTeamUpdated}
            />
          ))}
        </div>

        {/* No Teams Message */}
        {teams.length === 0 && !loading && (
          <div className="mt-8 text-center text-gray-500">
            <p>Click "Add New Team" to create your first team</p>
          </div>
        )}
      </div>

      {/* Create Team Drawer */}
      <CustomDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        title="Create New Team"
        position="right"
        size="md"
        showFooter={true}
        footerContent={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreateDrawer(false)}
              className="px-4 py-2 text-sm text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-team-form"
              className="px-4 py-2 text-sm text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Team"}
            </button>
          </div>
        }
      >
        <CreateTeamForm onSubmit={handleCreateTeam} loading={creating} />
      </CustomDrawer>
    </div>
  );
};
