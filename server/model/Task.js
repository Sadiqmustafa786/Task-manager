// model/Task.js - Update the priority enum
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    phase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project.phases",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    // Add responsible, accountable, consultant, informed fields
    responsible: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    accountable: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    consultant: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    informed: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["pending", "in-progress", "review", "completed", "blocked"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "medium", "high"], // Added "normal"
      default: "medium",
    },
    startDate: { type: Date },
    dueDate: { type: Date },
    completedAt: { type: Date },
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 },
    attachments: [{ type: String }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    labels: [{ type: String }],
    starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Virtual for days remaining
taskSchema.virtual("daysRemaining").get(function () {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  if (due < now) return 0;
  const diffTime = Math.abs(due - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for overdue check
taskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate) return false;
  if (this.status === "completed") return false;
  return new Date(this.dueDate) < new Date();
});

taskSchema.set("toJSON", { virtuals: true });
taskSchema.set("toObject", { virtuals: true });

module.exports = mongoose.models.Task || mongoose.model("Task", taskSchema);
