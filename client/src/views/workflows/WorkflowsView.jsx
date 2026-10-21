// views/workflows/WorkflowsView.jsx
import React, { useEffect, useState } from "react";
import { useWorkflowStore } from "../../stores/useWorkflowStore";
import WorkflowCard from "./WorkflowCard";
import CreateWorkflowCard from "./CreateWorkflowCard";
import CreateWorkflowForm from "./CreateWorkflowForm";
import { showSuccess, showError } from "../../components/toaster/Toaster";

export const WorkflowsView = () => {
  const [activeTab, setActiveTab] = useState("user");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const {
    generalWorkflows,
    userWorkflows,
    fetchGeneralWorkflows,
    fetchUserWorkflows,
    createWorkflow,
    loading,
    error,
    clearError,
  } = useWorkflowStore();

  useEffect(() => {
    fetchGeneralWorkflows();
    fetchUserWorkflows();
  }, []);

  const handleWorkflowUpdated = () => {
    fetchUserWorkflows();
  };

  const handleUseGeneralWorkflow = async (workflow) => {
    try {
      await createWorkflow({
        name: `${workflow.name} (Copy)`,
        phases: (workflow.phases || []).map((phase, index) => ({
          name: phase.name,
          order: index,
        })),
        defaultImage: workflow.defaultImage,
        iconColor: workflow.iconColor,
      });
      showSuccess(`${workflow.name} added to My Workflows.`);
      setActiveTab("user");
    } catch (error) {
      showError(error.response?.data?.message || "Failed to use this workflow");
    }
  };

  const handleCreateWorkflow = async (workflowData) => {
    try {
      setCreating(true);
      await createWorkflow(workflowData);
      showSuccess("Workflow created successfully!");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create workflow:", error);
      showError(error.response?.data?.message || "Failed to create workflow");
    } finally {
      setCreating(false);
    }
  };

  if (loading && userWorkflows.length === 0 && generalWorkflows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-between p-4 mb-4 text-red-700 bg-red-100 border border-red-400 rounded-lg">
            <span>{error}</span>
            <button onClick={clearError} className="font-bold">
              ✗
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("user")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "user"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            My Workflows ({userWorkflows.length})
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "general"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            General Workflows ({generalWorkflows.length})
          </button>
        </div>

        {/* Workflows Grid */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5 justify-items-center">
          {/* Create Workflow Card - Only in My Workflows tab */}
          {activeTab === "user" && (
            <CreateWorkflowCard onClick={() => setShowCreateModal(true)} />
          )}

          {/* My Workflows */}
          {activeTab === "user" &&
            userWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow._id}
                workflow={workflow}
                onWorkflowUpdated={handleWorkflowUpdated}
              />
            ))}

          {/* General Workflows */}
          {activeTab === "general" &&
            generalWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow._id}
                workflow={workflow}
                isGeneral={true}
                onUseWorkflow={handleUseGeneralWorkflow}
              />
            ))}
        </div>

        {/* No Workflows Message */}
        {activeTab === "user" && userWorkflows.length === 0 && !loading && (
          <div className="mt-8 text-center text-gray-500">
            <p>You have not created a workflow yet. Start with a ready-made template or create your own.</p>
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Browse default workflows
            </button>
          </div>
        )}
      </div>

      {/* Create Workflow Modal (Center) */}
      <CreateWorkflowForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateWorkflow}
        loading={creating}
      />
    </div>
  );
};
