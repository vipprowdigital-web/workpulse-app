import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { KeyboardAvoidingView } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { apiUrl } from "@/config/env";
import DateTimePicker from "@react-native-community/datetimepicker";

type UserType = {
  _id: string;
  name: string;
  department?: string;
};

type ProjectType = {
  _id: string;
  name: string;
};

export default function AssignedTasks() {
  const [userSearch, setUserSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [users, setUsers] = useState<UserType[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) {
          Alert.alert("Error", "Login session missing");
          return;
        }

        const userRes = await fetch(`${apiUrl}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        setUsers(Array.isArray(userData) ? userData : []);

        const projectRes = await fetch(`${apiUrl}/api/project`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const projectData = await projectRes.json();
        setProjects(Array.isArray(projectData) ? projectData : []);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, []);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreateTask = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert("Error", "Kam se kam ek user select karo");
      return;
    }
    if (!taskTitle.trim()) {
      Alert.alert("Error", "Task title enter karo");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("token");
      const adminId = await SecureStore.getItemAsync("adminId");

      const res = await fetch(`${apiUrl}/api/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedTo: selectedUsers,
          project: selectedProject || null,
          team: null,
          title: taskTitle,
          dueDate: selectedDate ? selectedDate.toISOString() : null,
          createdBy: adminId,
          taskType: "team",
          status: "Pending",
        }),
      });

      if (!res.ok) throw new Error("Task create failed");

      Alert.alert("Success ✅", "Task successfully assigned!", [
        {
          text: "OK",
          onPress: () => {
            setUserSearch("");
            setProjectSearch("");
            setTaskTitle("");
            setSelectedUsers([]);
            setSelectedProject(null);
            setSelectedDate(null);
          },
        },
      ]);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  const selectedProjectName = projects.find(
    (p) => p._id === selectedProject,
  )?.name;

  const formatDisplayDate = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#5f00be" />

      <LinearGradient colors={["#5f00be", "#127a6e"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Assign Task</Text>
          <Text style={styles.headerSub}>Assign work to team members</Text>
        </View>
      </LinearGradient>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Select Users — Multiple */}
          <View style={styles.card}>
            <Text style={styles.label}>
              <Ionicons name="people-outline" size={14} color="#CBD5F5" />{" "}
              Select Users *
            </Text>

            {/* Selected Users Badges */}
            {selectedUsers.length > 0 && (
              <View style={styles.selectedBadgesRow}>
                {selectedUsers.map((uid) => {
                  const u = users.find((x) => x._id === uid);
                  if (!u) return null;
                  return (
                    <View key={uid} style={styles.badge}>
                      <Text style={styles.badgeText}>{u.name}</Text>
                      <TouchableOpacity
                        onPress={() => toggleUserSelection(uid)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={15}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <TextInput
              placeholder="Search user..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={userSearch}
              onChangeText={(t) => {
                setUserSearch(t);
                setShowUserDropdown(true);
              }}
              onFocus={() => setShowUserDropdown(true)}
            />

            {showUserDropdown && filteredUsers.length > 0 && (
              <View style={styles.dropdown}>
                {filteredUsers.map((item) => {
                  const isSelected = selectedUsers.includes(item._id);
                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                      ]}
                      onPress={() => toggleUserSelection(item._id)}
                    >
                      <View style={styles.dropdownItemLeft}>
                        <View style={styles.dropdownAvatar}>
                          <Text style={styles.dropdownAvatarText}>
                            {item.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.dropdownItemText}>
                            {item.name}
                          </Text>
                          {item.department && (
                            <Text style={styles.dropdownItemSub}>
                              {item.department}
                            </Text>
                          )}
                        </View>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#00A693"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => setShowUserDropdown(false)}
                >
                  <Text style={styles.doneBtnText}>
                    Done ({selectedUsers.length} selected)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Select Project — Optional */}
          <View style={styles.card}>
            <Text style={styles.label}>
              <Ionicons name="folder-outline" size={14} color="#CBD5F5" />{" "}
              Select Project (optional)
            </Text>

            {selectedProject && (
              <View style={styles.selectedBadgesRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{selectedProjectName}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedProject(null);
                      setProjectSearch("");
                    }}
                  >
                    <Ionicons name="close-circle" size={15} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TextInput
              placeholder="Search project..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={projectSearch}
              onChangeText={(t) => {
                setProjectSearch(t);
                setShowProjectDropdown(true);
              }}
              onFocus={() => setShowProjectDropdown(true)}
            />

            {showProjectDropdown && filteredProjects.length > 0 && (
              <View style={styles.dropdown}>
                {filteredProjects.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.dropdownItem,
                      selectedProject === item._id &&
                        styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedProject(item._id);
                      setProjectSearch(item.name);
                      setShowProjectDropdown(false);
                    }}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <Ionicons
                        name="folder"
                        size={18}
                        color="#9B42F2"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.dropdownItemText}>{item.name}</Text>
                    </View>
                    {selectedProject === item._id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#00A693"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Task Title */}
          <View style={styles.card}>
            <Text style={styles.label}>
              <Ionicons name="create-outline" size={14} color="#CBD5F5" /> Task
              Title *
            </Text>
            <TextInput
              placeholder="Enter task title..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={taskTitle}
              onChangeText={setTaskTitle}
              multiline
            />
          </View>

          {/* Due Date — Optional + Calendar */}
          <View style={styles.card}>
            <Text style={styles.label}>
              <Ionicons name="calendar-outline" size={14} color="#CBD5F5" /> Due
              Date (optional)
            </Text>
            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={18} color="#9B42F2" />
              <Text
                style={[
                  styles.datePickerText,
                  !selectedDate && { color: "#9CA3AF" },
                ]}
              >
                {selectedDate
                  ? formatDisplayDate(selectedDate)
                  : "Select due date"}
              </Text>
              {selectedDate && (
                <TouchableOpacity onPress={() => setSelectedDate(null)}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (event.type === "set" && date) setSelectedDate(date);
                }}
              />
            )}
          </View>

          {/* Summary */}
          {(selectedUsers.length > 0 || selectedProject || taskTitle) && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Task Summary</Text>
              {selectedUsers.length > 0 && (
                <View style={styles.summaryRow}>
                  <Ionicons name="people" size={14} color="#9CA3AF" />
                  <Text style={styles.summaryText}>
                    {selectedUsers
                      .map((id) => users.find((u) => u._id === id)?.name)
                      .join(", ")}
                  </Text>
                </View>
              )}
              {selectedProject && (
                <View style={styles.summaryRow}>
                  <Ionicons name="folder" size={14} color="#9CA3AF" />
                  <Text style={styles.summaryText}>{selectedProjectName}</Text>
                </View>
              )}
              {taskTitle ? (
                <View style={styles.summaryRow}>
                  <Ionicons name="document-text" size={14} color="#9CA3AF" />
                  <Text style={styles.summaryText}>{taskTitle}</Text>
                </View>
              ) : null}
              {selectedDate ? (
                <View style={styles.summaryRow}>
                  <Ionicons name="calendar" size={14} color="#9CA3AF" />
                  <Text style={styles.summaryText}>
                    {formatDisplayDate(selectedDate)}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createBtn,
              (selectedUsers.length === 0 || !taskTitle.trim()) &&
                styles.createBtnDisabled,
            ]}
            onPress={handleCreateTask}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                selectedUsers.length === 0 || !taskTitle.trim()
                  ? ["#374151", "#374151"]
                  : ["#5f00be", "#00A693"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createBtnGrad}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.createBtnText}>Create Task</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF3FB" },
  header: {
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#0F2A5F",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    color: "#CBD5F5",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#081B43",
    padding: 12,
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
  },
  selectedBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,166,147,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { color: "#00A693", fontSize: 13, fontWeight: "600" },
  dropdown: {
    marginTop: 6,
    backgroundColor: "#081B43",
    borderRadius: 10,
    overflow: "hidden",
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1E3A8A",
  },
  dropdownItemSelected: { backgroundColor: "rgba(0,166,147,0.12)" },
  dropdownItemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  dropdownAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1D6FA4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dropdownAvatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  dropdownItemText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  dropdownItemSub: { color: "#9CA3AF", fontSize: 11, marginTop: 1 },
  doneBtn: {
    padding: 12,
    alignItems: "center",
    backgroundColor: "rgba(95,0,190,0.3)",
  },
  doneBtnText: { color: "#9B42F2", fontWeight: "700", fontSize: 13 },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#081B43",
    padding: 12,
    borderRadius: 10,
  },
  datePickerText: { color: "#fff", fontSize: 14, flex: 1 },
  summaryCard: {
    backgroundColor: "#0F2A5F",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#00A693",
  },
  summaryTitle: {
    color: "#CBD5F5",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  summaryText: { color: "#E0E7FF", fontSize: 13, flex: 1 },
  createBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  createBtnDisabled: { opacity: 0.6 },
  createBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
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
// import * as SecureStore from "expo-secure-store";
// import Button from "@/components/button";

// type UserType = {
//   _id: string;
//   name: string;
//   createdAt?: string;
// };

// type ProjectType = {
//   _id: string;
//   name: string;
// };

// export default function AssignedTasks() {
//   const [userSearch, setUserSearch] = useState("");
//   const [projectSearch, setProjectSearch] = useState("");
//   const [taskTitle, setTaskTitle] = useState("");
//   const [dueDate, setDueDate] = useState("");

//   const [users, setUsers] = useState<UserType[]>([]);
//   const [projects, setProjects] = useState<ProjectType[]>([]);

//   const [selectedUser, setSelectedUser] = useState<string | null>(null);
//   const [selectedProject, setSelectedProject] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = await SecureStore.getItemAsync("token");

//         if (!token) {
//           Alert.alert("Error", "Login session missing");
//           return;
//         }

//         const userRes = await fetch(
//           `${apiUrl}/api/user`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const userData = await userRes.json();
//         setUsers(Array.isArray(userData) ? userData : []);

//         const projectRes = await fetch(
//           `${apiUrl}/api/project`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const projectData = await projectRes.json();
//         setProjects(Array.isArray(projectData) ? projectData : []);
//       } catch (err) {
//         console.log(err);
//       }
//     };

//     fetchData();
//   }, []);

//   const handleCreateTask = async () => {
//     if (!selectedUser || !selectedProject) {
//       Alert.alert("Error", "Select user & project");
//       return;
//     }

//     if (!taskTitle.trim()) {
//       Alert.alert("Error", "Enter task");
//       return;
//     }

//     try {
//       const token = await SecureStore.getItemAsync("token");
//       const adminId = await SecureStore.getItemAsync("adminId");

//       const res = await fetch(`${apiUrl}/api/task`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           assignedTo: selectedUser,
//           project: selectedProject,
//           team: null,
//           title: taskTitle,
//           dueDate: dueDate ? new Date(dueDate).toISOString() : null,
//           createdBy: adminId,
//           taskType: "team",
//           status: "Pending",
//         }),
//       });

//       if (!res.ok) {
//         throw new Error("Task create failed");
//       }

//       Alert.alert("Success", "Task Created ✅");

//       setUserSearch("");
//       setProjectSearch("");
//       setTaskTitle("");
//       setDueDate("");
//       setSelectedUser(null);
//       setSelectedProject(null);
//     } catch (err) {
//       console.log(err);
//       Alert.alert("Error", "Something went wrong");
//     }
//   };

//   const renderDropdown = (
//     data: { _id: string; name: string }[],
//     setSelected: (id: string) => void,
//     setSearch: (name: string) => void
//   ) => (
//     <ScrollView
//       style={styles.dropdown}
//       nestedScrollEnabled
//       keyboardShouldPersistTaps="handled"

//     >
//       {data.map((item) => (
//         <TouchableOpacity
//           key={item._id}
//           style={styles.item}
//           onPress={() => {
//             setSelected(item._id);
//             setSearch(item.name);
//           }}
//         >
//           <Text style={styles.text}>{item.name}</Text>
//         </TouchableOpacity>
//       ))}
//     </ScrollView>
//   );

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={{ paddingBottom: 90,  }}
//       nestedScrollEnabled
//     >
//       <LinearGradient colors={["#5f00be", "#127a6e"]} style={styles.header}>
//         <Text style={styles.headerText}>Assign Task</Text>
//       </LinearGradient>

//       <View style={styles.card}>
//         <Text style={styles.label}>Select User</Text>
//         <TextInput
//           placeholder="Search user..."
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={userSearch}
//           onChangeText={setUserSearch}
//         />

//         {renderDropdown(
//           users.filter((u) =>
//             u.name.toLowerCase().includes(userSearch.toLowerCase())
//           ),
//           setSelectedUser,
//           setUserSearch
//         )}
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

//         {renderDropdown(
//           projects.filter((p) =>
//             p.name.toLowerCase().includes(projectSearch.toLowerCase())
//           ),
//           setSelectedProject,
//           setProjectSearch
//         )}
//       </View>

//       <View style={styles.card}>
//         <Text style={styles.label}>Task</Text>
//         <TextInput
//           placeholder="Enter task..."
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

//       <View style={{ marginTop: 20, marginHorizontal: 20, marginBottom: 30 }}>
//         <Button title="Create Task" onPress={handleCreateTask} />
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#d3d7df",
//     marginBottom:50,
//   },

//   header: {
//     padding: 30,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//   },

//   headerText: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//   },

//   card: {
//     backgroundColor: "#0F2A5F",
//     margin: 15,
//     padding: 15,
//     borderRadius: 15,
//   },

//   label: {
//     color: "#CBD5F5",
//     marginBottom: 5,
//   },

//   input: {
//     backgroundColor: "#081B43",
//     padding: 10,
//     borderRadius: 8,
//     color: "#fff",
//   },

//   dropdown: {
//     maxHeight: 180,
//     marginTop: 5,
//   },

//   item: {
//     padding: 10,
//     borderBottomWidth: 0.5,
//     borderColor: "#1E3A8A",
//   },

//   text: {
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
//     fetch(`${apiUrl}/api/team`)
//       .then((res) => res.json())
//       .then((data: TeamType[]) => setTeams(Array.isArray(data) ? data : []))
//       .catch((err) => console.log(err));

//     fetch(`${apiUrl}/api/project`)
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
//       const res = await fetch(`${apiUrl}/api/task`, {
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
//     fetch(`${apiUrl}/api/team`)
//       .then(res => res.json())
//       .then((data: TeamType[]) => setTeams(data))
//       .catch(err => console.log(err));

//     fetch(`${apiUrl}/api/project`)
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
//       await fetch(`${apiUrl}/api/task`, {
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
