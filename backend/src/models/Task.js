import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    // ✅ FIXED: Sirf ek status field — sabhi states cover karta hai
    status: {
      type: String,
      enum: ["Pending", "Completed", "Approved", "Reassigned"],
      default: "Pending",
    },

    // ✅ User ne task complete karte waqt jo description likha
    userDescription: {
      type: String,
      default: "",
    },

    // ✅ Admin ne review mein jo note likha (reassign ke time)
    adminNote: {
      type: String,
      default: "",
    },

    taskType: {
      type: String,
      enum: ["my", "team"],
      required: true,
      default: "team",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);


// import mongoose from "mongoose";

// const taskSchema = new mongoose.Schema(
//   {
//     companyId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Admin",
//       required: true,
//       index: true,
//     },

//     team: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Team",
//       default: null,
//     },

//     status: {
//   type: String,
//   enum: ["Pending", "Completed", "Approved", "Reassigned"],
//   default: "Pending",
// },


// reviewStatus: {
//   type: String,
//   enum: ["Completed", "Approved", "Reassigned"],
//   default: "Completed",
// },

// userDescription: {
//   type: String,
//   default: "",
// },

// adminNote: {
//   type: String,
//   default: "",
// },


//     project: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Project",
//       default: null,
//     },

//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     dueDate: {
//       type: Date,
//       default: null,
//     },

//     status: {
//       type: String,
//       enum: ["Pending", "Completed"],
//       default: "Pending",
//     },

//     taskType: {
//       type: String,
//       enum: ["my", "team"],
//       required: true,
//       default: "team",
//     },

//     assignedTo: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Admin",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Task", taskSchema);


// import mongoose from "mongoose";

// const taskSchema = new mongoose.Schema(
//   {
//     team: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Team",
//       default: null,
//     },

//     project: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Project",
//       default: null,
//     },

//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     dueDate: {
//       type: Date,
//       default: null,
//     },

//     status: {
//       type: String,
//       enum: ["Pending", "Completed"],
//       default: "Pending",
//     },

//     taskType: {
//       type: String,
//       enum: ["my", "team"],
//       required: true,
//       default: "team",
//     },

//     assignedTo: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Admin",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Task", taskSchema);

// import mongoose from "mongoose";

// const taskSchema = new mongoose.Schema(
//   {
//     team: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Team",
//       default: null,
//     },

//     project: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Project",
//       default: null,
//     },

//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     status: {
//       type: String,
//       enum: ["Pending", "Completed"],
//       default: "Pending",
//     },

//     taskType: {
//       type: String,
//       enum: ["my", "team"],
//       required: true,
//       default: "team",
//     },

//     assignedTo: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Task", taskSchema);