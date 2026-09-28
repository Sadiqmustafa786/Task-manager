// server/model/Backlog.js
const mongoose = require("mongoose");

const backlogSchema = new mongoose.Schema(
  {
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
    assignTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Not started", "Assigned", "In progress", "Complete", "On hold"],
      default: "Not started",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    label: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Label",
    },
    attachment: {
      type: String,
      default: "",
    },
    reportedDate: {
      type: Date,
      default: Date.now,
    },
    pickedDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    referenceData: {
      taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
      milestoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Milestone",
      },
      type: {
        type: String,
        enum: ["task", "milestone"],
      },
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Virtual for days in backlog
backlogSchema.virtual("daysInBacklog").get(function () {
  if (!this.reportedDate) return 0;
  const now = new Date();
  const diffTime = Math.abs(now - this.reportedDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

backlogSchema.set("toJSON", { virtuals: true });
backlogSchema.set("toObject", { virtuals: true });
backlogSchema.set("strictPopulate", false);

module.exports =
  mongoose.models.Backlog || mongoose.model("Backlog", backlogSchema);
