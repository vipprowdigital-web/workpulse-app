import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import Button from "@/components/button";

type UserType = {
  _id: string;
  name: string;
};

export default function CreateProject() {
  const [projectName, setProjectName] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");

        if (!token) {
          Alert.alert("Error", "Login session missing. Please login again.");
          return;
        }

        const userRes = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/user`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const userData = await userRes.json();
        console.log("CREATE PROJECT USERS:", userData);

        setUsers(Array.isArray(userData) ? userData : []);
      } catch (err) {
        console.log("CREATE PROJECT USER FETCH ERROR:", err);
      }
    };

    fetchData();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      Alert.alert("Error", "Enter project name");
      return;
    }

    if (!selectedUser) {
      Alert.alert("Error", "Select user");
      return;
    }

    let formattedDueDate = null;

    if (dueDate.trim()) {
      const parsedDate = new Date(dueDate);

      if (isNaN(parsedDate.getTime())) {
        Alert.alert("Error", "Enter due date in YYYY-MM-DD format");
        return;
      }

      formattedDueDate = parsedDate.toISOString();
    }

    try {
      const token = await SecureStore.getItemAsync("token");
      const adminId = await SecureStore.getItemAsync("adminId");

      if (!token || !adminId) {
        Alert.alert("Error", "Login session missing. Please login again.");
        return;
      }

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          team: null,
          assignedTo: selectedUser,
          dueDate: formattedDueDate,
          createdBy: adminId,
        }),
      });

      const data = await res.json();
      console.log("PROJECT RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data.message || "Failed");
      }

      Alert.alert("Success", "Project Created ✅");

      setProjectName("");
      setUserSearch("");
      setDueDate("");
      setSelectedUser(null);
      setShowUserDropdown(false);
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  const renderUserDropdown = () => (
    <ScrollView
      style={styles.dropdown}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      {filteredUsers.map((item) => (
        <TouchableOpacity
          key={item._id}
          style={styles.dropdownItem}
          onPress={() => {
            setSelectedUser(item._id);
            setUserSearch(item.name);
            setShowUserDropdown(false);
            Keyboard.dismiss();
          }}
        >
          <Text style={styles.dropdownText}>{item.name}</Text>
        </TouchableOpacity>
      ))}

      {userSearch.length > 0 && filteredUsers.length === 0 && (
        <Text style={styles.emptyText}>No user found</Text>
      )}
    </ScrollView>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient colors={["#5f00be", "#127a6e"]} style={styles.header}>
        <Text style={styles.headerText}>Create Project</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.label}>Project Name</Text>

        <TextInput
          placeholder="Enter project name..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={projectName}
          onChangeText={setProjectName}
        />

        {projectName !== "" && (
          <TouchableOpacity style={styles.createBox} onPress={handleCreateProject}>
            <LinearGradient
              colors={["#5f00be", "#127a6e"]}
              style={styles.createGradient}
            >
              <Text style={styles.createText}>Create "{projectName}"</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Select User</Text>

        <TextInput
          placeholder="Search user..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={userSearch}
          onFocus={() => {
            setShowUserDropdown(true);
          }}
          onChangeText={(text) => {
            setUserSearch(text);
            setSelectedUser(null);
            setShowUserDropdown(true);
          }}
        />

        {showUserDropdown && renderUserDropdown()}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Project Due Date</Text>

        <TextInput
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={dueDate}
          onChangeText={setDueDate}
        />
      </View>

      <View style={{ marginTop: 20, marginHorizontal: 20, marginBottom: 30 }}>
        <Button title="Create Project" onPress={handleCreateProject} />
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
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#0F2A5F",
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 15,
    padding: 15,
  },

  label: {
    fontSize: 14,
    color: "#CBD5F5",
    marginBottom: 8,
  },

  input: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    backgroundColor: "#081B43",
    color: "#fff",
  },

  dropdown: {
    maxHeight: 180,
    marginTop: 5,
    borderRadius: 10,
    overflow: "hidden",
  },

  dropdownItem: {
    padding: 10,
    borderBottomWidth: 0.5,
    borderColor: "#1E3A8A",
  },

  dropdownText: {
    color: "#fff",
  },

  createBox: {
    marginTop: 10,
    borderRadius: 10,
    overflow: "hidden",
  },

  createGradient: {
    padding: 12,
    alignItems: "center",
    borderRadius: 10,
  },

  createText: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyText: {
    color: "#9CA3AF",
    marginTop: 8,
    fontSize: 13,
  },
});