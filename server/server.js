const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();

const connectDB = require("./config/db");
const seedDefaultWorkflows = require("./config/seedDefaultWorkflows");
const authRoutes = require("./route/authRoutes");
const teamRoutes = require("./route/Teamroutes");
const workflowRoutes = require("./route/workflowRoutes");
const projectRoutes = require("./route/projectRoutes");
const taskRoutes = require("./route/taskRoutes");
const milestoneRoutes = require("./route/milestoneRoutes");
const statisticsRoutes = require("./route/statisticsRoutes");
const backlogRoutes = require("./route/backlogRoutes");

// Initialize express
const app = express();

// Database connection and default workflow seeding run before the server starts.

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [process.env.CLIENT_URL];
      if (process.env.NODE_ENV !== "production") {
        allowedOrigins.push(
          "http://localhost:5173",
          "http://127.0.0.1:5173",
        );
      }

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);

app.use("/api/workflows", workflowRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/backlog", backlogRoutes);
// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Auth API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(seedDefaultWorkflows)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Server startup failed:", error);
    process.exit(1);
  });
