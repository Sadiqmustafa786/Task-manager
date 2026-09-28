// client/src/views/Home/DashboardView.jsx
import React, { useEffect, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { LuLayoutList } from "react-icons/lu";
import { FaClockRotateLeft, FaUser } from "react-icons/fa6";
import { useAuthStore } from "../../stores/useAuthStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { useProjectStore } from "../../stores/useProjectStore";
import CustomDrawer from "../../components/CustomDrawer";
import Calendar from "./Calendar";
import TodayTask from "./TodayTask";
import HomeSkeleton from "./HomeSkeleton";
import { taksToggleMainData, taksToggleSubData } from "../../utils/homeUtils";
import { formatDate, getDeadlineStatus } from "../../utils/dateUtils";

export const DashboardView = () => {
  const { user } = useAuthStore();
  const {
    tasks,
    fetchTasks,
    loading: taskLoading,
    todayTasks,
    fetchTodayTasks,
    loadingTodayTasks,
  } = useTaskStore();
  const {
    projects,
    fetchProjects,
    loading: projectLoading,
  } = useProjectStore();

  const [filteredTasks, setFilteredTasks] = useState([]);
  const [mainFilter, setMainFilter] = useState(1);
  const [subFilter, setSubFilter] = useState(1);
  const [showTodayTask, setShowTodayTask] = useState(false);
  const [userMap, setUserMap] = useState({});

  // useEffect(() => {
  //   if (tasks.length > 0) {
  //     console.log("=== All Tasks Debug ===");
  //     tasks.forEach((task, index) => {
  //       console.log(`${index + 1}. Task: ${task.name || task.title}`);
  //       console.log(`   dueDate: ${task.dueDate}`);
  //       console.log(`   deadline_date: ${task.deadline_date}`);
  //       console.log(`   endDate: ${task.endDate}`);
  //       console.log(`   status: ${task.status}`);
  //       console.log("---");
  //     });
  //     console.log("=== End of Tasks ===");
  //   }
  // }, [tasks]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchTodayTasks(); // Fetch today's tasks separately
  }, []);

  // Build user map from tasks
  useEffect(() => {
    if (tasks.length > 0) {
      const map = {};
      tasks.forEach((task) => {
        if (
          task.assignedBy &&
          typeof task.assignedBy === "object" &&
          task.assignedBy._id
        ) {
          map[task.assignedBy._id] = task.assignedBy.name || "Unknown User";
        }
        if (
          task.createdBy &&
          typeof task.createdBy === "object" &&
          task.createdBy._id
        ) {
          map[task.createdBy._id] = task.createdBy.name || "Unknown User";
        }
        if (task.responsible && Array.isArray(task.responsible)) {
          task.responsible.forEach((resp) => {
            if (resp && typeof resp === "object" && resp._id) {
              map[resp._id] = resp.name || "Unknown User";
            }
          });
        }
      });
      setUserMap(map);
    }
  }, [tasks]);

  useEffect(() => {
    if (tasks.length > 0) {
      filterTasks();
    }
  }, [tasks, mainFilter, subFilter]);

  const filterTasks = () => {
    let filtered = [...tasks];

    switch (mainFilter) {
      case 1: // Incoming Tasks
        filtered = filtered.filter(
          (task) => task.status === "pending" || task.status === "in-progress",
        );
        break;
      case 2: // Outgoing Tasks
        filtered = filtered.filter((task) => task.status === "completed");
        break;
      case 3: // Consulting Tasks
        filtered = filtered.filter(
          (task) => task.consultant && task.consultant.length > 0,
        );
        break;
      default:
        break;
    }

    switch (subFilter) {
      case 1: // Ongoing
        filtered = filtered.filter((task) => task.status !== "completed");
        break;
      case 2: // Overdue
        filtered = filtered.filter((task) => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return dueDate < today && task.status !== "completed";
        });
        break;
      default:
        break;
    }

    setFilteredTasks(filtered);
  };

  // Helper function to get task creator name
  const getTaskCreatorName = (task) => {
    if (
      task.assignedBy &&
      typeof task.assignedBy === "object" &&
      task.assignedBy.name
    ) {
      return task.assignedBy.name;
    }
    if (
      task.createdBy &&
      typeof task.createdBy === "object" &&
      task.createdBy.name
    ) {
      return task.createdBy.name;
    }
    if (task.assignedBy && typeof task.assignedBy === "string") {
      return userMap[task.assignedBy] || "Unknown User";
    }
    if (task.createdBy && typeof task.createdBy === "string") {
      return userMap[task.createdBy] || "Unknown User";
    }
    return "Unassigned";
  };

  const handleMainFilterChange = (id) => {
    setMainFilter(id);
  };

  const handleSubFilterChange = (id) => {
    setSubFilter(id);
  };

  const handleTodayTaskToggle = () => {
    setShowTodayTask(!showTodayTask);
  };

  const handleDirection = (type, item) => {
    if (type === "task") {
      window.location.href = `/tasks/${item._id}`;
    } else if (type === "project") {
      const projectId =
        typeof item.project === "object" ? item.project._id : item.project;
      window.location.href = `/projects/${projectId}`;
    }
  };

  if (taskLoading || projectLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 md:py-5 space-y-4 sm:space-y-5 md:space-y-6">
      {/* Dashboard Title */}
      <div className="mb-2">
        <h1 className="text-base sm:text-lg md:text-[20px] font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent inline-block">
          Dashboard
        </h1>
      </div>

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-2 border-blue-200/50 flex flex-col sm:flex-row justify-between p-4 sm:p-6 w-full rounded-2xl gap-4 sm:gap-6 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <div className="flex flex-col gap-3 sm:gap-4 flex-1">
          <div>
            <span className="text-gray-700 text-lg sm:text-xl md:text-[25px] font-semibold">
              Hi,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent font-bold">
                {user?.name || "User"}
              </span>
            </span>
          </div>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed">
            You have{" "}
            <span className="font-bold text-blue-600">
              {loadingTodayTasks ? "..." : todayTasks.length}
            </span>{" "}
            tasks to deliver by today. Keep going - you're making great
            progress!
          </p>
          <div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                onClick={handleTodayTaskToggle}
                className="bg-gradient-to-r from-blue-600 to-blue-500 capitalize py-2 px-6 sm:px-8 font-semibold text-sm sm:text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-white"
              >
                Let's Start!
              </button>
            </motion.div>
          </div>
        </div>
        <div className="hidden sm:block flex-shrink-0">
          <motion.img
            src="/dashboard-animation.gif"
            alt="dashboard"
            className="h-[180px] sm:h-[200px] md:h-[220px]"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>

      {/* Main Tabs */}
      <div className="flex items-center gap-4">
        <LayoutGroup id="taskmain-tabs">
          <div className="flex items-center gap-4">
            {taksToggleMainData.map((ele) => {
              const isActive = mainFilter === ele.id;
              return (
                <button
                  key={ele.id}
                  onClick={() => handleMainFilterChange(ele.id)}
                  className={`relative px-3 py-1.5 text-sm font-normal ${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <span className="relative z-10">{ele.title}</span>
                  {isActive && (
                    <motion.span
                      layoutId="underline-taskmain"
                      className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      {/* Sub Tabs */}
      <LayoutGroup id="taskSub-main">
        <div className="flex items-center gap-4">
          {taksToggleSubData.map((ele) => {
            const isActive = subFilter === ele.id;
            return (
              <div
                key={ele.id}
                onClick={() => handleSubFilterChange(ele.id)}
                className={`relative px-3 py-1.5 text-sm font-medium outline-sky-400 transition focus-visible:outline-2 cursor-pointer ${
                  isActive
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                style={{
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span className="relative z-20">{ele.title}</span>
              </div>
            );
          })}
        </div>
      </LayoutGroup>

      {/* Task List */}
      <div className="border border-blue-200 p-3 sm:p-4 w-full rounded-lg h-fit max-h-[200px] sm:max-h-[250px] overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div>
            <span className="text-sm sm:text-base text-gray-500">
              No tasks found
            </span>
          </div>
        ) : (
          filteredTasks.map((task, i) => {
            const project = task.project;
            const deadlineStatus = getDeadlineStatus(task.dueDate);
            const creatorName = getTaskCreatorName(task);
            const projectName = project?.name || "Unassigned";
            const projectColor = project?.cardColor || "#6B7280";

            return (
              <div
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-gray-100"
                key={i}
              >
                <div className="flex flex-row items-center gap-2 sm:gap-3 col-span-12 sm:col-span-5">
                  <span className="text-blue-600 text-base sm:text-lg md:text-[20px]">
                    <LuLayoutList />
                  </span>
                  <motion.span
                    whileHover={{ scale: 1.04 }}
                    className="cursor-pointer text-sm sm:text-base truncate text-gray-800"
                    onClick={() => handleDirection("task", task)}
                  >
                    {task?.name || task?.title}
                  </motion.span>
                </div>
                <div className="col-span-12 sm:col-span-3 flex items-center">
                  <motion.span
                    whileHover={{ scale: 1.1 }}
                    className="cursor-pointer text-sm sm:text-base truncate"
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
                <div className="col-span-12 sm:col-span-2 flex items-center gap-2 justify-start sm:justify-end text-gray-500 text-xs sm:text-[12px]">
                  <span>
                    <FaClockRotateLeft />
                  </span>
                  <span>{formatDate(task.dueDate)}</span>
                  {deadlineStatus === "overdue" && (
                    <span className="text-red-500 text-xs font-medium ml-1">
                      (Overdue)
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Calendar Section */}
      <div className="border border-blue-200 p-3 sm:p-4 w-full rounded-lg shadow-md">
        <Calendar
          tasks={tasks}
          projects={projects}
          onTaskClick={(task) => handleDirection("task", task)}
          onProjectClick={(project) => handleDirection("project", project)}
        />
      </div>

      {/* Today Task Drawer */}
      {showTodayTask && (
        <CustomDrawer
          open={showTodayTask}
          closeDrawer={handleTodayTaskToggle}
          title="Today's Tasks"
          widthSize={700}
          compo={
            <TodayTask
              todayTasks={todayTasks}
              handleDirection={handleDirection}
              projects={projects}
              getTaskCreatorName={getTaskCreatorName}
            />
          }
        />
      )}
    </div>
  );
};
