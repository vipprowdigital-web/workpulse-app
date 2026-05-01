import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import Button from "@/components/button";

type UserType = {
  _id: string;
  name: string;
  createdAt?: string;
};

type ProjectType = {
  _id: string;
  name: string;
};

export default function AssignedTasks() {
  const [userSearch, setUserSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [users, setUsers] = useState<UserType[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");

        if (!token) {
          Alert.alert("Error", "Login session missing");
          return;
        }

        const userRes = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/user`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const userData = await userRes.json();
        setUsers(Array.isArray(userData) ? userData : []);

        const projectRes = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/project`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const projectData = await projectRes.json();
        setProjects(Array.isArray(projectData) ? projectData : []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  const handleCreateTask = async () => {
    if (!selectedUser || !selectedProject) {
      Alert.alert("Error", "Select user & project");
      return;
    }

    if (!taskTitle.trim()) {
      Alert.alert("Error", "Enter task");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("token");
      const adminId = await SecureStore.getItemAsync("adminId");

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedTo: selectedUser,
          project: selectedProject,
          team: null,
          title: taskTitle,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          createdBy: adminId,
          taskType: "team",
          status: "Pending",
        }),
      });

      if (!res.ok) {
        throw new Error("Task create failed");
      }

      Alert.alert("Success", "Task Created ✅");

      setUserSearch("");
      setProjectSearch("");
      setTaskTitle("");
      setDueDate("");
      setSelectedUser(null);
      setSelectedProject(null);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const renderDropdown = (
    data: { _id: string; name: string }[],
    setSelected: (id: string) => void,
    setSearch: (name: string) => void
  ) => (
    <ScrollView
      style={styles.dropdown}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      {data.map((item) => (
        <TouchableOpacity
          key={item._id}
          style={styles.item}
          onPress={() => {
            setSelected(item._id);
            setSearch(item.name);
          }}
        >
          <Text style={styles.text}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
      nestedScrollEnabled
    >
      <LinearGradient colors={["#5f00be", "#127a6e"]} style={styles.header}>
        <Text style={styles.headerText}>Assign Task</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.label}>Select User</Text>
        <TextInput
          placeholder="Search user..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={userSearch}
          onChangeText={setUserSearch}
        />

        {renderDropdown(
          users.filter((u) =>
            u.name.toLowerCase().includes(userSearch.toLowerCase())
          ),
          setSelectedUser,
          setUserSearch
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Select Project</Text>
        <TextInput
          placeholder="Search project..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={projectSearch}
          onChangeText={setProjectSearch}
        />

        {renderDropdown(
          projects.filter((p) =>
            p.name.toLowerCase().includes(projectSearch.toLowerCase())
          ),
          setSelectedProject,
          setProjectSearch
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Task</Text>
        <TextInput
          placeholder="Enter task..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={taskTitle}
          onChangeText={setTaskTitle}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Due Date</Text>
        <TextInput
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={dueDate}
          onChangeText={setDueDate}
        />
      </View>

      <View style={{ marginTop: 20, marginHorizontal: 20, marginBottom: 30 }}>
        <Button title="Create Task" onPress={handleCreateTask} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d3d7df",
  },

  header: {
    padding: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#0F2A5F",
    margin: 15,
    padding: 15,
    borderRadius: 15,
  },

  label: {
    color: "#CBD5F5",
    marginBottom: 5,
  },

  input: {
    backgroundColor: "#081B43",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
  },

  dropdown: {
    maxHeight: 180,
    marginTop: 5,
  },

  item: {
    padding: 10,
    borderBottomWidth: 0.5,
    borderColor: "#1E3A8A",
  },

  text: {
    color: "#fff",
  },
});

// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { useState, useEffect } from "react";
// import Button from "@/components/button";

// type TeamType = {
//   _id: string;
//   name: string;
// };

// type ProjectType = {
//   _id: string;
//   name: string;
// };

// export default function AssignedTasks() {
//   const [teamSearch, setTeamSearch] = useState("");
//   const [projectSearch, setProjectSearch] = useState("");
//   const [taskTitle, setTaskTitle] = useState("");
//   const [dueDate, setDueDate] = useState("");

//   const [teams, setTeams] = useState<TeamType[]>([]);
//   const [projects, setProjects] = useState<ProjectType[]>([]);

//   const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
//   const [selectedProject, setSelectedProject] = useState<string | null>(null);

//   useEffect(() => {
//     fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/team`)
//       .then((res) => res.json())
//       .then((data: TeamType[]) => setTeams(Array.isArray(data) ? data : []))
//       .catch((err) => console.log(err));

//     fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/project`)
//       .then((res) => res.json())
//       .then((data: ProjectType[]) => setProjects(Array.isArray(data) ? data : []))
//       .catch((err) => console.log(err));
//   }, []);

//   const filteredTeams = teams.filter((t) =>
//     t.name.toLowerCase().includes(teamSearch.toLowerCase())
//   );

//   const filteredProjects = projects.filter((p) =>
//     p.name.toLowerCase().includes(projectSearch.toLowerCase())
//   );

//   const handleCreateTask = async () => {
//     if (!taskTitle.trim()) {
//       Alert.alert("Error", "Enter task title");
//       return;
//     }

//     if (!selectedTeam || !selectedProject) {
//       Alert.alert("Error", "Select team & project");
//       return;
//     }

//     // Temporary until auth is added
//     const currentAdminId = "69df5bca904e3f692fc504d3";

//     try {
//       const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/task`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           team: selectedTeam,
//           project: selectedProject,
//           title: taskTitle,
//           dueDate: dueDate ? new Date(dueDate).toISOString() : null,
//           createdBy: currentAdminId,
//           taskType: "team",
//           assignedTo: null,
//           status: "Pending",
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.message || "Task creation failed");
//       }

//       Alert.alert("Success", "Task Created ✅");

//       setTaskTitle("");
//       setDueDate("");
//       setSelectedTeam(null);
//       setSelectedProject(null);
//       setTeamSearch("");
//       setProjectSearch("");
//     } catch (error: any) {
//       console.log(error);
//       Alert.alert("Error", error.message || "Something went wrong");
//     }
//   };

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <LinearGradient
//         colors={["#5f00be", "#127a6e"]}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 0 }}
//         style={styles.header}
//       >
//         <Text style={styles.headerText}>Assign To</Text>
//       </LinearGradient>

//       <View style={styles.card}>
//         <Text style={styles.label}>Task Title</Text>
//         <TextInput
//           placeholder="Enter task title..."
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={taskTitle}
//           onChangeText={setTaskTitle}
//         />
//       </View>

//       <View style={styles.card}>
//         <Text style={styles.label}>Due Date</Text>
//         <TextInput
//           placeholder="YYYY-MM-DD"
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={dueDate}
//           onChangeText={setDueDate}
//         />
//       </View>

//       <View style={styles.card}>
//         <Text style={styles.label}>Select Team</Text>

//         <TextInput
//           placeholder="Search team..."
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={teamSearch}
//           onChangeText={setTeamSearch}
//         />

//         {filteredTeams.map((item) => (
//           <TouchableOpacity
//             key={item._id}
//             style={[
//               styles.dropdownItem,
//               selectedTeam === item._id && styles.selectedItem,
//             ]}
//             onPress={() => {
//               setSelectedTeam(item._id);
//               setTeamSearch(item.name);
//             }}
//           >
//             <Text style={styles.dropdownText}>{item.name}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <View style={styles.card}>
//         <Text style={styles.label}>Select Project</Text>

//         <TextInput
//           placeholder="Search project..."
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={projectSearch}
//           onChangeText={setProjectSearch}
//         />

//         {filteredProjects.map((item) => (
//           <TouchableOpacity
//             key={item._id}
//             style={[
//               styles.dropdownItem,
//               selectedProject === item._id && styles.selectedItem,
//             ]}
//             onPress={() => {
//               setSelectedProject(item._id);
//               setProjectSearch(item.name);
//             }}
//           >
//             <Text style={styles.dropdownText}>{item.name}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <View style={{ marginTop: 25, marginHorizontal: 20 }}>
//         <Button title="Create Task" onPress={handleCreateTask} />
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#081B43",
//   },

//   header: {
//     paddingTop: 35,
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//     borderBottomLeftRadius: 25,
//     borderBottomRightRadius: 25,
//   },

//   headerText: {
//     color: "#fff",
//     fontSize: 22,
//     fontWeight: "bold",
//   },

//   card: {
//     backgroundColor: "#0F2A5F",
//     marginHorizontal: 20,
//     marginTop: 18,
//     borderRadius: 15,
//     padding: 15,
//   },

//   label: {
//     fontSize: 14,
//     color: "#CBD5F5",
//     marginBottom: 8,
//   },

//   input: {
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 10,
//     backgroundColor: "#081B43",
//     color: "#fff",
//   },

//   dropdownItem: {
//     padding: 10,
//     borderBottomWidth: 0.5,
//     borderColor: "#1E3A8A",
//   },

//   selectedItem: {
//     backgroundColor: "#00A693",
//     borderRadius: 8,
//   },

//   dropdownText: {
//     color: "#fff",
//   },
// });


// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { useState, useEffect } from "react";
// import Button from "@/components/button";

// // ✅ TYPES FIX
// type TeamType = {
//   _id: string;
//   name: string;
// };

// type ProjectType = {
//   _id: string;
//   name: string;
// };

// export default function AssignedTasks() {
//   const [teamSearch, setTeamSearch] = useState("");
//   const [projectSearch, setProjectSearch] = useState("");

//   // ✅ TYPE SAFE STATES
//   const [teams, setTeams] = useState<TeamType[]>([]);
//   const [projects, setProjects] = useState<ProjectType[]>([]);

//   const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
//   const [selectedProject, setSelectedProject] = useState<string | null>(null);

//   // ✅ API CALL
//   useEffect(() => {
//     fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/team`)
//       .then(res => res.json())
//       .then((data: TeamType[]) => setTeams(data))
//       .catch(err => console.log(err));

//     fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/project`)
//       .then(res => res.json())
//       .then((data: ProjectType[]) => setProjects(data))
//       .catch(err => console.log(err));
//   }, []);

//   // ✅ FILTER
//   const filteredTeams = teams.filter((t) =>
//     t.name.toLowerCase().includes(teamSearch.toLowerCase())
//   );

//   const filteredProjects = projects.filter((p) =>
//     p.name.toLowerCase().includes(projectSearch.toLowerCase())
//   );

//   // ✅ CREATE TASK
//   const handleCreateTask = async () => {
//     if (!selectedTeam || !selectedProject) {
//       alert("Select team & project");
//       return;
//     }

//     try {
//       await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/task`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           team: selectedTeam,
//           project: selectedProject,
//           title: "New Task",
//         }),
//       });

//       alert("Task Created ✅");
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
//       {/* HEADER */}
//       <LinearGradient
//         colors={["#5f00be", "#127a6e"]}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 0 }}
//         style={styles.header}
//       >
//         <Text style={styles.headerText}>Assign To</Text>
//       </LinearGradient>

//       {/* TEAM BOX */}
//       <View style={styles.card}>
//         <Text style={styles.label}>Select Team</Text>

//         <TextInput
//           placeholder="Search team..."
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={teamSearch}
//           onChangeText={setTeamSearch}
//         />

//         {filteredTeams.map((item) => (
//           <TouchableOpacity
//             key={item._id}
//             style={styles.dropdownItem}
//             onPress={() => setSelectedTeam(item._id)}
//           >
//             <Text style={styles.dropdownText}>{item.name}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* PROJECT BOX */}
//       <View style={styles.card}>
//         <Text style={styles.label}>Select Project</Text>

//         <TextInput
//           placeholder="Search project..."
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={projectSearch}
//           onChangeText={setProjectSearch}
//         />

//         {filteredProjects.map((item) => (
//           <TouchableOpacity
//             key={item._id}
//             style={styles.dropdownItem}
//             onPress={() => setSelectedProject(item._id)}
//           >
//             <Text style={styles.dropdownText}>{item.name}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* BUTTON */}
//       <View style={{ marginTop: 25, marginHorizontal: 20 }}>
//         <Button title="Create Task" onPress={handleCreateTask} />
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#081B43",
//   },

//   header: {
//     paddingTop: 35,
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//     borderBottomLeftRadius: 25,
//     borderBottomRightRadius: 25,
//   },

//   headerText: {
//     color: "#fff",
//     fontSize: 22,
//     fontWeight: "bold",
//   },

//   card: {
//     backgroundColor: "#0F2A5F",
//     marginHorizontal: 20,
//     marginTop: 18,
//     borderRadius: 15,
//     padding: 15,
//   },

//   label: {
//     fontSize: 14,
//     color: "#CBD5F5",
//     marginBottom: 8,
//   },

//   input: {
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 10,
//     backgroundColor: "#081B43",
//     color: "#fff",
//   },

//   dropdownItem: {
//     padding: 10,
//     borderBottomWidth: 0.5,
//     borderColor: "#1E3A8A",
//   },

//   dropdownText: {
//     color: "#fff",
//   },
// });