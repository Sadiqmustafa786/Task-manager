const crypto = require("crypto");
const Team = require("../model/Team");
const TeamInvitation = require("../model/Teaminvitation");
const User = require("../model/User");
const { sendTeamInvitationEmail } = require("../services/email.service");

// ─── POST /api/teams ──────────────────────────────────────────────────────────
// Create a new team. The authenticated user becomes the owner.
const createTeam = async (req, res) => {
  try {
    const { name, description, inviteEmails = [] } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Team name is required." });
    }

    const existingTeam = await Team.findOne({
      name: name.trim(),
      owner: req.user._id,
    });
    if (existingTeam) {
      return res
        .status(400)
        .json({ success: false, message: "Team already exists." });
    }

    // Create the team with the owner as the first member
    const team = await Team.create({
      name: name.trim(),
      description: description?.trim() || "",
      owner: req.user._id,
      members: [{ user: req.user._id, role: "owner" }],
    });

    // Send invitations to provided emails (fire-and-forget errors per invite)
    const inviteResults = await Promise.allSettled(
      inviteEmails.map((email) =>
        _createAndSendInvite({ email, team, inviter: req.user }),
      ),
    );

    const sentInvites = inviteResults.map((r, i) => ({
      email: inviteEmails[i],
      status: r.status === "fulfilled" ? r.value.status : "failed",
      reason: r.status === "rejected" ? r.reason?.message : undefined,
    }));

    const populated = await team.populate("members.user", "name email avatar");

    res.status(201).json({
      success: true,
      message: "Team created successfully.",
      team: populated,
      invitations: sentInvites,
    });
  } catch (error) {
    console.error("createTeam error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/teams/:teamId/invite ──────────────────────────────────────────
// Owner invites additional members by email after team creation.
const inviteMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found." });
    }

    // Only the owner can invite
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the team owner can invite members.",
      });
    }

    const result = await _createAndSendInvite({
      email,
      team,
      inviter: req.user,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      invitation: result.invitation,
    });
  } catch (error) {
    console.error("inviteMember error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/teams/invite/accept/:token ─────────────────────────────────────
// Magic link handler — user clicks "Accept" in their email.
const acceptInvitation = async (req, res) => {
  const { token } = req.params;
  return res.redirect(`${process.env.CLIENT_URL}/invite/accept/${encodeURIComponent(token)}`);
};

const acceptInvitationAuthenticated = async (req, res) => {
  try {
    const invitation = await TeamInvitation.findOne({ token: req.params.token });
    if (!invitation) return res.status(404).json({ success: false, message: "Invitation not found." });
    if (invitation.status !== "pending") return res.status(400).json({ success: false, message: `This invitation has already been ${invitation.status}.` });
    if (invitation.expiresAt < new Date()) return res.status(410).json({ success: false, message: "This invitation has expired." });
    if (invitation.invitedEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: `Sign in with ${invitation.invitedEmail} to accept this invitation.` });
    }
    const team = await Team.findById(invitation.team);
    if (!team) return res.status(404).json({ success: false, message: "The invited team no longer exists." });
    if (!team.members.some((member) => member.user.toString() === req.user._id.toString())) {
      team.members.push({ user: req.user._id, role: "member" });
      await team.save();
    }
    invitation.status = "accepted";
    await invitation.save();
    return res.json({ success: true, team: { _id: team._id, name: team.name } });
  } catch (error) {
    console.error("acceptInvitationAuthenticated error:", error);
    return res.status(500).json({ success: false, message: "Could not accept this invitation." });
  }
};
// ─── GET /api/teams/invite/reject/:token ─────────────────────────────────────
// Magic link handler — user clicks "Decline" in their email.
const rejectInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await TeamInvitation.findOne({ token });
    if (!invitation) {
      return res.redirect(`${process.env.CLIENT_URL}/invite/invalid`);
    }

    if (invitation.status !== "pending") {
      return res.redirect(
        `${process.env.CLIENT_URL}/invite/already-${invitation.status}`,
      );
    }

    invitation.status = "rejected";
    await invitation.save();

    return res.redirect(`${process.env.CLIENT_URL}/invite/rejected`);
  } catch (error) {
    console.error("rejectInvitation error:", error);
    return res.redirect(`${process.env.CLIENT_URL}/invite/error`);
  }
};

