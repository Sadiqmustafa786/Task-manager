// constants/workflowIcons.js
export const workflowIcons = [
  {
    id: 1,
    path: "https://cdn-icons-png.flaticon.com/512/2721/2721293.png", // Development
    // emoji: "💻",
    color: "#4F46E5",
  },
  {
    id: 2,
    path: "https://cdn-icons-png.flaticon.com/512/1055/1055687.png", // Design
    emoji: "🎨",
    color: "#EC4899",
  },

  {
    id: 3,
    path: "https://cdn-icons-png.flaticon.com/512/2991/2991108.png", // Content
    emoji: "✍️",
    color: "#06B6D4",
  },

  {
    id: 4,
    path: "https://cdn-icons-png.flaticon.com/512/2921/2921222.png", // Planning
    emoji: "📋",
    color: "#A855F7",
  },
];

export const getIconByPath = (path) => {
  return workflowIcons.find((icon) => icon.path === path) || workflowIcons[0];
};
