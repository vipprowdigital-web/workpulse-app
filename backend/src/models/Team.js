import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);


// import mongoose from "mongoose";

// const teamSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
// });

// export default mongoose.model("Team", teamSchema);