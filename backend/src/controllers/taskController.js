import Task from "../models/Task.js";

// Create Task
export const createTask = async (req, res) => {
  try {
    const {
      team,
      project,
      title,
      assignedTo,
      createdBy,
      status,
      taskType,
      dueDate,
    } = req.body;

    if (!title || !createdBy) {
      return res.status(400).json({
        message: "Title and createdBy are required",
      });
    }

    if (taskType !== "my" && !assignedTo) {
      return res.status(400).json({
        message: "Assigned user is required",
      });
    }

    const task = await Task.create({
      companyId: req.user.companyId,
      team: team || null,
      project: project || null,
      title,
      dueDate: dueDate || null,
      assignedTo: taskType === "my" ? null : assignedTo,
      createdBy,
      status: status || "Pending",
      taskType: taskType || "team",
    });

    const populatedTask = await Task.findById(task._id)
      .populate({
        path: "team",
        populate: {
          path: "members",
          select: "name email mobileNo department",
        },
      })
      .populate("project")
      .populate("assignedTo", "name email mobileNo department")
      .populate("createdBy", "companyName email");

    res.status(201).json(populatedTask);
  } catch (error) {
    console.log("Error creating task:", error);
    res.status(500).json({ message: "Error creating task" });
  }
};

// Get All Tasks
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ companyId: req.user.companyId })
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

    res.json(tasks);
  } catch (error) {
    console.log("Error fetching tasks:", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

// Get My Tasks
// export const getMyTasks = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const tasks = await Task.find({
//       companyId: req.user.companyId,
//       createdBy: userId,
//       taskType: "my",
//     })
//       .populate("project")
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("team", "name")
//       .populate("createdBy", "companyName email")
//       .sort({ createdAt: -1 });

//     res.json(tasks);
//   } catch (error) {
//     console.log("Error fetching my tasks:", error);
//     res.status(500).json({ message: "Error fetching my tasks" });
//   }
// };

// Get Team Tasks
export const getTeamTasks = async (req, res) => {
  try {
    const { userId } = req.params;

    const tasks = await Task.find({
      companyId: req.user.companyId,
      createdBy: userId,
      taskType: "team",
    })
      .populate("project")
      .populate("assignedTo", "name email mobileNo department")
      .populate("team", "name")
      .populate("createdBy", "companyName email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.log("Error fetching team tasks:", error);
    res.status(500).json({ message: "Error fetching team tasks" });
  }
};

// Toggle Task Status
export const toggleTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    // YE FIX — req.body undefined ho to crash na ho
    console.log("User: ", req.body);
    
    const userDescription = req.body?.userDescription || "";
   const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status === "Pending" || task.status === "Reassigned") {
      task.status = "Completed";
      task.userDescription = userDescription;
    } else {
      task.status = "Pending";
      task.userDescription = "";
    }

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate("project")
      .populate("assignedTo", "name email mobileNo department")
      .populate("team", "name")
      .populate("createdBy", "companyName email");

    res.json(updatedTask);
  } catch (error) {
    console.log("Error updating task status:", error);
    res.status(500).json({ message: "Error updating task status" });
  }
};
// export const toggleTaskStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userDescription } = req.body;

//     const task = await Task.findOne({
//       _id: id,
//       companyId: req.user.companyId,
//     });

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     if (task.status === "Pending" || task.status === "Reassigned") {
//       task.status = "Completed";
//       task.userDescription = userDescription || "";
//     } else {
//       task.status = "Pending";
//       task.userDescription = "";
//     }

//     await task.save();

//     const updatedTask = await Task.findById(id)
//       .populate("project")
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("team", "name")
//       .populate("createdBy", "companyName email");

//     res.json(updatedTask);
//   } catch (error) {
//     console.log("Error updating task status:", error);
//     res.status(500).json({ message: "Error updating task status" });
//   }
// };

// User Own Tasks
export const getUserTasks = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    const tasks = await Task.find({ assignedTo: userId })
      .populate("project", "name")
      .populate("assignedTo", "name")
      .populate("team", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.log("Get user tasks error:", error);
    res.status(500).json({ message: "Error fetching user tasks" });
  }
};

