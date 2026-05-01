import Department from "../models/Department.js";

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const companyId = req.user.companyId;

    const existing = await Department.findOne({
      companyId,
      name: name.trim(),
    });

    if (existing) {
      return res.status(400).json({ message: "Department already exists" });
    }

    const department = await Department.create({
      companyId,
      name: name.trim(),
      isActive: true,
    });

    res.status(201).json(department);
  } catch (error) {
    console.log("Create department error:", error);
    res.status(500).json({ message: "Error creating department" });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({
      companyId: req.user.companyId,
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    }).sort({ createdAt: -1 });

    res.status(200).json(departments);
  } catch (error) {
    console.log("Get departments error:", error);
    res.status(500).json({ message: "Error fetching departments" });
  }
};