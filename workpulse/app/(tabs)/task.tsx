
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, StatusBar,
  TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal,
  KeyboardAvoidingView, Platform, Pressable, TextInput, Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Button from "@/components/button";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";

type TaskItem = {
  _id: string; title: string;
  status: "Pending" | "Completed" | "Approved" | "Reassigned";
  dueDate?: string | null; createdAt?: string;
  adminNote?: string;
  assignedTo?: { _id?: string; name?: string } | null;
  project?: { _id?: string; name?: string } | null;
};

type Reminder = {
  _id: string; title: string; note?: string;
  dueDate?: string | null; done: boolean; createdAt: string;
};

export default function TaskScreen() {
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync("role").then(r => setRole(r === "user" ? "user" : "admin"));
  }, []);

  if (role === null) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F3F7FF" }}>
      <ActivityIndicator size="large" color="#5f00be" />
    </View>
  );

  if (role === "user") return <UserTaskScreen />;
  return <AdminTaskScreen />;
}

/* ═══════════════════════════════════════
   ADMIN TASK SCREEN
═══════════════════════════════════════ */
function AdminTaskScreen() {
  const [activeSection, setActiveSection] = useState<"myTask" | "reminders" | null>(null);
  const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
  const [loadingMyTasks, setLoadingMyTasks] = useState(false);

  // Reminders
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [addReminderVisible, setAddReminderVisible] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [savingReminder, setSavingReminder] = useState(false);

  // Add Task for self
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/task`;

  useFocusEffect(useCallback(() => { loadReminders(); }, []));

  const loadReminders = async () => {
    const adminId = await SecureStore.getItemAsync("adminId");
    const stored = await SecureStore.getItemAsync(`admin_reminders_${adminId}`);
    if (stored) { try { setReminders(JSON.parse(stored)); } catch {} }
  };

  const saveReminders = async (updated: Reminder[]) => {
    const adminId = await SecureStore.getItemAsync("adminId");
    await SecureStore.setItemAsync(`admin_reminders_${adminId}`, JSON.stringify(updated));
    setReminders(updated);
  };

  const handleAddReminder = async () => {
    if (!reminderTitle.trim()) { Alert.alert("Validation", "Title required"); return; }
    setSavingReminder(true);
    const newR: Reminder = {
      _id: Date.now().toString(), title: reminderTitle.trim(),
      note: reminderNote.trim() || undefined,
      dueDate: reminderDate.trim() || null,
      done: false, createdAt: new Date().toISOString(),
    };
    await saveReminders([newR, ...reminders]);
    setReminderTitle(""); setReminderNote(""); setReminderDate("");
    setAddReminderVisible(false); setSavingReminder(false);
  };

  const toggleReminder = async (id: string) => {
    await saveReminders(reminders.map(r => r._id === id ? { ...r, done: !r.done } : r));
  };

  const deleteReminder = async (id: string) => {
    Alert.alert("Delete", "Delete karna chahte ho?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await saveReminders(reminders.filter(r => r._id !== id));
      }},
    ]);
  };

  const fetchMyTasks = async () => {
    try {
      setLoadingMyTasks(true);
      const token = await SecureStore.getItemAsync("token");
      const adminId = await SecureStore.getItemAsync("adminId");
      const res = await fetch(`${BASE_URL}/my/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMyTasks(Array.isArray(data) ? data : []);
    } catch { console.log("fetch error"); }
    finally { setLoadingMyTasks(false); }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) { Alert.alert("Validation", "Task title required"); return; }
    setSavingTask(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      const adminId = await SecureStore.getItemAsync("adminId");
      const res = await fetch(`${BASE_URL}/self`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTaskTitle.trim(), dueDate: newTaskDue.trim() || null, assignedToSelf: true }),
      });
      if (!res.ok) throw new Error();
      setNewTaskTitle(""); setNewTaskDue("");
      setAddTaskVisible(false);
      await fetchMyTasks();
      Alert.alert("Success", "Task added!");
    } catch {
      Alert.alert("Error", "Task add nahi hua");
    } finally { setSavingTask(false); }
  };

  const toggleTaskStatus = async (id: string) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      await fetch(`${BASE_URL}/toggle/${id}`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      fetchMyTasks();
    } catch { console.log("toggle error"); }
  };

  const formatDate = (d?: string | null) => {
    if (!d) return null;
    const date = new Date(d);
    return isNaN(date.getTime()) ? null
      : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const pendingReminders = reminders.filter(r => !r.done);
  const pendingTasks = myTasks.filter(t => t.status === "Pending");
  const completedTasks = myTasks.filter(t => t.status === "Completed");

  return (
    <SafeAreaView style={aS.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F7FF" />
      <ScrollView contentContainerStyle={aS.scroll} showsVerticalScrollIndicator={false}>

        {/* Page Title */}
        <View style={aS.pageHeader}>
          <Text style={aS.pageTitle}>Tasks</Text>
          <Text style={aS.pageSub}>Manage your work</Text>
        </View>

        {/* ── Assign Task Card ── */}
        <TouchableOpacity style={aS.mainCard} onPress={() => router.push("/(screens)/assigned-tasks")} activeOpacity={0.85}>
          <LinearGradient colors={["#5f00be", "#7b28db"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={aS.mainCardGrad}>
            <View style={aS.cardLeft}>
              <View style={aS.cardIconBox}>
                <Ionicons name="person-add-outline" size={22} color="#fff" />
              </View>
              <View>
                <Text style={aS.cardTitle}>Assign Task</Text>
                <Text style={aS.cardSub}>Assign tasks to team members</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── My Tasks Card ── */}
        <View style={aS.sectionCard}>
          <View style={aS.sectionCardHeader}>
            <View style={aS.cardLeft}>
              <View style={[aS.cardIconBox, { backgroundColor: "#E8F4FB" }]}>
                <Ionicons name="checkmark-done-outline" size={22} color="#1D6FA4" />
              </View>
              <View>
                <Text style={aS.sectionCardTitle}>My Tasks</Text>
                <Text style={aS.sectionCardSub}>
                  {pendingTasks.length} pending • {completedTasks.length} done
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {/* Add Task Button */}
              <TouchableOpacity
                style={aS.iconBtn}
                onPress={() => setAddTaskVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#1D6FA4" />
              </TouchableOpacity>
              {/* Toggle View */}
              <TouchableOpacity
                style={[aS.iconBtn, activeSection === "myTask" && { backgroundColor: "#1D6FA4" }]}
                onPress={async () => {
                  if (activeSection === "myTask") { setActiveSection(null); return; }
                  setActiveSection("myTask");
                  await fetchMyTasks();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name={activeSection === "myTask" ? "chevron-up" : "chevron-down"} size={20} color={activeSection === "myTask" ? "#fff" : "#1D6FA4"} />
              </TouchableOpacity>
            </View>
          </View>

          {activeSection === "myTask" && (
            <View style={aS.taskListBox}>
              {loadingMyTasks ? (
                <ActivityIndicator size="small" color="#1D6FA4" style={{ padding: 16 }} />
              ) : myTasks.length === 0 ? (
                <View style={aS.emptyBox}>
                  <Ionicons name="clipboard-outline" size={32} color="#CBD5E1" />
                  <Text style={aS.emptyText}>No tasks yet</Text>
                  <TouchableOpacity onPress={() => setAddTaskVisible(true)} style={aS.createFirstBtn}>
                    <Text style={aS.createFirstText}>+ Add Task</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                myTasks.map((item) => (
                  <TouchableOpacity key={item._id} style={aS.taskRow} onPress={() => toggleTaskStatus(item._id)} activeOpacity={0.7}>
                    <View style={[aS.taskDot, { backgroundColor: item.status === "Completed" ? "#1D9E75" : "#5f00be" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[aS.taskTitle, item.status === "Completed" && { textDecorationLine: "line-through", color: "#9CA3AF" }]}>
                        {item.title}
                      </Text>
                      {item.dueDate && <Text style={aS.taskMeta}>📅 {formatDate(item.dueDate)}</Text>}
                    </View>
                    <View style={[aS.taskBadge, { backgroundColor: item.status === "Completed" ? "rgba(29,158,117,0.12)" : "rgba(95,0,190,0.1)" }]}>
                      <Text style={[aS.taskBadgeText, { color: item.status === "Completed" ? "#1D9E75" : "#5f00be" }]}>
                        {item.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* ── Reminders Card ── */}
        <View style={aS.sectionCard}>
          <View style={aS.sectionCardHeader}>
            <View style={aS.cardLeft}>
              <View style={[aS.cardIconBox, { backgroundColor: "#EDE7F6" }]}>
                <Ionicons name="notifications-outline" size={22} color="#7B1FA2" />
              </View>
              <View>
                <Text style={aS.sectionCardTitle}>My Reminders</Text>
                <Text style={aS.sectionCardSub}>
                  {pendingReminders.length} active reminder{pendingReminders.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity style={[aS.iconBtn, { backgroundColor: "#EDE7F6" }]} onPress={() => setAddReminderVisible(true)} activeOpacity={0.8}>
                <Ionicons name="add" size={20} color="#7B1FA2" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[aS.iconBtn, { backgroundColor: "#EDE7F6" }, activeSection === "reminders" && { backgroundColor: "#7B1FA2" }]}
                onPress={() => setActiveSection(activeSection === "reminders" ? null : "reminders")}
                activeOpacity={0.8}
              >
                <Ionicons name={activeSection === "reminders" ? "chevron-up" : "chevron-down"} size={20} color={activeSection === "reminders" ? "#fff" : "#7B1FA2"} />
              </TouchableOpacity>
            </View>
          </View>

          {activeSection === "reminders" && (
            <View style={aS.taskListBox}>
              {reminders.length === 0 ? (
                <View style={aS.emptyBox}>
                  <Ionicons name="notifications-outline" size={32} color="#CBD5E1" />
                  <Text style={aS.emptyText}>Koi reminder nahi hai</Text>
                  <TouchableOpacity onPress={() => setAddReminderVisible(true)} style={[aS.createFirstBtn, { backgroundColor: "#EDE7F6" }]}>
                    <Text style={[aS.createFirstText, { color: "#7B1FA2" }]}>+ Add Reminder</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                reminders.map(r => (
                  <View key={r._id} style={[aS.taskRow, r.done && { opacity: 0.5 }]}>
                    <Switch value={r.done} onValueChange={() => toggleReminder(r._id)}
                      trackColor={{ false: "#E0E0E0", true: "#CE93D8" }}
                      thumbColor={r.done ? "#7B1FA2" : "#90A4AE"} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[aS.taskTitle, r.done && { textDecorationLine: "line-through", color: "#9CA3AF" }]}>{r.title}</Text>
                      {r.note ? <Text style={aS.taskMeta}>{r.note}</Text> : null}
                      {r.dueDate ? <Text style={[aS.taskMeta, { color: "#7B1FA2" }]}>📅 {formatDate(r.dueDate)}</Text> : null}
                    </View>
                    <TouchableOpacity onPress={() => deleteReminder(r._id)} style={{ padding: 6 }}>
                      <Ionicons name="trash-outline" size={17} color="#EF9A9A" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

      </ScrollView>

      {/* ── Add Task Modal ── */}
      <Modal visible={addTaskVisible} transparent animationType="slide" onRequestClose={() => setAddTaskVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable style={aS.modalBg} onPress={() => setAddTaskVisible(false)} />
          <View style={aS.modalSheet}>
            <View style={aS.modalHandle} />
            <Text style={aS.modalTitle}>Add Task for Myself</Text>
            <Text style={aS.inputLabel}>Task Title *</Text>
            <TextInput style={aS.textInput} placeholder="e.g. Review report, Fix bug..." placeholderTextColor="#9CA3AF" value={newTaskTitle} onChangeText={setNewTaskTitle} autoFocus />
            <Text style={aS.inputLabel}>Due Date (optional)</Text>
            <TextInput style={aS.textInput} placeholder="e.g. 2026-05-20" placeholderTextColor="#9CA3AF" value={newTaskDue} onChangeText={setNewTaskDue} />
            <TouchableOpacity style={[aS.saveBtn, { backgroundColor: "#1D6FA4" }, savingTask && { opacity: 0.7 }]} onPress={handleAddTask} disabled={savingTask} activeOpacity={0.8}>
              {savingTask ? <ActivityIndicator size="small" color="#fff" /> : <Text style={aS.saveBtnText}>Add Task</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Reminder Modal ── */}
      <Modal visible={addReminderVisible} transparent animationType="slide" onRequestClose={() => setAddReminderVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable style={aS.modalBg} onPress={() => setAddReminderVisible(false)} />
          <View style={aS.modalSheet}>
            <View style={aS.modalHandle} />
            <Text style={aS.modalTitle}>New Reminder</Text>
            <Text style={aS.inputLabel}>Title *</Text>
            <TextInput style={aS.textInput} placeholder="e.g. Meeting at 3pm..." placeholderTextColor="#9CA3AF" value={reminderTitle} onChangeText={setReminderTitle} autoFocus />
            <Text style={aS.inputLabel}>Note (optional)</Text>
            <TextInput style={[aS.textInput, { height: 70, textAlignVertical: "top" }]} placeholder="Details..." placeholderTextColor="#9CA3AF" value={reminderNote} onChangeText={setReminderNote} multiline />
            <Text style={aS.inputLabel}>Due Date (optional)</Text>
            <TextInput style={aS.textInput} placeholder="e.g. 2026-05-20" placeholderTextColor="#9CA3AF" value={reminderDate} onChangeText={setReminderDate} />
            <TouchableOpacity style={[aS.saveBtn, { backgroundColor: "#7B1FA2" }, savingReminder && { opacity: 0.7 }]} onPress={handleAddReminder} disabled={savingReminder} activeOpacity={0.8}>
              {savingReminder ? <ActivityIndicator size="small" color="#fff" /> : <Text style={aS.saveBtnText}>Save Reminder</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════
   USER TASK SCREEN — UNCHANGED
═══════════════════════════════════════ */
function UserTaskScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"Pending" | "Completed">("Pending");
  const [descModalVisible, setDescModalVisible] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [descText, setDescText] = useState("");

  const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/task`;

  useEffect(() => { fetchAssignedTasks(); }, []);

  const fetchAssignedTasks = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("token");
      const userId = await SecureStore.getItemAsync("userId");
      if (!userId) { Alert.alert("Session Error", "Please login again"); return; }
      const res = await fetch(`${BASE_URL}/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch { Alert.alert("Error", "Network error"); }
    finally { setLoading(false); }
  };

 const filteredTasks = useMemo(() => {
  if (activeTab === "Pending") {
    return tasks.filter((t) => t.status === "Pending" || t.status === "Reassigned");
  }
  return tasks.filter((t) => t.status === "Completed" || t.status === "Approved");
}, [tasks, activeTab]);
 const pendingCount = useMemo(
  () => tasks.filter((t) => t.status === "Pending" || t.status === "Reassigned").length,
  [tasks]
);
  const completedCount = useMemo(() => tasks.filter((t) => t.status === "Completed").length, [tasks]);

  const formatTaskDate = (dateString?: string) => {
    if (!dateString) return "Assigned recently";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Assigned recently";
    if (date.toDateString() === new Date().toDateString()) return "Assigned today";
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const handleToggleTask = async (taskId: string, description: string) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${BASE_URL}/toggle/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userDescription: description }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert("Error", data.message || "Task update failed"); return; }
      setTasks((prev) => prev.map((item) => (item._id === taskId ? data : item)));
    } catch { Alert.alert("Error", "Task update nahi hua"); }
  };

  const renderTaskItem = ({ item }: { item: TaskItem }) => {
    const isCompleted = item.status === "Completed";
    const isReassigned = item.status === "Reassigned";
    return (
      <View style={uS.taskCard}>
        <LinearGradient
          colors={isCompleted ? ["rgba(18,122,110,0.15)", "rgba(255,255,255,0.95)"] : isReassigned ? ["rgba(55,138,221,0.15)", "rgba(255,255,255,0.95)"] : ["rgba(95,0,190,0.14)", "rgba(255,255,255,0.96)"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={uS.taskCardOverlay}
        >
          <View style={uS.taskTopRow}>
            <View style={uS.iconTitleWrap}>
              <View style={[uS.taskIconWrap, isCompleted ? uS.completedIconWrap : isReassigned ? uS.reassignedIconWrap : uS.pendingIconWrap]}>
                <Ionicons name={isCompleted ? "checkmark-done" : isReassigned ? "refresh-outline" : "time-outline"} size={18} color={isCompleted ? "#127a6e" : isReassigned ? "#378ADD" : "#5f00be"} />
              </View>
              <View style={uS.taskTextWrap}>
                <Text numberOfLines={2} style={[uS.taskTitle, isCompleted && uS.completedTaskTitle]}>{item.title}</Text>
                <Text style={uS.taskDate}>{item.project?.name || "No project"} • {formatTaskDate(item.createdAt)}</Text>
              </View>
            </View>
            <View style={[uS.statusBadge, isCompleted ? uS.completedBadge : isReassigned ? uS.reassignedBadge : uS.pendingBadge]}>
              <Text style={[uS.statusText, isCompleted ? uS.completedText : isReassigned ? uS.reassignedText : uS.pendingText]}>{item.status}</Text>
            </View>
          </View>
          {isReassigned && !!item.adminNote && (
            <View style={uS.adminNoteBox}>
              <Text style={uS.adminNoteLabel}>Admin Feedback</Text>
              <Text style={uS.adminNoteText}>{item.adminNote}</Text>
            </View>
          )}
          {!isCompleted && (
            <TouchableOpacity activeOpacity={0.85} onPress={() => { setPendingToggleId(item._id); setDescText(""); setDescModalVisible(true); }} style={uS.actionBtnWrap}>
              <LinearGradient colors={isReassigned ? ["#378ADD", "#185FA5"] : ["#127a6e", "#081B43"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={uS.taskActionButton}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={uS.taskActionText}>{isReassigned ? "Resubmit Task" : "Mark as Complete"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={uS.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081B43" />
      <View style={uS.topBg} />
      <FlatList
        data={filteredTasks} keyExtractor={(item) => item._id} renderItem={renderTaskItem}
        showsVerticalScrollIndicator={false} contentContainerStyle={uS.listContent}
        refreshing={loading} onRefresh={fetchAssignedTasks}
        ListHeaderComponent={
          <>
            <View style={uS.headerOuter}>
              <LinearGradient colors={["#5f00be", "#127a6e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={uS.headerCard}>
                <Text style={uS.headerTitle}>Assigned Tasks</Text>
                <Text style={uS.headerSubtitle}>Tasks assigned by admin will appear here.</Text>
              </LinearGradient>
            </View>
            <View style={uS.statsRow}>
              <LinearGradient colors={["#081B43", "#102B63"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={uS.statCard}>
                <Text style={uS.statValue}>{tasks.length}</Text><Text style={uS.statLabel}>Total</Text>
              </LinearGradient>
              <LinearGradient colors={["#5f00be", "#7B28DB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={uS.statCard}>
                <Text style={uS.statValue}>{pendingCount}</Text><Text style={uS.statLabel}>Pending</Text>
              </LinearGradient>
              <LinearGradient colors={["#127a6e", "#19A08F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={uS.statCard}>
                <Text style={uS.statValue}>{completedCount}</Text><Text style={uS.statLabel}>Completed</Text>
              </LinearGradient>
            </View>
            <View style={uS.tabRow}>
              <TouchableOpacity style={[uS.tabBtn, activeTab === "Pending" && uS.tabBtnActive]} onPress={() => setActiveTab("Pending")}>
                <Text style={[uS.tabText, activeTab === "Pending" && uS.tabTextActive]}>Pending ({pendingCount})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[uS.tabBtn, activeTab === "Completed" && uS.tabBtnActiveGreen]} onPress={() => setActiveTab("Completed")}>
                <Text style={[uS.tabText, activeTab === "Completed" && uS.tabTextActive]}>Completed ({completedCount})</Text>
              </TouchableOpacity>
            </View>
            <View style={uS.sectionHeader}>
              <Text style={uS.sectionTitle}>{activeTab === "Pending" ? "Pending Tasks" : "Completed Tasks"}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={uS.emptyCard}>
            <Ionicons name={activeTab === "Pending" ? "time-outline" : "checkmark-done-circle-outline"} size={40} color="#9CA3AF" />
            <Text style={uS.emptyText}>{activeTab === "Pending" ? "Koi pending task nahi hai" : "Koi completed task nahi hai"}</Text>
          </View>
        }
      />
      <Modal visible={descModalVisible} transparent animationType="slide" onRequestClose={() => setDescModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={() => setDescModalVisible(false)} />
          <View style={uS.modalSheet}>
            <View style={uS.modalHandle} />
            <Text style={uS.modalTitle}>Task Complete karo</Text>
            <Text style={uS.modalSub}>Kya kiya — thoda describe karo (optional)</Text>
            <TextInput style={uS.modalInput} placeholder="e.g. Kaam complete ho gaya..." placeholderTextColor="#6B7280" multiline value={descText} onChangeText={setDescText} textAlignVertical="top" />
            <View style={uS.modalBtns}>
              <TouchableOpacity style={uS.modalBtnCancel} onPress={() => setDescModalVisible(false)}>
                <Text style={uS.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={uS.modalBtnConfirm} onPress={async () => {
                setDescModalVisible(false);
                if (pendingToggleId) { await handleToggleTask(pendingToggleId, descText.trim()); setPendingToggleId(null); setDescText(""); }
              }}>
                <LinearGradient colors={["#127a6e", "#081B43"]} style={uS.modalBtnGrad}>
                  <Text style={uS.modalBtnConfirmText}>Submit ✓</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════
   ADMIN STYLES
═══════════════════════════════════════ */
const aS = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F7FF" },
  scroll: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 40 },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#081B43" },
  pageSub: { fontSize: 14, color: "#6B7280", marginTop: 2 },

  mainCard: { borderRadius: 18, marginBottom: 14, overflow: "hidden", elevation: 4, shadowColor: "#5f00be", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  mainCardGrad: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  cardIconBox: { width: 42, height: 42, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cardSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },

  sectionCard: { backgroundColor: "#fff", borderRadius: 18, marginBottom: 14, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  sectionCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  sectionCardTitle: { fontSize: 15, fontWeight: "700", color: "#081B43" },
  sectionCardSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#E8F4FB", justifyContent: "center", alignItems: "center" },

  taskListBox: { borderTopWidth: 1, borderTopColor: "#F0F4F8", paddingHorizontal: 16, paddingBottom: 12 },
  taskRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#F5F5F5", gap: 10 },
  taskDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { fontSize: 14, fontWeight: "600", color: "#081B43" },
  taskMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  taskBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  taskBadgeText: { fontSize: 11, fontWeight: "700" },

  emptyBox: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, color: "#9CA3AF" },
  createFirstBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#E8F4FB", borderRadius: 10, marginTop: 4 },
  createFirstText: { color: "#1D6FA4", fontWeight: "700", fontSize: 13 },

  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHandle: { width: 36, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#081B43", marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: "700", color: "#081B43", marginBottom: 6, marginTop: 10 },
  textInput: { height: 50, borderWidth: 1, borderColor: "#D8E2F0", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#081B43", backgroundColor: "#F9FBFF" },
  saveBtn: { height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 16 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

/* ═══════════════════════════════════════
   USER STYLES — UNCHANGED
═══════════════════════════════════════ */
const uS = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#EEF3FB" },
  topBg: { position: "absolute", top: 0, left: 0, right: 0, height: 140, backgroundColor: "#081B43", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  listContent: { paddingBottom: 30, paddingTop: 24 },
  headerOuter: { paddingHorizontal: 16, marginTop: 28 },
  headerCard: { borderRadius: 24, paddingHorizontal: 18, paddingVertical: 22, shadowColor: "#081B43", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 8 },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  headerSubtitle: { color: "rgba(255,255,255,0.86)", fontSize: 14, marginTop: 8, lineHeight: 20 },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: 18, gap: 10 },
  statCard: { flex: 1, borderRadius: 18, paddingVertical: 18, alignItems: "center", justifyContent: "center", elevation: 6 },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
  statLabel: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 6, fontWeight: "600" },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 18, gap: 10 },
  tabBtn: { flex: 1, paddingVertical: 11, borderRadius: 14, backgroundColor: "#E5E7EB", alignItems: "center" },
  tabBtnActive: { backgroundColor: "#5f00be" },
  tabBtnActiveGreen: { backgroundColor: "#127a6e" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },
  tabTextActive: { color: "#FFFFFF" },
  sectionHeader: { paddingHorizontal: 16, marginTop: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#081B43" },
  taskCard: { marginHorizontal: 16, marginBottom: 14, borderRadius: 22, overflow: "hidden", elevation: 6 },
  taskCardOverlay: { padding: 16, borderWidth: 1, borderColor: "rgba(8,27,67,0.06)", backgroundColor: "#fff" },
  taskTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  iconTitleWrap: { flexDirection: "row", flex: 1, paddingRight: 10 },
  taskIconWrap: { width: 40, height: 40, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 10 },
  pendingIconWrap: { backgroundColor: "rgba(95,0,190,0.12)" },
  completedIconWrap: { backgroundColor: "rgba(18,122,110,0.12)" },
  reassignedIconWrap: { backgroundColor: "rgba(55,138,221,0.12)" },
  taskTextWrap: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: "700", color: "#081B43", lineHeight: 22 },
  completedTaskTitle: { textDecorationLine: "line-through", color: "#6F7A94" },
  taskDate: { marginTop: 5, fontSize: 13, color: "#7A86A3", fontWeight: "500" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  pendingBadge: { backgroundColor: "rgba(95,0,190,0.12)" },
  completedBadge: { backgroundColor: "rgba(18,122,110,0.14)" },
  reassignedBadge: { backgroundColor: "rgba(55,138,221,0.12)" },
  statusText: { fontSize: 12, fontWeight: "700" },
  pendingText: { color: "#5f00be" },
  completedText: { color: "#127a6e" },
  reassignedText: { color: "#378ADD" },
  adminNoteBox: { backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10, marginBottom: 12, borderLeftWidth: 2, borderLeftColor: "#378ADD" },
  adminNoteLabel: { fontSize: 10, fontWeight: "700", color: "#185FA5", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
  adminNoteText: { fontSize: 12, color: "#1E40AF", lineHeight: 17 },
  actionBtnWrap: { borderRadius: 16, overflow: "hidden" },
  taskActionButton: { minHeight: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  taskActionText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  emptyCard: { marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 18, padding: 30, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, color: "#7A86A3", fontWeight: "600" },
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





// import React, { useEffect, useMemo, useState, useCallback } from "react";
// import {
//   View, Text, FlatList, StyleSheet, SafeAreaView, StatusBar,
//   TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal,
//   KeyboardAvoidingView, Platform, Pressable, TextInput, Switch,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import Button from "@/components/button";
// import { router, useFocusEffect } from "expo-router";
// import * as SecureStore from "expo-secure-store";

// type TaskItem = {
//   _id: string; title: string;
//   status: "Pending" | "Completed" | "Approved" | "Reassigned";
//   dueDate?: string | null; createdAt?: string; taskType?: "my" | "team";
//   adminNote?: string;
//   assignedTo?: { _id?: string; name?: string } | null;
//   project?: { _id?: string; name?: string } | null;
// };

// type Reminder = {
//   _id: string; title: string; note?: string;
//   dueDate?: string | null; done: boolean; createdAt: string;
// };

// export default function TaskScreen() {
//   const [role, setRole] = useState<"admin" | "user" | null>(null);

//   useEffect(() => {
//     SecureStore.getItemAsync("role").then(r => setRole(r === "user" ? "user" : "admin"));
//   }, []);

//   if (role === null) return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EEF3FB" }}>
//       <ActivityIndicator size="large" color="#081B43" />
//     </View>
//   );

//   if (role === "user") return <UserTaskScreen />;
//   return <AdminTaskScreen />;
// }

// /* ═══════════════════════════════════════════════════
//    ADMIN TASK SCREEN
//    - Assign Task button
//    - My Tasks (jo admin ne khud ko assign kiye)
//    - My Reminders (permanent, SecureStore)
// ═══════════════════════════════════════════════════ */
// function AdminTaskScreen() {
//   const [activeSection, setActiveSection] = useState<"myTask" | "reminders" | null>(null);
//   const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
//   const [loadingMyTasks, setLoadingMyTasks] = useState(false);

//   // Reminders
//   const [reminders, setReminders] = useState<Reminder[]>([]);
//   const [addReminderVisible, setAddReminderVisible] = useState(false);
//   const [reminderTitle, setReminderTitle] = useState("");
//   const [reminderNote, setReminderNote] = useState("");
//   const [reminderDate, setReminderDate] = useState("");
//   const [savingReminder, setSavingReminder] = useState(false);

//   const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/task`;

//   // Load reminders on focus
//   useFocusEffect(useCallback(() => {
//     loadReminders();
//   }, []));

//   const loadReminders = async () => {
//     const adminId = await SecureStore.getItemAsync("adminId");
//     const stored = await SecureStore.getItemAsync(`admin_reminders_${adminId}`);
//     if (stored) {
//       try { setReminders(JSON.parse(stored)); } catch {}
//     }
//   };

//   const saveReminders = async (updated: Reminder[]) => {
//     const adminId = await SecureStore.getItemAsync("adminId");
//     await SecureStore.setItemAsync(`admin_reminders_${adminId}`, JSON.stringify(updated));
//     setReminders(updated);
//   };

//   const handleAddReminder = async () => {
//     if (!reminderTitle.trim()) { Alert.alert("Validation", "Title required"); return; }
//     setSavingReminder(true);
//     const newR: Reminder = {
//       _id: Date.now().toString(),
//       title: reminderTitle.trim(),
//       note: reminderNote.trim() || undefined,
//       dueDate: reminderDate.trim() || null,
//       done: false,
//       createdAt: new Date().toISOString(),
//     };
//     await saveReminders([newR, ...reminders]);
//     setReminderTitle(""); setReminderNote(""); setReminderDate("");
//     setAddReminderVisible(false);
//     setSavingReminder(false);
//   };

//   const toggleReminder = async (id: string) => {
//     await saveReminders(reminders.map(r => r._id === id ? { ...r, done: !r.done } : r));
//   };

//   const deleteReminder = async (id: string) => {
//     Alert.alert("Delete", "Is reminder ko delete karna chahte ho?", [
//       { text: "Cancel", style: "cancel" },
//       { text: "Delete", style: "destructive", onPress: async () => {
//         await saveReminders(reminders.filter(r => r._id !== id));
//       }},
//     ]);
//   };

//   const fetchMyTasks = async () => {
//     try {
//       setLoadingMyTasks(true);
//       const token = await SecureStore.getItemAsync("token");
//       const adminId = await SecureStore.getItemAsync("adminId");
//       const res = await fetch(`${BASE_URL}/my/${adminId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       setMyTasks(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.log("Fetch my tasks error:", err);
//     } finally {
//       setLoadingMyTasks(false);
//     }
//   };

//   const toggleTaskStatus = async (id: string) => {
//     try {
//       const token = await SecureStore.getItemAsync("token");
//       await fetch(`${BASE_URL}/toggle/${id}`, {
//         method: "PUT",
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       fetchMyTasks();
//     } catch (err) {
//       console.log("Toggle task error:", err);
//     }
//   };

//   const formatDate = (d?: string | null) => {
//     if (!d) return null;
//     const date = new Date(d);
//     return isNaN(date.getTime()) ? null
//       : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
//   };

//   const pendingReminders = reminders.filter(r => !r.done);

//   return (
//     <SafeAreaView style={adminStyles.container}>
//       <ScrollView contentContainerStyle={adminStyles.wrapper} showsVerticalScrollIndicator={false}>

//         {/* ── Assign Task ── */}
//         <LinearGradient colors={["#5f00be", "#7b28db"]} style={adminStyles.card}>
//           <View style={adminStyles.row}>
//             <View style={adminStyles.iconBox}>
//               <Ionicons name="person-add-outline" size={20} color="#fff" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={adminStyles.title}>Assign Task</Text>
//               <Text style={adminStyles.subtitle}>Assign tasks to team</Text>
//             </View>
//           </View>
//           <Button title="Assign Task" onPress={() => router.push("/(screens)/assigned-tasks")} />
//         </LinearGradient>

//         {/* ── My Tasks ── */}
//         <LinearGradient colors={["#081B43", "#0f2a5f"]} style={adminStyles.card}>
//           <View style={adminStyles.row}>
//             <View style={adminStyles.iconBox}>
//               <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={adminStyles.title}>My Tasks</Text>
//               <Text style={adminStyles.subtitle}>Tasks assigned to yourself</Text>
//             </View>
//           </View>
//           <Button
//             title={activeSection === "myTask" ? "Hide My Tasks" : "View My Tasks"}
//             onPress={async () => {
//               if (activeSection === "myTask") { setActiveSection(null); return; }
//               setActiveSection("myTask");
//               await fetchMyTasks();
//             }}
//           />
//         </LinearGradient>

//         {activeSection === "myTask" && (
//           <View style={adminStyles.listCard}>
//             <Text style={adminStyles.sectionTitle}>My Task List</Text>
//             {loadingMyTasks ? (
//               <View style={adminStyles.loaderBox}><ActivityIndicator size="small" color="#5f00be" /></View>
//             ) : myTasks.length === 0 ? (
//               <Text style={adminStyles.emptyText}>No tasks found</Text>
//             ) : (
//               myTasks.map((item) => (
//                 <TouchableOpacity key={item._id} style={adminStyles.taskItem} onPress={() => toggleTaskStatus(item._id)}>
//                   <View style={{ flex: 1 }}>
//                     <Text style={adminStyles.taskTitle}>{item.title}</Text>
//                     {item.project?.name && <Text style={adminStyles.taskSubText}>📁 {item.project.name}</Text>}
//                     {item.dueDate && <Text style={adminStyles.taskSubText}>📅 {formatDate(item.dueDate)}</Text>}
//                   </View>
//                   <View style={[adminStyles.statusBadge, { backgroundColor: item.status === "Completed" ? "rgba(18,122,110,0.12)" : "rgba(95,0,190,0.12)" }]}>
//                     <Text style={[adminStyles.statusText, { color: item.status === "Completed" ? "#127a6e" : "#5f00be" }]}>
//                       {item.status}
//                     </Text>
//                   </View>
//                 </TouchableOpacity>
//               ))
//             )}
//           </View>
//         )}

//         {/* ── Reminders ── */}
//         <LinearGradient colors={["#F57F17", "#E65100"]} style={adminStyles.card}>
//           <View style={adminStyles.row}>
//             <View style={adminStyles.iconBox}>
//               <Ionicons name="notifications-outline" size={20} color="#fff" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={adminStyles.title}>My Reminders</Text>
//               <Text style={adminStyles.subtitle}>
//                 {pendingReminders.length} active reminder{pendingReminders.length !== 1 ? "s" : ""}
//               </Text>
//             </View>
//           </View>
//           <View style={{ flexDirection: "row", gap: 10 }}>
//             <View style={{ flex: 1 }}>
//               <Button
//                 title={activeSection === "reminders" ? "Hide" : "View All"}
//                 onPress={() => setActiveSection(activeSection === "reminders" ? null : "reminders")}
//               />
//             </View>
//             <TouchableOpacity
//               style={adminStyles.addReminderBtn}
//               onPress={() => setAddReminderVisible(true)}
//               activeOpacity={0.8}
//             >
//               <Ionicons name="add" size={22} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </LinearGradient>

//         {activeSection === "reminders" && (
//           <View style={adminStyles.listCard}>
//             <Text style={adminStyles.sectionTitle}>Reminders</Text>
//             {reminders.length === 0 ? (
//               <View style={adminStyles.emptyReminder}>
//                 <Ionicons name="notifications-outline" size={36} color="#CBD5E1" />
//                 <Text style={adminStyles.emptyText}>Koi reminder nahi hai</Text>
//                 <TouchableOpacity onPress={() => setAddReminderVisible(true)} style={adminStyles.createFirstBtn}>
//                   <Text style={adminStyles.createFirstText}>+ Add Reminder</Text>
//                 </TouchableOpacity>
//               </View>
//             ) : (
//               reminders.map(r => (
//                 <View key={r._id} style={[adminStyles.reminderRow, r.done && { opacity: 0.5 }]}>
//                   <Switch
//                     value={r.done}
//                     onValueChange={() => toggleReminder(r._id)}
//                     trackColor={{ false: "#E0E0E0", true: "#A5D6A7" }}
//                     thumbColor={r.done ? "#2E7D32" : "#90A4AE"}
//                   />
//                   <View style={{ flex: 1, marginLeft: 10 }}>
//                     <Text style={[adminStyles.reminderTitle, r.done && { textDecorationLine: "line-through", color: "#9CA3AF" }]}>
//                       {r.title}
//                     </Text>
//                     {r.note ? <Text style={adminStyles.reminderNote}>{r.note}</Text> : null}
//                     {r.dueDate ? <Text style={adminStyles.reminderDate}>📅 {formatDate(r.dueDate)}</Text> : null}
//                   </View>
//                   <TouchableOpacity onPress={() => deleteReminder(r._id)} style={{ padding: 6 }}>
//                     <Ionicons name="trash-outline" size={18} color="#EF9A9A" />
//                   </TouchableOpacity>
//                 </View>
//               ))
//             )}
//           </View>
//         )}

//       </ScrollView>

//       {/* Add Reminder Modal */}
//       <Modal visible={addReminderVisible} transparent animationType="slide" onRequestClose={() => setAddReminderVisible(false)}>
//         <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
//           <Pressable style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={() => setAddReminderVisible(false)} />
//           <View style={adminStyles.modalSheet}>
//             <View style={adminStyles.modalHandle} />
//             <Text style={adminStyles.modalTitle}>New Reminder</Text>

//             <Text style={adminStyles.inputLabel}>Title *</Text>
//             <TextInput style={adminStyles.textInput} placeholder="e.g. Meeting at 3pm, Submit report..." placeholderTextColor="#9CA3AF" value={reminderTitle} onChangeText={setReminderTitle} autoFocus />

//             <Text style={adminStyles.inputLabel}>Note (optional)</Text>
//             <TextInput style={[adminStyles.textInput, { height: 70, textAlignVertical: "top" }]} placeholder="Details..." placeholderTextColor="#9CA3AF" value={reminderNote} onChangeText={setReminderNote} multiline />

//             <Text style={adminStyles.inputLabel}>Due Date (optional)</Text>
//             <TextInput style={adminStyles.textInput} placeholder="e.g. 2026-05-20" placeholderTextColor="#9CA3AF" value={reminderDate} onChangeText={setReminderDate} />

//             <TouchableOpacity
//               style={[adminStyles.saveBtn, savingReminder && { opacity: 0.7 }]}
//               onPress={handleAddReminder}
//               disabled={savingReminder}
//               activeOpacity={0.8}
//             >
//               {savingReminder
//                 ? <ActivityIndicator size="small" color="#fff" />
//                 : <Text style={adminStyles.saveBtnText}>Save Reminder</Text>
//               }
//             </TouchableOpacity>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// /* ═══════════════════════════════════════════════════
//    USER TASK SCREEN — UNCHANGED
// ═══════════════════════════════════════════════════ */
// function UserTaskScreen() {
//   const [tasks, setTasks] = useState<TaskItem[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState<"Pending" | "Completed">("Pending");
//   const [descModalVisible, setDescModalVisible] = useState(false);
//   const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
//   const [descText, setDescText] = useState("");

//   const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/task`;

//   useEffect(() => { fetchAssignedTasks(); }, []);

//   const fetchAssignedTasks = async () => {
//     try {
//       setLoading(true);
//       const token = await SecureStore.getItemAsync("token");
//       const userId = await SecureStore.getItemAsync("userId");
//       if (!userId) { Alert.alert("Session Error", "Please login again"); return; }
//       const res = await fetch(`${BASE_URL}/user/${userId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       setTasks(Array.isArray(data) ? data : []);
//     } catch (error) {
//       Alert.alert("Error", "Network error — check your connection");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredTasks = useMemo(() => tasks.filter((t) => t.status === activeTab), [tasks, activeTab]);
//   const pendingCount = useMemo(() => tasks.filter((t) => t.status === "Pending").length, [tasks]);
//   const completedCount = useMemo(() => tasks.filter((t) => t.status === "Completed").length, [tasks]);

//   const formatTaskDate = (dateString?: string) => {
//     if (!dateString) return "Assigned recently";
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return "Assigned recently";
//     const today = new Date().toDateString();
//     if (date.toDateString() === today) return "Assigned today";
//     return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
//   };

//   const handleToggleTask = async (taskId: string, description: string) => {
//     try {
//       const token = await SecureStore.getItemAsync("token");
//       const res = await fetch(`${BASE_URL}/toggle/${taskId}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ userDescription: description }),
//       });
//       const data = await res.json();
//       if (!res.ok) { Alert.alert("Error", data.message || "Task update failed"); return; }
//       setTasks((prev) => prev.map((item) => (item._id === taskId ? data : item)));
//     } catch { Alert.alert("Error", "Task update nahi hua"); }
//   };

//   const renderTaskItem = ({ item }: { item: TaskItem }) => {
//     const isCompleted = item.status === "Completed";
//     const isReassigned = item.status === "Reassigned";
//     return (
//       <View style={userStyles.taskCard}>
//         <LinearGradient
//           colors={isCompleted ? ["rgba(18,122,110,0.15)", "rgba(255,255,255,0.95)"] : isReassigned ? ["rgba(55,138,221,0.15)", "rgba(255,255,255,0.95)"] : ["rgba(95,0,190,0.14)", "rgba(255,255,255,0.96)"]}
//           start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={userStyles.taskCardOverlay}
//         >
//           <View style={userStyles.taskTopRow}>
//             <View style={userStyles.iconTitleWrap}>
//               <View style={[userStyles.taskIconWrap, isCompleted ? userStyles.completedIconWrap : isReassigned ? userStyles.reassignedIconWrap : userStyles.pendingIconWrap]}>
//                 <Ionicons name={isCompleted ? "checkmark-done" : isReassigned ? "refresh-outline" : "time-outline"} size={18} color={isCompleted ? "#127a6e" : isReassigned ? "#378ADD" : "#5f00be"} />
//               </View>
//               <View style={userStyles.taskTextWrap}>
//                 <Text numberOfLines={2} style={[userStyles.taskTitle, isCompleted && userStyles.completedTaskTitle]}>{item.title}</Text>
//                 <Text style={userStyles.taskDate}>{item.project?.name || "No project"} • {formatTaskDate(item.createdAt)}</Text>
//               </View>
//             </View>
//             <View style={[userStyles.statusBadge, isCompleted ? userStyles.completedBadge : isReassigned ? userStyles.reassignedBadge : userStyles.pendingBadge]}>
//               <Text style={[userStyles.statusText, isCompleted ? userStyles.completedText : isReassigned ? userStyles.reassignedText : userStyles.pendingText]}>{item.status}</Text>
//             </View>
//           </View>
//           {isReassigned && !!item.adminNote && (
//             <View style={userStyles.adminNoteBox}>
//               <Text style={userStyles.adminNoteLabel}>Admin Feedback</Text>
//               <Text style={userStyles.adminNoteText}>{item.adminNote}</Text>
//             </View>
//           )}
//           {!isCompleted && (
//             <TouchableOpacity activeOpacity={0.85} onPress={() => { setPendingToggleId(item._id); setDescText(""); setDescModalVisible(true); }} style={userStyles.actionBtnWrap}>
//               <LinearGradient colors={isReassigned ? ["#378ADD", "#185FA5"] : ["#127a6e", "#081B43"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={userStyles.taskActionButton}>
//                 <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
//                 <Text style={userStyles.taskActionText}>{isReassigned ? "Resubmit Task" : "Mark as Complete"}</Text>
//               </LinearGradient>
//             </TouchableOpacity>
//           )}
//         </LinearGradient>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={userStyles.safeArea}>
//       <StatusBar barStyle="light-content" backgroundColor="#081B43" />
//       <View style={userStyles.topBg} />
//       <FlatList
//         data={filteredTasks} keyExtractor={(item) => item._id} renderItem={renderTaskItem}
//         showsVerticalScrollIndicator={false} contentContainerStyle={userStyles.listContent}
//         refreshing={loading} onRefresh={fetchAssignedTasks}
//         ListHeaderComponent={
//           <>
//             <View style={userStyles.headerOuter}>
//               <LinearGradient colors={["#5f00be", "#127a6e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={userStyles.headerCard}>
//                 <Text style={userStyles.headerTitle}>Assigned Tasks</Text>
//                 <Text style={userStyles.headerSubtitle}>Tasks assigned by admin will appear here. Track pending and completed work easily.</Text>
//               </LinearGradient>
//             </View>
//             <View style={userStyles.statsRow}>
//               <LinearGradient colors={["#081B43", "#102B63"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={userStyles.statCard}>
//                 <Text style={userStyles.statValue}>{tasks.length}</Text><Text style={userStyles.statLabel}>Total</Text>
//               </LinearGradient>
//               <LinearGradient colors={["#5f00be", "#7B28DB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={userStyles.statCard}>
//                 <Text style={userStyles.statValue}>{pendingCount}</Text><Text style={userStyles.statLabel}>Pending</Text>
//               </LinearGradient>
//               <LinearGradient colors={["#127a6e", "#19A08F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={userStyles.statCard}>
//                 <Text style={userStyles.statValue}>{completedCount}</Text><Text style={userStyles.statLabel}>Completed</Text>
//               </LinearGradient>
//             </View>
//             <View style={userStyles.tabRow}>
//               <TouchableOpacity style={[userStyles.tabBtn, activeTab === "Pending" && userStyles.tabBtnActive]} onPress={() => setActiveTab("Pending")}>
//                 <Text style={[userStyles.tabText, activeTab === "Pending" && userStyles.tabTextActive]}>Pending ({pendingCount})</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[userStyles.tabBtn, activeTab === "Completed" && userStyles.tabBtnActiveGreen]} onPress={() => setActiveTab("Completed")}>
//                 <Text style={[userStyles.tabText, activeTab === "Completed" && userStyles.tabTextActive]}>Completed ({completedCount})</Text>
//               </TouchableOpacity>
//             </View>
//             <View style={userStyles.sectionHeader}>
//               <Text style={userStyles.sectionTitle}>{activeTab === "Pending" ? "Pending Tasks" : "Completed Tasks"}</Text>
//             </View>
//           </>
//         }
//         ListEmptyComponent={
//           <View style={userStyles.emptyCard}>
//             <Ionicons name={activeTab === "Pending" ? "time-outline" : "checkmark-done-circle-outline"} size={40} color="#9CA3AF" />
//             <Text style={userStyles.emptyText}>{activeTab === "Pending" ? "Koi pending task nahi hai" : "Koi completed task nahi hai"}</Text>
//           </View>
//         }
//       />
//       <Modal visible={descModalVisible} transparent animationType="slide" onRequestClose={() => setDescModalVisible(false)}>
//         <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
//           <Pressable style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={() => setDescModalVisible(false)} />
//           <View style={userStyles.modalSheet}>
//             <View style={userStyles.modalHandle} />
//             <Text style={userStyles.modalTitle}>Task Complete karo</Text>
//             <Text style={userStyles.modalSub}>Kya kiya — thoda describe karo (optional)</Text>
//             <TextInput style={userStyles.modalInput} placeholder="e.g. Kaam complete ho gaya, testing bhi ki..." placeholderTextColor="#6B7280" multiline value={descText} onChangeText={setDescText} textAlignVertical="top" />
//             <View style={userStyles.modalBtns}>
//               <TouchableOpacity style={userStyles.modalBtnCancel} onPress={() => setDescModalVisible(false)}>
//                 <Text style={userStyles.modalBtnCancelText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={userStyles.modalBtnConfirm} onPress={async () => {
//                 setDescModalVisible(false);
//                 if (pendingToggleId) { await handleToggleTask(pendingToggleId, descText.trim()); setPendingToggleId(null); setDescText(""); }
//               }}>
//                 <LinearGradient colors={["#127a6e", "#081B43"]} style={userStyles.modalBtnGrad}>
//                   <Text style={userStyles.modalBtnConfirmText}>Submit ✓</Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// /* ═══════════════════════════════════════════════════
//    ADMIN STYLES
// ═══════════════════════════════════════════════════ */
// const adminStyles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#EEF3FB" },
//   wrapper: { paddingTop: 60, alignItems: "center", paddingBottom: 30 },
//   card: { width: "90%", borderRadius: 18, padding: 14, marginBottom: 14 },
//   row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
//   iconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginRight: 10 },
//   title: { color: "#fff", fontSize: 15, fontWeight: "700" },
//   subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 11 },
//   listCard: { width: "90%", backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 14 },
//   sectionTitle: { fontSize: 15, fontWeight: "700", color: "#081B43", marginBottom: 10 },
//   taskItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#F0F4F8" },
//   taskTitle: { fontSize: 13, fontWeight: "600", color: "#081B43" },
//   taskSubText: { fontSize: 11, color: "#6B7280", marginTop: 2 },
//   statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
//   statusText: { fontSize: 11, fontWeight: "700" },
//   loaderBox: { padding: 10, alignItems: "center" },
//   emptyText: { textAlign: "center", fontSize: 12, color: "#6B7280", marginTop: 6 },
//   addReminderBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center" },
//   reminderRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#F0F4F8" },
//   reminderTitle: { fontSize: 14, fontWeight: "600", color: "#081B43" },
//   reminderNote: { fontSize: 12, color: "#6B7280", marginTop: 2 },
//   reminderDate: { fontSize: 12, color: "#F57F17", marginTop: 2 },
//   emptyReminder: { alignItems: "center", paddingVertical: 20, gap: 8 },
//   createFirstBtn: { marginTop: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#FFF8E1", borderRadius: 10 },
//   createFirstText: { color: "#F57F17", fontWeight: "700", fontSize: 13 },
//   modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
//   modalHandle: { width: 36, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
//   modalTitle: { fontSize: 16, fontWeight: "700", color: "#081B43", marginBottom: 12 },
//   inputLabel: { fontSize: 13, fontWeight: "700", color: "#081B43", marginBottom: 6, marginTop: 10 },
//   textInput: { height: 50, borderWidth: 1, borderColor: "#D8E2F0", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#081B43", backgroundColor: "#F9FBFF" },
//   saveBtn: { height: 50, backgroundColor: "#F57F17", borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 16 },
//   saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
// });

// /* ═══════════════════════════════════════════════════
//    USER STYLES — UNCHANGED
// ═══════════════════════════════════════════════════ */
// const userStyles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: "#EEF3FB" },
//   topBg: { position: "absolute", top: 0, left: 0, right: 0, height: 140, backgroundColor: "#081B43", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
//   listContent: { paddingBottom: 30, paddingTop: 24 },
//   headerOuter: { paddingHorizontal: 16, marginTop: 28 },
//   headerCard: { borderRadius: 24, paddingHorizontal: 18, paddingVertical: 22, shadowColor: "#081B43", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 8 },
//   headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
//   headerSubtitle: { color: "rgba(255,255,255,0.86)", fontSize: 14, marginTop: 8, lineHeight: 20 },
//   statsRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: 18, gap: 10 },
//   statCard: { flex: 1, borderRadius: 18, paddingVertical: 18, alignItems: "center", justifyContent: "center", shadowColor: "#081B43", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
//   statValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
//   statLabel: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 6, fontWeight: "600" },
//   tabRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 18, gap: 10 },
//   tabBtn: { flex: 1, paddingVertical: 11, borderRadius: 14, backgroundColor: "#E5E7EB", alignItems: "center" },
//   tabBtnActive: { backgroundColor: "#5f00be" },
//   tabBtnActiveGreen: { backgroundColor: "#127a6e" },
//   tabText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },
//   tabTextActive: { color: "#FFFFFF" },
//   sectionHeader: { paddingHorizontal: 16, marginTop: 18, marginBottom: 10 },
//   sectionTitle: { fontSize: 20, fontWeight: "800", color: "#081B43" },
//   taskCard: { marginHorizontal: 16, marginBottom: 14, borderRadius: 22, overflow: "hidden", shadowColor: "#081B43", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 },
//   taskCardOverlay: { padding: 16, borderWidth: 1, borderColor: "rgba(8,27,67,0.06)", backgroundColor: "#fff" },
//   taskTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
//   iconTitleWrap: { flexDirection: "row", flex: 1, paddingRight: 10 },
//   taskIconWrap: { width: 40, height: 40, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 10 },
//   pendingIconWrap: { backgroundColor: "rgba(95,0,190,0.12)" },
//   completedIconWrap: { backgroundColor: "rgba(18,122,110,0.12)" },
//   reassignedIconWrap: { backgroundColor: "rgba(55,138,221,0.12)" },
//   taskTextWrap: { flex: 1 },
//   taskTitle: { fontSize: 16, fontWeight: "700", color: "#081B43", lineHeight: 22 },
//   completedTaskTitle: { textDecorationLine: "line-through", color: "#6F7A94" },
//   taskDate: { marginTop: 5, fontSize: 13, color: "#7A86A3", fontWeight: "500" },
//   statusBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
//   pendingBadge: { backgroundColor: "rgba(95,0,190,0.12)" },
//   completedBadge: { backgroundColor: "rgba(18,122,110,0.14)" },
//   reassignedBadge: { backgroundColor: "rgba(55,138,221,0.12)" },
//   statusText: { fontSize: 12, fontWeight: "700" },
//   pendingText: { color: "#5f00be" },
//   completedText: { color: "#127a6e" },
//   reassignedText: { color: "#378ADD" },
//   adminNoteBox: { backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10, marginBottom: 12, borderLeftWidth: 2, borderLeftColor: "#378ADD" },
//   adminNoteLabel: { fontSize: 10, fontWeight: "700", color: "#185FA5", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
//   adminNoteText: { fontSize: 12, color: "#1E40AF", lineHeight: 17 },
//   actionBtnWrap: { borderRadius: 16, overflow: "hidden" },
//   taskActionButton: { minHeight: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
//   taskActionText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
//   emptyCard: { marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 18, padding: 30, alignItems: "center", gap: 10 },
//   emptyText: { fontSize: 14, color: "#7A86A3", fontWeight: "600" },
//   modalSheet: { backgroundColor: "#0B1F4B", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
//   modalHandle: { width: 36, height: 4, backgroundColor: "#374151", borderRadius: 2, alignSelf: "center", marginBottom: 18 },
//   modalTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginBottom: 4 },
//   modalSub: { color: "#9CA3AF", fontSize: 12, marginBottom: 16, lineHeight: 18 },
//   modalInput: { borderWidth: 1, borderColor: "#374151", borderRadius: 12, padding: 12, fontSize: 13, color: "#FFFFFF", height: 100, backgroundColor: "#081B43" },
//   modalBtns: { flexDirection: "row", gap: 10, marginTop: 14 },
//   modalBtnCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 0.5, borderColor: "#374151", alignItems: "center", justifyContent: "center" },
//   modalBtnCancelText: { color: "#9CA3AF", fontWeight: "600", fontSize: 13 },
//   modalBtnConfirm: { flex: 2, borderRadius: 12, overflow: "hidden" },
//   modalBtnGrad: { paddingVertical: 13, alignItems: "center", justifyContent: "center" },
//   modalBtnConfirmText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
// });



// import React, { useEffect, useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   SafeAreaView,
//   StatusBar,
//   TouchableOpacity,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
//   Modal,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   TextInput,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import Button from "@/components/button";
// import { router } from "expo-router";
// import * as SecureStore from "expo-secure-store";

// type TaskItem = {
//   _id: string;
//   title: string;
//   status: "Pending" | "Completed" | "Approved" | "Reassigned";
//   dueDate?: string | null;
//   createdAt?: string;
//   taskType?: "my" | "team";
//   adminNote?: string;
//   assignedTo?: { _id?: string; name?: string } | null;
//   project?: { _id?: string; name?: string } | null;
// };

// export default function TaskScreen() {
//   const [role, setRole] = useState<"admin" | "user">("admin");

//   useEffect(() => {
//     const loadRole = async () => {
//       const savedRole = await SecureStore.getItemAsync("role");
//       setRole(savedRole === "user" ? "user" : "admin");
//     };
//     loadRole();
//   }, []);

//   if (role === "user") return <UserTaskScreen />;
//   return <AdminTaskScreen />;
// }

// /* ================= ADMIN TASK SCREEN — UNCHANGED ================= */

// function AdminTaskScreen() {
//   const [activeSection, setActiveSection] = useState<"myTask" | "teamTask" | null>(null);
//   const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
//   const [teamTasks, setTeamTasks] = useState<TaskItem[]>([]);
//   const [loadingMyTasks, setLoadingMyTasks] = useState(false);
//   const [loadingTeamTasks, setLoadingTeamTasks] = useState(false);

//   // ✅ apna actual route match karo — /api/task ya /api/tasks
//   const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/task`;

//   const fetchMyTasks = async () => {
//     try {
//       setLoadingMyTasks(true);
//       const token = await SecureStore.getItemAsync("token");
//       const adminId = await SecureStore.getItemAsync("adminId");
//       const res = await fetch(`${BASE_URL}/my/${adminId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       setMyTasks(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.log("Fetch my tasks error:", err);
//     } finally {
//       setLoadingMyTasks(false);
//     }
//   };

//   const fetchTeamTasks = async () => {
//     try {
//       setLoadingTeamTasks(true);
//       const token = await SecureStore.getItemAsync("token");
//       const adminId = await SecureStore.getItemAsync("adminId");
//       const res = await fetch(`${BASE_URL}/team/${adminId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       setTeamTasks(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.log("Fetch team tasks error:", err);
//     } finally {
//       setLoadingTeamTasks(false);
//     }
//   };

//   const toggleTaskStatus = async (id: string) => {
//     try {
//       const token = await SecureStore.getItemAsync("token");
//       await fetch(`${BASE_URL}/toggle/${id}`, {
//         method: "PUT",
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (activeSection === "myTask") fetchMyTasks();
//       if (activeSection === "teamTask") fetchTeamTasks();
//     } catch (err) {
//       console.log("Toggle task error:", err);
//     }
//   };

//   return (
//     <SafeAreaView style={adminStyles.container}>
//       <ScrollView contentContainerStyle={adminStyles.wrapper} showsVerticalScrollIndicator={false}>
//         <LinearGradient colors={["#5f00be", "#7b28db"]} style={adminStyles.card}>
//           <View style={adminStyles.row}>
//             <View style={adminStyles.iconBox}>
//               <Ionicons name="person-add-outline" size={20} color="#fff" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={adminStyles.title}>Assign Task</Text>
//               <Text style={adminStyles.subtitle}>Assign tasks to team</Text>
//             </View>
//           </View>
//           <Button title="Assign Task" onPress={() => router.push("/(screens)/assigned-tasks")} />
//         </LinearGradient>

//         <LinearGradient colors={["#081B43", "#0f2a5f"]} style={adminStyles.card}>
//           <View style={adminStyles.row}>
//             <View style={adminStyles.iconBox}>
//               <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={adminStyles.title}>My Tasks</Text>
//               <Text style={adminStyles.subtitle}>Manage your tasks</Text>
//             </View>
//           </View>
//           <Button
//             title={activeSection === "myTask" ? "Hide My Tasks" : "My Tasks"}
//             onPress={async () => {
//               if (activeSection === "myTask") { setActiveSection(null); return; }
//               setActiveSection("myTask");
//               await fetchMyTasks();
//             }}
//           />
//         </LinearGradient>

//         {activeSection === "myTask" && (
//           <View style={adminStyles.listCard}>
//             <Text style={adminStyles.sectionTitle}>My Task List</Text>
//             {loadingMyTasks ? (
//               <View style={adminStyles.loaderBox}><ActivityIndicator size="small" color="#5f00be" /></View>
//             ) : myTasks.length === 0 ? (
//               <Text style={adminStyles.emptyText}>No tasks found</Text>
//             ) : (
//               myTasks.map((item) => (
//                 <TouchableOpacity key={item._id} style={adminStyles.taskItem} onPress={() => toggleTaskStatus(item._id)}>
//                   <View style={adminStyles.taskLeft}>
//                     <Text style={adminStyles.taskTitle}>{item.title}</Text>
//                   </View>
//                   <Text style={[adminStyles.statusText, { color: item.status === "Completed" ? "#127a6e" : "#5f00be" }]}>
//                     {item.status}
//                   </Text>
//                 </TouchableOpacity>
//               ))
//             )}
//           </View>
//         )}

//         <LinearGradient colors={["#127a6e", "#19a08f"]} style={adminStyles.card}>
//           <View style={adminStyles.row}>
//             <View style={adminStyles.iconBox}>
//               <Ionicons name="people-outline" size={20} color="#fff" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={adminStyles.title}>Team Tasks</Text>
//               <Text style={adminStyles.subtitle}>View team tasks</Text>
//             </View>
//           </View>
//           <Button
//             title={activeSection === "teamTask" ? "Hide Team Tasks" : "Team Tasks"}
//             onPress={async () => {
//               if (activeSection === "teamTask") { setActiveSection(null); return; }
//               setActiveSection("teamTask");
//               await fetchTeamTasks();
//             }}
//           />
//         </LinearGradient>

//         {activeSection === "teamTask" && (
//           <View style={adminStyles.listCard}>
//             <Text style={adminStyles.sectionTitle}>Team Task List</Text>
//             {loadingTeamTasks ? (
//               <View style={adminStyles.loaderBox}><ActivityIndicator size="small" color="#127a6e" /></View>
//             ) : teamTasks.length === 0 ? (
//               <Text style={adminStyles.emptyText}>No team tasks found</Text>
//             ) : (
//               teamTasks.map((item) => (
//                 <TouchableOpacity key={item._id} style={adminStyles.taskItem} onPress={() => toggleTaskStatus(item._id)}>
//                   <View style={adminStyles.taskLeft}>
//                     <Text style={adminStyles.taskTitle}>{item.title}</Text>
//                     <Text style={adminStyles.taskSubText}>{item.assignedTo?.name || "User"}</Text>
//                   </View>
//                   <Text style={[adminStyles.statusText, { color: item.status === "Completed" ? "#127a6e" : "#5f00be" }]}>
//                     {item.status}
//                   </Text>
//                 </TouchableOpacity>
//               ))
//             )}
//           </View>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// /* ================= USER TASK SCREEN — UPDATED ================= */

// function UserTaskScreen() {
//   const [tasks, setTasks] = useState<TaskItem[]>([]);
//   const [loading, setLoading] = useState(false);

//   // ✅ Pending / Completed tab
//   const [activeTab, setActiveTab] = useState<"Pending" | "Completed">("Pending");

//   // ✅ Description modal
//   const [descModalVisible, setDescModalVisible] = useState(false);
//   const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
//   const [descText, setDescText] = useState("");

//   const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/task`;

//   useEffect(() => {
//     fetchAssignedTasks();
//   }, []);

//   const fetchAssignedTasks = async () => {
//     try {
//       setLoading(true);
//       const token = await SecureStore.getItemAsync("token");
//       const userId = await SecureStore.getItemAsync("userId");

//       if (!userId) {
//         Alert.alert("Session Error", "Please login again");
//         return;
//       }

//       const res = await fetch(`${BASE_URL}/user/${userId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await res.json();
//       setTasks(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.log("User assigned task error:", error);
//       Alert.alert("Error", "Network error — check your connection");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Tab wise filtered tasks
//   const filteredTasks = useMemo(
//     () => tasks.filter((t) => t.status === activeTab),
//     [tasks, activeTab]
//   );

//   const pendingCount = useMemo(() => tasks.filter((t) => t.status === "Pending").length, [tasks]);
//   const completedCount = useMemo(() => tasks.filter((t) => t.status === "Completed").length, [tasks]);

//   const formatTaskDate = (dateString?: string) => {
//     if (!dateString) return "Assigned recently";
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return "Assigned recently";
//     const today = new Date().toDateString();
//     if (date.toDateString() === today) return "Assigned today";
//     return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
//   };

//   // ✅ Description ke saath toggle
//   const handleToggleTask = async (taskId: string, description: string) => {
//     try {
//       const token = await SecureStore.getItemAsync("token");
//       const res = await fetch(`${BASE_URL}/toggle/${taskId}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ userDescription: description }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         Alert.alert("Error", data.message || "Task update failed");
//         return;
//       }

//       setTasks((prev) => prev.map((item) => (item._id === taskId ? data : item)));
//     } catch (error) {
//       console.log("Toggle user task error:", error);
//       Alert.alert("Error", "Task update nahi hua");
//     }
//   };

//   const renderTaskItem = ({ item }: { item: TaskItem }) => {
//     const isCompleted = item.status === "Completed";
//     const isReassigned = item.status === "Reassigned";

//     return (
//       <View style={userStyles.taskCard}>
//         <LinearGradient
//           colors={
//             isCompleted
//               ? ["rgba(18,122,110,0.15)", "rgba(255,255,255,0.95)"]
//               : isReassigned
//               ? ["rgba(55,138,221,0.15)", "rgba(255,255,255,0.95)"]
//               : ["rgba(95,0,190,0.14)", "rgba(255,255,255,0.96)"]
//           }
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={userStyles.taskCardOverlay}
//         >
//           <View style={userStyles.taskTopRow}>
//             <View style={userStyles.iconTitleWrap}>
//               <View
//                 style={[
//                   userStyles.taskIconWrap,
//                   isCompleted
//                     ? userStyles.completedIconWrap
//                     : isReassigned
//                     ? userStyles.reassignedIconWrap
//                     : userStyles.pendingIconWrap,
//                 ]}
//               >
//                 <Ionicons
//                   name={
//                     isCompleted
//                       ? "checkmark-done"
//                       : isReassigned
//                       ? "refresh-outline"
//                       : "time-outline"
//                   }
//                   size={18}
//                   color={isCompleted ? "#127a6e" : isReassigned ? "#378ADD" : "#5f00be"}
//                 />
//               </View>

//               <View style={userStyles.taskTextWrap}>
//                 <Text
//                   numberOfLines={2}
//                   style={[
//                     userStyles.taskTitle,
//                     isCompleted && userStyles.completedTaskTitle,
//                   ]}
//                 >
//                   {item.title}
//                 </Text>
//                 <Text style={userStyles.taskDate}>
//                   {item.project?.name || "No project"} • {formatTaskDate(item.createdAt)}
//                 </Text>
//               </View>
//             </View>

//             <View
//               style={[
//                 userStyles.statusBadge,
//                 isCompleted
//                   ? userStyles.completedBadge
//                   : isReassigned
//                   ? userStyles.reassignedBadge
//                   : userStyles.pendingBadge,
//               ]}
//             >
//               <Text
//                 style={[
//                   userStyles.statusText,
//                   isCompleted
//                     ? userStyles.completedText
//                     : isReassigned
//                     ? userStyles.reassignedText
//                     : userStyles.pendingText,
//                 ]}
//               >
//                 {item.status}
//               </Text>
//             </View>
//           </View>

//           {/* ✅ Admin note — agar reassign kiya ho */}
//           {isReassigned && !!item.adminNote && (
//             <View style={userStyles.adminNoteBox}>
//               <Text style={userStyles.adminNoteLabel}>Admin Feedback</Text>
//               <Text style={userStyles.adminNoteText}>{item.adminNote}</Text>
//             </View>
//           )}

//           {/* ✅ Sirf pending aur reassigned tasks toggle ho sakte hain */}
//           {!isCompleted && (
//             <TouchableOpacity
//               activeOpacity={0.85}
//               onPress={() => {
//                 setPendingToggleId(item._id);
//                 setDescText("");
//                 setDescModalVisible(true);
//               }}
//               style={userStyles.actionBtnWrap}
//             >
//               <LinearGradient
//                 colors={isReassigned ? ["#378ADD", "#185FA5"] : ["#127a6e", "#081B43"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//                 style={userStyles.taskActionButton}
//               >
//                 <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
//                 <Text style={userStyles.taskActionText}>
//                   {isReassigned ? "Resubmit Task" : "Mark as Complete"}
//                 </Text>
//               </LinearGradient>
//             </TouchableOpacity>
//           )}
//         </LinearGradient>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={userStyles.safeArea}>
//       <StatusBar barStyle="light-content" backgroundColor="#081B43" />
//       <View style={userStyles.topBg} />

//       <FlatList
//         data={filteredTasks}
//         keyExtractor={(item) => item._id}
//         renderItem={renderTaskItem}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={userStyles.listContent}
//         refreshing={loading}
//         onRefresh={fetchAssignedTasks}
//         ListHeaderComponent={
//           <>
//             <View style={userStyles.headerOuter}>
//               <LinearGradient
//                 colors={["#5f00be", "#127a6e"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 1 }}
//                 style={userStyles.headerCard}
//               >
//                 <Text style={userStyles.headerTitle}>Assigned Tasks</Text>
//                 <Text style={userStyles.headerSubtitle}>
//                   Tasks assigned by admin will appear here. Track pending and completed work easily.
//                 </Text>
//               </LinearGradient>
//             </View>

//             {/* Stats */}
//             <View style={userStyles.statsRow}>
//               <LinearGradient colors={["#081B43", "#102B63"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={userStyles.statCard}>
//                 <Text style={userStyles.statValue}>{tasks.length}</Text>
//                 <Text style={userStyles.statLabel}>Total</Text>
//               </LinearGradient>
//               <LinearGradient colors={["#5f00be", "#7B28DB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={userStyles.statCard}>
//                 <Text style={userStyles.statValue}>{pendingCount}</Text>
//                 <Text style={userStyles.statLabel}>Pending</Text>
//               </LinearGradient>
//               <LinearGradient colors={["#127a6e", "#19A08F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={userStyles.statCard}>
//                 <Text style={userStyles.statValue}>{completedCount}</Text>
//                 <Text style={userStyles.statLabel}>Completed</Text>
//               </LinearGradient>
//             </View>

//             {/* ✅ Pending / Completed Tabs */}
//             <View style={userStyles.tabRow}>
//               <TouchableOpacity
//                 style={[userStyles.tabBtn, activeTab === "Pending" && userStyles.tabBtnActive]}
//                 onPress={() => setActiveTab("Pending")}
//               >
//                 <Text style={[userStyles.tabText, activeTab === "Pending" && userStyles.tabTextActive]}>
//                   Pending ({pendingCount})
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[userStyles.tabBtn, activeTab === "Completed" && userStyles.tabBtnActiveGreen]}
//                 onPress={() => setActiveTab("Completed")}
//               >
//                 <Text style={[userStyles.tabText, activeTab === "Completed" && userStyles.tabTextActive]}>
//                   Completed ({completedCount})
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             <View style={userStyles.sectionHeader}>
//               <Text style={userStyles.sectionTitle}>
//                 {activeTab === "Pending" ? "Pending Tasks" : "Completed Tasks"}
//               </Text>
//             </View>
//           </>
//         }
//         ListEmptyComponent={
//           <View style={userStyles.emptyCard}>
//             <Ionicons
//               name={activeTab === "Pending" ? "time-outline" : "checkmark-done-circle-outline"}
//               size={40}
//               color="#9CA3AF"
//             />
//             <Text style={userStyles.emptyText}>
//               {activeTab === "Pending" ? "Koi pending task nahi hai" : "Koi completed task nahi hai"}
//             </Text>
//           </View>
//         }
//       />

//       {/* ✅ Description Modal */}
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
//             style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" }}
//             onPress={() => setDescModalVisible(false)}
//           />
//           <View style={userStyles.modalSheet}>
//             <View style={userStyles.modalHandle} />
//             <Text style={userStyles.modalTitle}>Task Complete karo</Text>
//             <Text style={userStyles.modalSub}>
//               Kya kiya — thoda describe karo (optional)
//             </Text>
//             <TextInput
//               style={userStyles.modalInput}
//               placeholder="e.g. Kaam complete ho gaya, testing bhi ki..."
//               placeholderTextColor="#6B7280"
//               multiline
//               value={descText}
//               onChangeText={setDescText}
//               textAlignVertical="top"
//             />
//             <View style={userStyles.modalBtns}>
//               <TouchableOpacity
//                 style={userStyles.modalBtnCancel}
//                 onPress={() => setDescModalVisible(false)}
//               >
//                 <Text style={userStyles.modalBtnCancelText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={userStyles.modalBtnConfirm}
//                 onPress={async () => {
//                   setDescModalVisible(false);
//                   if (pendingToggleId) {
//                     await handleToggleTask(pendingToggleId, descText.trim());
//                     setPendingToggleId(null);
//                     setDescText("");
//                   }
//                 }}
//               >
//                 <LinearGradient colors={["#127a6e", "#081B43"]} style={userStyles.modalBtnGrad}>
//                   <Text style={userStyles.modalBtnConfirmText}>Submit ✓</Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// /* ================= ADMIN STYLES — UNCHANGED ================= */
// const adminStyles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#EEF3FB" },
//   wrapper: { paddingTop: 60, alignItems: "center", paddingBottom: 30 },
//   card: { width: "90%", borderRadius: 18, padding: 14, marginBottom: 14 },
//   row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
//   iconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginRight: 10 },
//   title: { color: "#fff", fontSize: 15, fontWeight: "700" },
//   subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 11 },
//   listCard: { width: "90%", backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 14 },
//   sectionTitle: { fontSize: 15, fontWeight: "700", color: "#081B43" },
//   taskItem: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
//   taskLeft: {},
//   taskTitle: { fontSize: 13, fontWeight: "600", color: "#081B43" },
//   taskSubText: { fontSize: 11, color: "#6B7280" },
//   statusText: { fontSize: 11, fontWeight: "700" },
//   loaderBox: { padding: 10, alignItems: "center" },
//   emptyText: { textAlign: "center", fontSize: 12, color: "#6B7280", marginTop: 10 },
// });

// /* ================= USER STYLES ================= */
// const userStyles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: "#EEF3FB" },
//   topBg: { position: "absolute", top: 0, left: 0, right: 0, height: 140, backgroundColor: "#081B43", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
//   listContent: { paddingBottom: 30, paddingTop: 24 },
//   headerOuter: { paddingHorizontal: 16, marginTop: 28 },
//   headerCard: { borderRadius: 24, paddingHorizontal: 18, paddingVertical: 22, shadowColor: "#081B43", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 8 },
//   headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
//   headerSubtitle: { color: "rgba(255,255,255,0.86)", fontSize: 14, marginTop: 8, lineHeight: 20 },
//   statsRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: 18, gap: 10 },
//   statCard: { flex: 1, borderRadius: 18, paddingVertical: 18, alignItems: "center", justifyContent: "center", shadowColor: "#081B43", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
//   statValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
//   statLabel: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 6, fontWeight: "600" },

//   // ✅ Tabs
//   tabRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 18, gap: 10 },
//   tabBtn: { flex: 1, paddingVertical: 11, borderRadius: 14, backgroundColor: "#E5E7EB", alignItems: "center" },
//   tabBtnActive: { backgroundColor: "#5f00be" },
//   tabBtnActiveGreen: { backgroundColor: "#127a6e" },
//   tabText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },
//   tabTextActive: { color: "#FFFFFF" },

//   sectionHeader: { paddingHorizontal: 16, marginTop: 18, marginBottom: 10 },
//   sectionTitle: { fontSize: 20, fontWeight: "800", color: "#081B43" },
//   taskCard: { marginHorizontal: 16, marginBottom: 14, borderRadius: 22, overflow: "hidden", shadowColor: "#081B43", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 },
//   taskCardOverlay: { padding: 16, borderWidth: 1, borderColor: "rgba(8,27,67,0.06)", backgroundColor: "#fff" },
//   taskTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
//   iconTitleWrap: { flexDirection: "row", flex: 1, paddingRight: 10 },
//   taskIconWrap: { width: 40, height: 40, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 10 },
//   pendingIconWrap: { backgroundColor: "rgba(95,0,190,0.12)" },
//   completedIconWrap: { backgroundColor: "rgba(18,122,110,0.12)" },
//   reassignedIconWrap: { backgroundColor: "rgba(55,138,221,0.12)" },
//   taskTextWrap: { flex: 1 },
//   taskTitle: { fontSize: 16, fontWeight: "700", color: "#081B43", lineHeight: 22 },
//   completedTaskTitle: { textDecorationLine: "line-through", color: "#6F7A94" },
//   taskDate: { marginTop: 5, fontSize: 13, color: "#7A86A3", fontWeight: "500" },
//   statusBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
//   pendingBadge: { backgroundColor: "rgba(95,0,190,0.12)" },
//   completedBadge: { backgroundColor: "rgba(18,122,110,0.14)" },
//   reassignedBadge: { backgroundColor: "rgba(55,138,221,0.12)" },
//   statusText: { fontSize: 12, fontWeight: "700" },
//   pendingText: { color: "#5f00be" },
//   completedText: { color: "#127a6e" },
//   reassignedText: { color: "#378ADD" },

//   // ✅ Admin note box
//   adminNoteBox: { backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10, marginBottom: 12, borderLeftWidth: 2, borderLeftColor: "#378ADD" },
//   adminNoteLabel: { fontSize: 10, fontWeight: "700", color: "#185FA5", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
//   adminNoteText: { fontSize: 12, color: "#1E40AF", lineHeight: 17 },

//   actionBtnWrap: { borderRadius: 16, overflow: "hidden" },
//   taskActionButton: { minHeight: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
//   taskActionText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
//   emptyCard: { marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 18, padding: 30, alignItems: "center", gap: 10 },
//   emptyText: { fontSize: 14, color: "#7A86A3", fontWeight: "600" },

//   // ✅ Modal
//   modalSheet: { backgroundColor: "#0B1F4B", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
//   modalHandle: { width: 36, height: 4, backgroundColor: "#374151", borderRadius: 2, alignSelf: "center", marginBottom: 18 },
//   modalTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginBottom: 4 },
//   modalSub: { color: "#9CA3AF", fontSize: 12, marginBottom: 16, lineHeight: 18 },
//   modalInput: { borderWidth: 1, borderColor: "#374151", borderRadius: 12, padding: 12, fontSize: 13, color: "#FFFFFF", height: 100, backgroundColor: "#081B43" },
//   modalBtns: { flexDirection: "row", gap: 10, marginTop: 14 },
//   modalBtnCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 0.5, borderColor: "#374151", alignItems: "center", justifyContent: "center" },
//   modalBtnCancelText: { color: "#9CA3AF", fontWeight: "600", fontSize: 13 },
//   modalBtnConfirm: { flex: 2, borderRadius: 12, overflow: "hidden" },
//   modalBtnGrad: { paddingVertical: 13, alignItems: "center", justifyContent: "center" },
//   modalBtnConfirmText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
// });