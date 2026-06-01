import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Modal, KeyboardAvoidingView,
  Platform, Pressable, ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "expo-router";
import { apiUrl } from "@/config/env";

const BASE_URL = apiUrl;

type TaskStatus = "Pending" | "Completed" | "Approved" | "Reassigned";
type AssignedUser = { _id: string; name: string; email: string; department?: string };
type Project = { _id: string; name: string };
type Team = { _id: string; name: string };
type Task = {
  _id: string; title: string; status: TaskStatus;
  userDescription: string; adminNote: string;
  assignedTo: AssignedUser | null; project: Project | null;
  team: Team | null; updatedAt: string; createdAt: string;
  dueDate?: string | null;
};

const getAvatarConfig = (name: string): { initials: string; colors: readonly [string, string] } => {
  const palettes: readonly (readonly [string, string])[] = [
    ["#1D9E75", "#0F6E56"], ["#378ADD", "#185FA5"], ["#EF9F27", "#BA7517"],
    ["#9B59B6", "#6C3483"], ["#E74C3C", "#A93226"], ["#16A085", "#0E6655"],
  ];
  const words = name.trim().split(" ");
  const initials = words.length >= 2
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
  const colorIndex = name.charCodeAt(0) % palettes.length;
  return { initials, colors: palettes[colorIndex] as readonly [string, string] };
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "abhi abhi";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day ago`;
};

const formatDate = (d?: string | null) => {
  if (!d) return null;
  const date = new Date(d);
  return isNaN(date.getTime()) ? null
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Main Entry ──────────────────────────────────────────
export default function TaskDoneScreen() {
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync("role").then(r => setRole(r === "user" ? "user" : "admin"));
  }, []);

  if (role === null) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EEF3FB" }}>
      <ActivityIndicator size="large" color="#081B43" />
    </View>
  );

  if (role === "user") return <UserTaskDoneScreen />;
  return <AdminTaskDoneScreen />;
}

// ════════════════════════════════════════════════
// USER SCREEN — sirf apne completed tasks
// ════════════════════════════════════════════════
function UserTaskDoneScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${BASE_URL}/api/task`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data: Task[] = await res.json();
      // Sirf completed tasks filter karo
      setTasks(data.filter(t => t.status === "Completed" || t.status === "Approved"));
    } catch {
      Alert.alert("Error", "Tasks load nahi ho sake.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchTasks(); }, [fetchTasks]));
  const onRefresh = () => { setRefreshing(true); fetchTasks(); };

  const getStatusConfig = (status: TaskStatus) => {
    if (status === "Approved") return { label: "Approved ✓", color: "#1D9E75", bg: "rgba(29,158,117,0.12)", dot: "#1D9E75", border: "#1D9E75" };
    return { label: "Completed", color: "#378ADD", bg: "rgba(55,138,221,0.12)", dot: "#378ADD", border: "#378ADD" };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <LinearGradient colors={["#081B43", "#0F2A5F"]} style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Completed Tasks</Text>
          <Text style={styles.topBarSub}>All tasks are done</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: "#1D9E75" }]}>
          <Text style={styles.badgeText}>{tasks.length} done</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#081B43" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 40 }}>✅</Text>
          <Text style={styles.emptyTitle}>no task completed</Text>
          <Text style={styles.emptySubtitle}>Jwhen you completed a task show here</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#081B43"]} />}
        >
          {tasks.map(task => {
            const statusConfig = getStatusConfig(task.status);
            const projectName = task.project?.name ?? task.team?.name ?? "General";

            return (
              <View key={task._id} style={[styles.userTaskCard, { borderLeftColor: statusConfig.border }]}>
                {/* Title + Project */}
                <View style={styles.userTaskHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userTaskTitle}>{task.title}</Text>
                    <View style={styles.userTaskMeta}>
                      <View style={styles.projectTag}>
                        <Text style={styles.projectTagText}>📁 {projectName}</Text>
                      </View>
                      {task.dueDate && (
                        <View style={styles.dateTag}>
                          <Text style={styles.dateTagText}>📅 {formatDate(task.dueDate)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {/* Status Badge */}
                  <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                  </View>
                </View>

                {/* Time */}
                <Text style={styles.userTaskTime}>Completed {timeAgo(task.updatedAt)}</Text>

                {/* Admin Note (agar reassign feedback tha) */}
                {!!task.adminNote && (
                  <View style={styles.adminNoteBox}>
                    <Text style={styles.adminNoteLabel}>Admin Feedback</Text>
                    <Text style={styles.adminNoteText}>{task.adminNote}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════
// ADMIN SCREEN — original code as is
// ════════════════════════════════════════════════
function AdminTaskDoneScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const getToken = async () => await SecureStore.getItemAsync("token");

  const fetchFeed = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/task/feed/completed`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Fetch failed");
      const data: Task[] = await res.json();
      setTasks(data);
    } catch {
      Alert.alert("Error", "Tasks load nahi ho sake. Network check karo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchFeed(); }, [fetchFeed]));
  const onRefresh = () => { setRefreshing(true); fetchFeed(); };

  const approveTask = async (taskId: string) => {
    setOpenMenuId(null);
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/task/approve/${taskId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      const updated: Task = await res.json();
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: updated.status } : t));
    } catch {
      Alert.alert("Error", "Approve nahi ho saka.");
    } finally {
      setActionLoading(false);
    }
  };

  const sendReview = async () => {
    if (!reviewText.trim()) { setReviewError(true); return; }
    if (!activeTask) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/task/reassign/${activeTask._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: reviewText.trim() }),
      });
      if (!res.ok) throw new Error();
      const updated: Task = await res.json();
      setTasks(prev => prev.map(t => t._id === activeTask._id ? { ...t, status: updated.status, adminNote: updated.adminNote } : t));
      setReviewModalVisible(false);
      setActiveTask(null);
      setReviewText("");
    } catch {
      Alert.alert("Error", "Reassign nahi ho saka.");
    } finally {
      setActionLoading(false);
    }
  };

  const openReview = (task: Task) => {
    setActiveTask(task);
    setReviewText("");
    setReviewError(false);
    setOpenMenuId(null);
    setReviewModalVisible(true);
  };

  const closeAllMenus = () => setOpenMenuId(null);
  const newCount = tasks.filter(t => t.status === "Completed" || t.status === "Pending").length;

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case "Completed":  return { label: "Completed",      color: "#1D9E75", bg: "rgba(29,158,117,0.12)",  dot: "#1D9E75",  border: "#1D9E75"  };
      case "Pending":    return { label: "Pending Review", color: "#EF9F27", bg: "rgba(239,159,39,0.12)",  dot: "#EF9F27",  border: "#EF9F27"  };
      case "Approved":   return { label: "Approved ✓",     color: "#1D9E75", bg: "rgba(29,158,117,0.12)",  dot: "#1D9E75",  border: "#1D9E75"  };
      case "Reassigned": return { label: "Reassigned",     color: "#378ADD", bg: "rgba(55,138,221,0.12)",  dot: "#378ADD",  border: "#378ADD"  };
    }
  };

  const renderEntry = (task: Task) => {
    const userName = task.assignedTo?.name ?? "Unknown User";
    const { initials, colors } = getAvatarConfig(userName);
    const statusConfig = getStatusConfig(task.status);
    const isMenuOpen = openMenuId === task._id;
    const projectName = task.project?.name ?? task.team?.name ?? "General";

    return (
      <Pressable key={task._id} onPress={closeAllMenus} style={[styles.entryCard, { borderLeftColor: statusConfig.border }]}>
        <View style={styles.entryHeader}>
          <LinearGradient colors={colors} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.entryMeta}>
            <Text style={styles.entryName}>{userName}</Text>
            <Text style={styles.entryAction}>ne ek task complete kiya</Text>
            <Text style={styles.entryTime}>{timeAgo(task.updatedAt)}</Text>
          </View>
          <View style={styles.menuWrapper}>
            <TouchableOpacity style={styles.dotBtn} onPress={() => setOpenMenuId(prev => prev === task._id ? null : task._id)} activeOpacity={0.7}>
              <Text style={styles.dotBtnText}>⋮</Text>
            </TouchableOpacity>
            {isMenuOpen && (
              <View style={styles.dropdown}>
                <TouchableOpacity style={styles.ddItem} onPress={() => openReview(task)} activeOpacity={0.7}>
                  <Text style={styles.ddIcon}>✏️</Text>
                  <Text style={[styles.ddText, { color: "#185FA5" }]}>Review & Reassign</Text>
                </TouchableOpacity>
                <View style={styles.ddDivider} />
                <TouchableOpacity style={styles.ddItem} onPress={() => approveTask(task._id)} activeOpacity={0.7}>
                  <Text style={styles.ddIcon}>✅</Text>
                  <Text style={[styles.ddText, { color: "#0F6E56" }]}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.taskTag, { borderColor: statusConfig.border }]}>
          <Text style={[styles.taskTagText, { color: statusConfig.border }]}>{projectName}  ›  {task.title}</Text>
        </View>
        <View style={styles.descBox}>
          {task.userDescription
            ? <Text style={styles.descText}>{task.userDescription}</Text>
            : <Text style={[styles.descText, { color: "#9CA3AF", fontStyle: "italic" }]}>User ne koi description nahi likha</Text>
          }
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
        {!!task.adminNote && (
          <View style={styles.adminNoteBox}>
            <Text style={styles.adminNoteLabel}>Admin feedback</Text>
            <Text style={styles.adminNoteText}>{task.adminNote}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#081B43", "#0F2A5F"]} style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Task Completion Feed</Text>
          <Text style={styles.topBarSub}>Admin Review Panel</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: newCount > 0 ? "#E24B4A" : "#1D9E75" }]}>
          <Text style={styles.badgeText}>{newCount > 0 ? `${newCount} new` : "All done"}</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#081B43" /><Text style={styles.loadingText}>Tasks load ho rahe hain...</Text></View>
      ) : tasks.length === 0 ? (
        <View style={styles.centered}><Text style={styles.emptyTitle}>No tasks</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.feed} showsVerticalScrollIndicator={false} onScrollBeginDrag={closeAllMenus}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#081B43"]} />}>
          {tasks.map(renderEntry)}
        </ScrollView>
      )}

      {actionLoading && (
        <View style={styles.actionLoadingOverlay}><ActivityIndicator size="small" color="#FFFFFF" /></View>
      )}

      <Modal visible={reviewModalVisible} transparent animationType="slide" onRequestClose={() => setReviewModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable style={styles.modalBackdrop} onPress={() => setReviewModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Review & Reassign Task</Text>
            <Text style={styles.modalSub}>Adminfeedback  — task Reassigned User</Text>
            {activeTask && (
              <View style={styles.modalForBox}>
                <LinearGradient colors={getAvatarConfig(activeTask.assignedTo?.name ?? "U").colors} style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>{getAvatarConfig(activeTask.assignedTo?.name ?? "U").initials}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalForName}>{activeTask.assignedTo?.name ?? "User"}</Text>
                  <Text style={styles.modalForTask} numberOfLines={1}>{activeTask.project?.name ?? activeTask.team?.name ?? "Task"}  ›  {activeTask.title}</Text>
                </View>
              </View>
            )}
            <TextInput style={[styles.reviewInput, reviewError && { borderColor: "#E24B4A" }]} placeholder="Kya changes chahiye, kya missing hai — yahan likhein..." placeholderTextColor="#9CA3AF" multiline value={reviewText} onChangeText={t => { setReviewText(t); setReviewError(false); }} textAlignVertical="top" />
            {reviewError && <Text style={styles.errorText}>Review likhna zaroori hai</Text>}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setReviewModalVisible(false)} activeOpacity={0.7}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSend} onPress={sendReview} activeOpacity={0.85} disabled={actionLoading}>
                <LinearGradient colors={["#081B43", "#0F2A5F"]} style={styles.btnSendGrad}>
                  {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnSendText}>Reassign Task →</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: "#EEF3FB" },
  topBar:               { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 90, paddingBottom: 14 },
  topBarTitle:          { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  topBarSub:            { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 },
  badge:                { marginLeft: "auto", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:            { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  centered:             { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText:          { fontSize: 13, color: "#6B7280" },
  emptyTitle:           { fontSize: 15, fontWeight: "700", color: "#374151" },
  emptySubtitle:        { fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 40 },
  feed:                 { padding: 14, gap: 12 },

  // User Task Card
  userTaskCard:         { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, borderLeftWidth: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  userTaskHeader:       { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 },
  userTaskTitle:        { fontSize: 15, fontWeight: "700", color: "#081B43", flex: 1 },
  userTaskMeta:         { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  userTaskTime:         { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
  projectTag:           { backgroundColor: "#EFF6FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  projectTagText:       { fontSize: 11, color: "#1D6FA4", fontWeight: "600" },
  dateTag:              { backgroundColor: "#F5F5F5", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  dateTagText:          { fontSize: 11, color: "#6B7280", fontWeight: "500" },

  // Admin Entry Card
  entryCard:            { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, borderLeftWidth: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  entryHeader:          { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  avatar:               { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText:           { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  entryMeta:            { flex: 1 },
  entryName:            { fontSize: 14, fontWeight: "700", color: "#081B43" },
  entryAction:          { fontSize: 11, color: "#6B7280", marginTop: 1 },
  entryTime:            { fontSize: 10, color: "#9CA3AF", marginTop: 2 },
  menuWrapper:          { position: "relative" },
  dotBtn:               { padding: 6, borderRadius: 6 },
  dotBtnText:           { fontSize: 18, color: "#6B7280", lineHeight: 20 },
  dropdown:             { position: "absolute", right: 0, top: 30, backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 0.5, borderColor: "#E5E7EB", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 10, elevation: 8, minWidth: 160, zIndex: 999, overflow: "hidden" },
  ddItem:               { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 11, paddingHorizontal: 14 },
  ddIcon:               { fontSize: 14 },
  ddText:               { fontSize: 13, fontWeight: "600" },
  ddDivider:            { height: 0.5, backgroundColor: "#E5E7EB", marginHorizontal: 10 },
  taskTag:              { alignSelf: "flex-start", borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  taskTagText:          { fontSize: 10, fontWeight: "600" },
  descBox:              { backgroundColor: "#F3F4F6", borderRadius: 10, padding: 10, marginBottom: 10 },
  descText:             { fontSize: 12, color: "#374151", lineHeight: 18 },
  statusPill:           { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
  statusDot:            { width: 6, height: 6, borderRadius: 3 },
  statusText:           { fontSize: 11, fontWeight: "700" },
  adminNoteBox:         { marginTop: 10, backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10, borderLeftWidth: 2, borderLeftColor: "#378ADD" },
  adminNoteLabel:       { fontSize: 10, fontWeight: "700", color: "#185FA5", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
  adminNoteText:        { fontSize: 12, color: "#1E40AF", lineHeight: 17 },
  actionLoadingOverlay: { position: "absolute", bottom: 20, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20, padding: 10, paddingHorizontal: 16 },
  modalOverlay:         { flex: 1, justifyContent: "flex-end" },
  modalBackdrop:        { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet:           { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHandle:          { width: 36, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  modalTitle:           { fontSize: 16, fontWeight: "700", color: "#081B43", marginBottom: 4 },
  modalSub:             { fontSize: 12, color: "#6B7280", marginBottom: 16, lineHeight: 18 },
  modalForBox:          { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F3F4F6", borderRadius: 12, padding: 10, marginBottom: 14 },
  modalAvatar:          { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  modalAvatarText:      { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  modalForName:         { fontSize: 13, fontWeight: "700", color: "#111827" },
  modalForTask:         { fontSize: 11, color: "#6B7280", marginTop: 1 },
  reviewInput:          { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, fontSize: 13, color: "#111827", height: 110, backgroundColor: "#FAFAFA" },
  errorText:            { fontSize: 11, color: "#E24B4A", marginTop: 4, marginLeft: 2 },
  modalBtns:            { flexDirection: "row", gap: 10, marginTop: 14 },
  btnCancel:            { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 0.5, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center" },
  btnCancelText:        { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  btnSend:              { flex: 2, borderRadius: 12, overflow: "hidden" },
  btnSendGrad:          { paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  btnSendText:          { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});




// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View, Text, StyleSheet, SafeAreaView, ScrollView,
//   TouchableOpacity, TextInput, Modal, KeyboardAvoidingView,
//   Platform, Pressable, ActivityIndicator, RefreshControl, Alert,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import * as SecureStore from "expo-secure-store"; // ✅ SecureStore

// // ✅ .env se BASE_URL — apni .env file mein EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api likho
// const BASE_URL = apiUrl;

// type TaskStatus = "Pending" | "Completed" | "Approved" | "Reassigned";
// type AssignedUser = { _id: string; name: string; email: string; department?: string };
// type Project = { _id: string; name: string };
// type Team = { _id: string; name: string };
// type Task = {
//   _id: string; title: string; status: TaskStatus;
//   userDescription: string; adminNote: string;
//   assignedTo: AssignedUser | null; project: Project | null;
//   team: Team | null; updatedAt: string;
// };

// const getAvatarConfig = (name: string): { initials: string; colors: readonly [string, string] } => {
//   const palettes: readonly (readonly [string, string])[] = [
//     ["#1D9E75", "#0F6E56"], ["#378ADD", "#185FA5"], ["#EF9F27", "#BA7517"],
//     ["#9B59B6", "#6C3483"], ["#E74C3C", "#A93226"], ["#16A085", "#0E6655"],
//   ];
//   const words = name.trim().split(" ");
//   const initials = words.length >= 2
//     ? `${words[0][0]}${words[1][0]}`.toUpperCase()
//     : name.slice(0, 2).toUpperCase();
//   const colorIndex = name.charCodeAt(0) % palettes.length;
//   return { initials, colors: palettes[colorIndex] as readonly [string, string] };
// };

// const timeAgo = (dateStr: string) => {
//   const diff = Date.now() - new Date(dateStr).getTime();
//   const mins = Math.floor(diff / 60000);
//   if (mins < 1) return "abhi abhi";
//   if (mins < 60) return `${mins} min ago`;
//   const hrs = Math.floor(mins / 60);
//   if (hrs < 24) return `${hrs} hr ago`;
//   return `${Math.floor(hrs / 24)} day ago`;
// };

// export default function TaskDoneScreen() {
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [openMenuId, setOpenMenuId] = useState<string | null>(null);
//   const [reviewModalVisible, setReviewModalVisible] = useState(false);
//   const [activeTask, setActiveTask] = useState<Task | null>(null);
//   const [reviewText, setReviewText] = useState("");
//   const [reviewError, setReviewError] = useState(false);
//   const [actionLoading, setActionLoading] = useState(false);

//   // ✅ SecureStore se token lo — same as baaki files mein use kiya hai
//   const getToken = async () => await SecureStore.getItemAsync("token");

//   const fetchFeed = useCallback(async () => {
//     try {
//       const token = await getToken();
//     const res = await fetch(`${BASE_URL}/api/task/feed/completed`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       if (!res.ok) throw new Error("Fetch failed");
//       const data: Task[] = await res.json();
//       setTasks(data);
//     } catch (error) {
//       Alert.alert("Error", "Tasks load nahi ho sake. Network check karo.");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => { fetchFeed(); }, [fetchFeed]);
//   const onRefresh = () => { setRefreshing(true); fetchFeed(); };

//   const approveTask = async (taskId: string) => {
//     setOpenMenuId(null);
//     setActionLoading(true);
//     try {
//       const token = await getToken();
//      const res = await fetch(`${BASE_URL}/api/task/approve/${taskId}`, {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       if (!res.ok) throw new Error();
//       const updated: Task = await res.json();
//       setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: updated.status } : t));
//     } catch {
//       Alert.alert("Error", "Approve nahi ho saka.");
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const sendReview = async () => {
//     if (!reviewText.trim()) { setReviewError(true); return; }
//     if (!activeTask) return;
//     setActionLoading(true);
//     try {
//       const token = await getToken();
//      const res = await fetch(`${BASE_URL}/api/task/reassign/${activeTask._id}`, {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ adminNote: reviewText.trim() }),
//       });
//       if (!res.ok) throw new Error();
//       const updated: Task = await res.json();
//       setTasks(prev =>
//         prev.map(t =>
//           t._id === activeTask._id
//             ? { ...t, status: updated.status, adminNote: updated.adminNote }
//             : t
//         )
//       );
//       setReviewModalVisible(false);
//       setActiveTask(null);
//       setReviewText("");
//     } catch {
//       Alert.alert("Error", "Reassign nahi ho saka.");
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const openReview = (task: Task) => {
//     setActiveTask(task);
//     setReviewText("");
//     setReviewError(false);
//     setOpenMenuId(null);
//     setReviewModalVisible(true);
//   };

//   const closeAllMenus = () => setOpenMenuId(null);

//   const newCount = tasks.filter(
//     t => t.status === "Completed" || t.status === "Pending"
//   ).length;

//   const getStatusConfig = (status: TaskStatus) => {
//     switch (status) {
//       case "Completed":  return { label: "Completed",      color: "#1D9E75", bg: "rgba(29,158,117,0.12)",  dot: "#1D9E75", border: "#1D9E75" };
//       case "Pending":    return { label: "Pending Review", color: "#EF9F27", bg: "rgba(239,159,39,0.12)",  dot: "#EF9F27", border: "#EF9F27" };
//       case "Approved":   return { label: "Approved ✓",     color: "#1D9E75", bg: "rgba(29,158,117,0.12)",  dot: "#1D9E75", border: "#1D9E75" };
//       case "Reassigned": return { label: "Reassigned",     color: "#378ADD", bg: "rgba(55,138,221,0.12)",  dot: "#378ADD", border: "#378ADD" };
//     }
//   };

//   const renderEntry = (task: Task) => {
//     const userName = task.assignedTo?.name ?? "Unknown User";
//     const { initials, colors } = getAvatarConfig(userName);
//     const statusConfig = getStatusConfig(task.status);
//     const isMenuOpen = openMenuId === task._id;
//     const projectName = task.project?.name ?? task.team?.name ?? "General";

//     return (
//       <Pressable
//         key={task._id}
//         onPress={closeAllMenus}
//         style={[styles.entryCard, { borderLeftColor: statusConfig.border }]}
//       >
//         {/* Header */}
//         <View style={styles.entryHeader}>
//           <LinearGradient colors={colors} style={styles.avatar}>
//             <Text style={styles.avatarText}>{initials}</Text>
//           </LinearGradient>

//           <View style={styles.entryMeta}>
//             <Text style={styles.entryName}>{userName}</Text>
//             <Text style={styles.entryAction}>ne ek task complete kiya</Text>
//             <Text style={styles.entryTime}>{timeAgo(task.updatedAt)}</Text>
//           </View>

//           <View style={styles.menuWrapper}>
//             <TouchableOpacity
//               style={styles.dotBtn}
//               onPress={() => setOpenMenuId(prev => prev === task._id ? null : task._id)}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.dotBtnText}>⋮</Text>
//             </TouchableOpacity>

//             {isMenuOpen && (
//               <View style={styles.dropdown}>
//                 <TouchableOpacity style={styles.ddItem} onPress={() => openReview(task)} activeOpacity={0.7}>
//                   <Text style={styles.ddIcon}>✏️</Text>
//                   <Text style={[styles.ddText, { color: "#185FA5" }]}>Review & Reassign</Text>
//                 </TouchableOpacity>
//                 <View style={styles.ddDivider} />
//                 <TouchableOpacity style={styles.ddItem} onPress={() => approveTask(task._id)} activeOpacity={0.7}>
//                   <Text style={styles.ddIcon}>✅</Text>
//                   <Text style={[styles.ddText, { color: "#0F6E56" }]}>Approve</Text>
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>
//         </View>

//         {/* Task Tag */}
//         <View style={[styles.taskTag, { borderColor: statusConfig.border }]}>
//           <Text style={[styles.taskTagText, { color: statusConfig.border }]}>
//             {projectName}  ›  {task.title}
//           </Text>
//         </View>

//         {/* User Description */}
//         <View style={styles.descBox}>
//           {task.userDescription
//             ? <Text style={styles.descText}>{task.userDescription}</Text>
//             : <Text style={[styles.descText, { color: "#9CA3AF", fontStyle: "italic" }]}>
//                 User ne koi description nahi likha
//               </Text>
//           }
//         </View>

//         {/* Status Pill */}
//         <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
//           <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
//           <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
//         </View>

//         {/* Admin Note */}
//         {!!task.adminNote && (
//           <View style={styles.adminNoteBox}>
//             <Text style={styles.adminNoteLabel}>Admin feedback</Text>
//             <Text style={styles.adminNoteText}>{task.adminNote}</Text>
//           </View>
//         )}
//       </Pressable>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Top Bar */}
//       <LinearGradient colors={["#081B43", "#0F2A5F"]} style={styles.topBar}>
//         <View>
//           <Text style={styles.topBarTitle}>Task Completion Feed</Text>
//           <Text style={styles.topBarSub}>Admin Review Panel</Text>
//         </View>
//         <View style={[styles.badge, { backgroundColor: newCount > 0 ? "#E24B4A" : "#1D9E75" }]}>
//           <Text style={styles.badgeText}>{newCount > 0 ? `${newCount} new` : "All done"}</Text>
//         </View>
//       </LinearGradient>

//       {loading ? (
//         <View style={styles.centered}>
//           <ActivityIndicator size="large" color="#081B43" />
//           <Text style={styles.loadingText}>Tasks load ho rahe hain...</Text>
//         </View>
//       ) : tasks.length === 0 ? (
//         <View style={styles.centered}>
//           <Text style={styles.emptyText}>Koi completed task nahi hai abhi</Text>
//         </View>
//       ) : (
//         <ScrollView
//           contentContainerStyle={styles.feed}
//           showsVerticalScrollIndicator={false}
//           onScrollBeginDrag={closeAllMenus}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#081B43"]} />
//           }
//         >
//           {tasks.map(renderEntry)}
//         </ScrollView>
//       )}

//       {actionLoading && (
//         <View style={styles.actionLoadingOverlay}>
//           <ActivityIndicator size="small" color="#FFFFFF" />
//         </View>
//       )}

//       {/* Review Modal */}
//       <Modal
//         visible={reviewModalVisible}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setReviewModalVisible(false)}
//       >
//         <KeyboardAvoidingView
//           style={styles.modalOverlay}
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//         >
//           <Pressable style={styles.modalBackdrop} onPress={() => setReviewModalVisible(false)} />
//           <View style={styles.modalSheet}>
//             <View style={styles.modalHandle} />
//             <Text style={styles.modalTitle}>Review & Reassign Task</Text>
//             <Text style={styles.modalSub}>
//               Admin ka feedback likhein — task wapas user ko reassign ho jayega
//             </Text>

//             {activeTask && (
//               <View style={styles.modalForBox}>
//                 <LinearGradient
//                   colors={getAvatarConfig(activeTask.assignedTo?.name ?? "U").colors}
//                   style={styles.modalAvatar}
//                 >
//                   <Text style={styles.modalAvatarText}>
//                     {getAvatarConfig(activeTask.assignedTo?.name ?? "U").initials}
//                   </Text>
//                 </LinearGradient>
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.modalForName}>{activeTask.assignedTo?.name ?? "User"}</Text>
//                   <Text style={styles.modalForTask} numberOfLines={1}>
//                     {activeTask.project?.name ?? activeTask.team?.name ?? "Task"}  ›  {activeTask.title}
//                   </Text>
//                 </View>
//               </View>
//             )}

//             <TextInput
//               style={[styles.reviewInput, reviewError && { borderColor: "#E24B4A" }]}
//               placeholder="Kya changes chahiye, kya missing hai — yahan likhein..."
//               placeholderTextColor="#9CA3AF"
//               multiline
//               value={reviewText}
//               onChangeText={t => { setReviewText(t); setReviewError(false); }}
//               textAlignVertical="top"
//             />
//             {reviewError && <Text style={styles.errorText}>Review likhna zaroori hai</Text>}

//             <View style={styles.modalBtns}>
//               <TouchableOpacity
//                 style={styles.btnCancel}
//                 onPress={() => setReviewModalVisible(false)}
//                 activeOpacity={0.7}
//               >
//                 <Text style={styles.btnCancelText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.btnSend}
//                 onPress={sendReview}
//                 activeOpacity={0.85}
//                 disabled={actionLoading}
//               >
//                 <LinearGradient colors={["#081B43", "#0F2A5F"]} style={styles.btnSendGrad}>
//                   {actionLoading
//                     ? <ActivityIndicator size="small" color="#fff" />
//                     : <Text style={styles.btnSendText}>Reassign Task →</Text>
//                   }
//                 </LinearGradient>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container:            { flex: 1, backgroundColor: "#EEF3FB" },
//   topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 90, paddingBottom: 14 },
//   topBarTitle:          { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
//   topBarSub:            { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 },
//   badge:                { marginLeft: "auto", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
//   badgeText:            { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
//   centered:             { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
//   loadingText:          { fontSize: 13, color: "#6B7280" },
//   emptyText:            { fontSize: 14, color: "#9CA3AF" },
//   feed:                 { padding: 14, gap: 12 },
//   entryCard:            { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, borderLeftWidth: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
//   entryHeader:          { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
//   avatar:               { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", flexShrink: 0 },
//   avatarText:           { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
//   entryMeta:            { flex: 1 },
//   entryName:            { fontSize: 14, fontWeight: "700", color: "#081B43" },
//   entryAction:          { fontSize: 11, color: "#6B7280", marginTop: 1 },
//   entryTime:            { fontSize: 10, color: "#9CA3AF", marginTop: 2 },
//   menuWrapper:          { position: "relative" },
//   dotBtn:               { padding: 6, borderRadius: 6 },
//   dotBtnText:           { fontSize: 18, color: "#6B7280", lineHeight: 20 },
//   dropdown:             { position: "absolute", right: 0, top: 30, backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 0.5, borderColor: "#E5E7EB", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 10, elevation: 8, minWidth: 160, zIndex: 999, overflow: "hidden" },
//   ddItem:               { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 11, paddingHorizontal: 14 },
//   ddIcon:               { fontSize: 14 },
//   ddText:               { fontSize: 13, fontWeight: "600" },
//   ddDivider:            { height: 0.5, backgroundColor: "#E5E7EB", marginHorizontal: 10 },
//   taskTag:              { alignSelf: "flex-start", borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
//   taskTagText:          { fontSize: 10, fontWeight: "600" },
//   descBox:              { backgroundColor: "#F3F4F6", borderRadius: 10, padding: 10, marginBottom: 10 },
//   descText:             { fontSize: 12, color: "#374151", lineHeight: 18 },
//   statusPill:           { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
//   statusDot:            { width: 6, height: 6, borderRadius: 3 },
//   statusText:           { fontSize: 11, fontWeight: "700" },
//   adminNoteBox:         { marginTop: 10, backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10, borderLeftWidth: 2, borderLeftColor: "#378ADD" },
//   adminNoteLabel:       { fontSize: 10, fontWeight: "700", color: "#185FA5", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
//   adminNoteText:        { fontSize: 12, color: "#1E40AF", lineHeight: 17 },
//   actionLoadingOverlay: { position: "absolute", bottom: 20, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20, padding: 10, paddingHorizontal: 16 },
//   modalOverlay:         { flex: 1, justifyContent: "flex-end" },
//   modalBackdrop:        { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
//   modalSheet:           { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
//   modalHandle:          { width: 36, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2, alignSelf: "center", marginBottom: 18 },
//   modalTitle:           { fontSize: 16, fontWeight: "700", color: "#081B43", marginBottom: 4 },
//   modalSub:             { fontSize: 12, color: "#6B7280", marginBottom: 16, lineHeight: 18 },
//   modalForBox:          { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F3F4F6", borderRadius: 12, padding: 10, marginBottom: 14 },
//   modalAvatar:          { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
//   modalAvatarText:      { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
//   modalForName:         { fontSize: 13, fontWeight: "700", color: "#111827" },
//   modalForTask:         { fontSize: 11, color: "#6B7280", marginTop: 1 },
//   reviewInput:          { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, fontSize: 13, color: "#111827", height: 110, backgroundColor: "#FAFAFA" },
//   errorText:            { fontSize: 11, color: "#E24B4A", marginTop: 4, marginLeft: 2 },
//   modalBtns:            { flexDirection: "row", gap: 10, marginTop: 14 },
//   btnCancel:            { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 0.5, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center" },
//   btnCancelText:        { fontSize: 13, color: "#6B7280", fontWeight: "600" },
//   btnSend:              { flex: 2, borderRadius: 12, overflow: "hidden" },
//   btnSendGrad:          { paddingVertical: 13, alignItems: "center", justifyContent: "center" },
//   btnSendText:          { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
// });
