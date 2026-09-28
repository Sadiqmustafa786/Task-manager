// views/tasks/CreateTaskForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import CustomModal from "../../components/CustomModal";
import { useTaskStore } from "../../stores/useTaskStore";
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
    description: "",
    teamId: "",
    startDate: "",
    endDate: "",
    priority: "normal",
  });

  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [responsible, setResponsible] = useState([]);
  const [accountable, setAccountable] = useState([]);
  const [consultant, setConsultant] = useState([]);
  const [informed, setInformed] = useState([]);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [activeRaciColumn, setActiveRaciColumn] = useState("responsible");
  const dropdownRef = useRef(null);

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
          // email: user.email,
          avatar: user.avatar,
        })),
      );
    }
    if (isOpen && formOptions.teams) {
      setAvailableTeams(formOptions.teams);
    }
  }, [isOpen, formOptions.users, formOptions.teams]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        description: "",
        teamId: "",
        startDate: "",
        endDate: "",
        priority: "normal",
      });
      setResponsible([]);
      setAccountable([]);
      setConsultant([]);
      setInformed([]);
      setActiveRaciColumn("responsible");
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMemberDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allAssignedUsers = [
    ...responsible,
    ...accountable,
    ...consultant,
    ...informed,
  ];
  const totalSelected = allAssignedUsers.length;

  const isUserAssigned = (userId) =>
    [...responsible, ...accountable, ...consultant, ...informed].some(
      (u) => u.id === userId,
    );

  const addUserToColumn = (user, column) => {
    const setters = {
      responsible: setResponsible,
      accountable: setAccountable,
      consultant: setConsultant,
      informed: setInformed,
    };
    const lists = { responsible, accountable, consultant, informed };
    if (!lists[column].some((u) => u.id === user.id)) {
      setters[column]((prev) => [...prev, user]);
    }
  };

  const removeUserFromColumn = (userId, column) => {
    const setters = {
      responsible: setResponsible,
      accountable: setAccountable,
      consultant: setConsultant,
      informed: setInformed,
    };
    setters[column]((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleUserSelect = (user) => {
    if (!isUserAssigned(user.id)) {
      addUserToColumn(user, activeRaciColumn);
      setMemberDropdownOpen(false);
    }
  };

  // Drag and Drop Handler
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    let draggedUser = null;

    if (source.droppableId === "responsible") {
      draggedUser = responsible.find((u) => u.id === draggableId);
      if (draggedUser) {
        setResponsible(responsible.filter((u) => u.id !== draggableId));
      }
    } else if (source.droppableId === "accountable") {
      draggedUser = accountable.find((u) => u.id === draggableId);
      if (draggedUser) {
        setAccountable(accountable.filter((u) => u.id !== draggableId));
      }
    } else if (source.droppableId === "consultant") {
      draggedUser = consultant.find((u) => u.id === draggableId);
      if (draggedUser) {
        setConsultant(consultant.filter((u) => u.id !== draggableId));
      }
    } else if (source.droppableId === "informed") {
      draggedUser = informed.find((u) => u.id === draggableId);
      if (draggedUser) {
        setInformed(informed.filter((u) => u.id !== draggableId));
      }
    }

    if (!draggedUser) return;

    if (destination.droppableId === "responsible") {
      setResponsible((prev) => [...prev, draggedUser]);
    } else if (destination.droppableId === "accountable") {
      setAccountable((prev) => [...prev, draggedUser]);
    } else if (destination.droppableId === "consultant") {
      setConsultant((prev) => [...prev, draggedUser]);
    } else if (destination.droppableId === "informed") {
      setInformed((prev) => [...prev, draggedUser]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError("Please enter task name");
      return;
    }
    if (allAssignedUsers.length === 0) {
      showError("Please assign at least one user");
      return;
    }
    try {
      setLoading(true);
      await createTask({
        name: formData.name,
        description: formData.description,
        projectId,
        phaseId,
        teamId: formData.teamId || null,
        assignedTo: allAssignedUsers[0]?.id || null,
        assignedUsers: allAssignedUsers.map((u) => u.id),
        responsible: responsible.map((u) => u.id),
        accountable: accountable.map((u) => u.id),
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

  // const priorityOptions = [
  //   { value: "low", label: "Low" },
  //   { value: "normal", label: "Normal" },
  //   { value: "medium", label: "Medium" },
  //   { value: "high", label: "High" },
  //   { value: "urgent", label: "Urgent" },
  // ];

  const raciColumns = [
    {
      id: "responsible",
      label: "R",
      fullLabel: "Responsible",
      items: responsible,
      color: "#3b82f6",
      bgColor: "#eff6ff",
    },
    {
      id: "accountable",
      label: "A",
      fullLabel: "Accountable",
      items: accountable,
      color: "#10b981",
      bgColor: "#ecfdf5",
    },
    {
      id: "consultant",
      label: "C",
      fullLabel: "Consultant",
      items: consultant,
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
    },
    {
      id: "informed",
      label: "I",
      fullLabel: "Informed",
      items: informed,
      color: "#f59e0b",
      bgColor: "#fffbeb",
    },
  ];

  const MemberChip = ({ user, column, index }) => (
    <Draggable draggableId={user.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background:
              raciColumns.find((c) => c.id === column)?.color || "#3b82f6",
            color: "#fff",
            borderRadius: "16px",
            padding: "2px 8px 2px 6px",
            fontSize: "11px",
            fontWeight: 500,
            marginBottom: "4px",
            marginRight: "4px",
            cursor: "grab",
            opacity: snapshot.isDragging ? 0.5 : 1,
          }}
        >
          <span
            style={{
              maxWidth: "80px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.name.split(" ")[0]}
          </span>
          <button
            onClick={() => removeUserFromColumn(user.id, column)}
            style={{
              background: "#fff",
              color:
                raciColumns.find((c) => c.id === column)?.color || "#3b82f6",
              border: "none",
              borderRadius: "50%",
              width: "14px",
              height: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "9px",
              fontWeight: 700,
              padding: 0,
            }}
            disabled={loading}
          >
            ×
          </button>
        </div>
      )}
    </Draggable>
  );

  const DroppableColumn = ({ column }) => (
    <Droppable droppableId={column.id} direction="horizontal">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          style={{
            border: `1px solid ${column.color}30`,
            borderRadius: "8px",
            padding: "6px",
            minHeight: "70px",
            background: snapshot.isDraggingOver ? column.bgColor : "#fafafa",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "24px",
                height: "24px",
                borderRadius: "12px",
                background: column.color,
                color: "#fff",
                textAlign: "center",
                lineHeight: "24px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {column.label}
            </span>
            <span
              style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500 }}
            >
              {column.fullLabel}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              minHeight: "40px",
            }}
          >
            {column.items.length === 0 ? (
              <p
                style={{
                  fontSize: "10px",
                  color: "#cbd5e1",
                  margin: 0,
                  padding: "4px 0",
                }}
              >
                Drop here
              </p>
            ) : (
              column.items.map((user, index) => (
                <MemberChip
                  key={user.id}
                  user={user}
                  column={column.id}
                  index={index}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "4px",
  };

  const inputStyle = {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#111827",
    background: "#f9fafb",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create Task — ${phaseName || "Phase"}`}
      size="full"
      position="right"
      fullScreen={true}
      showCloseButton={true}
      closeOnBackdrop={false}
      closeOnEscape={true}
      showFooter={true}
      footerContent={
        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              color: "#374151",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              background: loading || !formData.name ? "#93c5fd" : "#3b82f6",
              color: "#fff",
              fontSize: "13px",
              cursor: loading || !formData.name ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      }
    >
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ padding: "0 4px" }}>
          {/* Section Heading */}
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#3b82f6",
              marginBottom: "16px",
              marginTop: "0",
            }}
          >
            Task Info
          </p>

          {/* Task Title */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Task Title</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter task title"
              disabled={loading}
              style={inputStyle}
            />
          </div>

          {/* Brief Description */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>
              Brief Description{" "}
              <span
                style={{ fontWeight: 400, color: "#9ca3af", fontSize: "11px" }}
              >
                (Optional)
              </span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter description"
              disabled={loading}
              style={inputStyle}
            />
          </div>

          {/* Priority */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Priority</label>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              {[
                { value: "low", label: "Low" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#374151",
                  }}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={opt.value}
                    checked={formData.priority === opt.value}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    disabled={loading}
                    style={{
                      accentColor: "#3b82f6",
                      width: "15px",
                      height: "15px",
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Initiation + Deadline side by side */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "14px",
            }}
          >
            <div>
              <label style={labelStyle}>Initiation</label>
              <input
                type="date"
                value={
                  formData.startDate ? formData.startDate.slice(0, 10) : ""
                }
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                disabled={loading}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Deadline</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                disabled={loading}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Member Selected + Select Team side by side */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "20px",
            }}
            ref={dropdownRef}
          >
            {/* Member Button */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                style={{
                  width: "100%",
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  fontSize: "13px",
                  color: "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  {totalSelected > 0
                    ? `${totalSelected} Member${totalSelected > 1 ? "s" : ""} Selected`
                    : "Select members"}
                </span>
                <span style={{ fontSize: "10px", color: "#6b7280" }}>▼</span>
              </button>

              {memberDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    maxHeight: "280px",
                    overflowY: "auto",
                  }}
                >
                  {/* RACI Column Selector */}
                  <div
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #f3f4f6",
                      background: "#f9fafb",
                      display: "flex",
                      gap: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    {raciColumns.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => setActiveRaciColumn(col.id)}
                        style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          border: `1px solid ${activeRaciColumn === col.id ? col.color : "#d1d5db"}`,
                          background:
                            activeRaciColumn === col.id
                              ? `${col.color}15`
                              : "#fff",
                          color:
                            activeRaciColumn === col.id ? col.color : "#6b7280",
                          fontSize: "11px",
                          cursor: "pointer",
                        }}
                      >
                        {col.fullLabel}
                      </button>
                    ))}
                  </div>

                  {/* Users List */}
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {availableUsers.length === 0 ? (
                      <p
                        style={{
                          padding: "16px",
                          fontSize: "12px",
                          color: "#9ca3af",
                          textAlign: "center",
                        }}
                      >
                        No users available
                      </p>
                    ) : (
                      availableUsers.map((user) => {
                        const assigned = isUserAssigned(user.id);
                        return (
                          <button
                            key={user.id}
                            onClick={() => {
                              if (!assigned) handleUserSelect(user);
                            }}
                            disabled={assigned}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "8px 12px",
                              border: "none",
                              borderBottom: "1px solid #f3f4f6",
                              background: assigned ? "#f9fafb" : "transparent",
                              cursor: assigned ? "default" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                background: assigned
                                  ? "#9ca3af"
                                  : raciColumns.find(
                                      (c) => c.id === activeRaciColumn,
                                    )?.color,
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: assigned ? "#9ca3af" : "#111827",
                                }}
                              >
                                {user.name}
                              </p>
                              {/* <p
                                style={{
                                  margin: 0,
                                  fontSize: "10px",
                                  color: "#9ca3af",
                                }}
                              >
                                {user.email}
                              </p> */}
                            </div>
                            {assigned && (
                              <span
                                style={{ fontSize: "10px", color: "#10b981" }}
                              >
                                Added
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Select Team */}
            <div>
              <select
                value={formData.teamId}
                onChange={(e) =>
                  setFormData({ ...formData, teamId: e.target.value })
                }
                disabled={loading}
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                  color: formData.teamId ? "#111827" : "#9ca3af",
                }}
              >
                <option value="">Select Team</option>
                {availableTeams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RACI Matrix - 4 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
            }}
          >
            {raciColumns.map((col) => (
              <DroppableColumn key={col.id} column={col} />
            ))}
          </div>
        </div>
      </DragDropContext>
    </CustomModal>
  );
};

export default CreateTaskForm;
