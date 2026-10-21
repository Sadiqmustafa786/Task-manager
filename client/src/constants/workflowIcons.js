export const workflowIcons = [
  {
    id: 1,
    name: "Development",
    path: "/workflow-icons/development.svg",
    color: "#4F46E5",
  },
  {
    id: 2,
    name: "Design",
    path: "/workflow-icons/design.svg",
    color: "#EC4899",
  },
  {
    id: 3,
    name: "Content",
    path: "/workflow-icons/content.svg",
    color: "#06B6D4",
  },
  {
    id: 4,
    name: "Planning",
    path: "/workflow-icons/planning.svg",
    color: "#A855F7",
  },
];

export const getIconByPath = (path) => {
  const icon = workflowIcons.find((item) => item.path === path);
  if (icon) return icon;

  // Keep old database records showing the refreshed local icon.
  const legacyIconIds = {
    "https://cdn-icons-png.flaticon.com/512/2721/2721293.png": 1,
    "https://cdn-icons-png.flaticon.com/512/1055/1055687.png": 2,
    "https://cdn-icons-png.flaticon.com/512/2991/2991108.png": 3,
    "https://cdn-icons-png.flaticon.com/512/2921/2921222.png": 4,
  };
  return (
    workflowIcons.find((item) => item.id === legacyIconIds[path]) ||
    workflowIcons[0]
  );
};