// ─── GET /api/teams ───────────────────────────────────────────────────────────
// Get all teams the authenticated user belongs to.
const getUserTeams = async (req, res) => {
  try {
    const teams = await Team.find({ "members.user": req.user._id })
      .populate("members.user", "name email avatar")
      .populate("owner", "name email avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, teams });
  } catch (error) {
    console.error("getUserTeams error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/teams/:teamId ───────────────────────────────────────────────────
// Get a single team (must be a member).
const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate("members.user", "name email avatar")
      .populate("owner", "name email avatar");

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found." });
    }

    const isMember = team.members.some(
      (m) => m.user._id.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    // Also return pending invitations for this team (owner only)
    let pendingInvitations = [];
    if (team.owner._id.toString() === req.user._id.toString()) {
      pendingInvitations = await TeamInvitation.find({
        team: teamId,
        status: "pending",
      }).select("invitedEmail createdAt expiresAt");
    }

    res.json({ success: true, team, pendingInvitations });
  } catch (error) {
    console.error("getTeamById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Internal helper ──────────────────────────────────────────────────────────
async function _createAndSendInvite({ email, team, inviter }) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if already a member
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const alreadyMember = team.members.some(
      (m) => m.user.toString() === existingUser._id.toString(),
    );
    if (alreadyMember) {
      return {
        status: "skipped",
        message: `${normalizedEmail} is already a team member.`,
      };
    }
  }

  // Check for existing pending invite
  const existingInvite = await TeamInvitation.findOne({
    team: team._id,
    invitedEmail: normalizedEmail,
    status: "pending",
  });
  if (existingInvite) {
    return {
      status: "skipped",
      message: `Pending invitation already exists for ${normalizedEmail}.`,
    };
  }

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString("hex");

  const invitation = await TeamInvitation.create({
    team: team._id,
    invitedEmail: normalizedEmail,
    invitedBy: inviter._id,
    token,
  });

  const acceptUrl = `${process.env.CLIENT_URL}/invite/accept/${token}`;
  const rejectUrl = `${process.env.API_URL}/api/teams/invite/reject/${token}`;

  await sendTeamInvitationEmail({
    toEmail: normalizedEmail,
    inviterName: inviter.name,
    teamName: team.name,
    acceptUrl,
    rejectUrl,
  });

  return {
    status: "sent",
    message: `Invitation sent to ${normalizedEmail}.`,
    invitation,
  };
}

// ─── PUT /api/teams/:teamId/color ────────────────────────────────────────────
// Update team color only - Owner only
const updateTeamColor = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { color } = req.body;

    if (!color) {
      return res
        .status(400)
        .json({ success: false, message: "Color is required." });
    }

    // Validate hex color format (e.g., #5A7ACD, #FFF, #FFFFFF)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      return res.status(400).json({
        success: false,
        message: "Invalid color format. Use hex color (e.g., #5A7ACD, #FFF).",
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found." });
    }

    // Only the owner can update team color
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the team owner can update team color.",
      });
    }

    // Update color
    team.color = color;
    await team.save();

    res.json({
      success: true,
      message: "Team color updated successfully.",
      team: {
        id: team._id,
        name: team.name,
        color: team.color,
        description: team.description,
      },
    });
  } catch (error) {
    console.error("updateTeamColor error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/teams/:teamId/name ─────────────────────────────────────────────
// Update team name only - Owner only
const updateTeamName = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Team name is required." });
    }

    const trimmedName = name.trim();

    const team = await Team.findById(teamId);
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found." });
    }

    // Only the owner can update team name
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the team owner can update team name.",
      });
    }

    // Check if another team with same name exists (owned by same user)
    const existingTeam = await Team.findOne({
      _id: { $ne: teamId },
      name: trimmedName,
      owner: req.user._id,
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message:
          "You already have another team with this name. Please choose a different name.",
      });
    }

    // Update name
    team.name = trimmedName;
    await team.save();

    res.json({
      success: true,
      message: "Team name updated successfully.",
      team: {
        id: team._id,
        name: team.name,
        color: team.color,
        description: team.description,
      },
    });
  } catch (error) {
    console.error("updateTeamName error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found." });
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the team owner can delete the team.",
      });
    }

    await Team.findByIdAndDelete(teamId); // ← replaces team.remove()

    res.json({ success: true, message: "Team deleted successfully." });
  } catch (error) {
    console.error("deleteTeam error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserInvitations = async (req, res) => {
  try {
    const invitations = await TeamInvitation.find({
      invitedEmail: req.user.email,
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .populate("team", "name color description")
      .populate("invitedBy", "name email avatar")
      .sort({ createdAt: -1 });

    // Debug log to check avatar data
    console.log("Invitations found:", invitations.length);
    invitations.forEach((inv) => {
      console.log("Inviter:", inv.invitedBy?.name);
      console.log("Inviter Avatar:", inv.invitedBy?.avatar);
    });

    res.json({
      success: true,
      invitations: invitations,
    });
  } catch (error) {
    console.error("getUserInvitations error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    console.log("Deleting invitation:", invitationId); // Debug log

    const invitation = await TeamInvitation.findById(invitationId).populate(
      "team",
      "name members owner",
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    console.log("Found invitation:", invitation); // Debug log

    // Check if invitation is already accepted or rejected
    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot delete invitation that is already ${invitation.status}`,
      });
    }

    const team = invitation.team;

    // Check if user has permission (team owner only)
    const isOwner = team.owner.toString() === userId.toString();

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only team owner can delete invitations",
      });
    }

    // Remove the pending member entry from team if it exists
    if (team.members) {
      team.members = team.members.filter(
        (m) => m.email !== invitation.invitedEmail || m.status !== "pending",
      );
      await team.save();
    }

    // Delete the invitation
    await TeamInvitation.findByIdAndDelete(invitationId);

    res.json({
      success: true,
      message: "Invitation deleted successfully",
      data: {
        invitationId: invitation._id,
        email: invitation.invitedEmail,
        teamName: team.name,
      },
    });
  } catch (error) {
    console.error("Delete invitation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete invitation",
      error: error.message,
    });
  }
};

module.exports = {
  createTeam,
  inviteMember,
  acceptInvitation,
  acceptInvitationAuthenticated,
  rejectInvitation,
  getUserTeams,
  getTeamById,
  updateTeamColor,
  updateTeamName,
  deleteTeam,
  getUserInvitations,
  deleteInvitation,
};
