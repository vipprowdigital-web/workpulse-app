import express from "express";
import {
  createTask,
  getTasks,
  getMyTasks,
  getTeamTasks,
  toggleTaskStatus,
  getUserTasks,
  getCompletedTasksFeed, // ✅ NEW
  reassignTask,           // ✅ NEW
  approveTask,            // ✅ NEW
  createSelfTask,
} from "../controllers/taskController.js";

// ✅ Apne middleware ka sahi path likho
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Existing routes
router.post("/", protect, createTask);
router.get("/", protect, getTasks);
router.get("/my/:userId", protect, getMyTasks);
router.get("/team/:userId", protect, getTeamTasks);
router.put("/toggle/:id", toggleTaskStatus); // User side — no admin check
router.get("/user/:userId", getUserTasks);   // User apne tasks dekhta hai
router.post("/self", protect, adminOnly, createSelfTask);
router.get("/my/:adminId", protect, adminOnly, getMyTasks);

// ✅ NEW: Admin feed — Completed/Pending tasks ki list
router.get("/feed/completed", protect, adminOnly, getCompletedTasksFeed);

// ✅ NEW: Admin actions
router.put("/approve/:id", protect, adminOnly, approveTask);
router.put("/reassign/:id", protect, adminOnly, reassignTask);

export default router;




// import express from "express";
// import {
//   createTask,
//   getTasks,
//   getMyTasks,
//   getTeamTasks,
//   toggleTaskStatus,
//   getUserTasks,
// } from "../controllers/taskController.js";

// const router = express.Router();

// router.post("/", createTask);
// router.get("/", getTasks);
// router.get("/my/:userId", getMyTasks);
// router.get("/team/:userId", getTeamTasks);
// router.put("/toggle/:id", toggleTaskStatus);
// router.get("/user/:userId", getUserTasks);
// router.put("/approve/:id", protect, adminOnly, approveTask);
// router.put("/reassign/:id", protect, adminOnly, reassignTask);

// export default router;


// import express from "express";
// import {
//   createTask,
//   getTasks,
//   getMyTasks,
//   getTeamTasks,
//   toggleTaskStatus,
// } from "../controllers/taskController.js";

// const router = express.Router();

// router.post("/", createTask);
// router.get("/", getTasks);
// router.get("/my/:userId", getMyTasks);
// router.get("/team/:userId", getTeamTasks);
// router.put("/toggle/:id", toggleTaskStatus);

// export default router;