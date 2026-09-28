const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a team invitation email with a magic accept/reject link.
 *
 * @param {Object} opts
 * @param {string} opts.toEmail        - Recipient email address
 * @param {string} opts.inviterName    - Name of the person who sent the invite
 * @param {string} opts.teamName       - Name of the team
 * @param {string} opts.acceptUrl      - Full URL to accept the invitation
 * @param {string} opts.rejectUrl      - Full URL to reject the invitation
 */
async function sendTeamInvitationEmail({
  toEmail,
  inviterName,
  teamName,
  acceptUrl,
  rejectUrl,
}) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Auth App"}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${inviterName} invited you to join "${teamName}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Team Invitation</title>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 40px 32px; text-align: center; }
            .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
            .body { padding: 36px 32px; }
            .body p { margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6; }
            .team-name { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 15px; margin: 4px 0 20px; }
            .actions { display: flex; gap: 12px; margin: 28px 0; }
            .btn { display: inline-block; padding: 13px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; text-align: center; }
            .btn-accept { background: #3b82f6; color: #ffffff; }
            .btn-reject { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
            .expiry { font-size: 13px; color: #9ca3af; margin-top: 8px; }
            .footer { border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>You're Invited! 🎉</h1>
              <p>Join a team on Auth App</p>
            </div>
            <div class="body">
              <p>Hi there,</p>
              <p><strong>${inviterName}</strong> has invited you to join their team:</p>
              <span class="team-name">🏷️ ${teamName}</span>
              <p>Click the button below to accept or decline this invitation.</p>
              <div class="actions">
                <a href="${acceptUrl}" class="btn btn-accept">✅ Accept Invitation</a>
                <a href="${rejectUrl}" class="btn btn-reject">✕ Decline</a>
              </div>
              <p class="expiry">⏳ This invitation expires in 7 days.</p>
            </div>
            <div class="footer">
              If you weren't expecting this invitation, you can safely ignore this email.
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send a task member added notification email.
 *
 * @param {Object} opts
 * @param {string} opts.toEmail        - Recipient email address
 * @param {string} opts.memberName     - Name of the member being added
 * @param {string} opts.taskName       - Name of the task
 * @param {string} opts.projectName    - Name of the project
 * @param {string} opts.role           - Role in the task (responsible, accountable, consultant, informed)
 * @param {string} opts.addedByName    - Name of the person who added the member
 * @param {string} opts.taskUrl        - Full URL to the task
 */
async function sendTaskMemberAddedEmail({
  toEmail,
  memberName,
  taskName,
  projectName,
  role,
  addedByName,
  taskUrl,
}) {
  const roleDisplayNames = {
    responsible: "🎯 Responsible",
    accountable: "📋 Accountable",
    consultant: "💡 Consultant",
    informed: "📢 Informed",
  };

  const roleDisplay = roleDisplayNames[role] || role;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Auth App"}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `You've been added to task "${taskName}" in ${projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Task Assignment Notification</title>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 40px 32px; text-align: center; }
            .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
            .body { padding: 36px 32px; }
            .body p { margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6; }
            .task-details { background: #f8f9fa; border-left: 4px solid #8b5cf6; padding: 16px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; margin: 12px 0; }
            .detail-label { font-weight: 600; color: #6b7280; min-width: 100px; }
            .detail-value { color: #374151; flex: 1; }
            .role-badge { display: inline-block; background: #ede9fe; color: #6d28d9; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; }
            .btn { display: inline-block; padding: 13px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; background: #8b5cf6; color: #ffffff; text-align: center; margin-top: 20px; }
            .footer { border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>Task Assignment 📝</h1>
              <p>You've been added to a task</p>
            </div>
            <div class="body">
              <p>Hi ${memberName},</p>
              <p><strong>${addedByName}</strong> has added you to a task on Auth App.</p>
              <div class="task-details">
                <div class="detail-row">
                  <div class="detail-label">Task:</div>
                  <div class="detail-value">${taskName}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Project:</div>
                  <div class="detail-value">${projectName}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Your Role:</div>
                  <div class="detail-value"><span class="role-badge">${roleDisplay}</span></div>
                </div>
              </div>
              <p>Click the button below to view the task and start collaborating.</p>
              <a href="${taskUrl}" class="btn">View Task</a>
            </div>
            <div class="footer">
              If you have any questions, please reach out to your team members.
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// services/email.service.js - Add this new function

/**
 * Send a milestone assignment notification email.
 *
 * @param {Object} opts
 * @param {string} opts.toEmail        - Recipient email address
 * @param {string} opts.memberName     - Name of the member being assigned
 * @param {string} opts.milestoneName  - Name of the milestone
 * @param {string} opts.taskName       - Name of the task
 * @param {string} opts.projectName    - Name of the project
 * @param {string} opts.assignedByName - Name of the person who assigned the milestone
 * @param {string} opts.milestoneUrl   - Full URL to the task with milestone
 * @param {string} opts.priority       - Priority of the milestone (low, medium, high)
 * @param {string} opts.dueDate        - Due date of the milestone
 */
async function sendMilestoneAssignedEmail({
  toEmail,
  memberName,
  milestoneName,
  taskName,
  projectName,
  assignedByName,
  milestoneUrl,
  priority,
  dueDate,
}) {
  const priorityColors = {
    low: "#6B7280",
    medium: "#F59E0B",
    high: "#EF4444",
  };

  const priorityColor = priorityColors[priority] || "#6B7280";

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Auth App"}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `📌 Milestone "${milestoneName}" assigned to you in "${taskName}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Milestone Assignment</title>
          <style>
            body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #10B981, #059669); padding: 40px 32px; text-align: center; }
            .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
            .body { padding: 36px 32px; }
            .body p { margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6; }
            .milestone-details { background: #f8f9fa; border-left: 4px solid #10B981; padding: 16px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; margin: 12px 0; align-items: flex-start; }
            .detail-label { font-weight: 600; color: #6b7280; min-width: 100px; flex-shrink: 0; }
            .detail-value { color: #374151; flex: 1; word-break: break-word; }
            .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 13px; color: white; }
            .btn { display: inline-block; padding: 13px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; background: #10B981; color: #ffffff; text-align: center; margin-top: 20px; }
            .footer { border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>🎯 Milestone Assignment</h1>
              <p>A milestone has been assigned to you</p>
            </div>
            <div class="body">
              <p>Hi ${memberName},</p>
              <p><strong>${assignedByName}</strong> has assigned a milestone to you for the task "${taskName}" in project <strong>${projectName}</strong>.</p>
              
              <div class="milestone-details">
                <div class="detail-row">
                  <div class="detail-label">Milestone:</div>
                  <div class="detail-value"><strong>${milestoneName}</strong></div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Priority:</div>
                  <div class="detail-value">
                    <span class="priority-badge" style="background-color: ${priorityColor};">
                      ${priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "Medium"}
                    </span>
                  </div>
                </div>
                ${
                  dueDate
                    ? `
                <div class="detail-row">
                  <div class="detail-label">Due Date:</div>
                  <div class="detail-value">${new Date(dueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>
                </div>
                `
                    : ""
                }
              </div>
              
              <p>Click the button below to view the task and milestone details:</p>
              <a href="${milestoneUrl}" class="btn">🔗 View Task</a>
            </div>
            <div class="footer">
              This is an automated notification. Please do not reply to this email.
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Update the exports
module.exports = {
  sendTeamInvitationEmail,
  sendTaskMemberAddedEmail,
  sendMilestoneAssignedEmail, // Add this export
};
