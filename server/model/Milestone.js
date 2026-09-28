// model/Milestone.js
const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "rejected"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String, default: "" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    isStarred: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    attachments: [{ type: String }],
    // Star rating for completed milestones
    starRating: { type: Number, min: 1, max: 5 },
    // Who rated the milestone
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ratedAt: { type: Date },
    // Review comments for completed milestones
    reviewComments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        isReview: { type: Boolean, default: true },
      },
    ],
    // Regular comments
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        isReview: { type: Boolean, default: false },
      },
    ],
    isActive: { type: Boolean, default: true },
    pickedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pickedAt: { type: Date },
  },
  {
    timestamps: true,
    strict: false,
  },
);

// Virtual for days remaining
milestoneSchema.virtual("daysRemaining").get(function () {
  if (!this.endDate) return null;
  const now = new Date();
  const end = new Date(this.endDate);
  if (end < now) return 0;
  const diffTime = Math.abs(end - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for overdue check
milestoneSchema.virtual("isOverdue").get(function () {
  if (!this.endDate) return false;
  if (this.status === "completed") return false;
  return new Date(this.endDate) < new Date();
});

milestoneSchema.set("toJSON", { virtuals: true });
milestoneSchema.set("toObject", { virtuals: true });

module.exports =
  mongoose.models.Milestone || mongoose.model("Milestone", milestoneSchema);
