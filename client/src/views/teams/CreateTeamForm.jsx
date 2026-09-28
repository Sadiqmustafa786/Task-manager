import React, { useState } from "react";

const CreateTeamForm = ({ onSubmit, loading }) => {
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    const emails = inviteEmails
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);

    onSubmit({
      name: teamName.trim(),
      description: teamDescription.trim(),
      inviteEmails: emails,
    });
  };

  return (
    <form id="create-team-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Team Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter team name"
          autoFocus
          required
          disabled={loading}
        />
      </div>

      {/* Team Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={teamDescription}
          onChange={(e) => setTeamDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          placeholder="What does this team do?"
          disabled={loading}
        />
      </div>

      {/* Invite Members */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Invite Members (Optional)
        </label>
        <input
          type="text"
          value={inviteEmails}
          onChange={(e) => setInviteEmails(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="email1@example.com, email2@example.com"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          Separate multiple emails with commas
        </p>
      </div>
    </form>
  );
};

export default CreateTeamForm;
