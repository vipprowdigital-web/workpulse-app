import express from "express";
import { addTeam, getTeams } from "../controllers/teamController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 PROTECTED
router.post("/", protect, adminOnly, addTeam);
router.get("/", protect, adminOnly, getTeams);

export default router;



// import express from "express";
// import { addTeam, getTeams } from "../controllers/teamController.js";

// const router = express.Router();

// router.post("/", addTeam);
// router.get("/", getTeams);

// export default router;


// import express from "express";
// import { addTeam, getTeams } from "../controllers/teamController.js";

// const router = express.Router();

// router.post("/", addTeam);
// router.get("/", getTeams);

// export default router;