import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI).then(() => {
      console.log("Successfully connected to database....");
    }).catch((error) => {
      console.error("Error while connection to database: ", error);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;


// const mongoose = require("mongoose");

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("MongoDB Connected ✅");
//   } catch (error) {
//     console.log(error);
//   }
// };

// module.exports = connectDB;