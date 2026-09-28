// client/src/views/Home/TodayTask.jsx
import React from "react";
import { motion } from "framer-motion";
import { LuLayoutList } from "react-icons/lu";
import { FaClockRotateLeft, FaUser } from "react-icons/fa6";
import { formatDate } from "../../utils/dateUtils";

const TodayTask = ({
  todayTasks = [],
  handleDirection,
  projects = [],
  getTaskCreatorName = () => "Unassigned",
}) => {
  const getProjectName = (task) => {
    const project = projects.find((p) => p._id === task.project);
    return project?.name || "Unassigned";
  };

  const getProjectColor = (task) => {
    const project = projects.find((p) => p._id === task.project);
    return project?.cardColor || "#6B7280";
  };

  if (todayTasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        <span>No tasks for today. Great job! 🎉</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {todayTasks.map((task, index) => {
        const creatorName = getTaskCreatorName(task);
        const projectName = getProjectName(task);
        const projectColor = getProjectColor(task);

        return (
          <div
            className="grid grid-cols-12 gap-2 py-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg px-2 transition-colors"
            key={task._id || index}
          >
            <div className="flex flex-row items-center gap-3 col-span-12 sm:col-span-5">
              <span className="text-blue-600 text-[20px]">
                <LuLayoutList />
              </span>
              <motion.span
                whileHover={{ scale: 1.04 }}
                className="cursor-pointer text-sm font-medium text-gray-800"
                onClick={() => handleDirection("task", task)}
              >
                {task.name || task.title}
              </motion.span>
            </div>
            <div className="col-span-12 sm:col-span-3 flex items-center">
              <motion.span
                whileHover={{ scale: 1.1 }}
                className="cursor-pointer text-sm truncate"
                style={{ color: projectColor }}
                onClick={() => handleDirection("project", task)}
              >
                {projectName}
              </motion.span>
            </div>
            <div className="col-span-12 sm:col-span-2 flex items-center gap-1.5 text-gray-500 text-xs">
              <FaUser className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{creatorName}</span>
            </div>
            <div className="col-span-12 sm:col-span-2 flex items-center gap-2 justify-end text-gray-500 text-[12px]">
              <span>
                <FaClockRotateLeft />
              </span>
              <span>{formatDate(task.dueDate)}</span>
              {task.status === "completed" && (
                <span className="text-green-500 text-xs font-medium ml-1">
                  ✓ Done
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TodayTask;
