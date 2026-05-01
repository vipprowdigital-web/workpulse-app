import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";

type TaskType = {
  _id: string;
  title: string;
  status: "Pending" | "Completed";
  dueDate?: string | null;
  project?: {
    _id: string;
    name: string;
  } | null;
  team?: {
    _id: string;
    name: string;
  } | null;
};

export default function UserHome() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [activeTab, setActiveTab] = useState<"Pending" | "Completed">("Pending");
  const [refreshing, setRefreshing] = useState(false);
   const [adminName, setAdminName] = useState("Aman");
  const [currentDate, setCurrentDate] = useState("Monday, 27 April");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/task`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.log("USER DASHBOARD TASK ERROR:", error);
      Alert.alert("Error", "Tasks fetch nahi ho paayi");
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchTasks();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => task.status === activeTab);
  }, [tasks, activeTab]);

  const pendingCount = useMemo(
    () => tasks.filter((task) => task.status === "Pending").length,
    [tasks]
  );

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === "Completed").length,
    [tasks]
  );

  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return "No due date";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "No due date";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/task/toggle/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Task status update failed");
      }

      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? data : task))
      );
    } catch (error: any) {
      console.log("TOGGLE TASK ERROR:", error);
      Alert.alert("Error", error.message || "Task status update nahi hua");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.islandWrapper}>
        <LinearGradient
          colors={["#5f00be", "#00A693"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.islandCard}
        >
          <View style={styles.topBar}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>U</Text>
              </View>
              <View style={styles.welcomeTextGroup}>
                <Text style={styles.helloText}>Hello, {adminName} 👋</Text>
                                <Text style={styles.dateLabel}>{currentDate}</Text>
              </View>
            </View>

            <View style={styles.rightIcons}>
              <TouchableOpacity style={styles.glassIcon}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                <View style={styles.activeDot} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerFooter}>
            <Text style={styles.motivationText}>
              You have <Text style={{ fontWeight: "bold" }}>{pendingCount}</Text> pending tasks
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Ionicons name="time-outline" size={40} color="#00A693" />
          <Text style={styles.cardTitle}>Pending Tasks</Text>
          <Text style={styles.cardSub}>{pendingCount} tasks waiting</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="checkmark-done-circle" size={40} color="#9B42F2" />
          <Text style={styles.cardTitle}>Completed Tasks</Text>
          <Text style={styles.cardSub}>{completedCount} tasks done</Text>
        </View>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.sectionTitle}>My Tasks</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity onPress={() => setActiveTab("Pending")}>
            <Text style={activeTab === "Pending" ? styles.activeTab : styles.inactiveTab}>
              Pending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab("Completed")}>
            <Text style={activeTab === "Completed" ? styles.activeTab : styles.inactiveTab}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <View key={task._id} style={styles.taskItem}>
              <View style={styles.taskLeft}>
                <Ionicons
                  name={task.status === "Completed" ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={task.status === "Completed" ? "#00A693" : "#3B82F6"}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.taskText}>{task.title}</Text>
                  <Text style={styles.metaText}>
                    {task.project?.name || "No project"} • Due: {formatDueDate(task.dueDate)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  task.status === "Completed" ? styles.completedBtn : styles.pendingBtn,
                ]}
                onPress={() => handleToggleTask(task._id)}
              >
                <Text style={styles.toggleBtnText}>
                  {task.status === "Completed" ? "Completed" : "Mark Complete"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={{ color: "#9CA3AF", marginTop: 10 }}>
            No {activeTab.toLowerCase()} tasks
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d3d7df",
  },
  islandWrapper: {
    paddingHorizontal: 15,
    paddingTop: 80,
    backgroundColor: "#e8eaee",
  },
  islandCard: {
    borderRadius: 25,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  welcomeTextGroup: {
    marginLeft: 12,
  },
  helloText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  dateLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginTop: 2,
  },
  glassIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  activeDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    backgroundColor: "#4ADE80",
    borderRadius: 3,
  },
  headerFooter: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  motivationText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
  },
  card: {
    width: "48%",
    backgroundColor: "#0F2A5F",
    borderRadius: 15,
    padding: 15,
    elevation: 6,
  },
  cardTitle: {
    fontWeight: "bold",
    marginTop: 10,
    color: "#FFFFFF",
  },
  cardSub: {
    color: "#9CA3AF",
    marginBottom: 10,
  },
  statusBox: {
    margin: 15,
    backgroundColor: "#0B1F4B",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 15,
    fontSize: 16,
    color: "#FFFFFF",
  },
  tabRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  activeTab: {
    backgroundColor: "#00A693",
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 10,
  },
  inactiveTab: {
    backgroundColor: "#E5E7EB",
    color: "#111827",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 10,
  },
  taskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  taskText: {
    color: "#E0E7FF",
    fontWeight: "500",
  },
  metaText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 3,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pendingBtn: {
    backgroundColor: "#00A693",
  },
  completedBtn: {
    backgroundColor: "#1E3A8A",
  },
  toggleBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});