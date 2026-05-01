import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    mobileNo: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["user"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//     },

//     password: {
//       type: String,
//       required: true,
//     },

//     mobileNo: {
//       type: String,
//       required: true,
//     },

//     department: {
//       type: String,
//       required: true,
//     },

//     // 🔥 company/admin reference (same as before)
//     companyId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Admin",
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("User", userSchema);


// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   name: String,
//   email: String,
//   password: String,

//   // 🔥 important (kis company ka user hai)
//   companyId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Admin",
//   },
// });

// export default mongoose.model("User", userSchema);