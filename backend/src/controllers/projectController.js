import Project from "../models/Project.js";
import Task from "../models/Task.js";

// Add Project
export const addProject = async (req, res) => {
  try {
    const { name, team, dueDate, createdBy, assignedTo } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    if (!createdBy) {
      return res.status(400).json({ message: "createdBy is required" });
    }

    const assignedUsers = Array.isArray(assignedTo)
      ? assignedTo
      : assignedTo
        ? [assignedTo]
        : [];

    const project = await Project.create({
      name,
      team: team || null,
      dueDate: dueDate || null,
      assignedTo: assignedUsers,
      createdBy,
      companyId: req.user.companyId,
    });

    const populatedProject = await Project.findById(project._id)
      .populate({
        path: "team",
        populate: {
          path: "members",
          select: "name email mobileNo department",
        },
      })
      .populate("assignedTo", "name email mobileNo department")
      .populate("createdBy", "companyName email");

    res.status(201).json(populatedProject);
  } catch (error) {
    console.log("Error adding project:", error);
    res.status(500).json({ message: "Error adding project" });
  }
};

// Get Projects — Admin ko apni company ke projects dikhenge
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      companyId: req.user.companyId,
    })
      .populate({
        path: "team",
        populate: {
          path: "members",
          select: "name email mobileNo department",
        },
      })
      .populate("assignedTo", "name email mobileNo department")
      .populate("createdBy", "companyName email")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.log("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects" });
  }
};

// User ke assigned projects
export const getUserProjects = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    const projects = await Project.find({
      companyId: req.user.companyId,
      assignedTo: userId,
    })
      .populate({
        path: "team",
        populate: {
          path: "members",
          select: "name email mobileNo department",
        },
      })
      .populate("assignedTo", "name email mobileNo department")
      .populate("createdBy", "companyName email")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.log("Get user projects error:", error);
    res.status(500).json({ message: "Error fetching user projects" });
  }
};

// Project Status — sirf apni company ke
export const getProjectStatus = async (req, res) => {
  try {
    const projects = await Project.find({
      companyId: req.user.companyId,
    })
      .populate({
        path: "team",
        populate: {
          path: "members",
          select: "name email mobileNo department",
        },
      })
      .populate("assignedTo", "name email mobileNo department")
      .populate("createdBy", "companyName email")
      .sort({ createdAt: -1 });

    const result = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({
          project: project._id,
          companyId: req.user.companyId,
        })
          .populate({
            path: "team",
            populate: {
              path: "members",
              select: "name email mobileNo department",
            },
          })
          .populate("project")
          .populate("assignedTo", "name email mobileNo department")
          .populate("createdBy", "companyName email")
          .sort({ createdAt: -1 });

        const totalTasks = tasks.length;

        // ✅ Sirf admin approved task hi completed count hoga
        const completedTasks = tasks.filter(
          (task) => task.status === "Approved",
        ).length;

        // ✅ Pending me Pending + Completed(submitted but not approved) + Reassigned count honge
        const pendingTasks = tasks.filter(
          (task) =>
            task.status === "Pending" ||
            task.status === "Completed" ||
            task.status === "Reassigned",
        ).length;

        const completedPercent =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const pendingPercent =
          totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

        const pendingTaskList = tasks.filter(
          (task) =>
            task.status === "Pending" ||
            task.status === "Completed" ||
            task.status === "Reassigned",
        );

        const completedTaskList = tasks.filter(
          (task) => task.status === "Approved",
        );

        return {
          _id: project._id,
          name: project.name,
          dueDate: project.dueDate || null,
          team: project.team,
          assignedTo: project.assignedTo,
          createdBy: project.createdBy,

          totalTasks,

          completedTasks,
          pendingTasks,

          completedPercent,
          pendingPercent,

          pendingTaskList,
          completedTaskList,

          tasks,
        };
      }),
    );

    res.json(result);
  } catch (error) {
    console.log("Error fetching project status:", error);
    res.status(500).json({ message: "Error fetching project status" });
  }
};

// import Project from "../models/Project.js";
// import Task from "../models/Task.js";

// // Add Project
// export const addProject = async (req, res) => {
//   try {
//     const { name, team, dueDate, createdBy } = req.body;

//     if (!name) {
//       return res.status(400).json({ message: "Project name is required" });
//     }

//     if (!createdBy) {
//       return res.status(400).json({ message: "createdBy is required" });
//     }

//     const project = await Project.create({
//       name,
//       team: team || null,
//       dueDate: dueDate || null,
//       createdBy,
//     });

//     const populatedProject = await Project.findById(project._id)
//       .populate({
//         path: "team",
//         populate: {
//           path: "members",
//           select: "name email mobileNo department",
//         },
//       })
//       .populate("createdBy", "companyName email");

//     res.status(201).json(populatedProject);
//   } catch (error) {
//     console.log("Error adding project:", error);
//     res.status(500).json({ message: "Error adding project" });
//   }
// };

// // Get Projects
// export const getProjects = async (req, res) => {
//   try {
//     const projects = await Project.find()
//       .populate({
//         path: "team",
//         populate: {
//           path: "members",
//           select: "name email mobileNo department",
//         },
//       })
//       .populate("createdBy", "companyName email")
//       .sort({ createdAt: -1 });

//     res.json(projects);
//   } catch (error) {
//     console.log("Error fetching projects:", error);
//     res.status(500).json({ message: "Error fetching projects" });
//   }
// };

// // Project Status
// export const getProjectStatus = async (req, res) => {
//   try {
//     const projects = await Project.find()
//       .populate({
//         path: "team",
//         populate: {
//           path: "members",
//           select: "name email mobileNo department",
//         },
//       })
//       .populate("createdBy", "companyName email")
//       .sort({ createdAt: -1 });

//     const result = await Promise.all(
//       projects.map(async (project) => {
//         const tasks = await Task.find({ project: project._id })
//           .populate({
//             path: "team",
//             populate: {
//               path: "members",
//               select: "name email mobileNo department",
//             },
//           })
//           .populate("project")
//           .populate("assignedTo", "name email mobileNo department")
//           .populate("createdBy", "companyName email")
//           .sort({ createdAt: -1 });

//         const totalTasks = tasks.length;
//         const completedTasks = tasks.filter(
//           (task) => task.status === "Completed"
//         ).length;
//         const pendingTasks = tasks.filter(
//           (task) => task.status === "Pending"
//         ).length;

//         const completedPercent =
//           totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

//         const pendingPercent =
//           totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

//         return {
//           _id: project._id,
//           name: project.name,
//           dueDate: project.dueDate || null,
//           team: project.team,
//           createdBy: project.createdBy,
//           totalTasks,
//           completedTasks,
//           pendingTasks,
//           completedPercent,
//           pendingPercent,
//           tasks,
//         };
//       })
//     );

//     res.json(result);
//   } catch (error) {
//     console.log("Error fetching project status:", error);
//     res.status(500).json({ message: "Error fetching project status" });
//   }
// };

// import Project from "../models/Project.js";

// // ✅ Add Project
// export const addProject = async (req, res) => {
//   try {
//     const { name } = req.body;

//     const project = await Project.create({ name });

//     res.status(201).json(project);
//   } catch (error) {
//     res.status(500).json({ message: "Error adding project" });
//   }
// };

// // ✅ Get Projects
// export const getProjects = async (req, res) => {
//   const projects = await Project.find();
//   res.json(projects);
// };
