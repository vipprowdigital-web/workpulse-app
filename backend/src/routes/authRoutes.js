import express from "express";
import { adminSignup, adminLogin, getAdminProfile, getAllAdmins } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.get("/admins", getAllAdmins);
router.get("/me", protect, getAdminProfile);

export default router;