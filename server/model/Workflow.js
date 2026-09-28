// model/Workflow.js
const mongoose = require("mongoose");

const phaseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  order: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const workflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["general", "user-created"],
      default: "user-created",
    },
    isDefault: { type: Boolean, default: false },
    defaultImage: { type: String, default: "/default-workflow.png" },
    iconColor: { type: String, default: "#4F46E5" },
    phases: [phaseSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.type === "user-created";
      },
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Remove virtuals to avoid any issues
// workflowSchema.virtual("totalPhases").get(function () {
//   return this.phases.length;
// });

// workflowSchema.set("toJSON", { virtuals: true });
// workflowSchema.set("toObject", { virtuals: true });

module.exports =
  mongoose.models.Workflow || mongoose.model("Workflow", workflowSchema);
