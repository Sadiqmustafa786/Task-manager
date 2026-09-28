// views/tasks/CreateTaskForm.jsx
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import CustomModal from "../../components/CustomModal";
import { useTaskStore } from "../../stores/useTaskStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { showError, showSuccess } from "../../components/toaster/Toaster";

const CreateTaskForm = ({
  isOpen,
  onClose,
  projectId,
  phaseId,
  phaseName,
  onTaskCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    assignedTo: "",
    startDate: "",
    endDate: "",
    priority: "medium",
  });

  const [availableUsers, setAvailableUsers] = useState([]);
  const [responsible, setResponsible] = useState([]);
  const [informed, setInformed] = useState([]);
  const [consultant, setConsultant] = useState([]);

  const { formData: formOptions, fetchFormData, createTask } = useTaskStore();

  useEffect(() => {
    if (isOpen && projectId) {
      fetchFormData(projectId);
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (isOpen && formOptions.users) {
      setAvailableUsers(
        formOptions.users.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        })),
      );
    }
  }, [isOpen, formOptions.users]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        assignedTo: "",
        startDate: "",
        endDate: "",
        priority: "medium",
      });
      setResponsible([]);
      setInformed([]);
      setConsultant([]);
    }
  }, [isOpen]);

  const handleUserSelect = (e) => {
    const userId = e.target.value;
    if (!userId) return;

    const selectedUser = availableUsers.find((u) => u.id === userId);
    if (
      selectedUser &&
      !responsible.some((u) => u.id === userId) &&
      !informed.some((u) => u.id === userId) &&
      !consultant.some((u) => u.id === userId)
    ) {
      setResponsible([...responsible, selectedUser]);
      setAvailableUsers(availableUsers.filter((u) => u.id !== userId));
    }
    setFormData({ ...formData, assignedTo: "" });
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    let draggedUser = null;
    if (source.droppableId === "available") {
      draggedUser = availableUsers.find((u) => u.id === draggableId);
      if (draggedUser) {
        setAvailableUsers(availableUsers.filter((u) => u.id !== draggableId));
      }
    } else if (source.droppableId === "responsible") {
      draggedUser = responsible.find((u) => u.id === draggableId);
      if (draggedUser) {
        setResponsible(responsible.filter((u) => u.id !== draggableId));
      }
    } else if (source.droppableId === "informed") {
      draggedUser = informed.find((u) => u.id === draggableId);
      if (draggedUser) {
        setInformed(informed.filter((u) => u.id !== draggableId));
      }
    } else if (source.droppableId === "consultant") {
      draggedUser = consultant.find((u) => u.id === draggableId);
      if (draggedUser) {
        setConsultant(consultant.filter((u) => u.id !== draggableId));
      }
    }

    if (!draggedUser) return;

    if (destination.droppableId === "available") {
      setAvailableUsers([...availableUsers, draggedUser]);
    } else if (destination.droppableId === "responsible") {
      setResponsible([...responsible, draggedUser]);
    } else if (destination.droppableId === "informed") {
      setInformed([...informed, draggedUser]);
    } else if (destination.droppableId === "consultant") {
      setConsultant([...consultant, draggedUser]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError("Please enter task name");
      return;
    }

    const allAssignedUsers = [...responsible, ...informed, ...consultant];

    if (allAssignedUsers.length === 0) {
      showError("Please assign at least one user");
      return;
    }

    try {
      setLoading(true);
      await createTask({
        name: formData.name,
        description: "",
        projectId: projectId,
        phaseId: phaseId,
        assignedTo: allAssignedUsers[0]?.id || null,
        assignedUsers: allAssignedUsers.map((u) => u.id),
        responsible: responsible.map((u) => u.id),
        informed: informed.map((u) => u.id),
        consultant: consultant.map((u) => u.id),
        priority: formData.priority,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      });
      showSuccess("Task created successfully!");
      if (onTaskCreated) onTaskCreated();
      onClose();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || "?";
  };

  const priorityOptions = [
    { value: "low", label: "Low", color: "text-gray-600 bg-gray-100" },
    { value: "medium", label: "Medium", color: "text-blue-600 bg-blue-100" },
    { value: "high", label: "High", color: "text-orange-600 bg-orange-100" },
    { value: "urgent", label: "Urgent", color: "text-red-600 bg-red-100" },
  ];

  const UserCard = ({ user, role }) => (
    <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="object-cover w-8 h-8 rounded-full"
        />
      ) : (
        <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-blue-500 rounded-full">
          {getInitials(user.name)}
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{user.name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </div>
  );

  const DroppableArea = ({ id, title, items, role, bgColor }) => (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`p-3 rounded-lg ${bgColor} ${snapshot.isDraggingOver ? "ring-2 ring-blue-400" : ""}`}
        >
          <h4 className="mb-2 text-sm font-semibold text-gray-700">{title}</h4>
          <div className="space-y-2 min-h-[100px]">
            {items.map((user, index) => (
              <Draggable key={user.id} draggableId={user.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${snapshot.isDragging ? "opacity-50" : ""}`}
                  >
                    <UserCard user={user} role={role} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create Task - ${phaseName || "Phase"}`}
      size="lg"
      showFooter={true}
      footerContent={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      }
    >
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Add scrollable container here */}
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
          {/* Task Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task name"
              disabled={loading}
            />
          </div>

          {/* Assign To Dropdown */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Assign To
            </label>
            <select
              value={formData.assignedTo}
              onChange={handleUserSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select a user to assign</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select a user and drag to the sections below
            </p>
          </div>

          {/* Drag and Drop Sections */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Available Users */}
            <DroppableArea
              id="available"
              title="Available Users"
              items={availableUsers}
              role="Available"
              bgColor="bg-gray-50"
            />

            <div className="space-y-4">
              {/* Responsible */}
              <DroppableArea
                id="responsible"
                title="Responsible"
                items={responsible}
                role="Responsible"
                bgColor="bg-blue-50"
              />

              {/* Informed */}
              <DroppableArea
                id="informed"
                title="Informed"
                items={informed}
                role="Informed"
                bgColor="bg-green-50"
              />

              {/* Consultant */}
              <DroppableArea
                id="consultant"
                title="Consultant"
                items={consultant}
                role="Consultant"
                bgColor="bg-purple-50"
              />
            </div>
          </div>

          {/* Start and End Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Priority
            </label>
            <div className="flex gap-3">
              {priorityOptions.map((priority) => (
                <label
                  key={priority.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={formData.priority === priority.value}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-4 h-4"
                    disabled={loading}
                  />
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded-full ${priority.color}`}
                  >
                    {priority.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </DragDropContext>
    </CustomModal>
  );
};

export default CreateTaskForm;
