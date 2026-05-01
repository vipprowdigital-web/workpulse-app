import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../utils/email.js";

const generateAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      role: "admin",
      companyId: admin._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ADMIN SIGNUP
// export const adminSignup = async (req, res) => {
//   try {
//     const { companyName, email, phone, businessType, address, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ message: "Email and password are required" });
//     }

//     const exist = await Admin.findOne({ email: email.toLowerCase() });

//     if (exist) {
//       return res.status(400).json({ message: "Admin already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const admin = await Admin.create({
//       companyName,
//       email: email.toLowerCase(),
//       phone,
//       businessType,
//       address,
//       password: hashedPassword,
//     });

//     const token = generateAdminToken(admin);

//     res.status(201).json({
//       message: "Signup successful",
//       admin,
//       token,
//       role: "admin",
//     });
//   } catch (error) {
//     console.log("Signup error:", error);
//     res.status(500).json({ message: "Signup error" });
//   }
// };

export const adminSignup = async (req, res) => {
  try {
    const { companyName, email, phone, businessType, address } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const exist = await Admin.findOne({ email: email.toLowerCase() });

    if (exist) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // 🔥 generate temp password
    const tempPassword = Math.random().toString(36).slice(-8);

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const admin = await Admin.create({
      companyName,
      email: email.toLowerCase(),
      phone,
      businessType,
      address,
      password: hashedPassword,
    });

    // 📧 send email
  await sendEmail(
  email,
  "Welcome to Task App",
  `
    <h2>Welcome to Workpulse 🚀</h2>
    <p>Your account has been created successfully.</p>
    <p>You can now login using your email and password.</p>
    <P> your password is 123456 </p>
    <p>If you did not create this account, please ignore this email.</p>
  `
);

    const token = generateAdminToken(admin);

    res.status(201).json({
      message: "Signup successful & email sent",
      admin,
      token,
      role: "admin",
    });

  } catch (error) {
    console.log("Signup error:", error);
    res.status(500).json({ message: "Signup error" });
  }
};

// ADMIN LOGIN
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = generateAdminToken(admin);

    res.status(200).json({
      message: "Login successful",
      admin,
      token,
      role: "admin",
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Login error" });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json(admin);
  } catch (error) {
    console.log("Get admin profile error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};


// import Admin from "../models/Admin.js";

// // ✅ SIGNUP
// export const adminSignup = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const exist = await Admin.findOne({ email });

//     if (exist) {
//       return res.status(400).json({ message: "Admin already exists" });
//     }

//     const admin = await Admin.create({
//       email,
//       password,
//     });

//     res.status(201).json({
//       message: "Signup successful",
//       admin,
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Signup error" });
//   }
// };

// // ✅ LOGIN
// export const adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const admin = await Admin.findOne({ email });

//     if (!admin) {
//       return res.status(400).json({ message: "Admin not found" });
//     }

//     if (admin.password !== password) {
//       return res.status(400).json({ message: "Invalid password" });
//     }

//     res.status(200).json({
//       message: "Login successful",
//       admin,
//        role: "admin",
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Login error" });
//   }
// };