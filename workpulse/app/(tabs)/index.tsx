import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/button";
import { useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

type TaskType = {
  _id: string;
  title: string;
  status: "Pending" | "Completed" |"Reassigned";
  dueDate?: string | null;
  createdAt?: string;
  project?: { _id: string; name: string } | null;
  team?: { _id: string; name: string } | null;
};

type ProjectStatusType = {
  _id: string;
  name: string;
  dueDate?: string | null;
  completedPercent: number;
  pendingPercent: number;
  tasks: TaskType[];
};

// ✅ Role load hone tak loading dikhao — race condition fix
export default function Dashboard() {
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      const savedRole = await SecureStore.getItemAsync("role");
      setRole(savedRole === "user" ? "user" : "admin");
    };
    loadRole();
  }, []);

  // Role load hone tak kuch mat dikhao
  if (role === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#d3d7df" }}>
        <ActivityIndicator size="large" color="#5f00be" />
      </View>
    );
  }

  if (role === "user") return <UserDashboard />;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const [projects, setProjects] = useState<ProjectStatusType[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectStatusType | null>(null);
  const [activeTab, setActiveTab] = useState<"Pending" | "Completed">("Pending");
  const [showProjectList, setShowProjectList] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const init = async () => {
      await loadAdminData();
      await fetchProjectStatus();
    };
    init();
  }, []);

  const loadAdminData = async () => {
    const name = await SecureStore.getItemAsync("adminName");
    setAdminName(name || "Admin");
    const today = new Date();
    setCurrentDate(today.toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long",
    }));
  };

  const fetchProjectStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/project/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
        setSelectedProject(data.length > 0 ? data[0] : null);
      }
    } catch (error) {
      console.log("Project status error:", error);
    }
  };

  const filteredTasks = useMemo(() => {
    if (!selectedProject?.tasks) return [];
    return selectedProject.tasks.filter((task) => task.status === activeTab);
  }, [selectedProject, activeTab]);

  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "No due date";
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.islandWrapper}>
        <LinearGradient
          colors={["#5f00be", "#00A693"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.islandCard}
        >
          <View style={styles.topBar}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{adminName.charAt(0).toUpperCase()}</Text>
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
              <TouchableOpacity style={styles.glassIcon} onPress={() => router.push("/(screens)/add-user")}>
                <Ionicons name="person-add-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerFooter}>
            <Text style={styles.motivationText}>
              You have <Text style={{ fontWeight: "bold" }}>{filteredTasks.length}</Text> tasks to review!
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Ionicons name="checkmark-done-circle" size={40} color="#00A693" />
          <Text style={styles.cardTitle}>Assigned Tasks</Text>
          <Text style={styles.cardSub}>Manage tasks</Text>
          <Button title="Assign Tasks" onPress={() => router.push("/(screens)/assigned-tasks")} />
        </View>
        <View style={styles.card}>
          <Ionicons name="folder-open" size={40} color="#9B42F2" />
          <Text style={styles.cardTitle}>Create Project</Text>
          <Text style={styles.cardSub}>Start new project</Text>
          <Button title="Create Project" onPress={() => router.push("/(screens)/create-project")} />
        </View>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.sectionTitle}>
          {selectedProject ? `Project Status - ${selectedProject.name}` : "Project Status"}
        </Text>
        <View style={styles.progressRow}>
          <View style={styles.circleWrapper}>
            <View style={styles.circleOuter}>
              <View style={styles.circleInner}>
                <Text style={styles.percent}>{selectedProject?.completedPercent ?? 0}%</Text>
                <Text style={styles.label}>Completed</Text>
              </View>
            </View>
          </View>
          <View style={styles.circleWrapper}>
            <View style={[styles.circleOuter, { borderColor: "#9B42F2" }]}>
              <View style={styles.circleInner}>
                <Text style={styles.percent}>{selectedProject?.pendingPercent ?? 0}%</Text>
                <Text style={styles.label}>Pending</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity onPress={() => setActiveTab("Pending")}>
            <Text style={activeTab === "Pending" ? styles.activeTab : styles.inactiveTab}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab("Completed")}>
            <Text style={activeTab === "Completed" ? styles.activeTab : styles.inactiveTab}>Completed</Text>
          </TouchableOpacity>
        </View>

        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <View key={task._id} style={styles.taskItem}>
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              <Text style={styles.taskText}>{task.title}</Text>
              <Text style={styles.date}>Due: {formatDueDate(task.dueDate)}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: "#9CA3AF", marginTop: 10 }}>No {activeTab.toLowerCase()} tasks</Text>
        )}

        <View style={{ marginTop: 10 }}>
          <Button
            title={showProjectList ? "Hide Projects" : "View All"}
            onPress={() => setShowProjectList(!showProjectList)}
          />
        </View>

        {showProjectList && (
          <View style={styles.projectDropdown}>
            {projects.length > 0 ? (
              projects.map((project) => {
                const isSelected = selectedProject?._id === project._id;
                return (
                  <TouchableOpacity
                    key={project._id}
                    style={[styles.projectItem, isSelected && styles.selectedProjectItem]}
                    onPress={() => { setSelectedProject(project); setShowProjectList(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.projectName}>{project.name}</Text>
                      <Text style={styles.projectMeta}>
                        {project.completedPercent}% Completed • {project.pendingPercent}% Pending
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.noProjectText}>No projects found</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function UserDashboard() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("User");
  const [currentDate, setCurrentDate] = useState("");
  const [descModalVisible, setDescModalVisible] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [descText, setDescText] = useState("");

  // ✅ await karke sequence mein load karo
  useEffect(() => {
    const init = async () => {
      await loadUserData();
      await fetchTasks();
    };
    init();
  }, []);

  const loadUserData = async () => {
    const name = await SecureStore.getItemAsync("userName");
    setUserName(name || "User");
    const today = new Date();
    setCurrentDate(today.toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long",
    }));
  };

  const fetchTasks = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const userId = await SecureStore.getItemAsync("userId");

      // ✅ token ya userId nahi mila toh silently return
      if (!token || !userId) {
        console.log("Token or userId missing — skipping fetch");
        return;
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/task/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
      else setTasks([]);
    } catch (error) {
      console.log("USER DASHBOARD TASK ERROR:", error);
      // ✅ Alert nahi — silently fail
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

 const pendingTasks = useMemo(
  () => tasks.filter((task) => task.status === "Pending" || task.status === "Reassigned"),
  [tasks]
);
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "Completed"), [tasks]);

  const todayAssignedTasks = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter((t) => t.createdAt && new Date(t.createdAt).toDateString() === today);
  }, [tasks]);

  const oldPendingTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status !== "Pending" || !t.createdAt) return false;
      return Math.floor((Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24)) >= 2;
    });
  }, [tasks]);

  const completionPercent = tasks.length === 0
    ? 0
    : Math.round((completedTasks.length / tasks.length) * 100);

  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "No due date";
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const getPendingDays = (createdAt?: string) => {
    if (!createdAt) return "Assigned recently";
    const diffInDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays <= 0) return "Assigned today";
    if (diffInDays === 1) return "Pending since 1 day";
    return `Pending since ${diffInDays} days`;
  };

  const handleToggleTask = async (taskId: string, description: string) => {
    try {
      console.log("description: ", description);
      
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/task/toggle/${taskId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userDescription: description, }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Task status update failed");
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data : t)));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Task status update nahi hua");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.islandWrapper}>
        <LinearGradient
          colors={["#5f00be", "#00A693"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.islandCard}
        >
          <View style={styles.topBar}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.welcomeTextGroup}>
                <Text style={styles.helloText}>Hello, {userName} 👋</Text>
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
              Your work <Text style={{ fontWeight: "bold" }}>{pendingTasks.length}</Text> is here
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Ionicons name="time-outline" size={40} color="#00A693" />
          <Text style={styles.cardTitle}>Pending Tasks</Text>
          <Text style={styles.cardSub}>{pendingTasks.length} tasks waiting</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="checkmark-done-circle" size={40} color="#9B42F2" />
          <Text style={styles.cardTitle}>Completed Tasks</Text>
          <Text style={styles.cardSub}>{completedTasks.length} tasks done</Text>
        </View>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.sectionTitle}>My Work Analytics</Text>
        <View style={styles.progressRow}>
          <View style={styles.circleWrapper}>
            <View style={styles.circleOuter}>
              <View style={styles.circleInner}>
                <Text style={styles.percent}>{completionPercent}%</Text>
                <Text style={styles.label}>Completed</Text>
              </View>
            </View>
          </View>
          <View style={styles.circleWrapper}>
            <View style={[styles.circleOuter, { borderColor: "#9B42F2" }]}>
              <View style={styles.circleInner}>
                <Text style={styles.percent}>{pendingTasks.length}</Text>
                <Text style={styles.label}>Pending</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>{tasks.length}</Text>
            <Text style={styles.analyticsLabel}>Total Assigned</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>{todayAssignedTasks.length}</Text>
            <Text style={styles.analyticsLabel}>Assigned Today</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>{oldPendingTasks.length}</Text>
            <Text style={styles.analyticsLabel}>Old Pending</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Pending Task Summary</Text>

        {pendingTasks.length > 0 ? (
          pendingTasks.slice(0, 4).map((task) => (
            <View key={task._id} style={styles.userTaskItem}>
              <View style={styles.taskLeft}>
                <Ionicons name="ellipse-outline" size={20} color="#3B82F6" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.taskText}>{task.title}</Text>
                  <Text style={styles.metaText}>
                    {task.project?.name || "No project"} • Due: {formatDueDate(task.dueDate)}
                  </Text>
                  <Text style={styles.metaText}>{getPendingDays(task.createdAt)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, styles.pendingBtn]}
                onPress={() => {
                  setPendingToggleId(task._id);
                  setDescText("");
                  setDescModalVisible(true);
                }}
              >
                <Text style={styles.toggleBtnText}>Mark Complete</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={{ color: "#9CA3AF", marginTop: 10 }}>No pending tasks</Text>
        )}
      </View>

      {/* Description Modal */}
      <Modal
        visible={descModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDescModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" }}
            onPress={() => setDescModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Task Complete karo</Text>
            <Text style={styles.modalSub}>Kya kiya — thoda describe karo (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. API integration complete ki, testing bhi ho gaya..."
              placeholderTextColor="#6B7280"
              multiline
              value={descText}
              onChangeText={setDescText}
              textAlignVertical="top"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setDescModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={async () => {
                  setDescModalVisible(false);
                  if (pendingToggleId) {
                    await handleToggleTask(pendingToggleId, descText.trim());
                    setPendingToggleId(null);
                    setDescText("");
                  }
                }}
              >
                <LinearGradient colors={["#00A693", "#007A6E"]} style={styles.modalBtnGrad}>
                  <Text style={styles.modalBtnConfirmText}>Mark Complete ✓</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#d3d7df" },
  islandWrapper: { paddingHorizontal: 15, paddingTop: 80, backgroundColor: "#e8eaee" },
  islandCard: {
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
  profileSection: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 45, height: 45, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  welcomeTextGroup: { marginLeft: 12 },
  helloText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  dateLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  glassIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", marginLeft: 8 },
  activeDot: { position: "absolute", top: 10, right: 10, width: 6, height: 6, backgroundColor: "#4ADE80", borderRadius: 3 },
  headerFooter: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" },
  motivationText: { color: "rgba(255,255,255,0.9)", fontSize: 13, letterSpacing: 0.3 },
  rightIcons: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  cardRow: { flexDirection: "row", justifyContent: "space-between", padding: 15 },
  card: { width: "48%", backgroundColor: "#0F2A5F", borderRadius: 15, padding: 15, elevation: 6 },
  cardTitle: { fontWeight: "bold", marginTop: 10, color: "#FFFFFF" },
  cardSub: { color: "#9CA3AF", marginBottom: 10 },
  statusBox: { margin: 15, backgroundColor: "#0B1F4B", borderRadius: 20, padding: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
  sectionTitle: { fontWeight: "bold", marginBottom: 15, fontSize: 16, color: "#FFFFFF" },
  progressRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 15 },
  circleWrapper: { alignItems: "center" },
  circleOuter: { width: 110, height: 110, borderRadius: 55, borderWidth: 8, borderColor: "#00A693", justifyContent: "center", alignItems: "center" },
  circleInner: { alignItems: "center" },
  percent: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
  label: { color: "#9CA3AF" },
  tabRow: { flexDirection: "row", marginBottom: 10 },
  activeTab: { backgroundColor: "#00A693", color: "#fff", paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10, marginRight: 10 },
  inactiveTab: { backgroundColor: "#E5E7EB", color: "#111827", paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10, marginRight: 10 },
  taskItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" },
  userTaskItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" },
  taskLeft: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 },
  taskText: { flex: 1, marginLeft: 10, color: "#E0E7FF", fontWeight: "500" },
  metaText: { color: "#9CA3AF", fontSize: 12, marginTop: 3 },
  date: { fontSize: 12, color: "#9CA3AF" },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  pendingBtn: { backgroundColor: "#00A693" },
  completedBtn: { backgroundColor: "#1E3A8A" },
  toggleBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  analyticsGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  analyticsItem: { width: "31%", backgroundColor: "#081B43", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, alignItems: "center" },
  analyticsValue: { color: "#FFFFFF", fontWeight: "800", fontSize: 18 },
  analyticsLabel: { color: "#9CA3AF", fontSize: 11, textAlign: "center", marginTop: 4 },
  projectDropdown: { marginTop: 12, backgroundColor: "#081B43", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  projectItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" },
  selectedProjectItem: { backgroundColor: "#12306B", borderRadius: 10 },
  projectName: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
  projectMeta: { color: "#9CA3AF", fontSize: 12, marginTop: 3 },
  noProjectText: { color: "#9CA3AF", textAlign: "center", paddingVertical: 10 },
  modalSheet: { backgroundColor: "#0B1F4B", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHandle: { width: 36, height: 4, backgroundColor: "#374151", borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  modalTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  modalSub: { color: "#9CA3AF", fontSize: 12, marginBottom: 16, lineHeight: 18 },
  modalInput: { borderWidth: 1, borderColor: "#374151", borderRadius: 12, padding: 12, fontSize: 13, color: "#FFFFFF", height: 100, backgroundColor: "#081B43" },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalBtnCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 0.5, borderColor: "#374151", alignItems: "center", justifyContent: "center" },
  modalBtnCancelText: { color: "#9CA3AF", fontWeight: "600", fontSize: 13 },
  modalBtnConfirm: { flex: 2, borderRadius: 12, overflow: "hidden" },
  modalBtnGrad: { paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  modalBtnConfirmText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
});


// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   RefreshControl,
//   Modal,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   TextInput,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { Ionicons } from "@expo/vector-icons";
// import Button from "@/components/button";
// import { useEffect, useMemo, useState } from "react";
// import * as SecureStore from "expo-secure-store";
// import { router } from "expo-router";

// type TaskType = {
//   _id: string;
//   title: string;
//   status: "Pending" | "Completed";
//   dueDate?: string | null;
//   createdAt?: string;
//   project?: {
//     _id: string;
//     name: string;
//   } | null;
//   team?: {
//     _id: string;
//     name: string;
//   } | null;
// };

// type ProjectStatusType = {
//   _id: string;
//   name: string;
//   dueDate?: string | null;
//   completedPercent: number;
//   pendingPercent: number;
//   tasks: TaskType[];
// };

// export default function Dashboard() {
//   const [role, setRole] = useState<"admin" | "user">("admin");

//   useEffect(() => {
//     const loadRole = async () => {
//       const savedRole = await SecureStore.getItemAsync("role");
//       setRole(savedRole === "user" ? "user" : "admin");
//     };

//     loadRole();
//   }, []);

//   if (role === "user") {
//     return <UserDashboard />;
//   }

//   return <AdminDashboard />;
// }

// function AdminDashboard() {
//   const [projects, setProjects] = useState<ProjectStatusType[]>([]);
//   const [selectedProject, setSelectedProject] =
//     useState<ProjectStatusType | null>(null);
//   const [activeTab, setActiveTab] = useState<"Pending" | "Completed">(
//     "Pending"
//   );
//   const [showProjectList, setShowProjectList] = useState(false);

//   const [adminName, setAdminName] = useState("Admin");
//   const [currentDate, setCurrentDate] = useState("");

//   useEffect(() => {
//     fetchProjectStatus();
//     loadAdminData();
//   }, []);

//   const loadAdminData = async () => {
//     const name = await SecureStore.getItemAsync("adminName");
//     setAdminName(name || "Admin");

//     const today = new Date();
//     const formattedDate = today.toLocaleDateString("en-IN", {
//       weekday: "long",
//       day: "numeric",
//       month: "long",
//     });
//     setCurrentDate(formattedDate);
//   };

//   const fetchProjectStatus = async () => {
//     try {
//       const token = await SecureStore.getItemAsync("token");

//       const res = await fetch(
//         `${process.env.EXPO_PUBLIC_API_URL}/api/project/status`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const data = await res.json();

//       if (Array.isArray(data)) {
//         setProjects(data);
//         setSelectedProject(data.length > 0 ? data[0] : null);
//       }
//     } catch (error) {
//       console.log("Project status error:", error);
//     }
//   };

//   const filteredTasks = useMemo(() => {
//     if (!selectedProject?.tasks) return [];
//     return selectedProject.tasks.filter((task) => task.status === activeTab);
//   }, [selectedProject, activeTab]);

//   const formatDueDate = (dateString?: string | null) => {
//     if (!dateString) return "No due date";
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return "No due date";
//     return date.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//     });
//   };

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={{ paddingBottom: 20 }}
//     >
//       <View style={styles.islandWrapper}>
//         <LinearGradient
//           colors={["#5f00be", "#00A693"]}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.islandCard}
//         >
//           <View style={styles.topBar}>
//             <View style={styles.profileSection}>
//               <View style={styles.avatar}>
//                 <Text style={styles.avatarText}>
//                   {adminName.charAt(0).toUpperCase()}
//                 </Text>
//               </View>

//               <View style={styles.welcomeTextGroup}>
//                 <Text style={styles.helloText}>Hello, {adminName} 👋</Text>
//                 <Text style={styles.dateLabel}>{currentDate}</Text>
//               </View>
//             </View>

//             <View style={styles.rightIcons}>
//               <TouchableOpacity style={styles.glassIcon}>
//                 <Ionicons name="notifications-outline" size={20} color="#fff" />
//                 <View style={styles.activeDot} />
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.glassIcon}
//                 onPress={() => router.push("/(screens)/add-user")}
//               >
//                 <Ionicons name="person-add-outline" size={20} color="#fff" />
//               </TouchableOpacity>
//             </View>
//           </View>

//           <View style={styles.headerFooter}>
//             <Text style={styles.motivationText}>
//               You have{" "}
//               <Text style={{ fontWeight: "bold" }}>
//                 {filteredTasks.length}
//               </Text>{" "}
//               tasks to review!
//             </Text>
//           </View>
//         </LinearGradient>
//       </View>

//       <View style={styles.cardRow}>
//         <View style={styles.card}>
//           <Ionicons name="checkmark-done-circle" size={40} color="#00A693" />
//           <Text style={styles.cardTitle}>Assigned Tasks</Text>
//           <Text style={styles.cardSub}>Manage  tasks</Text>
//           <Button
//             title="Assign Tasks"
//             onPress={() => router.push("/(screens)/assigned-tasks")}
//           />
//         </View>

//         <View style={styles.card}>
//           <Ionicons name="folder-open" size={40} color="#9B42F2" />
//           <Text style={styles.cardTitle}>Create Project</Text>
//           <Text style={styles.cardSub}>Start new project</Text>
//           <Button
//             title="Create Project"
//             onPress={() => router.push("/(screens)/create-project")}
//           />
//         </View>
//       </View>

//       <View style={styles.statusBox}>
//         <Text style={styles.sectionTitle}>
//           {selectedProject
//             ? `Project Status - ${selectedProject.name}`
//             : "Project Status"}
//         </Text>

//         <View style={styles.progressRow}>
//           <View style={styles.circleWrapper}>
//             <View style={styles.circleOuter}>
//               <View style={styles.circleInner}>
//                 <Text style={styles.percent}>
//                   {selectedProject?.completedPercent ?? 0}%
//                 </Text>
//                 <Text style={styles.label}>Completed</Text>
//               </View>
//             </View>
//           </View>

//           <View style={styles.circleWrapper}>
//             <View style={[styles.circleOuter, { borderColor: "#9B42F2" }]}>
//               <View style={styles.circleInner}>
//                 <Text style={styles.percent}>
//                   {selectedProject?.pendingPercent ?? 0}%
//                 </Text>
//                 <Text style={styles.label}>Pending</Text>
//               </View>
//             </View>
//           </View>
//         </View>

//         <View style={styles.tabRow}>
//           <TouchableOpacity onPress={() => setActiveTab("Pending")}>
//             <Text
//               style={
//                 activeTab === "Pending" ? styles.activeTab : styles.inactiveTab
//               }
//             >
//               Pending
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity onPress={() => setActiveTab("Completed")}>
//             <Text
//               style={
//                 activeTab === "Completed"
//                   ? styles.activeTab
//                   : styles.inactiveTab
//               }
//             >
//               Completed
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {filteredTasks.length > 0 ? (
//           filteredTasks.map((task) => (
//             <View key={task._id} style={styles.taskItem}>
//               <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
//               <Text style={styles.taskText}>{task.title}</Text>
//               <Text style={styles.date}>
//                 Due: {formatDueDate(task.dueDate)}
//               </Text>
//             </View>
//           ))
//         ) : (
//           <Text style={{ color: "#9CA3AF", marginTop: 10 }}>
//             No {activeTab.toLowerCase()} tasks
//           </Text>
//         )}

//         <View style={{ marginTop: 10 }}>
//           <Button
//             title={showProjectList ? "Hide Projects" : "View All"}
//             onPress={() => setShowProjectList(!showProjectList)}
//           />
//         </View>

//         {showProjectList && (
//           <View style={styles.projectDropdown}>
//             {projects.length > 0 ? (
//               projects.map((project) => {
//                 const isSelected = selectedProject?._id === project._id;

//                 return (
//                   <TouchableOpacity
//                     key={project._id}
//                     style={[
//                       styles.projectItem,
//                       isSelected && styles.selectedProjectItem,
//                     ]}
//                     onPress={() => {
//                       setSelectedProject(project);
//                       setShowProjectList(false);
//                     }}
//                   >
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.projectName}>{project.name}</Text>
//                       <Text style={styles.projectMeta}>
//                         {project.completedPercent}% Completed •{" "}
//                         {project.pendingPercent}% Pending
//                       </Text>
//                     </View>
//                     <Ionicons name="chevron-forward" size={18} color="#fff" />
//                   </TouchableOpacity>
//                 );
//               })
//             ) : (
//               <Text style={styles.noProjectText}>No projects found</Text>
//             )}
//           </View>
//         )}
//       </View>
//     </ScrollView>
//   );
// }

// function UserDashboard() {
//   const [tasks, setTasks] = useState<TaskType[]>([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const [userName, setUserName] = useState("User");
//   const [currentDate, setCurrentDate] = useState("");

//   // ✅ Description modal states
//   const [descModalVisible, setDescModalVisible] = useState(false);
//   const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
//   const [descText, setDescText] = useState("");

// useEffect(() => {
//   const init = async () => {
//     await loadUserData();
//     await fetchTasks();
//   };
//   init();
// }, []);

//   const loadUserData = async () => {
//     const name = await SecureStore.getItemAsync("userName");
//     setUserName(name || "User");

//     const today = new Date();
//     const formattedDate = today.toLocaleDateString("en-IN", {
//       weekday: "long",
//       day: "numeric",
//       month: "long",
//     });
//     setCurrentDate(formattedDate);
//   };

//   const fetchTasks = async () => {
//     try {
//       const token = await SecureStore.getItemAsync("token");
//       const userId = await SecureStore.getItemAsync("userId"); // ✅ same API as tasks.tsx

//       if (!userId) return;

//       const res = await fetch(
//         `${process.env.EXPO_PUBLIC_API_URL}/api/task/user/${userId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const data = await res.json();

//       if (Array.isArray(data)) {
//         setTasks(data);
//       } else {
//         setTasks([]);
//       }
//     } catch (error) {
//       console.log("USER DASHBOARD TASK ERROR:", error);
//     }
//   };

//   const onRefresh = async () => {
//     try {
//       setRefreshing(true);
//       await fetchTasks();
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const pendingTasks = useMemo(
//     () => tasks.filter((task) => task.status === "Pending"),
//     [tasks]
//   );

//   const completedTasks = useMemo(
//     () => tasks.filter((task) => task.status === "Completed"),
//     [tasks]
//   );

//   const todayAssignedTasks = useMemo(() => {
//     const today = new Date().toDateString();
//     return tasks.filter((task) => {
//       if (!task.createdAt) return false;
//       return new Date(task.createdAt).toDateString() === today;
//     });
//   }, [tasks]);

//   const oldPendingTasks = useMemo(() => {
//     return tasks.filter((task) => {
//       if (task.status !== "Pending" || !task.createdAt) return false;
//       const diffInDays = Math.floor(
//         (Date.now() - new Date(task.createdAt).getTime()) /
//           (1000 * 60 * 60 * 24)
//       );
//       return diffInDays >= 2;
//     });
//   }, [tasks]);

//   const completionPercent =
//     tasks.length === 0
//       ? 0
//       : Math.round((completedTasks.length / tasks.length) * 100);

//   const formatDueDate = (dateString?: string | null) => {
//     if (!dateString) return "No due date";
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return "No due date";
//     return date.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//     });
//   };

//   const getPendingDays = (createdAt?: string) => {
//     if (!createdAt) return "Assigned recently";
//     const diffInDays = Math.floor(
//       (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
//     );
//     if (diffInDays <= 0) return "Assigned today";
//     if (diffInDays === 1) return "Pending since 1 day";
//     return `Pending since ${diffInDays} days`;
//   };

//   // ✅ description ke saath toggle — admin feed mein dikhega
//   const handleToggleTask = async (taskId: string, description: string) => {
//     try {
//       const token = await SecureStore.getItemAsync("token");

//       const res = await fetch(
//         `${process.env.EXPO_PUBLIC_API_URL}/api/task/toggle/${taskId}`,
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ userDescription: description }),
//         }
//       );

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.message || "Task status update failed");
//       }

//       setTasks((prev) =>
//         prev.map((task) => (task._id === taskId ? data : task))
//       );
//     } catch (error: any) {
//       Alert.alert("Error", error.message || "Task status update nahi hua");
//     }
//   };

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={{ paddingBottom: 20 }}
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//       }
//     >
//       <View style={styles.islandWrapper}>
//         <LinearGradient
//           colors={["#5f00be", "#00A693"]}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.islandCard}
//         >
//           <View style={styles.topBar}>
//             <View style={styles.profileSection}>
//               <View style={styles.avatar}>
//                 <Text style={styles.avatarText}>
//                   {userName.charAt(0).toUpperCase()}
//                 </Text>
//               </View>

//               <View style={styles.welcomeTextGroup}>
//                 <Text style={styles.helloText}>Hello, {userName} 👋</Text>
//                 <Text style={styles.dateLabel}>{currentDate}</Text>
//               </View>
//             </View>

//             <View style={styles.rightIcons}>
//               <TouchableOpacity style={styles.glassIcon}>
//                 <Ionicons name="notifications-outline" size={20} color="#fff" />
//                 <View style={styles.activeDot} />
//               </TouchableOpacity>
//             </View>
//           </View>

//           <View style={styles.headerFooter}>
//             <Text style={styles.motivationText}>
//               Your work{" "}
//               <Text style={{ fontWeight: "bold" }}>{pendingTasks.length}</Text>{" "}
//               is here
//             </Text>
//           </View>
//         </LinearGradient>
//       </View>

//       <View style={styles.cardRow}>
//         <View style={styles.card}>
//           <Ionicons name="time-outline" size={40} color="#00A693" />
//           <Text style={styles.cardTitle}>Pending Tasks</Text>
//           <Text style={styles.cardSub}>
//             {pendingTasks.length} tasks waiting
//           </Text>
//         </View>

//         <View style={styles.card}>
//           <Ionicons name="checkmark-done-circle" size={40} color="#9B42F2" />
//           <Text style={styles.cardTitle}>Completed Tasks</Text>
//           <Text style={styles.cardSub}>
//             {completedTasks.length} tasks done
//           </Text>
//         </View>
//       </View>

//       <View style={styles.statusBox}>
//         <Text style={styles.sectionTitle}>My Work Analytics</Text>

//         <View style={styles.progressRow}>
//           <View style={styles.circleWrapper}>
//             <View style={styles.circleOuter}>
//               <View style={styles.circleInner}>
//                 <Text style={styles.percent}>{completionPercent}%</Text>
//                 <Text style={styles.label}>Completed</Text>
//               </View>
//             </View>
//           </View>

//           <View style={styles.circleWrapper}>
//             <View style={[styles.circleOuter, { borderColor: "#9B42F2" }]}>
//               <View style={styles.circleInner}>
//                 <Text style={styles.percent}>{pendingTasks.length}</Text>
//                 <Text style={styles.label}>Pending</Text>
//               </View>
//             </View>
//           </View>
//         </View>

//         <View style={styles.analyticsGrid}>
//           <View style={styles.analyticsItem}>
//             <Text style={styles.analyticsValue}>{tasks.length}</Text>
//             <Text style={styles.analyticsLabel}>Total Assigned</Text>
//           </View>

//           <View style={styles.analyticsItem}>
//             <Text style={styles.analyticsValue}>
//               {todayAssignedTasks.length}
//             </Text>
//             <Text style={styles.analyticsLabel}>Assigned Today</Text>
//           </View>

//           <View style={styles.analyticsItem}>
//             <Text style={styles.analyticsValue}>
//               {oldPendingTasks.length}
//             </Text>
//             <Text style={styles.analyticsLabel}>Old Pending</Text>
//           </View>
//         </View>

//         <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
//           Pending Task Summary
//         </Text>

//         {pendingTasks.length > 0 ? (
//           pendingTasks.slice(0, 4).map((task) => (
//             <View key={task._id} style={styles.userTaskItem}>
//               <View style={styles.taskLeft}>
//                 <Ionicons name="ellipse-outline" size={20} color="#3B82F6" />

//                 <View style={{ marginLeft: 10, flex: 1 }}>
//                   <Text style={styles.taskText}>{task.title}</Text>
//                   <Text style={styles.metaText}>
//                     {task.project?.name || "No project"} • Due:{" "}
//                     {formatDueDate(task.dueDate)}
//                   </Text>
//                   <Text style={styles.metaText}>
//                     {getPendingDays(task.createdAt)}
//                   </Text>
//                 </View>
//               </View>

//               {/* ✅ Button ab modal open karta hai */}
//               <TouchableOpacity
//                 style={[styles.toggleBtn, styles.pendingBtn]}
//                 onPress={() => {
//                   setPendingToggleId(task._id);
//                   setDescText("");
//                   setDescModalVisible(true);
//                 }}
//               >
//                 <Text style={styles.toggleBtnText}>Mark Complete</Text>
//               </TouchableOpacity>
//             </View>
//           ))
//         ) : (
//           <Text style={{ color: "#9CA3AF", marginTop: 10 }}>
//             No pending tasks
//           </Text>
//         )}
//       </View>

//       {/* ✅ Description Modal — user yahan description likhta hai */}
//       <Modal
//         visible={descModalVisible}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setDescModalVisible(false)}
//       >
//         <KeyboardAvoidingView
//           style={{ flex: 1, justifyContent: "flex-end" }}
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//         >
//           <Pressable
//             style={{
//               ...StyleSheet.absoluteFillObject,
//               backgroundColor: "rgba(0,0,0,0.45)",
//             }}
//             onPress={() => setDescModalVisible(false)}
//           />

//           <View style={styles.modalSheet}>
//             <View style={styles.modalHandle} />

//             <Text style={styles.modalTitle}>Task Complete karo</Text>
//             <Text style={styles.modalSub}>
//               Kya kiya — thoda describe karo (optional)
//             </Text>

//             <TextInput
//               style={styles.modalInput}
//               placeholder="e.g. API integration complete ki, testing bhi ho gaya..."
//               placeholderTextColor="#6B7280"
//               multiline
//               value={descText}
//               onChangeText={setDescText}
//               textAlignVertical="top"
//             />

//             <View style={styles.modalBtns}>
//               <TouchableOpacity
//                 style={styles.modalBtnCancel}
//                 onPress={() => setDescModalVisible(false)}
//               >
//                 <Text style={styles.modalBtnCancelText}>Cancel</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.modalBtnConfirm}
//                 onPress={async () => {
//                   setDescModalVisible(false);
//                   if (pendingToggleId) {
//                     await handleToggleTask(pendingToggleId, descText.trim());
//                     setPendingToggleId(null);
//                     setDescText("");
//                   }
//                 }}
//               >
//                 <LinearGradient
//                   colors={["#00A693", "#007A6E"]}
//                   style={styles.modalBtnGrad}
//                 >
//                   <Text style={styles.modalBtnConfirmText}>
//                     Mark Complete ✓
//                   </Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#d3d7df",
//   },
//   islandWrapper: {
//     paddingHorizontal: 15,
//     paddingTop: 80,
//     backgroundColor: "#e8eaee",
//   },
//   islandCard: {
//     borderRadius: 25,
//     padding: 20,
//     backgroundColor: "rgba(255,255,255,0.05)",
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.08)",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.3,
//     shadowRadius: 15,
//     elevation: 12,
//     paddingVertical: 20,    // Upar-neeche 20 rahega
//     paddingHorizontal: 12,
//   },
//   topBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     width: '100%',
//   },
//   profileSection: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   avatar: {
//     width: 45,
//     height: 45,
//     borderRadius: 15,
//     backgroundColor: "rgba(255, 255, 255, 0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.3)",
//   },
//   avatarText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   welcomeTextGroup: {
//     marginLeft: 12,
//   },
//   helloText: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "800",
//   },
//   dateLabel: {
//     color: "rgba(255, 255, 255, 0.7)",
//     fontSize: 12,
//     marginTop: 2,
//   },
//   glassIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 12,
//     backgroundColor: "rgba(255, 255, 255, 0.15)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginLeft: 8,
   
//   },
//   activeDot: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     width: 6,
//     height: 6,
//     backgroundColor: "#4ADE80",
//     borderRadius: 3,
//   },
//   headerFooter: {
//     marginTop: 20,
//     paddingTop: 15,
//     borderTopWidth: 1,
//     borderTopColor: "rgba(255, 255, 255, 0.1)",
//   },
//   motivationText: {
//     color: "rgba(255, 255, 255, 0.9)",
//     fontSize: 13,
//     letterSpacing: 0.3,
//   },
//   rightIcons: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "flex-end", // Icons ko right side push karega
//   },
//   cardRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 15,
//   },
//   card: {
//     width: "48%",
//     backgroundColor: "#0F2A5F",
//     borderRadius: 15,
//     padding: 15,
//     elevation: 6,
//   },
//   cardTitle: {
//     fontWeight: "bold",
//     marginTop: 10,
//     color: "#FFFFFF",
//   },
//   cardSub: {
//     color: "#9CA3AF",
//     marginBottom: 10,
//   },
//   statusBox: {
//     margin: 15,
//     backgroundColor: "#0B1F4B",
//     borderRadius: 20,
//     padding: 15,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.05)",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.4,
//     shadowRadius: 15,
//     elevation: 8,
//   },
//   sectionTitle: {
//     fontWeight: "bold",
//     marginBottom: 15,
//     fontSize: 16,
//     color: "#FFFFFF",
//   },
//   progressRow: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     marginBottom: 15,
//   },
//   circleWrapper: {
//     alignItems: "center",
//   },
//   circleOuter: {
//     width: 110,
//     height: 110,
//     borderRadius: 55,
//     borderWidth: 8,
//     borderColor: "#00A693",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   circleInner: {
//     alignItems: "center",
//   },
//   percent: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#FFFFFF",
//   },
//   label: {
//     color: "#9CA3AF",
//   },
//   tabRow: {
//     flexDirection: "row",
//     marginBottom: 10,
//   },
//   activeTab: {
//     backgroundColor: "#00A693",
//     color: "#fff",
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//     borderRadius: 10,
//     marginRight: 10,
//   },
//   inactiveTab: {
//     backgroundColor: "#E5E7EB",
//     color: "#111827",
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//     borderRadius: 10,
//     marginRight: 10,
//   },
//   taskItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 10,
//     borderBottomWidth: 0.5,
//     borderColor: "rgba(255,255,255,0.08)",
//   },
//   userTaskItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 12,
//     borderBottomWidth: 0.5,
//     borderColor: "rgba(255,255,255,0.08)",
//   },
//   taskLeft: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//     marginRight: 10,
//   },
//   taskText: {
//     flex: 1,
//     marginLeft: 10,
//     color: "#E0E7FF",
//     fontWeight: "500",
//   },
//   metaText: {
//     color: "#9CA3AF",
//     fontSize: 12,
//     marginTop: 3,
//   },
//   date: {
//     fontSize: 12,
//     color: "#9CA3AF",
//   },
//   toggleBtn: {
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   pendingBtn: {
//     backgroundColor: "#00A693",
//   },
//   completedBtn: {
//     backgroundColor: "#1E3A8A",
//   },
//   toggleBtnText: {
//     color: "#fff",
//     fontSize: 12,
//     fontWeight: "bold",
//   },
//   analyticsGrid: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 10,
//   },
//   analyticsItem: {
//     width: "31%",
//     backgroundColor: "#081B43",
//     borderRadius: 12,
//     paddingVertical: 12,
//     paddingHorizontal: 8,
//     alignItems: "center",
//   },
//   analyticsValue: {
//     color: "#FFFFFF",
//     fontWeight: "800",
//     fontSize: 18,
//   },
//   analyticsLabel: {
//     color: "#9CA3AF",
//     fontSize: 11,
//     textAlign: "center",
//     marginTop: 4,
//   },
//   projectDropdown: {
//     marginTop: 12,
//     backgroundColor: "#081B43",
//     borderRadius: 14,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//   },
//   projectItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingVertical: 12,
//     paddingHorizontal: 8,
//     borderBottomWidth: 0.5,
//     borderColor: "rgba(255,255,255,0.08)",
//   },
//   selectedProjectItem: {
//     backgroundColor: "#12306B",
//     borderRadius: 10,
//   },
//   projectName: {
//     color: "#FFFFFF",
//     fontWeight: "bold",
//     fontSize: 14,
//   },
//   projectMeta: {
//     color: "#9CA3AF",
//     fontSize: 12,
//     marginTop: 3,
//   },
//   noProjectText: {
//     color: "#9CA3AF",
//     textAlign: "center",
//     paddingVertical: 10,
//   },

//   // ✅ Modal styles
//   modalSheet: {
//     backgroundColor: "#0B1F4B",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     padding: 20,
//     paddingBottom: 36,
//   },
//   modalHandle: {
//     width: 36,
//     height: 4,
//     backgroundColor: "#374151",
//     borderRadius: 2,
//     alignSelf: "center",
//     marginBottom: 18,
//   },
//   modalTitle: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//     marginBottom: 4,
//   },
//   modalSub: {
//     color: "#9CA3AF",
//     fontSize: 12,
//     marginBottom: 16,
//     lineHeight: 18,
//   },
//   modalInput: {
//     borderWidth: 1,
//     borderColor: "#374151",
//     borderRadius: 12,
//     padding: 12,
//     fontSize: 13,
//     color: "#FFFFFF",
//     height: 100,
//     backgroundColor: "#081B43",
//   },
//   modalBtns: {
//     flexDirection: "row",
//     gap: 10,
//     marginTop: 14,
//   },
//   modalBtnCancel: {
//     flex: 1,
//     paddingVertical: 13,
//     borderRadius: 12,
//     borderWidth: 0.5,
//     borderColor: "#374151",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   modalBtnCancelText: {
//     color: "#9CA3AF",
//     fontWeight: "600",
//     fontSize: 13,
//   },
//   modalBtnConfirm: {
//     flex: 2,
//     borderRadius: 12,
//     overflow: "hidden",
//   },
//   modalBtnGrad: {
//     paddingVertical: 13,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   modalBtnConfirmText: {
//     color: "#FFFFFF",
//     fontWeight: "700",
//     fontSize: 13,
//   },
// });


// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { Ionicons } from "@expo/vector-icons";
// import Button from "@/components/button";
// import { useEffect, useMemo, useState } from "react";
// import * as SecureStore from "expo-secure-store";
// import { router } from "expo-router";

// type TaskType = {
//   _id: string;
//   title: string;
//   status: "Pending" | "Completed";
//   dueDate?: string | null;
// };

// type ProjectStatusType = {
//   _id: string;
//   name: string;
//   dueDate?: string | null;
//   completedPercent: number;
//   pendingPercent: number;
//   tasks: TaskType[];
// };

// export default function Dashboard() {
//   const [projects, setProjects] = useState<ProjectStatusType[]>([]);
//   const [selectedProject, setSelectedProject] =
//     useState<ProjectStatusType | null>(null);
//   const [activeTab, setActiveTab] = useState<"Pending" | "Completed">(
//     "Pending"
//   );
//   const [showProjectList, setShowProjectList] = useState(false);

//   const [displayName, setDisplayName] = useState("Admin");
//   const [role, setRole] = useState<"admin" | "user">("admin");
//   const [currentDate, setCurrentDate] = useState("");

//   useEffect(() => {
//     loadData();
//     fetchProjectStatus();
//   }, []);

//   const loadData = async () => {
//     const storedRole = await SecureStore.getItemAsync("role");
//     const adminName = await SecureStore.getItemAsync("adminName");
//     const userName = await SecureStore.getItemAsync("userName");

//     const finalRole = storedRole === "user" ? "user" : "admin";
//     setRole(finalRole);

//     if (finalRole === "user") {
//       setDisplayName(userName || "User");
//     } else {
//       setDisplayName(adminName || "Admin");
//     }

//     const today = new Date();
//     const formattedDate = today.toLocaleDateString("en-IN", {
//       weekday: "long",
//       day: "numeric",
//       month: "long",
//     });

//     setCurrentDate(formattedDate);
//   };

//   const fetchProjectStatus = async () => {
//     try {
//       const token = await SecureStore.getItemAsync("token");

//       const res = await fetch(
//         `${process.env.EXPO_PUBLIC_API_URL}/api/project/status`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const data = await res.json();

//       if (Array.isArray(data)) {
//         setProjects(data);
//         setSelectedProject(data.length > 0 ? data[0] : null);
//       }
//     } catch (error) {
//       console.log("Project status error:", error);
//     }
//   };

//   const filteredTasks = useMemo(() => {
//     if (!selectedProject?.tasks) return [];
//     return selectedProject.tasks.filter((task) => task.status === activeTab);
//   }, [selectedProject, activeTab]);

//   const allTasks = useMemo(() => {
//     return projects.flatMap((project) => project.tasks || []);
//   }, [projects]);

//   const pendingTasks = allTasks.filter((task) => task.status === "Pending");
//   const completedTasks = allTasks.filter((task) => task.status === "Completed");

//   const userFilteredTasks =
//     activeTab === "Pending" ? pendingTasks : completedTasks;

//   const formatDueDate = (dateString?: string | null) => {
//     if (!dateString) return "No due date";
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return "No due date";

//     return date.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//     });
//   };

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={{ paddingBottom: 20 }}
//     >
//       <View style={styles.islandWrapper}>
//         <LinearGradient
//           colors={["#5f00be", "#00A693"]}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.islandCard}
//         >
//           <View style={styles.topBar}>
//             <View style={styles.profileSection}>
//               <View style={styles.avatar}>
//                 <Text style={styles.avatarText}>
//                   {displayName.charAt(0).toUpperCase()}
//                 </Text>
//               </View>

//               <View style={styles.welcomeTextGroup}>
//                 <Text style={styles.helloText}>Hello, {displayName} 👋</Text>
//                 <Text style={styles.dateLabel}>{currentDate}</Text>
//               </View>
//             </View>

//             <View style={styles.rightIcons}>
//               <TouchableOpacity style={styles.glassIcon}>
//                 <Ionicons name="notifications-outline" size={20} color="#fff" />
//                 <View style={styles.activeDot} />
//               </TouchableOpacity>

//               {role === "admin" && (
//                 <TouchableOpacity
//                   style={styles.glassIcon}
//                   onPress={() => router.push("/(screens)/add-user")}
//                 >
//                   <Ionicons name="person-add-outline" size={20} color="#fff" />
//                 </TouchableOpacity>
//               )}
//             </View>
//           </View>

//           <View style={styles.headerFooter}>
//             <Text style={styles.motivationText}>
//               You have{" "}
//               <Text style={{ fontWeight: "bold" }}>
//                 {role === "admin" ? filteredTasks.length : pendingTasks.length}
//               </Text>{" "}
//               {role === "admin" ? "tasks to review!" : "pending tasks"}
//             </Text>
//           </View>
//         </LinearGradient>
//       </View>

//       <View style={styles.cardRow}>
//         {role === "admin" ? (
//           <>
//             <View style={styles.card}>
//               <Ionicons
//                 name="checkmark-done-circle"
//                 size={40}
//                 color="#00A693"
//               />
//               <Text style={styles.cardTitle}>Assigned Tasks</Text>
//               <Text style={styles.cardSub}>Manage project tasks</Text>
//               <Button
//                 title="Assign Tasks"
//                 onPress={() => router.push("/(screens)/assigned-tasks")}
//               />
//             </View>

//             <View style={styles.card}>
//               <Ionicons name="folder-open" size={40} color="#9B42F2" />
//               <Text style={styles.cardTitle}>Create Project</Text>
//               <Text style={styles.cardSub}>Start new project</Text>
//               <Button
//                 title="Create Project"
//                 onPress={() => router.push("/(screens)/create-project")}
//               />
//             </View>
//           </>
//         ) : (
//           <>
//             <View style={styles.card}>
//               <Ionicons name="time-outline" size={40} color="#00A693" />
//               <Text style={styles.cardTitle}>Pending Tasks</Text>
//               <Text style={styles.cardSub}>
//                 {pendingTasks.length} tasks waiting
//               </Text>
//             </View>

//             <View style={styles.card}>
//               <Ionicons
//                 name="checkmark-done-circle"
//                 size={40}
//                 color="#9B42F2"
//               />
//               <Text style={styles.cardTitle}>Completed Tasks</Text>
//               <Text style={styles.cardSub}>
//                 {completedTasks.length} tasks done
//               </Text>
//             </View>
//           </>
//         )}
//       </View>

//       {role === "admin" ? (
//         <View style={styles.statusBox}>
//           <Text style={styles.sectionTitle}>
//             {selectedProject
//               ? `Project Status - ${selectedProject.name}`
//               : "Project Status"}
//           </Text>

//           <View style={styles.progressRow}>
//             <View style={styles.circleWrapper}>
//               <View style={styles.circleOuter}>
//                 <View style={styles.circleInner}>
//                   <Text style={styles.percent}>
//                     {selectedProject?.completedPercent ?? 0}%
//                   </Text>
//                   <Text style={styles.label}>Completed</Text>
//                 </View>
//               </View>
//             </View>

//             <View style={styles.circleWrapper}>
//               <View style={[styles.circleOuter, { borderColor: "#9B42F2" }]}>
//                 <View style={styles.circleInner}>
//                   <Text style={styles.percent}>
//                     {selectedProject?.pendingPercent ?? 0}%
//                   </Text>
//                   <Text style={styles.label}>Pending</Text>
//                 </View>
//               </View>
//             </View>
//           </View>

//           <View style={styles.tabRow}>
//             <TouchableOpacity onPress={() => setActiveTab("Pending")}>
//               <Text
//                 style={
//                   activeTab === "Pending"
//                     ? styles.activeTab
//                     : styles.inactiveTab
//                 }
//               >
//                 Pending
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity onPress={() => setActiveTab("Completed")}>
//               <Text
//                 style={
//                   activeTab === "Completed"
//                     ? styles.activeTab
//                     : styles.inactiveTab
//                 }
//               >
//                 Completed
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {filteredTasks.length > 0 ? (
//             filteredTasks.map((task) => (
//               <View key={task._id} style={styles.taskItem}>
//                 <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
//                 <Text style={styles.taskText}>{task.title}</Text>
//                 <Text style={styles.date}>
//                   Due: {formatDueDate(task.dueDate)}
//                 </Text>
//               </View>
//             ))
//           ) : (
//             <Text style={{ color: "#9CA3AF", marginTop: 10 }}>
//               No {activeTab.toLowerCase()} tasks
//             </Text>
//           )}

//           <View style={{ marginTop: 10 }}>
//             <Button
//               title={showProjectList ? "Hide Projects" : "View All"}
//               onPress={() => setShowProjectList(!showProjectList)}
//             />
//           </View>

//           {showProjectList && (
//             <View style={styles.projectDropdown}>
//               {projects.length > 0 ? (
//                 projects.map((project) => {
//                   const isSelected = selectedProject?._id === project._id;

//                   return (
//                     <TouchableOpacity
//                       key={project._id}
//                       style={[
//                         styles.projectItem,
//                         isSelected && styles.selectedProjectItem,
//                       ]}
//                       onPress={() => {
//                         setSelectedProject(project);
//                         setShowProjectList(false);
//                       }}
//                     >
//                       <View style={{ flex: 1 }}>
//                         <Text style={styles.projectName}>{project.name}</Text>
//                         <Text style={styles.projectMeta}>
//                           {project.completedPercent}% Completed •{" "}
//                           {project.pendingPercent}% Pending
//                         </Text>
//                       </View>

//                       <Ionicons
//                         name="chevron-forward"
//                         size={18}
//                         color="#fff"
//                       />
//                     </TouchableOpacity>
//                   );
//                 })
//               ) : (
//                 <Text style={styles.noProjectText}>No projects found</Text>
//               )}
//             </View>
//           )}
//         </View>
//       ) : (
//         <View style={styles.statusBox}>
//           <Text style={styles.sectionTitle}>My Tasks</Text>

//           <View style={styles.tabRow}>
//             <TouchableOpacity onPress={() => setActiveTab("Pending")}>
//               <Text
//                 style={
//                   activeTab === "Pending"
//                     ? styles.activeTab
//                     : styles.inactiveTab
//                 }
//               >
//                 Pending
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity onPress={() => setActiveTab("Completed")}>
//               <Text
//                 style={
//                   activeTab === "Completed"
//                     ? styles.activeTab
//                     : styles.inactiveTab
//                 }
//               >
//                 Completed
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {userFilteredTasks.length > 0 ? (
//             userFilteredTasks.map((task) => (
//               <View key={task._id} style={styles.taskItem}>
//                 <Ionicons
//                   name={
//                     task.status === "Completed"
//                       ? "checkmark-circle"
//                       : "ellipse-outline"
//                   }
//                   size={20}
//                   color={task.status === "Completed" ? "#00A693" : "#3B82F6"}
//                 />
//                 <Text style={styles.taskText}>{task.title}</Text>
//                 <Text style={styles.date}>
//                   Due: {formatDueDate(task.dueDate)}
//                 </Text>
//               </View>
//             ))
//           ) : (
//             <Text style={{ color: "#9CA3AF", marginTop: 10 }}>
//               No {activeTab.toLowerCase()} tasks
//             </Text>
//           )}
//         </View>
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#d3d7df",
//   },
//   islandWrapper: {
//     paddingHorizontal: 15,
//     paddingTop: 80,
//     backgroundColor: "#e8eaee",
//   },
//   islandCard: {
//     borderRadius: 25,
//     padding: 20,
//     backgroundColor: "rgba(255,255,255,0.05)",
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.08)",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.3,
//     shadowRadius: 15,
//     elevation: 12,
//   },
//   topBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   profileSection: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   avatar: {
//     width: 45,
//     height: 45,
//     borderRadius: 15,
//     backgroundColor: "rgba(255, 255, 255, 0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.3)",
//   },
//   avatarText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   welcomeTextGroup: {
//     marginLeft: 12,
//   },
//   helloText: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "800",
//   },
//   dateLabel: {
//     color: "rgba(255, 255, 255, 0.7)",
//     fontSize: 12,
//     marginTop: 2,
//   },
//   glassIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 12,
//     backgroundColor: "rgba(255, 255, 255, 0.15)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginLeft: 10,
//   },
//   activeDot: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     width: 6,
//     height: 6,
//     backgroundColor: "#4ADE80",
//     borderRadius: 3,
//   },
//   headerFooter: {
//     marginTop: 20,
//     paddingTop: 15,
//     borderTopWidth: 1,
//     borderTopColor: "rgba(255, 255, 255, 0.1)",
//   },
//   motivationText: {
//     color: "rgba(255, 255, 255, 0.9)",
//     fontSize: 13,
//     letterSpacing: 0.3,
//   },
//   rightIcons: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   cardRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 15,
//   },
//   card: {
//     width: "48%",
//     backgroundColor: "#0F2A5F",
//     borderRadius: 15,
//     padding: 15,
//     elevation: 6,
//   },
//   cardTitle: {
//     fontWeight: "bold",
//     marginTop: 10,
//     color: "#FFFFFF",
//   },
//   cardSub: {
//     color: "#9CA3AF",
//     marginBottom: 10,
//   },
//   statusBox: {
//     margin: 15,
//     backgroundColor: "#0B1F4B",
//     borderRadius: 20,
//     padding: 15,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.05)",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.4,
//     shadowRadius: 15,
//     elevation: 8,
//   },
//   sectionTitle: {
//     fontWeight: "bold",
//     marginBottom: 15,
//     fontSize: 16,
//     color: "#FFFFFF",
//   },
//   progressRow: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     marginBottom: 15,
//   },
//   circleWrapper: {
//     alignItems: "center",
//   },
//   circleOuter: {
//     width: 110,
//     height: 110,
//     borderRadius: 55,
//     borderWidth: 8,
//     borderColor: "#00A693",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   circleInner: {
//     alignItems: "center",
//   },
//   percent: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#FFFFFF",
//   },
//   label: {
//     color: "#9CA3AF",
//   },
//   tabRow: {
//     flexDirection: "row",
//     marginBottom: 10,
//   },
//   activeTab: {
//     backgroundColor: "#00A693",
//     color: "#fff",
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//     borderRadius: 10,
//     marginRight: 10,
//   },
//   inactiveTab: {
//     backgroundColor: "#E5E7EB",
//     color: "#111827",
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//     borderRadius: 10,
//     marginRight: 10,
//   },
//   taskItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 10,
//     borderBottomWidth: 0.5,
//     borderColor: "rgba(255,255,255,0.08)",
//   },
//   taskText: {
//     flex: 1,
//     marginLeft: 10,
//     color: "#E0E7FF",
//     fontWeight: "500",
//   },
//   date: {
//     fontSize: 12,
//     color: "#9CA3AF",
//   },
//   projectDropdown: {
//     marginTop: 12,
//     backgroundColor: "#081B43",
//     borderRadius: 14,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//   },
//   projectItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingVertical: 12,
//     paddingHorizontal: 8,
//     borderBottomWidth: 0.5,
//     borderColor: "rgba(255,255,255,0.08)",
//   },
//   selectedProjectItem: {
//     backgroundColor: "#12306B",
//     borderRadius: 10,
//   },
//   projectName: {
//     color: "#FFFFFF",
//     fontWeight: "bold",
//     fontSize: 14,
//   },
//   projectMeta: {
//     color: "#9CA3AF",
//     fontSize: 12,
//     marginTop: 3,
//   },
//   noProjectText: {
//     color: "#9CA3AF",
//     textAlign: "center",
//     paddingVertical: 10,
//   },
// });


