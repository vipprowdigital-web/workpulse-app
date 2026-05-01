import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  companyName: String,
  email: String,
  phone: String,
  businessType: String,
  address: String,
  password: String,
});

export default mongoose.model("Admin", adminSchema);