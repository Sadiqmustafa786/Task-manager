// views/workflows/CreateWorkflowForm.jsx
import React, { useState, useRef, useEffect } from "react";
import CustomModal from "../../components/CustomModal";
import { showError } from "../../components/toaster/Toaster";
import { workflowIcons } from "../../constants/workflowIcons";

const CreateWorkflowForm = ({ isOpen, onClose, onSubmit, loading }) => {
  const [workflowName, setWorkflowName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(workflowIcons[0]);
  const [phases, setPhases] = useState([
    { id: "start", name: "Start", isDefault: true },
    { id: "end", name: "End", isDefault: true },
  ]);
  const [phaseName, setPhaseName] = useState("");
  const scrollRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setWorkflowName("");
    setSelectedIcon(workflowIcons[0]);
    setPhases([
      { id: "start", name: "Start", isDefault: true },
      { id: "end", name: "End", isDefault: true },
    ]);
    setPhaseName("");
  };

  const handleAddPhase = () => {
    if (!phaseName.trim()) {
      showError("Please enter phase name");
      return;
    }

    const newPhase = {
      id: Date.now(),
      name: phaseName.trim(),
      isDefault: false,
    };

    const newPhases = [...phases];
    newPhases.splice(newPhases.length - 1, 0, newPhase);
    setPhases(newPhases);
    setPhaseName("");
  };

  const handleRemovePhase = (phaseId) => {
    const phaseToRemove = phases.find((p) => p.id === phaseId);
    if (phaseToRemove?.isDefault) {
      showError("Cannot remove Start or End phases");
      return;
    }
    setPhases(phases.filter((p) => p.id !== phaseId));
  };

  const handleSubmit = () => {
    if (!workflowName.trim()) {
      showError("Please enter workflow name");
      return;
    }

    const phasesToSubmit = phases.map((phase, index) => ({
      name: phase.name,
      order: index,
    }));

    onSubmit({
      name: workflowName.trim(),
      phases: phasesToSubmit,
      defaultImage: selectedIcon.path,
      iconColor: selectedIcon.color,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // const scrollLeft = () => {
  //   if (scrollRef.current) {
  //     scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
  //   }
  // };

  // const scrollRight = () => {
  //   if (scrollRef.current) {
  //     scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
  //   }
  // };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Workflow"
      size="lg"
      showFooter={true}
      contentClassName="!p-0"
      footerContent={
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !workflowName.trim()}
            className="px-4 py-2 text-sm text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Workflow"}
          </button>
        </div>
      }
    >
      {/* Scrollable Content - Fixed max height */}
      <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4">
        {/* Workflow Name */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Workflow Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter workflow name"
            autoFocus
            disabled={loading}
          />
        </div>

        {/* Icon Selection - Horizontal Scrollable Row */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Select Workflow Icon <span className="text-red-500">*</span>
          </label>

          {/* Selected Icon Preview */}
          <div className="flex items-center gap-4 p-3 mb-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="text-sm text-gray-600">Selected:</div>
            <div
              className="flex items-center justify-center w-12 h-12 p-1 rounded-lg"
              style={{ backgroundColor: selectedIcon.color }}
            >
              <img
                src={selectedIcon.path}
                alt={selectedIcon.name}
                className="object-contain w-8 h-8"
              />
            </div>
            <div className="text-sm font-medium text-gray-800">
              {selectedIcon.name}
            </div>
          </div>

          {/* Horizontal Scrollable Icons Row */}
          <div className="relative">
            {/* Left Scroll Button
            <button
              type="button"
              onClick={scrollLeft}
              className="absolute left-0 z-10 p-1 transition-colors -translate-y-1/2 bg-white rounded-full shadow-md top-1/2 hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button> */}

            {/* Scrollable Icons Container */}
            <div
              ref={scrollRef}
              className="flex gap-3 px-8 py-4 overflow-x-auto scroll-smooth"
              style={{ scrollbarWidth: "thin" }}
            >
              {workflowIcons.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`flex-shrink-0 p-2 rounded-lg transition-all hover:scale-105 ${
                    selectedIcon.id === icon.id
                      ? "ring-2 ring-blue-500 bg-blue-50 shadow-md"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="flex items-center justify-center w-16 h-16 p-2 rounded-lg"
                    style={{ backgroundColor: icon.color }}
                  >
                    <img
                      src={icon.path}
                      alt={icon.name}
                      className="object-contain w-10 h-10"
                    />
                  </div>
                  <p className="mt-1 text-xs text-center text-gray-600">
                    {icon.name}
                  </p>
                </button>
              ))}
            </div>

            {/* Right Scroll Button
            <button
              type="button"
              onClick={scrollRight}
              className="absolute right-0 z-10 p-1 transition-colors -translate-y-1/2 bg-white rounded-full shadow-md top-1/2 hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button> */}
          </div>
        </div>

        {/* Add Phases Section */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Phases
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phase name"
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPhase();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddPhase}
              disabled={loading || !phaseName.trim()}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Add Phase
            </button>
          </div>

          {/* Phases List */}
          {phases.length > 0 && (
            <div className="space-y-2 overflow-y-auto max-h-48">
              <div className="flex gap-3">
                {phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-violet-500"
                  >
                    <div className="flex items-center gap-3">
                      {/* <span className="text-sm font-medium text-white">
                        #{index + 1}
                      </span> */}
                      <span className="text-sm font-medium text-white">
                        {phase.name}
                      </span>
                      {/* {phase.isDefault && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )} */}
                    </div>
                    {!phase.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhase(phase.id)}
                        className="text-red-500 transition-colors hover:text-red-700"
                        disabled={loading}
                        title="Remove phase"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomModal>
  );
};

export default CreateWorkflowForm;
