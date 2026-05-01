import express from "express";
import {
  createDepartment,
  getDepartments,
} from "../controllers/departmentController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, adminOnly, createDepartment);
router.get("/", protect, adminOnly, getDepartments);

export default router;