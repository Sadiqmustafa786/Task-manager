import React, { useState } from "react";
import { teamService } from "../../services/team.service";
import { showError, showSuccess } from "../../components/toaster/Toaster";
import EditTeam from "./EditTeam";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import TeamDetailModal from "./TeamDetailModal";
import { useTeamStore } from "../../stores/useTeamStore";
import { useAuthStore } from "../../stores/useAuthStore";

const TeamCard = ({ team, onColorUpdated, onTeamUpdated }) => {
  const teamColor = team.color || "#5A7ACD";
  const [showMenu, setShowMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(teamColor);
  const [updating, setUpdating] = useState(false);
  const [currentColor, setCurrentColor] = useState(teamColor);
  const [deleting, setDeleting] = useState(false);

  const { deleteTeam } = useTeamStore();
  const { user } = useAuthStore(); // Get current logged in user

  const formattedDate = new Date(team.createdAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const owner = team.members?.find((member) => member.role === "owner");
  const addedByName = owner?.user?.name || "Unknown";

  // Check if current user is the owner of the team
  const isOwner = owner?.user?._id === user?._id;

  const initial = team.name?.charAt(0).toUpperCase() || "T";

  // Color palette
  const colorPalette = [
    "#EF4444",
    "#F97316",
    "#EAB308",
    "#84CC16",
    "#06B6D4",
    "#A855F7",
    "#EC4899",
    "#F9A8D4",
    "#6B7280",
    "#92400E",
  ];

  const handleUpdateColor = async () => {
    try {
      setUpdating(true);
      await teamService.updateTeamColor(team._id, selectedColor);
      setCurrentColor(selectedColor);
      showSuccess("Team color updated successfully!");
      if (onColorUpdated) {
        onColorUpdated();
      }
      setShowColorMenu(false);
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to update color:", error);
      showError(error.response?.data?.message || "Failed to update team color");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditClick = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteTeam(team._id);
      showSuccess("Team deleted successfully!");
      if (onTeamUpdated) {
        onTeamUpdated();
      }
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete team:", error);
      showError(error.response?.data?.message || "Failed to delete team");
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClose = () => {
    setShowEditModal(false);
  };

  const handleTeamUpdated = () => {
    if (onTeamUpdated) {
      onTeamUpdated();
    }
  };

  const handleCardClick = () => {
    setShowDetailModal(true);
  };

  const handleTeamUpdate = () => {
    if (onTeamUpdated) {
      onTeamUpdated();
    }
  };

  return (
    <>
      <div
        className="cursor-pointer w-full max-w-[180px] flex flex-col items-center"
        onClick={handleCardClick}
      >
        <div className="relative w-full">
          <div
            className="w-full aspect-square max-w-[160px] mx-auto rounded-md flex items-center justify-center mb-3 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{ backgroundColor: currentColor }}
          >
            <span
              className="text-6xl font-semibold"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {initial}
            </span>
          </div>

          {/* Three dots button - Show only if user is owner */}
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
                setShowColorMenu(false);
              }}
              className="absolute p-1 text-white rounded-full top-2 right-2 hover:bg-white/20"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          )}

          {/* Main Dropdown Menu - Show only if user is owner */}
          {isOwner && showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setShowColorMenu(false);
                }}
              />

              {/* Main Menu */}
              <div className="absolute top-0 z-30 w-40 mt-2 overflow-visible bg-white border border-gray-100 rounded-lg shadow-xl left-32">
                {/* Color Button - Opens nested menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowColorMenu(!showColorMenu);
                    }}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                  >
                    <span>Color</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  {/* Nested Color Menu */}
                  {showColorMenu && (
                    <div
                      className="absolute top-0 z-40 w-64 p-3 ml-2 bg-white border border-gray-100 rounded-lg shadow-xl"
                      style={{ left: "100%" }}
                    >
                      <p className="mb-2 text-xs font-medium text-gray-500">
                        Select Color
                      </p>
                      <div className="grid grid-cols-5 gap-2 mb-3">
                        {colorPalette.map((color) => (
                          <button
                            key={color}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedColor(color);
                            }}
                            className={`w-8 h-8 rounded-md cursor-pointer hover:scale-110 transition-transform border ${
                              selectedColor === color
                                ? "border-2 border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-full h-8 mb-3 rounded cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateColor();
                        }}
                        disabled={updating}
                        className="w-full px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updating ? "Updating..." : "Update Color"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick();
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info below the square */}
        <div className="w-full px-1 text-center">
          {/* Team name */}
          <h3 className="text-sm font-semibold text-gray-800 mb-0.5 truncate">
            {team.name}
          </h3>

          {/* Added By */}
          <p className="mb-1 text-xs text-gray-500">
            Added By:{" "}
            <span className="font-medium text-gray-700">{addedByName}</span>
          </p>

          {/* Date with clock icon */}
          <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
            <svg
              className="flex-shrink-0 w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Team Detail Modal */}
      <TeamDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        team={team}
        onTeamUpdate={handleTeamUpdate}
      />

      {/* Edit Team Modal */}
      {showEditModal && (
        <EditTeam
          team={team}
          onClose={handleEditClose}
          onTeamUpdated={handleTeamUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Team"
        message={`Are you sure you want to delete "${team.name}"? This action cannot be undone.`}
        loading={deleting}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
      />
    </>
  );
};

export default TeamCard;
