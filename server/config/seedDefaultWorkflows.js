const Workflow = require("../model/Workflow");

const defaultWorkflows = [
  {
    name: "Software Development",
    defaultImage: "/workflow-icons/development.svg",
    iconColor: "#4F46E5",
    phases: ["Start", "Backlog", "To Do", "In Progress", "Code Review", "Testing", "Done", "End"],
  },
  {
    name: "Design Process",
    defaultImage: "/workflow-icons/design.svg",
    iconColor: "#EC4899",
    phases: ["Start", "Research", "Brief", "Wireframes", "Design", "Review", "Approved", "End"],
  },
  {
    name: "Content Production",
    defaultImage: "/workflow-icons/content.svg",
    iconColor: "#06B6D4",
    phases: ["Start", "Ideas", "Drafting", "Editing", "Review", "Published", "End"],
  },
  {
    name: "Project Planning",
    defaultImage: "/workflow-icons/planning.svg",
    iconColor: "#A855F7",
    phases: ["Start", "Planning", "Ready", "In Progress", "Blocked", "Completed", "End"],
  },
];

async function seedDefaultWorkflows() {
  for (const workflow of defaultWorkflows) {
    await Workflow.updateOne(
      { name: workflow.name, type: "general", isDefault: true },
      {
        $set: {
          isActive: true,
          defaultImage: workflow.defaultImage,
          iconColor: workflow.iconColor,
          phases: workflow.phases.map((name, order) => ({ name, order })),
        },
        $setOnInsert: { name: workflow.name, type: "general", isDefault: true },
      },
      { upsert: true },
    );
  }
  console.log("Default workflows are ready");
}

module.exports = seedDefaultWorkflows;
