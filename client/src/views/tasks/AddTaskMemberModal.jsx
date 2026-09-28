// views/tasks/AddTaskMemberModal.jsx
import React, { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { useTaskStore } from "../../stores/useTaskStore";
import { useTeamStore } from "../../stores/useTeamStore";

const AddTaskMemberModal = ({
  isOpen,
  onClose,
  taskMembers,
  onAddMember,
  taskTeamId,
  taskTeamName,
}) => {
  const [activeTab, setActiveTab] = useState("employees");
  const [selectedUser, setSelectedUser] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);

  // Default role is always "responsible"
  const DEFAULT_ROLE = "responsible";

  const { formData, fetchFormData } = useTaskStore();
  const { teams, fetchTeams } = useTeamStore();

  // Fetch all users and teams when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFormData();
      fetchTeams();
    }
  }, [isOpen, fetchFormData, fetchTeams]);

  // Fetch team members when task has a team
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (taskTeamId && activeTab === "team") {
        setLoadingTeamMembers(true);
        try {
          const response = await fetch(`/api/teams/${taskTeamId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          const data = await response.json();
          if (data.success && data.team) {
            const members = data.team.members
              .filter((m) => m.user && m.user._id)
              .map((m) => ({
                _id: m.user._id,
                name: m.user.name,
                email: m.user.email,
                avatar: m.user.avatar,
                role: m.role,
              }));
            setTeamMembers(members);
          }
        } catch (error) {
          console.error("Failed to fetch team members:", error);
          setTeamMembers([]);
        } finally {
          setLoadingTeamMembers(false);
        }
      }
    };
    loadTeamMembers();
  }, [taskTeamId, activeTab]);

  // Get all users based on active tab (show all, don't filter out assigned ones)
  const getAllUsers = () => {
    if (activeTab === "employees") {
      // Show ALL users from the store (including those already assigned)
      return formData.users || [];
    } else {
      // Show ALL team members (including those already assigned)
      return teamMembers;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      return;
    }
    // Always use DEFAULT_ROLE ("responsible") when adding member
    onAddMember(selectedUser, DEFAULT_ROLE);
    setSelectedUser("");
    onClose();
  };

  if (!isOpen) return null;

  const allUsersList = getAllUsers();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-[800px] sm:h-[500px] bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Member to Task
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Tabs */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Select Member From
            </label>
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("employees");
                  setSelectedUser("");
                }}
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
                  activeTab === "employees"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Employees ({formData.users?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("team");
                  setSelectedUser("");
                }}
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
                  activeTab === "team"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Team {taskTeamName ? `- ${taskTeamName}` : ""} (
                {teamMembers.length})
              </button>
            </div>
          </div>

          {/* Team Info - Show when Team tab is active */}
          {activeTab === "team" && taskTeamId && (
            <div className="p-2 mb-3 rounded-md bg-blue-50">
              <p className="text-xs text-blue-700">
                Showing members of team:{" "}
                <span className="font-semibold">
                  {taskTeamName || "Selected Team"}
                </span>
              </p>
            </div>
          )}

          {activeTab === "team" && !taskTeamId && (
            <div className="p-2 mb-3 rounded-md bg-yellow-50">
              <p className="text-xs text-yellow-700">
                No team was selected during task creation.
              </p>
            </div>
          )}

          {/* Users/Team Members Dropdown */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Select {activeTab === "employees" ? "User" : "Team Member"}
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={
                (activeTab === "employees" && formData.users?.length === 0) ||
                (activeTab === "team" && (!taskTeamId || loadingTeamMembers))
              }
            >
              <option value="">
                Select a {activeTab === "employees" ? "user" : "team member"}...
              </option>
              {allUsersList.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                  {/* {taskMembers[DEFAULT_ROLE]?.some(
                    (member) => member._id === user._id,
                  ) && " (Already Assigned as Responsible)"} */}
                </option>
              ))}
            </select>

            {activeTab === "employees" && formData.users?.length === 0 && (
              <p className="mt-1 text-xs text-blue-600">Loading users...</p>
            )}

            {activeTab === "employees" &&
              formData.users?.length > 0 &&
              allUsersList.length === 0 && (
                <p className="mt-1 text-xs text-yellow-600">
                  No users available.
                </p>
              )}

            {activeTab === "team" && loadingTeamMembers && (
              <p className="mt-1 text-xs text-blue-600">
                Loading team members...
              </p>
            )}

            {activeTab === "team" &&
              taskTeamId &&
              !loadingTeamMembers &&
              allUsersList.length === 0 && (
                <p className="mt-1 text-xs text-yellow-600">
                  No team members found.
                </p>
              )}

            {activeTab === "team" && !taskTeamId && (
              <p className="mt-1 text-xs text-yellow-600">
                No team was selected when creating this task.
              </p>
            )}
          </div>

          {/* Info about role */}
          <div className="p-2 mb-4 rounded-md bg-gray-50">
            <p className="text-xs text-gray-600">
              Members will be added as{" "}
              <span className="font-semibold text-blue-600">Responsible</span>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUser || (activeTab === "team" && !taskTeamId)}
              className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskMemberModal;
