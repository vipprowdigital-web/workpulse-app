import express from "express";
import {
  addProject,
  getProjects,
  getProjectStatus,
} from "../controllers/projectController.js";

const router = express.Router();

router.post("/", addProject);
router.get("/", getProjects);
router.get("/status", getProjectStatus);

export default router;


// import express from "express";
// import {
//   addProject,
//   getProjects,
// } from "../controllers/projectController.js";

// const router = express.Router();

// router.post("/", addProject);
// router.get("/", getProjects);

// export default router;