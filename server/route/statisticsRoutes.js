// server/route/statisticsRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getIndividualCards,
  getIndividualTable,
  getIndividualProjects,
  getOrganizationalStats,
  getOrganizationalCards,
  getOrganizationalTable,
  getProjectsList,
  getEmployees,
} = require("../controller/statisticsController");

router.use(protect);

// Individual Statistics
router.get("/individual/cards", getIndividualCards);
router.get("/individual/table", getIndividualTable);
router.get("/individual/projects", getIndividualProjects);

// Organizational Statistics
router.get("/organizational", getOrganizationalStats);
router.get("/organizational/cards", getOrganizationalCards);
router.get("/organizational/table", getOrganizationalTable);

// Lists
router.get("/projects/list", getProjectsList);
router.get("/employees", getEmployees);

module.exports = router;
