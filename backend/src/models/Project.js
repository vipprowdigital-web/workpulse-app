import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Admin",
  required: true,
},

 companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      index: true,
      default: null,
    },
  },
  
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);


// import mongoose from "mongoose";

// const projectSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
// });

// export default mongoose.model("Project", projectSchema);