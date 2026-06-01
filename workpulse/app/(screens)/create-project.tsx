import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Keyboard,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import {KeyboardAvoidingView} from "react-native";
import { router } from "expo-router";
import { apiUrl } from "@/config/env";
import DateTimePicker from "@react-native-community/datetimepicker";

type UserType = {
  _id: string;
  name: string;
  department?: string;
};

export default function CreateProject() {
  const [projectName, setProjectName] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) {
          Alert.alert("Error", "Login session missing. Please login again.");
          return;
        }

        const userRes = await fetch(`${apiUrl}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = await userRes.json();
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (err) {
        console.log("CREATE PROJECT USER FETCH ERROR:", err);
      }
    };

    fetchData();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const formatDisplayDate = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      Alert.alert("Error", "Enter project name");
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert("Error", "Select at least one user");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("token");
      const adminId = await SecureStore.getItemAsync("adminId");

      if (!token || !adminId) {
        Alert.alert("Error", "Login session missing. Please login again.");
        return;
      }

      const res = await fetch(`${apiUrl}/api/project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          team: null,
          assignedTo: selectedUsers,
          dueDate: selectedDate ? selectedDate.toISOString() : null,
          createdBy: adminId,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed");

      Alert.alert("Success ✅", "Project created successfully!", [
        {
          text: "OK",
          onPress: () => {
            setProjectName("");
            setUserSearch("");
            setSelectedUsers([]);
            setSelectedDate(null);
            setShowUserDropdown(false);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  const isReady = projectName.trim() && selectedUsers.length > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#5f00be" />

      <LinearGradient colors={["#5f00be", "#127a6e"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Create Project</Text>
          <Text style={styles.headerSub}>Add a new project for your team</Text>
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
        {/* Project Name */}
        <View style={styles.card}>
          <Text style={styles.label}>
            <Ionicons name="folder-outline" size={14} color="#CBD5F5" /> Project
            Name *
          </Text>
          <TextInput
            placeholder="Enter project name..."
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={projectName}
            onChangeText={setProjectName}
          />
        </View>

        {/* Select Users */}
        <View style={styles.card}>
          <Text style={styles.label}>
            <Ionicons name="person-outline" size={14} color="#CBD5F5" /> Select
            Users *
          </Text>

          {selectedUsers.length > 0 && (
            <View style={styles.selectedBadgesRow}>
              {selectedUsers.map((uid) => {
                const user = users.find((u) => u._id === uid);
                if (!user) return null;

                return (
                  <View key={uid} style={styles.selectedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#00A693"
                    />
                    <Text style={styles.selectedBadgeText}>{user.name}</Text>
                    <TouchableOpacity onPress={() => toggleUserSelection(uid)}>
                      <Ionicons name="close-circle" size={16} color="#9CA3AF" />
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
            onFocus={() => setShowUserDropdown(true)}
            onChangeText={(text) => {
              setUserSearch(text);
              setShowUserDropdown(true);
            }}
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
                    onPress={() => {
                      toggleUserSelection(item._id);
                    }}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <View style={styles.dropdownAvatar}>
                        <Text style={styles.dropdownAvatarText}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                        {item.department && (
                          <Text style={styles.dropdownItemSub}>
                            {item.department}
                          </Text>
                        )}
                      </View>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#00A693" />
                    )}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  setShowUserDropdown(false);
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.doneBtnText}>
                  Done ({selectedUsers.length} selected)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {userSearch.length > 0 && filteredUsers.length === 0 && (
            <Text style={styles.emptyText}>No user found</Text>
          )}
        </View>

        {/* Due Date */}
        <View style={styles.card}>
          <Text style={styles.label}>
            <Ionicons name="calendar-outline" size={14} color="#CBD5F5" />{" "}
            Project Due Date (optional)
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
        {(projectName || selectedUsers.length > 0 || selectedDate) && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Project Summary</Text>

            {projectName ? (
              <View style={styles.summaryRow}>
                <Ionicons name="folder" size={14} color="#9CA3AF" />
                <Text style={styles.summaryText}>{projectName}</Text>
              </View>
            ) : null}

            {selectedUsers.length > 0 ? (
              <View style={styles.summaryRow}>
                <Ionicons name="people" size={14} color="#9CA3AF" />
                <Text style={styles.summaryText}>
                  {selectedUsers
                    .map((id) => users.find((u) => u._id === id)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </Text>
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
          style={[styles.createBtn, !isReady && styles.createBtnDisabled]}
          onPress={handleCreateProject}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={!isReady ? ["#374151", "#374151"] : ["#5f00be", "#00A693"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createBtnGrad}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Create Project</Text>
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
    marginBottom: 8,
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,166,147,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  selectedBadgeText: {
    color: "#00A693",
    fontSize: 13,
    fontWeight: "600",
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: "#081B43",
    borderRadius: 10,
    overflow: "hidden",
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1E3A8A",
  },
  dropdownItemSelected: { backgroundColor: "rgba(0,166,147,0.1)" },
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
  emptyText: { color: "#9CA3AF", marginTop: 8, fontSize: 13 },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#081B43",
    padding: 12,
    borderRadius: 10,
  },
  datePickerText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  doneBtn: {
    padding: 12,
    alignItems: "center",
    backgroundColor: "rgba(95,0,190,0.3)",
  },
  doneBtnText: {
    color: "#9B42F2",
    fontWeight: "700",
    fontSize: 13,
  },
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
//   Keyboard,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { useState, useEffect } from "react";
// import * as SecureStore from "expo-secure-store";
// import Button from "@/components/button";

// type UserType = {
//   _id: string;
//   name: string;
// };

// export default function CreateProject() {
//   const [projectName, setProjectName] = useState("");
//   const [userSearch, setUserSearch] = useState("");
//   const [dueDate, setDueDate] = useState("");

//   const [users, setUsers] = useState<UserType[]>([]);
//   const [selectedUser, setSelectedUser] = useState<string | null>(null);
//   const [showUserDropdown, setShowUserDropdown] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = await SecureStore.getItemAsync("token");

//         if (!token) {
//           Alert.alert("Error", "Login session missing. Please login again.");
//           return;
//         }

//         const userRes = await fetch(
//           `${apiUrl}/api/user`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         const userData = await userRes.json();
//         console.log("CREATE PROJECT USERS:", userData);

//         setUsers(Array.isArray(userData) ? userData : []);
//       } catch (err) {
//         console.log("CREATE PROJECT USER FETCH ERROR:", err);
//       }
//     };

//     fetchData();
//   }, []);

//   const filteredUsers = users.filter((u) =>
//     u.name.toLowerCase().includes(userSearch.toLowerCase())
//   );

//   const handleCreateProject = async () => {
//     if (!projectName.trim()) {
//       Alert.alert("Error", "Enter project name");
//       return;
//     }

//     if (!selectedUser) {
//       Alert.alert("Error", "Select user");
//       return;
//     }

//     let formattedDueDate = null;

//     if (dueDate.trim()) {
//       const parsedDate = new Date(dueDate);

//       if (isNaN(parsedDate.getTime())) {
//         Alert.alert("Error", "Enter due date in YYYY-MM-DD format");
//         return;
//       }

//       formattedDueDate = parsedDate.toISOString();
//     }

//     try {
//       const token = await SecureStore.getItemAsync("token");
//       const adminId = await SecureStore.getItemAsync("adminId");

//       if (!token || !adminId) {
//         Alert.alert("Error", "Login session missing. Please login again.");
//         return;
//       }

//       const res = await fetch(`${apiUrl}/api/project`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           name: projectName,
//           team: null,
//           assignedTo: selectedUser,
//           dueDate: formattedDueDate,
//           createdBy: adminId,
//         }),
//       });

//       const data = await res.json();
//       console.log("PROJECT RESPONSE:", data);

//       if (!res.ok) {
//         throw new Error(data.message || "Failed");
//       }

//       Alert.alert("Success", "Project Created ✅");

//       setProjectName("");
//       setUserSearch("");
//       setDueDate("");
//       setSelectedUser(null);
//       setShowUserDropdown(false);
//     } catch (error: any) {
//       console.log(error);
//       Alert.alert("Error", error.message || "Something went wrong");
//     }
//   };

//   const renderUserDropdown = () => (
//     <ScrollView
//       style={styles.dropdown}
//       nestedScrollEnabled
//       keyboardShouldPersistTaps="handled"
//       showsVerticalScrollIndicator
//     >
//       {filteredUsers.map((item) => (
//         <TouchableOpacity
//           key={item._id}
//           style={styles.dropdownItem}
//           onPress={() => {
//             setSelectedUser(item._id);
//             setUserSearch(item.name);
//             setShowUserDropdown(false);
//             Keyboard.dismiss();
//           }}
//         >
//           <Text style={styles.dropdownText}>{item.name}</Text>
//         </TouchableOpacity>
//       ))}

//       {userSearch.length > 0 && filteredUsers.length === 0 && (
//         <Text style={styles.emptyText}>No user found</Text>
//       )}
//     </ScrollView>
//   );

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={{ paddingBottom: 30 }}
//       showsVerticalScrollIndicator={false}
//       nestedScrollEnabled
//       keyboardShouldPersistTaps="handled"
//     >
//       <LinearGradient colors={["#5f00be", "#127a6e"]} style={styles.header}>
//         <Text style={styles.headerText}>Create Project</Text>
//       </LinearGradient>

//       <View style={styles.card}>
//         <Text style={styles.label}>Project Name</Text>

//         <TextInput
//           placeholder="Enter project name..."
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={projectName}
//           onChangeText={setProjectName}
//         />

//         {projectName !== "" && (
//           <TouchableOpacity style={styles.createBox} onPress={handleCreateProject}>
//             <LinearGradient
//               colors={["#5f00be", "#127a6e"]}
//               style={styles.createGradient}
//             >
//               <Text style={styles.createText}>Create "{projectName}"</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={styles.card}>
//         <Text style={styles.label}>Select User</Text>

//         <TextInput
//           placeholder="Search user..."
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={userSearch}
//           onFocus={() => {
//             setShowUserDropdown(true);
//           }}
//           onChangeText={(text) => {
//             setUserSearch(text);
//             setSelectedUser(null);
//             setShowUserDropdown(true);
//           }}
//         />

//         {showUserDropdown && renderUserDropdown()}
//       </View>

//       <View style={styles.card}>
//         <Text style={styles.label}>Project Due Date</Text>

//         <TextInput
//           placeholder="YYYY-MM-DD"
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={dueDate}
//           onChangeText={setDueDate}
//         />
//       </View>

//       <View style={{ marginTop: 20, marginHorizontal: 20, marginBottom: 30 }}>
//         <Button title="Create Project" onPress={handleCreateProject} />
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#d3d7df",
//   },

//   header: {
//     paddingTop: 90,
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
//     marginBottom: 6,
//     backgroundColor: "#081B43",
//     color: "#fff",
//   },

//   dropdown: {
//     maxHeight: 180,
//     marginTop: 5,
//     borderRadius: 10,
//     overflow: "hidden",
//   },

//   dropdownItem: {
//     padding: 10,
//     borderBottomWidth: 0.5,
//     borderColor: "#1E3A8A",
//   },

//   dropdownText: {
//     color: "#fff",
//   },

//   createBox: {
//     marginTop: 10,
//     borderRadius: 10,
//     overflow: "hidden",
//   },

//   createGradient: {
//     padding: 12,
//     alignItems: "center",
//     borderRadius: 10,
//   },

//   createText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },

//   emptyText: {
//     color: "#9CA3AF",
//     marginTop: 8,
//     fontSize: 13,
//   },
// });
