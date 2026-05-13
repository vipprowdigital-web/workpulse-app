import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateUserToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: "user",
      companyId: user.companyId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ADMIN ADD USER
export const addUser = async (req, res) => {
  try {
    const { name, email, password, mobileNo, department } = req.body;

    if (!name || !email || !password || !mobileNo || !department) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const companyId = req.user.companyId;

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      companyId,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      mobileNo,
      department,
      companyId,
    });

    res.status(201).json({
      message: "User added successfully",
      user,
    });
  } catch (error) {
    console.log("Error adding user:", error);
    res.status(500).json({ message: "Error adding user" });
  }
};

// USER LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = generateUserToken(user);

    res.status(200).json({
      message: "Login successful",
      user,
      token,
      role: "user",
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Login error" });
  }
};

// GET COMPANY USERS
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      companyId: req.user.companyId,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
      ],
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.log("Get users error:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// GET LOGGED-IN USER PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Get profile error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};
console.log ("error");


// import User from "../models/User.js";
// import bcrypt from "bcryptjs";

// // ✅ ADMIN ADD USER
// export const addUser = async (req, res) => {
//   try {
//     const { name, email, password, companyId, mobileNo, department } = req.body;

//     if (!name || !email || !password || !mobileNo || !department) {
//       return res.status(400).json({
//         message: "All fields are required",
//       });
//     }

//     const existingUser = await User.findOne({ email: email.toLowerCase() });

//     if (existingUser) {
//       return res.status(400).json({
//         message: "User already exists",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const userData = {
//       name,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       mobileNo,
//       department,
//     };

//     if (companyId) {
//       userData.companyId = companyId;
//     }

//     const user = new User(userData);

//     await user.save();

//     res.status(201).json({
//       message: "User added successfully",
//       user,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Error adding user" });
//   }
// };

// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email: email.toLowerCase() });

//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid password" });
//     }

//     res.status(200).json({
//       message: "Login successful",
//       user,
//        role: "user",
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Login error" });
//   }
// };


// // Get All Users
// export const getUsers = async (req, res) => {
//   try {
//     const users = await User.find().sort({ createdAt: -1 });
//     res.status(200).json(users);
//   } catch (error) {
//     console.log("Get users error:", error);
//     res.status(500).json({ message: "Error fetching users" });
//   }
// };

// import User from "../models/User.js";

// // ✅ ADMIN ADD USER
// export const addUser = async (req, res) => {
//   try {
//     const { name, email, password, companyId } = req.body;

//     const user = new User({
//       name,
//       email,
//       password,
//       companyId,
//     });

//     await user.save();

//     res.status(201).json({
//       message: "User added successfully",
//       user,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error adding user" });
//   }
// };