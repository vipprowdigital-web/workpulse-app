import express from "express";
import { addUser, loginUser, getUsers,getMyProfile } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔓 PUBLIC
router.post("/login", loginUser);

// 🔒 PROTECTED (admin only)
router.post("/add-user", protect, adminOnly, addUser);
// router.get("/getusers", protect, adminOnly, getUsers);
router.get("/", protect, adminOnly, getUsers);
router.get("/me", protect, getMyProfile);

export default router;


// import express from "express";
// import { addUser, loginUser, getUsers } from "../controllers/userController.js";

// const router = express.Router();

// router.post("/add-user", addUser);
// router.post("/login", loginUser);
// router.get("/getusers", getUsers);

// export default router;