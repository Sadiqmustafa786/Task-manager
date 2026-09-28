// model/Project.js
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    startDate: { type: Date },
    endDate: { type: Date },
    isContinuous: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["planning", "in-progress", "on-hold", "completed", "cancelled"],
      default: "planning",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    phases: [
      {
        phaseId: { type: mongoose.Schema.Types.ObjectId },
        name: { type: String, required: true },
        order: { type: Number, required: true },
        status: {
          type: String,
          enum: ["pending", "in-progress", "completed"],
          default: "pending",
        },
        startDate: { type: Date },
        endDate: { type: Date },
        progress: { type: Number, default: 0, min: 0, max: 100 },
      },
    ],
    attachments: [{ type: String }],
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    cardColor: { type: String, default: "#3B82F6" },
  },
  { timestamps: true },
);

// Virtual fields
projectSchema.virtual("daysRemaining").get(function () {
  if (this.isContinuous || !this.endDate) return null;
  const now = new Date();
  const end = new Date(this.endDate);
  if (end < now) return 0;
  const diffTime = Math.abs(end - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

projectSchema.virtual("totalDuration").get(function () {
  if (!this.startDate) return 0;
  const start = new Date(this.startDate);
  const end =
    this.isContinuous || !this.endDate ? new Date() : new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

projectSchema.set("toJSON", { virtuals: true });
projectSchema.set("toObject", { virtuals: true });
projectSchema.set("strictPopulate", false);

module.exports =
  mongoose.models.Project || mongoose.model("Project", projectSchema);
