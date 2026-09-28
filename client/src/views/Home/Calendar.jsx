// client/src/views/Home/Calendar.jsx
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { LuLayoutList } from "react-icons/lu";
import { calendarToggleData } from "../../utils/homeUtils";
import {
  formatDate,
  getDaysInMonth,
  getMonthName,
} from "../../utils/dateUtils";

const Calendar = ({
  tasks = [],
  projects = [],
  onTaskClick,
  onProjectClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState(1); // 1: Month, 2: Week
  const [hoveredDay, setHoveredDay] = useState(null);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get calendar data for month view
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(month, year);
    const daysArray = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }

    return {
      year,
      month,
      daysArray,
      monthName: getMonthName(month),
    };
  }, [currentDate]);

  // Get week days for week view
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  }, [currentDate]);

  // Get tasks for a specific day
  const getTasksForDay = (day, month, year) => {
    const date = new Date(year, month, day);
    const dateString = date.toDateString();
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate).toDateString() === dateString;
    });
  };

  // Get task count for a day
  const getTaskCount = (day, month, year) => {
    return getTasksForDay(day, month, year).length;
  };

  // Get project color for a task
  const getProjectColor = (task) => {
    const project = projects.find((p) => p._id === task.project);
    return project?.cardColor || "#6B7280";
  };

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handlePreviousWeek = () => {
    setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const handleNextWeek = () => {
    setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleViewToggle = (id) => {
    setViewMode(id);
  };

  const isToday = (day, month, year) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isWeekend = (day) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    return date.getDay() === 0 || date.getDay() === 6;
  };

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.2 }}
            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100"
            onClick={viewMode === 1 ? handlePreviousMonth : handlePreviousWeek}
          >
            <FaChevronLeft className="text-gray-600" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.2 }}
            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100"
            onClick={viewMode === 1 ? handleNextMonth : handleNextWeek}
          >
            <FaChevronRight className="text-gray-600" />
          </motion.button>
        </div>

        {/* Date Display */}
        {viewMode === 1 ? (
          <div className="text-xl text-gray-800 font-bold flex gap-2 items-center">
            <span>{calendarData.monthName}</span>
            <span className="font-normal">{calendarData.year}</span>
          </div>
        ) : (
          <div className="text-lg text-gray-800 font-normal">
            Week of {weekDays[0].toLocaleDateString()} -{" "}
            {weekDays[6].toLocaleDateString()}
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center gap-4">
          {calendarToggleData.map((ele) => (
            <div
              key={ele.id}
              className={`${
                viewMode === ele.id
                  ? "text-white"
                  : "hover:text-gray-700 text-gray-500"
              } relative rounded-full px-3 py-1.5 text-sm font-medium transition cursor-pointer`}
              onClick={() => handleViewToggle(ele.id)}
            >
              {viewMode === ele.id && (
                <motion.span
                  layoutId="bubble-calendar"
                  className="absolute inset-0 z-10 bg-blue-600"
                  style={{ borderRadius: 9999 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative cursor-pointer text-[14px] z-20">
                {ele.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === 1 ? (
        // Month View
        <div className="grid grid-cols-7 gap-2 text-center">
          {/* Day Headers */}
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-md text-gray-600 font-medium w-full h-full flex items-center justify-center"
            >
              {day}
            </div>
          ))}

          {/* Days */}
          {calendarData.daysArray.map((day, index) => {
            if (day === null) {
              return <div key={index} className="w-full h-[100px]" />;
            }

            const taskCount = getTaskCount(
              day,
              calendarData.month,
              calendarData.year,
            );
            const dayTasks = getTasksForDay(
              day,
              calendarData.month,
              calendarData.year,
            );
            const isTodayDate = isToday(
              day,
              calendarData.month,
              calendarData.year,
            );
            const isWeekendDay = isWeekend(day);

            return (
              <motion.div
                whileHover={{ scale: 1.06 }}
                key={index}
                className="relative w-full h-[100px] flex flex-col rounded-xl cursor-pointer"
                onMouseEnter={() => setHoveredDay({ day, tasks: dayTasks })}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div
                  className={`w-full h-full flex flex-col rounded-xl p-2 ${
                    isWeekendDay
                      ? "bg-red-50"
                      : "hover:border hover:border-blue-200 bg-gray-50"
                  } ${isTodayDate ? "border-2 border-blue-500" : ""}`}
                >
                  <span className="text-sm text-gray-700 font-medium">
                    {day}
                  </span>
                  <div className="flex-1 flex items-end">
                    {taskCount > 0 && (
                      <span className="text-xs font-semibold text-blue-600">
                        {taskCount} {taskCount > 1 ? "Tasks" : "Task"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Popover */}
                {hoveredDay?.day === day && dayTasks.length > 0 && (
                  <div
                    className="absolute left-full ml-2 top-0 bg-white p-4 rounded-lg shadow-xl z-50 w-[300px] border border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-gray-600 text-sm font-semibold mb-2">
                      Tasks for {day} {calendarData.monthName}
                    </p>
                    <ul className="space-y-2">
                      {dayTasks.slice(0, 5).map((task, i) => (
                        <motion.li
                          whileHover={{ scale: 1.02 }}
                          key={i}
                          className="flex items-center gap-2 text-gray-700 text-[13px] cursor-pointer p-1 hover:bg-gray-50 rounded"
                          onClick={() => onTaskClick(task)}
                        >
                          <span className="text-blue-500">
                            <LuLayoutList />
                          </span>
                          <span className="truncate flex-1 text-start">
                            {task.name || task.title}
                          </span>
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getProjectColor(task) }}
                          />
                        </motion.li>
                      ))}
                      {dayTasks.length > 5 && (
                        <li className="text-xs text-gray-400 text-center">
                          +{dayTasks.length - 5} more tasks
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        // Week View
        <div className="w-full">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-4 text-center mb-4">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-md font-medium text-gray-700 w-full h-full flex items-center justify-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((date, index) => {
              const day = date.getDate();
              const month = date.getMonth();
              const year = date.getFullYear();
              const dayTasks = getTasksForDay(day, month, year);
              const isTodayDate = isToday(day, month, year);
              const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;

              return (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  key={index}
                  className={`flex flex-col rounded-xl border shadow-sm p-2 min-h-[120px]
                    ${isWeekendDay ? "bg-red-50" : "bg-gray-50"}
                    ${isTodayDate ? "border-2 border-blue-500" : "border-gray-200"}
                  `}
                >
                  {/* Date */}
                  <div className="flex items-center justify-center mb-2">
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full 
                        ${isTodayDate ? "bg-blue-600 text-white" : "text-gray-800"}
                      `}
                    >
                      {day}
                    </div>
                  </div>

                  {/* Tasks */}
                  {dayTasks.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {dayTasks.slice(0, 3).map((task, i) => (
                        <motion.li
                          whileHover={{ scale: 1.02 }}
                          key={i}
                          className="p-1.5 rounded-md cursor-pointer hover:shadow-sm transition-shadow"
                          style={{
                            backgroundColor: `${getProjectColor(task)}20`,
                          }}
                          onClick={() => onTaskClick(task)}
                        >
                          <div className="font-medium text-gray-800 text-xs truncate">
                            {task.name || task.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {task.dueDate
                              ? formatDate(task.dueDate)
                              : "No deadline"}
                          </div>
                        </motion.li>
                      ))}
                      {dayTasks.length > 3 && (
                        <li className="text-xs text-gray-400 text-center">
                          +{dayTasks.length - 3} more
                        </li>
                      )}
                    </ul>
                  ) : (
                    <div className="text-center text-gray-400 text-sm flex-1 flex items-center justify-center">
                      No Tasks
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
