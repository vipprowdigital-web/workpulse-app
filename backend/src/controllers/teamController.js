import Team from "../models/Team.js";

// ✅ ADD TEAM
export const addTeam = async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Team name is required" });
    }

    const companyId = req.user.companyId;

    const team = await Team.create({
      name,
      companyId,
      members: Array.isArray(members) ? members : [],
      isActive: true,
    });

    const populatedTeam = await Team.findById(team._id).populate(
      "members",
      "name email mobileNo department"
    );

    res.status(201).json(populatedTeam);
  } catch (error) {
    console.log("Error adding team:", error);
    res.status(500).json({ message: "Error adding team" });
  }
};

// ✅ GET TEAMS (FIXED - OLD + NEW BOTH)
export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      companyId: req.user.companyId,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
      ],
    })
      .populate("members", "name email mobileNo department")
      .sort({ createdAt: -1 });

    res.status(200).json(teams);
  } catch (error) {
    console.log("Error fetching teams:", error);
    res.status(500).json({ message: "Error fetching teams" });
  }
};



// import Team from "../models/Team.js";

// // Add Team
// export const addTeam = async (req, res) => {
//   try {
//     const { name, members } = req.body;

//     if (!name) {
//       return res.status(400).json({ message: "Team name is required" });
//     }

//     const team = await Team.create({
//       name,
//       members: Array.isArray(members) ? members : [],
//     });

//     const populatedTeam = await Team.findById(team._id).populate(
//       "members",
//       "name email mobileNo department"
//     );

//     res.status(201).json(populatedTeam);
//   } catch (error) {
//     console.log("Error adding team:", error);
//     res.status(500).json({ message: "Error adding team" });
//   }
// };

// // Get Teams
// export const getTeams = async (req, res) => {
//   try {
//     const teams = await Team.find()
//       .populate("members", "name email mobileNo department")
//       .sort({ createdAt: -1 });

//     res.json(teams);
//   } catch (error) {
//     console.log("Error fetching teams:", error);
//     res.status(500).json({ message: "Error fetching teams" });
//   }
// };


// import Team from "../models/Team.js";

// // ✅ Add Team
// export const addTeam = async (req, res) => {
//   try {
//     const { name } = req.body;

//     const team = await Team.create({ name });

//     res.status(201).json(team);
//   } catch (error) {
//     res.status(500).json({ message: "Error adding team" });
//   }
// };

// // ✅ Get Teams
// export const getTeams = async (req, res) => {
//   const teams = await Team.find();
//   res.json(teams);
// };