// Admin Review Feed
export const getCompletedTasksFeed = async (req, res) => {
  try {
    const tasks = await Task.find({
      companyId: req.user.companyId,
      taskType: "team",
      status: { $in: ["Completed", "Pending", "Reassigned"] },
    })
      .populate("assignedTo", "name email mobileNo department")
      .populate("project", "name")
      .populate("team", "name")
      .populate("createdBy", "companyName email")
      .sort({ updatedAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.log("Error fetching completed feed:", error);
    res.status(500).json({ message: "Error fetching task feed" });
  }
};

// Reassign Task
export const reassignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    if (!adminNote || !adminNote.trim()) {
      return res.status(400).json({
        message: "Admin note is required for reassign",
      });
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: id,
        companyId: req.user.companyId,
      },
      {
        status: "Reassigned",
        adminNote: adminNote.trim(),
      },
      { returnDocument: "after" }
    )
      .populate("assignedTo", "name email mobileNo department")
      .populate("project", "name")
      .populate("team", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (err) {
    console.log("Reassign error:", err);
    res.status(500).json({ message: "Reassign failed" });
  }
};

// Approve Task
export const approveTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndUpdate(
      {
        _id: id,
        companyId: req.user.companyId,
      },
      {
        status: "Approved",
        adminNote: "",
      },
      { returnDocument: "after" }
    )
      .populate("assignedTo", "name email mobileNo department")
      .populate("project", "name")
      .populate("team", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (err) {
    console.log("Approve error:", err);
    res.status(500).json({ message: "Approve failed" });
  }
};
export const createSelfTask = async (req, res) => {
  try {
    const { title, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title required" });
    }

    const task = await Task.create({
      title: title.trim(),
      dueDate: dueDate || null,
      companyId: req.user.companyId,   // JWT se aata hai
      createdBy: req.user.id,          // admin ka _id
      assignedTo: null,                // khud k liye, kisi user ko assign nahi
      taskType: "my",                  // "my" type
      status: "Pending",
      team: null,
      project: null,
    });

    res.status(201).json(task);
  } catch (error) {
    console.log("Create self task error:", error);
    res.status(500).json({ message: "Task create nahi hua" });
  }
};


// ════════════════════════════════════════════════════
// taskRoutes.js mein YE LINE ADD KARO
// ════════════════════════════════════════════════════

// import { ..., createSelfTask } from "../controllers/taskController.js";

// router.post("/self", protect, adminOnly, createSelfTask);


// ════════════════════════════════════════════════════
// NOTE: /api/task/my/:adminId route already exist
// karta hai aapke paas — vo GET karta hai taskType:"my"
// wale tasks jo createdBy = adminId ho
// Agar nahi hai to ye bhi add karo:
// ════════════════════════════════════════════════════
export const getMyTasks = async (req, res) => {
  try {
    const userId = req.params.userId || req.params.adminId;

    const tasks = await Task.find({
      createdBy: userId,
      companyId: req.user.companyId,
      taskType: "my",
    })
    .populate("project", "name")
    .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.log("Get my tasks error:", error);
    res.status(500).json({ message: "Tasks fetch nahi hue" });
  }
};




// import Task from "../models/Task.js";

// // Create Task
// export const createTask = async (req, res) => {
//   try {
//     const {
//       team,
//       project,
//       title,
//       assignedTo,
//       createdBy,
//       status,
//       taskType,
//       dueDate,
//     } = req.body;

//     if (!title || !createdBy) {
//       return res.status(400).json({
//         message: "Title and createdBy are required",
//       });
//     }

//     const task = await Task.create({
//       team: team || null,
//       project: project || null,
//       title,
//       dueDate: dueDate || null,
//       assignedTo: taskType === "my" ? null : assignedTo || null,
//       createdBy,
//       status: status || "Pending",
//       taskType: taskType || "team",
//     });

//     const populatedTask = await Task.findById(task._id)
//       .populate({
//         path: "team",
//         populate: {
//           path: "members",
//           select: "name email mobileNo department",
//         },
//       })
//       .populate("project")
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("createdBy", "name email mobileNo department");

//     res.status(201).json(populatedTask);
//   } catch (error) {
//     console.log("Error creating task:", error);
//     res.status(500).json({ message: "Error creating task" });
//   }
// };

// // Get All Tasks
// export const getTasks = async (req, res) => {
//   try {
//     const tasks = await Task.find()
//       .populate({
//         path: "team",
//         populate: {
//           path: "members",
//           select: "name email mobileNo department",
//         },
//       })
//       .populate("project")
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("createdBy", "name email mobileNo department")
//       .sort({ createdAt: -1 });

//     res.json(tasks);
//   } catch (error) {
//     console.log("Error fetching tasks:", error);
//     res.status(500).json({ message: "Error fetching tasks" });
//   }
// };

// // Get My Tasks
// export const getMyTasks = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const tasks = await Task.find({
//       createdBy: userId,
//       taskType: "my",
//     })
//       .populate({
//         path: "team",
//         populate: {
//           path: "members",
//           select: "name email mobileNo department",
//         },
//       })
//       .populate("project")
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("createdBy", "name email mobileNo department")
//       .sort({ createdAt: -1 });

//     res.json(tasks);
//   } catch (error) {
//     console.log("Error fetching my tasks:", error);
//     res.status(500).json({ message: "Error fetching my tasks" });
//   }
// };

// // Get Team Tasks
// export const getTeamTasks = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const tasks = await Task.find({
//       createdBy: userId,
//       taskType: "team",
//     })
//       .populate({
//         path: "team",
//         populate: {
//           path: "members",
//           select: "name email mobileNo department",
//         },
//       })
//       .populate("project")
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("createdBy", "name email mobileNo department")
//       .sort({ createdAt: -1 });

//     res.json(tasks);
//   } catch (error) {
//     console.log("Error fetching team tasks:", error);
//     res.status(500).json({ message: "Error fetching team tasks" });
//   }
// };

// // Toggle Task Status
// export const toggleTaskStatus = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const task = await Task.findById(id);

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     task.status = task.status === "Pending" ? "Completed" : "Pending";
//     await task.save();

//     const updatedTask = await Task.findById(id)
//       .populate({
//         path: "team",
//         populate: {
//           path: "members",
//           select: "name email mobileNo department",
//         },
//       })
//       .populate("project")
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("createdBy", "name email mobileNo department");

//     res.json(updatedTask);
//   } catch (error) {
//     console.log("Error updating task status:", error);
//     res.status(500).json({ message: "Error updating task status" });
//   }
// };

// //only user can see own task
// export const getUserTasks = async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     const tasks = await Task.find({ assignedTo: userId })
//       .populate("project", "name")
//       .populate("assignedTo", "name")
//       .sort({ createdAt: -1 });

//     res.json(tasks);
//   } catch (error) {
//     console.log("Get user tasks error:", error);
//     res.status(500).json({ message: "Error fetching user tasks" });
//   }
// };

// //reaasigned task api

// export const reassignTask = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { adminNote } = req.body;

//     const task = await Task.findByIdAndUpdate(
//       id,
//       {
//         status: "Reassigned",
//         adminNote,
//       },
//       { new: true }
//     );

//     res.json(task);
//   } catch (err) {
//     res.status(500).json({ message: "Reassign failed" });
//   }
// };


// //approved task api 

// export const approveTask = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const task = await Task.findByIdAndUpdate(
//       id,
//       {
//         status: "Approved",
//         adminNote: "",
//       },
//       { new: true }
//     );

//     res.json(task);
//   } catch (err) {
//     res.status(500).json({ message: "Approve failed" });
//   }
// };

// import Task from "../models/Task.js";

// // ✅ Create Task
// export const createTask = async (req, res) => {
//   try {
//     const {
//       team,
//       project,
//       title,
//       assignedTo,
//       createdBy,
//       status,
//       taskType,
//     } = req.body;

//     const task = await Task.create({
//       team,
//       project,
//       title,
//       assignedTo: taskType === "my" ? null : assignedTo,
//       createdBy,
//       status,
//       taskType,
//     });

//     res.status(201).json(task);
//   } catch (error) {
//     res.status(500).json({ message: "Error creating task" });
//   }
// };

// // ✅ Get All Tasks
// export const getTasks = async (req, res) => {
//   try {
//     const tasks = await Task.find()
//       .populate("team")
//       .populate("project")
//       .populate("assignedTo", "name email")
//       .populate("createdBy", "name email");

//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching tasks" });
//   }
// };

// // ✅ Admin ke personal tasks
// export const getMyTasks = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const tasks = await Task.find({
//       createdBy: userId,
//       taskType: "my",
//     })
//       .populate("team")
//       .populate("project")
//       .populate("assignedTo", "name email")
//       .populate("createdBy", "name email")
//       .sort({ createdAt: -1 });

//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching my tasks" });
//   }
// };

// // ✅ Admin ke diye hue team tasks
// export const getTeamTasks = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const tasks = await Task.find({
//       createdBy: userId,
//       taskType: "team",
//     })
//       .populate("team")
//       .populate("project")
//       .populate("assignedTo", "name email")
//       .populate("createdBy", "name email")
//       .sort({ createdAt: -1 });

//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching team tasks" });
//   }
// };

// // ✅ Toggle Task Status
// export const toggleTaskStatus = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const task = await Task.findById(id);

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     task.status = task.status === "Pending" ? "Completed" : "Pending";
//     await task.save();

//     const updatedTask = await Task.findById(id)
//       .populate("team")
//       .populate("project")
//       .populate("assignedTo", "name email")
//       .populate("createdBy", "name email");

//     res.json(updatedTask);
//   } catch (error) {
//     res.status(500).json({ message: "Error updating task status" });
//   }
// };