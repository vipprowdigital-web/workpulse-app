
import express from "express";
import {
  createTask,
  getTasks,
  getAssignedTaskHistory,
  getMyTasks,
  getTeamTasks,
  toggleTaskStatus,
  getUserTasks,
  getCompletedTasksFeed,
  reassignTask,
  approveTask,
  createSelfTask,
} from "../controllers/taskController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createTask);
router.post("/self", protect, adminOnly, createSelfTask);

router.get("/", protect, getTasks);
router.get("/history/assigned", protect, adminOnly, getAssignedTaskHistory);
router.get("/feed/completed", protect, adminOnly, getCompletedTasksFeed);

// Standalone unique dynamic parameter routes
router.get("/my/:userId", protect, getMyTasks); 
router.get("/team/:userId", protect, getTeamTasks);
router.get("/user/:userId", protect, getUserTasks);

router.put("/toggle/:id", protect, toggleTaskStatus);
router.put("/approve/:id", protect, adminOnly, approveTask);
router.put("/reassign/:id", protect, adminOnly, reassignTask);

export default router;

// import express from "express";
// import {
//   createTask,
//   getTasks,
//   getAssignedTaskHistory,
//   getMyTasks,
//   getTeamTasks,
//   toggleTaskStatus,
//   getUserTasks,
//   getCompletedTasksFeed, // ✅ NEW
//   reassignTask, // ✅ NEW
//   approveTask, // ✅ NEW
//   createSelfTask,
// } from "../controllers/taskController.js";

// // ✅ Apne middleware ka sahi path likho
// import { protect, adminOnly } from "../middleware/authMiddleware.js";

// const router = express.Router();

// // Existing routes
// router.post("/", protect, createTask);
// router.get("/history/assigned", protect, adminOnly, getAssignedTaskHistory);
// router.get("/", protect, getTasks);
// router.get("/my/:userId", protect, getMyTasks);
// router.get("/team/:userId", protect, getTeamTasks);
// router.put("/toggle/:id", protect, toggleTaskStatus); // User side — no admin check
// router.get("/user/:userId", protect, getUserTasks);
// router.post("/self", protect, adminOnly, createSelfTask);
// router.get("/my/:adminId", protect, adminOnly, getMyTasks);

// // ✅ NEW: Admin feed — Completed/Pending tasks ki list
// router.get("/feed/completed", protect, adminOnly, getCompletedTasksFeed);

// // ✅ NEW: Admin actions
// router.put("/approve/:id", protect, adminOnly, approveTask);
// router.put("/reassign/:id", protect, adminOnly, reassignTask);

// export default router;


