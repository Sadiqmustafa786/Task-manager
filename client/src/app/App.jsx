// client/src/App.jsx
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { AuthCallbackView } from "../components/AuthCallbackView";
import { LoginView } from "../components/LoginView";
import { PrivateRoute } from "../components/PrivateRoute";
import { DashboardView } from "../views/Home/DashboardView";
import { TeamsView } from "../views/teams/TeamsView";
import Navbar from "../components/Navbar";
import Toaster from "../components/toaster/Toaster";
import { WorkflowsView } from "../views/workflows/WorkflowsView";
import { ProjectsView } from "../views/projects/ProjectsView";
import ProjectDetailPage from "../views/projects/ProjectDetailPage";
import CreateProjectPage from "../views/projects/CreateProjectPage";
import { TasksView } from "../views/tasks/TasksView";
import CreateTaskPage from "../views/tasks/CreateTaskPage";
import TaskDetailPage from "../views/tasks/TaskDetailPage";
// Add these imports
import IndividualStatisticsView from "../views/statistics/IndividualStatisticsView";
import OrganizationalStatisticsView from "../views/statistics/OrganizationalStatisticsView";
import BacklogView from "../views/backlog/BacklogView";

export default function App() {
  const initializeSession = useAuthStore((s) => s.initializeSession);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return (
    <Router>
      <Navbar />
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/auth/callback" element={<AuthCallbackView />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardView />
            </PrivateRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <PrivateRoute>
              <TeamsView />
            </PrivateRoute>
          }
        />
        <Route
          path="/workflows"
          element={
            <PrivateRoute>
              <WorkflowsView />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <PrivateRoute>
              <ProjectsView />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <PrivateRoute>
              <ProjectDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/create"
          element={
            <PrivateRoute>
              <CreateProjectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <TasksView />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks/create"
          element={
            <PrivateRoute>
              <CreateTaskPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks/:taskId"
          element={
            <PrivateRoute>
              <TaskDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:projectId/tasks/:taskId"
          element={
            <PrivateRoute>
              <TaskDetailPage />
            </PrivateRoute>
          }
        />
        {/* Statistics Routes - Add these */}
        <Route
          path="/statistics/individual"
          element={
            <PrivateRoute>
              <IndividualStatisticsView />
            </PrivateRoute>
          }
        />
        <Route
          path="/statistics/organizational"
          element={
            <PrivateRoute>
              <OrganizationalStatisticsView />
            </PrivateRoute>
          }
        />
        {/* Statistics Dashboard (optional) */}
        <Route
          path="/statistics"
          element={
            <PrivateRoute>
              <Navigate to="/statistics/individual" />
            </PrivateRoute>
          }
        />
        <Route
          path="/backlog/:projectId"
          element={
            <PrivateRoute>
              <BacklogView />
            </PrivateRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}
