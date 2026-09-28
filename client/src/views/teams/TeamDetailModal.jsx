import React, { useState, useEffect } from "react";
import CustomModal from "../../components/CustomModal";
import ConfirmationDialog from "../../components/ConfirmationDialog"; // Import ConfirmationDialog
import { showSuccess, showError } from "../../components/toaster/Toaster";
import { teamService } from "../../services/team.service";
import { useAuthStore } from "../../stores/useAuthStore";
import { useTeamStore } from "../../stores/useTeamStore";

const TeamDetailModal = ({ isOpen, onClose, team, onTeamUpdate }) => {
  const [activeTab, setActiveTab] = useState("members");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teamDetails, setTeamDetails] = useState(team);
  const [deletingInvite, setDeletingInvite] = useState(null); // Track invitation being deleted
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);

  const { user } = useAuthStore();
  const { deleteInvitation } = useTeamStore();

  const DEFAULT_AVATAR =
    "https://res.cloudinary.com/dtpw0qbbv/image/upload/v1775588580/default_ut8atz.jpg";

  // Fetch team details including pending invitations when modal opens
  useEffect(() => {
    if (isOpen && team?._id) {
      fetchTeamDetails();
    }
  }, [isOpen, team?._id]);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const response = await teamService.getTeamById(team._id);
      setTeamDetails(response.team);
      setPendingInvites(response.pendingInvitations || []);
    } catch (error) {
      console.error("Failed to fetch team details:", error);
      showError("Failed to load team details");
    } finally {
      setLoading(false);
    }
  };

  if (!team) return null;

  // Get owner name and check if current user is owner
  const owner = teamDetails?.members?.find((member) => member.role === "owner");
  const ownerName = owner?.user?.name || "Unknown";
  const isOwner = owner?.user?._id === user?._id;

  // Format date
  const formattedDate = new Date(teamDetails?.createdAt).toLocaleString(
    "en-US",
    {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  );

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      showError("Please enter an email address");
      return;
    }

    try {
      setInviting(true);
      await teamService.inviteMember(team._id, inviteEmail);
      showSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      await fetchTeamDetails();

      if (onTeamUpdate) {
        onTeamUpdate();
      }
    } catch (error) {
      console.error("Failed to send invite:", error);
      showError(error.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  // Open confirmation dialog for delete
  const openDeleteConfirmation = (invitation) => {
    setSelectedInvitation(invitation);
    setShowDeleteConfirm(true);
  };

  // Handle delete invitation
  const handleDeleteInvitation = async () => {
    if (!selectedInvitation) return;

    try {
      setDeletingInvite(selectedInvitation._id);
      await deleteInvitation(selectedInvitation._id);
      showSuccess(
        `Invitation cancelled for ${selectedInvitation.invitedEmail}`,
      );

      // Refresh the pending invites list
      await fetchTeamDetails();

      // Update global invitations list if this user has invitations
      if (onTeamUpdate) {
        onTeamUpdate();
      }

      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setSelectedInvitation(null);
    } catch (error) {
      console.error("Failed to delete invitation:", error);
      showError(error.response?.data?.message || "Failed to cancel invitation");
    } finally {
      setDeletingInvite(null);
    }
  };

  return (
    <>
      <CustomModal
        isOpen={isOpen}
        onClose={onClose}
        title={teamDetails?.name || team.name}
        size="lg"
        showFooter={true}
        footerContent={
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Subtitle */}
            <p className="text-sm text-gray-500 mb-4 -mt-2">
              Created {formattedDate} by {ownerName}
            </p>

            {/* Tabs - Show Pending tab only for owner */}
            <div className="flex border-b border-gray-200 -mx-6 px-6 mb-4">
              <button
                onClick={() => setActiveTab("members")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "members"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Members ({teamDetails?.members?.length || 0})
              </button>
              {isOwner && (
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "pending"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Pending ({pendingInvites.length})
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto -mx-6 px-6">
              {activeTab === "members" ? (
                // Members Tab - Visible to everyone
                <div className="space-y-3">
                  {teamDetails?.members?.map((member) => (
                    <div
                      key={member.user._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {member.user.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={member.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {member.user.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">
                            {member.user.name}
                            {member.role === "owner" && (
                              <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                                Owner
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}

                  {teamDetails?.members?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No members in this team yet
                    </div>
                  )}
                </div>
              ) : (
                // Pending Tab - Only visible to owner
                <div className="space-y-4">
                  {/* Add Invite Input */}
                  <form onSubmit={handleSendInvite} className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address to invite"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={inviting}
                    />
                    <button
                      type="submit"
                      disabled={inviting || !inviteEmail.trim()}
                      className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {inviting ? "Sending..." : "Send Invite"}
                    </button>
                  </form>

                  {/* Pending Invites List */}
                  {pendingInvites.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {pendingInvites.map((invite) => (
                        <div
                          key={invite._id || invite.invitedEmail}
                          className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-full"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {invite.invitedEmail}
                          </span>
                          <button
                            onClick={() => openDeleteConfirmation(invite)}
                            disabled={deletingInvite === invite._id}
                            className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                            title="Cancel invitation"
                          >
                            {deletingInvite === invite._id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No pending invitations
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CustomModal>

      {/* Confirmation Dialog for Delete Invitation */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedInvitation(null);
        }}
        onConfirm={handleDeleteInvitation}
        title="Cancel Invitation"
        message={`Are you sure you want to cancel the invitation for ${selectedInvitation?.invitedEmail}? This action cannot be undone.`}
        loading={deletingInvite !== null}
        confirmText="Cancel Invitation"
        cancelText="Keep Invitation"
        confirmButtonColor="red"
      />
    </>
  );
};

export default TeamDetailModal;
