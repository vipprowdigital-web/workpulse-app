

import Task from "../models/Task.js";

// 1. Create Task
export const createTask = async (req, res) => {
  try {
    const { team, project, title, assignedTo, status, taskType, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const assignedUsers = Array.isArray(assignedTo) ? assignedTo : assignedTo ? [assignedTo] : [];

    if ((taskType || "team") !== "my" && assignedUsers.length === 0) {
      return res.status(400).json({ message: "At least one assigned user is required" });
    }

    const task = await Task.create({
      companyId: req.user.companyId,
      team: team || null,
      project: project || null,
      title,
      dueDate: dueDate || null,
      assignedTo: taskType === "my" ? [] : assignedUsers,
      userProgress: taskType === "my" ? [] : assignedUsers.map((userId) => ({
        user: userId,
        status: "Pending",
      })),
      createdBy: req.user.id, // Authenticated user id
      status: status || "Pending",
      taskType: taskType || "team",
    });

    const populatedTask = await Task.findById(task._id)
      .populate({
        path: "team",
        populate: { path: "members", select: "name email mobileNo department" },
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

// 2. Get Admin Created Active Team Tasks
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      companyId: req.user.companyId,
      createdBy: req.user.id, // Strictly filter by logged-in user/admin
      taskType: "team",
    })
      .populate({
        path: "team",
        populate: { path: "members", select: "name email mobileNo department" },
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

// 3. Admin Assigned Task History (Strictly for this Admin)
export const getAssignedTaskHistory = async (req, res) => {
  try {
    const tasks = await Task.find({
      companyId: req.user.companyId,
      createdBy: req.user.id, // Security Filter: Jo admin login h sirf uske tasks
      taskType: "team",
    })
      .populate({
        path: "team",
        populate: { path: "members", select: "name email mobileNo department" },
      })
      .populate("project")
      .populate("assignedTo", "name email mobileNo department")
      .populate("createdBy", "companyName email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.log("Error fetching history:", error);
    res.status(500).json({ message: "Error fetching assigned task history" });
  }
};

// 4. Get Admin Personal "My" Tasks
export const getMyTasks = async (req, res) => {
  try {
    // Agar URL me params na ho toh login middleware se id nikal lo fallback ke liye
    const userId = req.params.userId || req.params.adminId || req.user.id;

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

// 5. Admin Review Feed (Strict Filter)
export const getCompletedTasksFeed = async (req, res) => {
  try {
    const tasks = await Task.find({
      companyId: req.user.companyId,
      createdBy: req.user.id, // Sirf login admin ke diye hue tasks
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

// 6. Get Team Tasks
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
    res.status(500).json({ message: "Error fetching team tasks" });
  }
};

// 7. Toggle Task Status (User Side)
export const toggleTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userDescription = req.body?.userDescription || "";
    const task = await Task.findById(id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.taskType === "my") {
      task.status = (task.status === "Pending" || task.status === "Reassigned") ? "Completed" : "Pending";
      task.userDescription = task.status === "Completed" ? userDescription : "";
      await task.save();
      const updatedTask = await Task.findById(id).populate("project").populate("assignedTo", "name").populate("team", "name").populate("createdBy", "companyName email");
      return res.json(updatedTask);
    }

    const currentUserId = req.user.id;
    let userProgressIndex = task.userProgress.findIndex((p) => p.user.toString() === currentUserId);

    if (userProgressIndex === -1) {
      const isAssigned = task.assignedTo.some((uid) => uid.toString() === currentUserId);
      if (!isAssigned) return res.status(403).json({ message: "This task is not assigned to you" });
      task.userProgress.push({ user: currentUserId, status: "Pending" });
      userProgressIndex = task.userProgress.length - 1;
    }

    let progress = task.userProgress[userProgressIndex];
    if (progress.status === "Pending" || progress.status === "Reassigned") {
      progress.status = "Completed";
      progress.userDescription = userDescription;
      progress.submittedAt = new Date();
    } else {
      progress.status = "Pending";
      progress.userDescription = "";
      progress.submittedAt = null;
    }

    // Checking final statuses
    const allUsersApproved = task.userProgress.every((p) => p.status === "Approved");
    const allUsersSubmitted = task.userProgress.every((p) => p.status === "Completed" || p.status === "Approved");

    if (allUsersApproved) task.status = "Approved";
    else if (allUsersSubmitted) task.status = "Completed";
    else task.status = "Pending";

    // Mongoose array tracking save fix
    task.markModified('userProgress');
    await task.save();

    const updatedTask = await Task.findById(id)
      .populate("project")
      .populate("assignedTo", "name email")
      .populate("team", "name")
      .populate("createdBy", "companyName email")
      .populate("userProgress.user", "name email");

    const obj = updatedTask.toObject();
    const myProgress = obj.userProgress?.find((p) => p.user?._id?.toString() === currentUserId);

    res.json({
      ...obj,
      status: myProgress?.status || obj.status,
      userDescription: myProgress?.userDescription || "",
      adminNote: myProgress?.adminNote || "",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating status" });
  }
};

// 8. User Own Tasks
export const getUserTasks = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const tasks = await Task.find({ companyId: req.user.companyId, assignedTo: userId })
      .populate("project", "name")
      .populate("assignedTo", "name")
      .populate("team", "name")
      .populate("userProgress.user", "name")
      .sort({ createdAt: -1 });

    const userWiseTasks = tasks.map((task) => {
      const obj = task.toObject();
      const myProgress = obj.userProgress?.find((p) => p.user?._id?.toString() === userId);
      return {
        ...obj,
        status: myProgress?.status || obj.status,
        userDescription: myProgress?.userDescription || "",
        adminNote: myProgress?.adminNote || "",
      };
    });
    res.json(userWiseTasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user tasks" });
  }
};

// 9. Reassign Task
export const reassignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    if (!adminNote?.trim()) return res.status(400).json({ message: "Admin note is required" });

    const task = await Task.findOneAndUpdate(
      { _id: id, companyId: req.user.companyId },
      { status: "Reassigned", adminNote: adminNote.trim() },
      { returnDocument: "after" }
    ).populate("assignedTo", "name").populate("project", "name").populate("team", "name");

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Reassign failed" });
  }
};

// 10. Approve Task
export const approveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndUpdate(
      { _id: id, companyId: req.user.companyId },
      { status: "Approved", adminNote: "" },
      { returnDocument: "after" }
    ).populate("assignedTo", "name").populate("project", "name").populate("team", "name");

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Approve failed" });
  }
};

// 11. Create Self Task
export const createSelfTask = async (req, res) => {
  try {
    const { title, dueDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Title required" });

    const task = await Task.create({
      title: title.trim(),
      dueDate: dueDate || null,
      companyId: req.user.companyId,
      createdBy: req.user.id,
      assignedTo: [],
      userProgress: [],
      taskType: "my",
      status: "Pending",
      team: null,
      project: null,
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Task create nahi hua" });
  }
};

// import Task from "../models/Task.js";

// // Create Task
// export const createTask = async (req, res) => {
//   try {
//     console.log("REQ USER:", req.user);
//     console.log("REQ BODY:", req.body);

//     const { team, project, title, assignedTo, status, taskType, dueDate } =
//       req.body;

//     if (!title) {
//       return res.status(400).json({
//         message: "Title is required",
//       });
//     }

//     const assignedUsers = Array.isArray(assignedTo)
//       ? assignedTo
//       : assignedTo
//         ? [assignedTo]
//         : [];

//     if ((taskType || "team") !== "my" && assignedUsers.length === 0) {
//       return res.status(400).json({
//         message: "At least one assigned user is required",
//       });
//     }

//     const task = await Task.create({
//       companyId: req.user.companyId,
//       team: team || null,
//       project: project || null,
//       title,
//       dueDate: dueDate || null,
//       assignedTo: taskType === "my" ? [] : assignedUsers,

//       userProgress:
//         taskType === "my"
//           ? []
//           : assignedUsers.map((userId) => ({
//               user: userId,
//               status: "Pending",
//             })),

//       // frontend se createdBy mat lo
//       createdBy: req.user.id,

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
//       .populate("createdBy", "companyName email");

//     res.status(201).json(populatedTask);
//   } catch (error) {
//     console.log("Error creating task:", error);
//     res.status(500).json({ message: "Error creating task" });
//   }
// };

// // Get All Tasks
// export const getTasks = async (req, res) => {
//   try {
//     console.log("GET TASKS USER:", req.user);
//     console.log("GET TASKS COMPANY ID:", req.user.companyId);

//     const tasks = await Task.find({
//       companyId: req.user.companyId,
//       createdBy: req.user.id,
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
//       .populate("createdBy", "companyName email")
//       .sort({ createdAt: -1 });

//     res.json(tasks);
//   } catch (error) {
//     console.log("Error fetching tasks:", error);
//     res.status(500).json({ message: "Error fetching tasks" });
//   }
// };

// // Admin Assigned Task History
// export const getAssignedTaskHistory = async (req, res) => {
//   try {
//     console.log("HISTORY ADMIN USER:", req.user);

//     const tasks = await Task.find({
//       companyId: req.user.companyId,
//       createdBy: req.user.id,
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
//       .populate("createdBy", "companyName email")
//       .sort({ createdAt: -1 });

//     console.log("HISTORY TASK COUNT:", tasks.length);

//     res.json(tasks);
//   } catch (error) {
//     console.log("Error fetching assigned task history:", error);
//     res.status(500).json({ message: "Error fetching assigned task history" });
//   }
// };

// // Get My Tasks
// // export const getMyTasks = async (req, res) => {
// //   try {
// //     const { userId } = req.params;

// //     const tasks = await Task.find({
// //       companyId: req.user.companyId,
// //       createdBy: userId,
// //       taskType: "my",
// //     })
// //       .populate("project")
// //       .populate("assignedTo", "name email mobileNo department")
// //       .populate("team", "name")
// //       .populate("createdBy", "companyName email")
// //       .sort({ createdAt: -1 });

// //     res.json(tasks);
// //   } catch (error) {
// //     console.log("Error fetching my tasks:", error);
// //     res.status(500).json({ message: "Error fetching my tasks" });
// //   }
// // };

// // Get Team Tasks
// export const getTeamTasks = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const tasks = await Task.find({
//       companyId: req.user.companyId,
//       createdBy: userId,
//       taskType: "team",
//     })
//       .populate("project")
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("team", "name")
//       .populate("createdBy", "companyName email")
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
//     const userDescription = req.body?.userDescription || "";

//     const task = await Task.findById(id);

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     // Admin self task ke liye old flow same rahega
//     if (task.taskType === "my") {
//       if (task.status === "Pending" || task.status === "Reassigned") {
//         task.status = "Completed";
//         task.userDescription = userDescription;
//       } else {
//         task.status = "Pending";
//         task.userDescription = "";
//       }

//       await task.save();

//       const updatedTask = await Task.findById(id)
//         .populate("project")
//         .populate("assignedTo", "name email mobileNo department")
//         .populate("team", "name")
//         .populate("createdBy", "companyName email");

//       return res.json(updatedTask);
//     }

//     const currentUserId = req.user.id;

//     let userProgress = task.userProgress.find(
//       (progress) => progress.user.toString() === currentUserId,
//     );

//     // Old tasks ke liye fallback, agar userProgress pehle se nahi bana hai
//     if (!userProgress) {
//       const isAssigned = task.assignedTo.some(
//         (userId) => userId.toString() === currentUserId,
//       );

//       if (!isAssigned) {
//         return res.status(403).json({
//           message: "This task is not assigned to you",
//         });
//       }

//       task.userProgress.push({
//         user: currentUserId,
//         status: "Pending",
//       });

//       userProgress = task.userProgress.find(
//         (progress) => progress.user.toString() === currentUserId,
//       );
//     }

//     if (
//       userProgress.status === "Pending" ||
//       userProgress.status === "Reassigned"
//     ) {
//       userProgress.status = "Completed";
//       userProgress.userDescription = userDescription;
//       userProgress.submittedAt = new Date();
//     } else if (userProgress.status === "Completed") {
//       userProgress.status = "Pending";
//       userProgress.userDescription = "";
//       userProgress.submittedAt = null;
//     }

//     const allUsersSubmitted = task.userProgress.every(
//       (progress) =>
//         progress.status === "Completed" || progress.status === "Approved",
//     );

//     const allUsersApproved = task.userProgress.every(
//       (progress) => progress.status === "Approved",
//     );

//     if (allUsersApproved) {
//       task.status = "Approved";
//     } else if (allUsersSubmitted) {
//       task.status = "Completed";
//     } else {
//       task.status = "Pending";
//     }

//     await task.save();

//     const updatedTask = await Task.findById(id)
//       .populate("project")
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("team", "name")
//       .populate("createdBy", "companyName email")
//       .populate("userProgress.user", "name email mobileNo department");

//     const obj = updatedTask.toObject();

//     const myProgress = obj.userProgress?.find(
//       (progress) => progress.user?._id?.toString() === currentUserId,
//     );

//     res.json({
//       ...obj,
//       status: myProgress?.status || obj.status,
//       userDescription: myProgress?.userDescription || "",
//       adminNote: myProgress?.adminNote || "",
//       submittedAt: myProgress?.submittedAt || null,
//       approvedAt: myProgress?.approvedAt || null,
//     });
//   } catch (error) {
//     console.log("Error updating task status:", error);
//     res.status(500).json({ message: "Error updating task status" });
//   }
// };
// // export const toggleTaskStatus = async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { userDescription } = req.body;

// //     const task = await Task.findOne({
// //       _id: id,
// //       companyId: req.user.companyId,
// //     });

// //     if (!task) {
// //       return res.status(404).json({ message: "Task not found" });
// //     }

// //     if (task.status === "Pending" || task.status === "Reassigned") {
// //       task.status = "Completed";
// //       task.userDescription = userDescription || "";
// //     } else {
// //       task.status = "Pending";
// //       task.userDescription = "";
// //     }

// //     await task.save();

// //     const updatedTask = await Task.findById(id)
// //       .populate("project")
// //       .populate("assignedTo", "name email mobileNo department")
// //       .populate("team", "name")
// //       .populate("createdBy", "companyName email");

// //     res.json(updatedTask);
// //   } catch (error) {
// //     console.log("Error updating task status:", error);
// //     res.status(500).json({ message: "Error updating task status" });
// //   }
// // };

// // User Own Tasks
// // User Own Tasks
// export const getUserTasks = async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     if (!userId) {
//       return res.status(400).json({ message: "userId required" });
//     }

//     const tasks = await Task.find({
//       companyId: req.user.companyId,
//       assignedTo: userId,
//     })
//       .populate("project", "name")
//       .populate("assignedTo", "name")
//       .populate("team", "name")
//       .populate("userProgress.user", "name email mobileNo department")
//       .sort({ createdAt: -1 });

//     const userWiseTasks = tasks.map((task) => {
//       const obj = task.toObject();

//       const myProgress = obj.userProgress?.find(
//         (progress) => progress.user?._id?.toString() === userId,
//       );

//       return {
//         ...obj,
//         status: myProgress?.status || obj.status,
//         userDescription: myProgress?.userDescription || "",
//         adminNote: myProgress?.adminNote || "",
//         submittedAt: myProgress?.submittedAt || null,
//         approvedAt: myProgress?.approvedAt || null,
//       };
//     });

//     res.json(userWiseTasks);
//   } catch (error) {
//     console.log("Get user tasks error:", error);
//     res.status(500).json({ message: "Error fetching user tasks" });
//   }
// };

// // Admin Review Feed
// export const getCompletedTasksFeed = async (req, res) => {
//   try {
//     const tasks = await Task.find({
//       companyId: req.user.companyId,
//       createdBy: req.user.id,
//       taskType: "team",
//       status: { $in: ["Completed", "Pending", "Reassigned"] },
//     })
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("project", "name")
//       .populate("team", "name")
//       .populate("createdBy", "companyName email")
//       .sort({ updatedAt: -1 });

//     res.json(tasks);
//   } catch (error) {
//     console.log("Error fetching completed feed:", error);
//     res.status(500).json({ message: "Error fetching task feed" });
//   }
// };

// // Reassign Task
// export const reassignTask = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { adminNote } = req.body;

//     if (!adminNote || !adminNote.trim()) {
//       return res.status(400).json({
//         message: "Admin note is required for reassign",
//       });
//     }

//     const task = await Task.findOneAndUpdate(
//       {
//         _id: id,
//         companyId: req.user.companyId,
//       },
//       {
//         status: "Reassigned",
//         adminNote: adminNote.trim(),
//       },
//       { returnDocument: "after" },
//     )
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("project", "name")
//       .populate("team", "name");

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     res.json(task);
//   } catch (err) {
//     console.log("Reassign error:", err);
//     res.status(500).json({ message: "Reassign failed" });
//   }
// };

// // Approve Task
// export const approveTask = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const task = await Task.findOneAndUpdate(
//       {
//         _id: id,
//         companyId: req.user.companyId,
//       },
//       {
//         status: "Approved",
//         adminNote: "",
//       },
//       { returnDocument: "after" },
//     )
//       .populate("assignedTo", "name email mobileNo department")
//       .populate("project", "name")
//       .populate("team", "name");

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     res.json(task);
//   } catch (err) {
//     console.log("Approve error:", err);
//     res.status(500).json({ message: "Approve failed" });
//   }
// };

// export const createSelfTask = async (req, res) => {
//   try {
//     const { title, dueDate } = req.body;

//     if (!title || !title.trim()) {
//       return res.status(400).json({ message: "Title required" });
//     }

//     const task = await Task.create({
//       title: title.trim(),
//       dueDate: dueDate || null,
//       companyId: req.user.companyId,
//       createdBy: req.user.id,
//       assignedTo: [],
//       userProgress: [],
//       taskType: "my",
//       status: "Pending",
//       team: null,
//       project: null,
//     });

//     res.status(201).json(task);
//   } catch (error) {
//     console.log("Create self task error:", error);
//     res.status(500).json({ message: "Task create nahi hua" });
//   }
// };

// // ════════════════════════════════════════════════════
// // taskRoutes.js mein YE LINE ADD KARO
// // ════════════════════════════════════════════════════

// // import { ..., createSelfTask } from "../controllers/taskController.js";

// // router.post("/self", protect, adminOnly, createSelfTask);

// // ════════════════════════════════════════════════════
// // NOTE: /api/task/my/:adminId route already exist
// // karta hai aapke paas — vo GET karta hai taskType:"my"
// // wale tasks jo createdBy = adminId ho
// // Agar nahi hai to ye bhi add karo:
// // ════════════════════════════════════════════════════
// export const getMyTasks = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.params.adminId;

//     const tasks = await Task.find({
//       createdBy: userId,
//       companyId: req.user.companyId,
//       taskType: "my",
//     })
//       .populate("project", "name")
//       .sort({ createdAt: -1 });

//     res.status(200).json(tasks);
//   } catch (error) {
//     console.log("Get my tasks error:", error);
//     res.status(500).json({ message: "Tasks fetch nahi hue" });
//   }
// };

