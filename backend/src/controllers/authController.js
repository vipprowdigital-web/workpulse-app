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
    const { companyName, email, phone, businessType, address,password } = req.body;
    console.log("Req.body from sign up: ", req.body);
    

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const exist = await Admin.findOne({ email: email.toLowerCase() });

    if (exist) {
      return res.status(400).json({ message: "Admin already exists" });
    }
    console.log("error");

    // // 🔥 generate temp password
    // const tempPassword = Math.random().toString(36).slice(-8);

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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
  "Welcome to Workpulse 🚀",
  `
  <html>
  <body>
  <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">
    <table align="center" width="600" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(90deg, #5f00be, #127a6e); padding:20px; text-align:center;">
          <h1 style="color:#ffffff; margin:0;">Workpulse</h1>
          <p style="color:#e0e0e0; margin:5px 0 0;">Task Management Simplified</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:30px;">
          <h2 style="color:#333; margin-top:0;">Welcome to Workpulse 🚀</h2>
          
          <p style="color:#555; line-height:1.6;">
            Your account has been successfully created. We're excited to have you on board!
          </p>

          <p style="color:#555; line-height:1.6;">
            You can now log in using your registered email and password to manage your tasks efficiently.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center; margin:30px 0;">
            <a href="#" style="background: linear-gradient(90deg, #5f00be, #127a6e); color:#fff; padding:12px 25px; text-decoration:none; border-radius:6px; font-weight:bold;">
              Login to Your Account
            </a>
          </div>

          <p style="color:#777; font-size:14px;">
            If you did not create this account, please ignore this email or contact support immediately.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f1f1f1; padding:15px; text-align:center;">
          <p style="margin:0; font-size:13px; color:#777;">
            © ${new Date().getFullYear()} Workpulse. All rights reserved.
          </p>
        </td>
      </tr>

    </table>
  </div>
  <body>
  </html>
  `
);

    const token = generateAdminToken(admin);

    console.log("Admin: ", admin);
    

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
    console.log("Req.body: ", req.body);

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    console.log("Admin: ", admin);
    

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
    // const admin = await Admin.findById(req.user.id).select("-password");
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

export const getAllAdmins = async (req, res) => {
  try {
    // const admin = await Admin.findById(req.user.id).select("-password");
    const admins = await Admin.find();
    console.log("Admins: ", admins);
    

    if (!admins) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json(admins);
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