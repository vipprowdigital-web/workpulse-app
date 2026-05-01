import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { router, useFocusEffect } from "expo-router";

type AdminProfile = {
  _id: string;
  companyName: string;
  email: string;
  phone: string;
  businessType: string;
  address: string;
  createdAt?: string;
};

type UserType = {
  _id: string;
  name: string;
  email: string;
  mobileNo: string;
  department: string;
  isActive: boolean;
  createdAt?: string;
};

type ProjectType = {
  _id: string;
  name: string;
  dueDate?: string | null;
  createdAt?: string;
  team?: { _id: string; name: string } | null;
};

type DepartmentType = {
  _id: string;
  name: string;
  count?: number;
  users?: UserType[];
};

type TaskType = {
  _id: string;
  title: string;
  status: "Pending" | "Completed" | "Approved" | "Reassigned";
  dueDate?: string | null;
  createdAt?: string;
  project?: { _id: string; name: string } | null;
  team?: { _id: string; name: string } | null;
};

type ModalType = "users" | "projects" | "departments" | "profile" | null;
type UserModalType = "profile" | "tasks" | "pending" | "completed" | null;

export default function AccountScreen() {
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      const savedRole = await SecureStore.getItemAsync("role");
      setRole(savedRole === "user" ? "user" : "admin");
    };

    loadRole();
  }, []);

  if (role === null) {
    return (
      <View style={styles.loaderFull}>
        <ActivityIndicator size="large" color="#1D6FA4" />
      </View>
    );
  }

  if (role === "user") {
    return <UserAccount />;
  }

  return <AdminAccount />;
}

function AdminAccount() {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const [newDeptName, setNewDeptName] = useState("");
  const [creatingDept, setCreatingDept] = useState(false);
  const [addDeptVisible, setAddDeptVisible] = useState(false);

  const API = process.env.EXPO_PUBLIC_API_URL;

  const fetchAll = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const headers = { Authorization: `Bearer ${token}` };

      const profileRes = await fetch(`${API}/api/auth/me`, { headers });
      if (profileRes.ok) setAdminProfile(await profileRes.json());

      let fetchedUsers: UserType[] = [];

      const usersRes = await fetch(`${API}/api/user`, { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (Array.isArray(usersData)) {
          fetchedUsers = usersData;
          setUsers(usersData);
        }
      }

      const projectsRes = await fetch(`${API}/api/project`, { headers });
      if (projectsRes.ok) {
        const pData = await projectsRes.json();
        if (Array.isArray(pData)) setProjects(pData);
      }

      const deptRes = await fetch(`${API}/api/department`, { headers });
      if (deptRes.ok) {
        const deptData = await deptRes.json();

        if (Array.isArray(deptData)) {
          const enriched = deptData.map((d: DepartmentType) => ({
            ...d,
            users: fetchedUsers.filter((u) => u.department === d.name),
            count: fetchedUsers.filter((u) => u.department === d.name).length,
          }));

          setDepartments(enriched);
        }
      }
    } catch (e) {
      console.log("Account fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) {
      Alert.alert("Validation", "Department name required");
      return;
    }

    try {
      setCreatingDept(true);
      const token = await SecureStore.getItemAsync("token");

      const res = await fetch(`${API}/api/department`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newDeptName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed");
        return;
      }

      setNewDeptName("");
      setAddDeptVisible(false);
      await fetchAll();

      Alert.alert("Success", `"${data.name}" department created!`);
    } catch (e) {
      Alert.alert("Error", "Could not create department");
    } finally {
      setCreatingDept(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Do You Want Logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("token");
          await SecureStore.deleteItemAsync("role");
          await SecureStore.deleteItemAsync("adminId");
          await SecureStore.deleteItemAsync("adminName");
          await SecureStore.deleteItemAsync("companyId");
          await SecureStore.deleteItemAsync("userId");
          await SecureStore.deleteItemAsync("userName");
          router.replace("/(auth)/logout");
        },
      },
    ]);
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "N/A";
    const date = new Date(d);

    return isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const initials = adminProfile?.companyName?.charAt(0).toUpperCase() || "A";

  const menuItems = [
    {
      key: "profile",
      icon: "person-outline" as const,
      label: "Company Profile",
      sub: adminProfile?.businessType || "View details",
      iconBg: "#E3F2FD",
      iconColor: "#1D6FA4",
      onPress: () => setActiveModal("profile"),
    },
    {
      key: "users",
      icon: "people-outline" as const,
      label: "Team Members",
      sub: `${users.length} employees`,
      iconBg: "#E8F5E9",
      iconColor: "#2E7D32",
      onPress: () => setActiveModal("users"),
    },
    {
      key: "projects",
      icon: "folder-open-outline" as const,
      label: "Projects",
      sub: `${projects.length} projects`,
      iconBg: "#F3E5F5",
      iconColor: "#7B1FA2",
      onPress: () => setActiveModal("projects"),
    },
    {
      key: "departments",
      icon: "business-outline" as const,
      label: "Departments",
      sub: `${departments.length} departments`,
      iconBg: "#FFF8E1",
      iconColor: "#F57F17",
      onPress: () => setActiveModal("departments"),
    },
    {
      key: "createproject",
      icon: "add-circle-outline" as const,
      label: "Create Project",
      sub: "Start a new project",
      iconBg: "#FCE4EC",
      iconColor: "#C62828",
      onPress: () => router.push("/(screens)/create-project"),
    },
  ];

  if (loading) {
    return (
      <View style={styles.loaderFull}>
        <ActivityIndicator size="large" color="#1D6FA4" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={["#C8DDEF", "#E8F4FB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.profileSection}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.adminName}>
          {adminProfile?.companyName || "Company"}
        </Text>

        <TouchableOpacity
          style={styles.adminIdRow}
          onPress={() => setActiveModal("profile")}
        >
          <Text style={styles.adminIdText}>
            {adminProfile?.businessType || "Admin"}
          </Text>
          <Ionicons name="chevron-forward" size={13} color="#1D6FA4" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.statsStrip}>
        <View style={styles.statPill}>
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statPill}>
          <Text style={styles.statValue}>{projects.length}</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statPill}>
          <Text style={styles.statValue}>{departments.length}</Text>
          <Text style={styles.statLabel}>Depts</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.menuRow, index > 0 && styles.menuRowBorder]}
            onPress={item.onPress}
            activeOpacity={0.6}
          >
            <View
              style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}
            >
              <Ionicons name={item.icon} size={22} color={item.iconColor} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#B0BEC5" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.logoutRow}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color="#E53935" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>WorkPulse v1.0.0</Text>

      <Modal
        visible={activeModal === "profile"}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Company Profile</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color="#455A64" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {[
                {
                  icon: "business-outline",
                  label: "Company Name",
                  value: adminProfile?.companyName,
                },
                {
                  icon: "mail-outline",
                  label: "Email",
                  value: adminProfile?.email,
                },
                {
                  icon: "call-outline",
                  label: "Phone",
                  value: adminProfile?.phone,
                },
                {
                  icon: "briefcase-outline",
                  label: "Business Type",
                  value: adminProfile?.businessType,
                },
                {
                  icon: "location-outline",
                  label: "Address",
                  value: adminProfile?.address,
                },
                {
                  icon: "calendar-outline",
                  label: "Registered On",
                  value: formatDate(adminProfile?.createdAt),
                },
              ].map((row) => (
                <View key={row.label} style={styles.detailRow}>
                  <Ionicons
                    name={row.icon as any}
                    size={18}
                    color="#1D6FA4"
                    style={{ width: 26 }}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{row.value || "—"}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={activeModal === "users"}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Team Members ({users.length})</Text>

              <View
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <TouchableOpacity
                  style={styles.addDeptHeaderBtn}
                  onPress={() => {
                    setActiveModal(null);
                    setTimeout(() => router.push("/(screens)/add-user"), 300);
                  }}
                >
                  <Ionicons name="person-add-outline" size={16} color="#fff" />
                  <Text style={styles.addDeptHeaderBtnText}>Add</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <Ionicons name="close" size={22} color="#455A64" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {users.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="people-outline" size={44} color="#CFD8DC" />
                  <Text style={styles.emptyTxt}>Koi user nahi mila</Text>
                </View>
              ) : (
                users.map((u) => (
                  <View key={u._id} style={styles.userRow}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarTxt}>
                        {u.name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{u.name}</Text>
                      <Text style={styles.userMeta}>{u.email}</Text>

                      <View style={styles.tagRow}>
                        <View
                          style={[styles.tag, { backgroundColor: "#E3F2FD" }]}
                        >
                          <Text style={[styles.tagTxt, { color: "#1D6FA4" }]}>
                            {u.department}
                          </Text>
                        </View>

                        <View
                          style={[styles.tag, { backgroundColor: "#F5F5F5" }]}
                        >
                          <Text style={[styles.tagTxt, { color: "#555" }]}>
                            {u.mobileNo}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={activeModal === "projects"}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Projects ({projects.length})</Text>

              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color="#455A64" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {projects.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons
                    name="folder-open-outline"
                    size={44}
                    color="#CFD8DC"
                  />
                  <Text style={styles.emptyTxt}>Koi project nahi mila</Text>
                </View>
              ) : (
                projects.map((p, i) => (
                  <View key={p._id} style={styles.projectRow}>
                    <View style={styles.projectNum}>
                      <Text style={styles.projectNumTxt}>{i + 1}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.projectName}>{p.name}</Text>

                      {p.team && (
                        <Text style={styles.projectMeta}>Team: {p.team.name}</Text>
                      )}

                      <Text style={styles.projectMeta}>
                        Created: {formatDate(p.createdAt)}
                        {p.dueDate ? `  •  Due: ${formatDate(p.dueDate)}` : ""}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={activeModal === "departments"}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Departments ({departments.length})
              </Text>

              <View
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <TouchableOpacity
                  style={styles.addDeptHeaderBtn}
                  onPress={() => {
                    setActiveModal(null);
                    setTimeout(() => setAddDeptVisible(true), 400);
                  }}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addDeptHeaderBtnText}>New</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <Ionicons name="close" size={22} color="#455A64" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {departments.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="business-outline" size={44} color="#CFD8DC" />
                  <Text style={styles.emptyTxt}>Koi department nahi hai</Text>

                  <TouchableOpacity
                    style={styles.createFirstDeptBtn}
                    onPress={() => {
                      setActiveModal(null);
                      setTimeout(() => setAddDeptVisible(true), 400);
                    }}
                  >
                    <Text style={styles.createFirstDeptText}>
                      + Create First Department
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                departments.map((dept) => (
                  <View key={dept._id} style={styles.deptBlock}>
                    <TouchableOpacity
                      style={styles.deptHeader}
                      onPress={() =>
                        setExpandedDept(
                          expandedDept === dept._id ? null : dept._id
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.deptIcon}>
                        <Ionicons
                          name="layers-outline"
                          size={20}
                          color="#1D6FA4"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.deptName}>{dept.name}</Text>
                        <Text style={styles.deptCount}>
                          {dept.count ?? 0} member
                          {(dept.count ?? 0) !== 1 ? "s" : ""}
                        </Text>
                      </View>

                      <Ionicons
                        name={
                          expandedDept === dept._id
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={18}
                        color="#90A4AE"
                      />
                    </TouchableOpacity>

                    {expandedDept === dept._id &&
                      (dept.users ?? []).length === 0 && (
                        <View style={styles.deptEmptyUsers}>
                          <Text style={styles.deptEmptyUsersText}>
                            No members in this department
                          </Text>
                        </View>
                      )}

                    {expandedDept === dept._id &&
                      (dept.users ?? []).map((u) => (
                        <View key={u._id} style={styles.deptUserRow}>
                          <View style={styles.deptUserAvatar}>
                            <Text style={styles.deptUserAvatarTxt}>
                              {u.name?.charAt(0).toUpperCase()}
                            </Text>
                          </View>

                          <View>
                            <Text style={styles.deptUserName}>{u.name}</Text>
                            <Text style={styles.deptUserEmail}>{u.email}</Text>
                          </View>
                        </View>
                      ))}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addDeptVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddDeptVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: "42%" }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Department</Text>
              <TouchableOpacity onPress={() => setAddDeptVisible(false)}>
                <Ionicons name="close" size={22} color="#455A64" />
              </TouchableOpacity>
            </View>

            <View style={styles.newDeptForm}>
              <TextInput
                style={styles.newDeptInput}
                placeholder="e.g. Finance, Operations, Legal..."
                placeholderTextColor="#9CA3AF"
                value={newDeptName}
                onChangeText={setNewDeptName}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.createDeptBtn, creatingDept && { opacity: 0.7 }]}
                onPress={handleCreateDepartment}
                disabled={creatingDept}
                activeOpacity={0.8}
              >
                {creatingDept ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createDeptBtnText}>Create Department</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function UserAccount() {
  const [profile, setProfile] = useState<UserType | null>(null);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState<UserModalType>(null);

  const API = process.env.EXPO_PUBLIC_API_URL;

  const fetchUserAccount = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const userId = await SecureStore.getItemAsync("userId");

      const headers = { Authorization: `Bearer ${token}` };

      const profileRes = await fetch(`${API}/api/user/me`, { headers });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      if (userId) {
        const taskRes = await fetch(`${API}/api/task/user/${userId}`, {
          headers,
        });

        if (taskRes.ok) {
          const taskData = await taskRes.json();
          if (Array.isArray(taskData)) setTasks(taskData);
        }
      }
    } catch (error) {
      console.log("User account fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useFocusEffect(
    useCallback(() => {
      fetchUserAccount();
    }, [fetchUserAccount])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserAccount();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("token");
          await SecureStore.deleteItemAsync("role");
          await SecureStore.deleteItemAsync("userId");
          await SecureStore.deleteItemAsync("userName");
          
          router.replace("/(auth)/logout");
        },
      },
    ]);
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "N/A";
    const date = new Date(d);

    return isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const pendingTasks = tasks.filter((t) => t.status === "Pending");
  const completedTasks = tasks.filter(
    (t) => t.status === "Completed" || t.status === "Approved"
  );

  const userName = profile?.name || "User";
  const initials = userName.charAt(0).toUpperCase();

  const userMenuItems = [
    {
      key: "profile",
      icon: "person-outline" as const,
      label: "My Profile",
      sub: profile?.department || "View details",
      iconBg: "#E3F2FD",
      iconColor: "#1D6FA4",
      onPress: () => setActiveModal("profile"),
    },
    {
      key: "tasks",
      icon: "list-outline" as const,
      label: "My Tasks",
      sub: `${tasks.length} assigned tasks`,
      iconBg: "#F3E5F5",
      iconColor: "#7B1FA2",
      onPress: () => setActiveModal("tasks"),
    },
    {
      key: "pending",
      icon: "time-outline" as const,
      label: "Pending Tasks",
      sub: `${pendingTasks.length} pending`,
      iconBg: "#FFF8E1",
      iconColor: "#F57F17",
      onPress: () => setActiveModal("pending"),
    },
    {
      key: "completed",
      icon: "checkmark-done-outline" as const,
      label: "Completed Tasks",
      sub: `${completedTasks.length} completed`,
      iconBg: "#E8F5E9",
      iconColor: "#2E7D32",
      onPress: () => setActiveModal("completed"),
    },
  ];

  const modalTasks =
    activeModal === "pending"
      ? pendingTasks
      : activeModal === "completed"
      ? completedTasks
      : tasks;

  if (loading) {
    return (
      <View style={styles.loaderFull}>
        <ActivityIndicator size="large" color="#1D6FA4" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={["#C8DDEF", "#E8F4FB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.profileSection}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.adminName}>{userName}</Text>

        <TouchableOpacity
          style={styles.adminIdRow}
          onPress={() => setActiveModal("profile")}
        >
          <Text style={styles.adminIdText}>{profile?.department || "User"}</Text>
          <Ionicons name="chevron-forward" size={13} color="#1D6FA4" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.statsStrip}>
        <View style={styles.statPill}>
          <Text style={styles.statValue}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statPill}>
          <Text style={styles.statValue}>{pendingTasks.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statPill}>
          <Text style={styles.statValue}>{completedTasks.length}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        {userMenuItems.map((item, index) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.menuRow, index > 0 && styles.menuRowBorder]}
            onPress={item.onPress}
            activeOpacity={0.6}
          >
            <View
              style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}
            >
              <Ionicons name={item.icon} size={22} color={item.iconColor} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#B0BEC5" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.logoutRow}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color="#E53935" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>WorkPulse v1.0.0</Text>

      <Modal
        visible={activeModal === "profile"}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Profile</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color="#455A64" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {[
                {
                  icon: "person-outline",
                  label: "Name",
                  value: profile?.name,
                },
                {
                  icon: "mail-outline",
                  label: "Email",
                  value: profile?.email,
                },
                {
                  icon: "call-outline",
                  label: "Mobile",
                  value: profile?.mobileNo,
                },
                {
                  icon: "business-outline",
                  label: "Department",
                  value: profile?.department,
                },
                {
                  icon: "calendar-outline",
                  label: "Joined On",
                  value: formatDate(profile?.createdAt),
                },
              ].map((row) => (
                <View key={row.label} style={styles.detailRow}>
                  <Ionicons
                    name={row.icon as any}
                    size={18}
                    color="#1D6FA4"
                    style={{ width: 26 }}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{row.value || "—"}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          activeModal === "tasks" ||
          activeModal === "pending" ||
          activeModal === "completed"
        }
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === "pending"
                  ? `Pending Tasks (${pendingTasks.length})`
                  : activeModal === "completed"
                  ? `Completed Tasks (${completedTasks.length})`
                  : `My Tasks (${tasks.length})`}
              </Text>

              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color="#455A64" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {modalTasks.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="list-outline" size={44} color="#CFD8DC" />
                  <Text style={styles.emptyTxt}>No Task Assigned</Text>
                </View>
              ) : (
                modalTasks.map((task, i) => (
                  <View key={task._id} style={styles.projectRow}>
                    <View style={styles.projectNum}>
                      <Text style={styles.projectNumTxt}>{i + 1}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.projectName}>{task.title}</Text>

                      <Text style={styles.projectMeta}>
                        {task.project?.name || "No project"} • Status:{" "}
                        {task.status}
                      </Text>

                      <Text style={styles.projectMeta}>
                        Created: {formatDate(task.createdAt)}
                        {task.dueDate ? `  •  Due: ${formatDate(task.dueDate)}` : ""}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  loaderFull: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  profileSection: {
    paddingTop: 70,
    paddingBottom: 28,
    alignItems: "center",
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#B0C4D8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1D6FA4",
  },
  adminName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A2E44",
  },
  adminIdRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  adminIdText: {
    fontSize: 14,
    color: "#1D6FA4",
    fontWeight: "500",
  },
  statsStrip: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -14,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 18,
  },
  statPill: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A2E44",
  },
  statLabel: {
    fontSize: 11,
    color: "#90A4AE",
    marginTop: 2,
    fontWeight: "500",
  },
  menuCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F0F4F8",
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A2E44",
  },
  menuSub: {
    fontSize: 12,
    color: "#90A4AE",
    marginTop: 1,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 6,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  logoutText: {
    color: "#E53935",
    fontWeight: "700",
    fontSize: 15,
  },
  version: {
    textAlign: "center",
    color: "#B0BEC5",
    fontSize: 12,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#CFD8DC",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A2E44",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    gap: 10,
  },
  detailLabel: {
    fontSize: 11,
    color: "#90A4AE",
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#1A2E44",
    fontWeight: "600",
  },
  userRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    gap: 12,
    alignItems: "flex-start",
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#1D6FA4",
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarTxt: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2E44",
  },
  userMeta: {
    fontSize: 12,
    color: "#90A4AE",
    marginTop: 2,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagTxt: {
    fontSize: 11,
    fontWeight: "600",
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    gap: 12,
  },
  projectNum: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#EDE7F6",
    justifyContent: "center",
    alignItems: "center",
  },
  projectNumTxt: {
    color: "#7B1FA2",
    fontWeight: "800",
    fontSize: 13,
  },
  projectName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2E44",
  },
  projectMeta: {
    fontSize: 12,
    color: "#90A4AE",
    marginTop: 3,
  },
  deptBlock: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  deptHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  deptIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  deptName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2E44",
  },
  deptCount: {
    fontSize: 12,
    color: "#90A4AE",
    marginTop: 1,
  },
  deptUserRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingLeft: 50,
    gap: 10,
    backgroundColor: "#FAFCFF",
  },
  deptUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#BBDEFB",
    justifyContent: "center",
    alignItems: "center",
  },
  deptUserAvatarTxt: {
    color: "#1D6FA4",
    fontWeight: "700",
    fontSize: 13,
  },
  deptUserName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A2E44",
  },
  deptUserEmail: {
    fontSize: 11,
    color: "#90A4AE",
    marginTop: 1,
  },
  deptEmptyUsers: {
    paddingLeft: 50,
    paddingBottom: 10,
  },
  deptEmptyUsersText: {
    color: "#CBD5E1",
    fontSize: 12,
  },
  addDeptHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5f00be",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addDeptHeaderBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  createFirstDeptBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#EDE7F6",
    borderRadius: 12,
  },
  createFirstDeptText: {
    color: "#5f00be",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 10,
  },
  emptyTxt: {
    color: "#90A4AE",
    fontSize: 14,
  },
  newDeptForm: {
    paddingVertical: 10,
    gap: 14,
  },
  newDeptInput: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D8E2F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#081B43",
    backgroundColor: "#F9FBFF",
  },
  createDeptBtn: {
    height: 52,
    backgroundColor: "#5f00be",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  createDeptBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});




// import {
//   View, Text, StyleSheet, ScrollView, TouchableOpacity,
//   Alert, ActivityIndicator, Modal, RefreshControl, TextInput,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useEffect, useState, useCallback } from "react";
// import * as SecureStore from "expo-secure-store";
// import { router, useFocusEffect } from "expo-router";

// type AdminProfile = { _id: string; companyName: string; email: string; phone: string; businessType: string; address: string; createdAt?: string };
// type UserType = { _id: string; name: string; email: string; mobileNo: string; department: string; isActive: boolean; createdAt?: string };
// type ProjectType = { _id: string; name: string; dueDate?: string | null; createdAt?: string; team?: { _id: string; name: string } | null };
// type DepartmentType = { _id: string; name: string; count?: number; users?: UserType[] };
// type ModalType = "users" | "projects" | "departments" | "profile" | null;

// export default function AccountScreen() {
//   const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
//   const [users, setUsers] = useState<UserType[]>([]);
//   const [projects, setProjects] = useState<ProjectType[]>([]);
//   const [departments, setDepartments] = useState<DepartmentType[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [activeModal, setActiveModal] = useState<ModalType>(null);
//   const [expandedDept, setExpandedDept] = useState<string | null>(null);

//   // New dept creation
//   const [newDeptName, setNewDeptName] = useState("");
//   const [creatingDept, setCreatingDept] = useState(false);
//   const [addDeptVisible, setAddDeptVisible] = useState(false);

//   const API = process.env.EXPO_PUBLIC_API_URL;

//   const fetchAll = useCallback(async () => {
//     try {
//       const token = await SecureStore.getItemAsync("token");
//       const headers = { Authorization: `Bearer ${token}` };

//       const profileRes = await fetch(`${API}/api/auth/me`, { headers });
//       if (profileRes.ok) setAdminProfile(await profileRes.json());

//       // Users ek baar fetch - local variable mein save karo
//       let fetchedUsers: UserType[] = [];
//       const usersRes = await fetch(`${API}/api/user`, { headers });
//       if (usersRes.ok) {
//         const usersData = await usersRes.json();
//         if (Array.isArray(usersData)) {
//           fetchedUsers = usersData;
//           setUsers(usersData);
//         }
//       }

//       const projectsRes = await fetch(`${API}/api/project`, { headers });
//       if (projectsRes.ok) {
//         const pData = await projectsRes.json();
//         if (Array.isArray(pData)) setProjects(pData);
//       }

//       // Departments - fetchedUsers use karo, dobara API call NAHI
//       const deptRes = await fetch(`${API}/api/department`, { headers });
//       if (deptRes.ok) {
//         const deptData = await deptRes.json();
//         if (Array.isArray(deptData)) {
//           const enriched = deptData.map((d: DepartmentType) => ({
//             ...d,
//             users: fetchedUsers.filter((u: UserType) => u.department === d.name),
//             count: fetchedUsers.filter((u: UserType) => u.department === d.name).length,
//           }));
//           setDepartments(enriched);
//         }
//       }
//     } catch (e) {
//       console.log("Account fetch error:", e);
//     } finally {
//       setLoading(false);
//     }
//   }, [API]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchAll();
//     }, [fetchAll])
//   );

//   const onRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

//   const handleCreateDepartment = async () => {
//     if (!newDeptName.trim()) { Alert.alert("Validation", "Department name required"); return; }
//     try {
//       setCreatingDept(true);
//       const token = await SecureStore.getItemAsync("token");
//       const res = await fetch(`${API}/api/department`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ name: newDeptName.trim() }),
//       });
//       const data = await res.json();
//       if (!res.ok) { Alert.alert("Error", data.message || "Failed"); return; }
//       setNewDeptName("");
//       setAddDeptVisible(false);
//       await fetchAll();
//       Alert.alert("Success", `"${data.name}" department created!`);
//     } catch (e) {
//       Alert.alert("Error", "Could not create department");
//     } finally {
//       setCreatingDept(false);
//     }
//   };

//   const handleLogout = () => {
//     Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
//       { text: "Cancel", style: "cancel" },
//       { text: "Logout", style: "destructive", onPress: async () => {
//         await SecureStore.deleteItemAsync("token");
//         await SecureStore.deleteItemAsync("role");
//         await SecureStore.deleteItemAsync("adminId");
//         await SecureStore.deleteItemAsync("adminName");
//         await SecureStore.deleteItemAsync("companyId");
//         router.replace("/");
//       }},
//     ]);
//   };

//   const formatDate = (d?: string | null) => {
//     if (!d) return "N/A";
//     const date = new Date(d);
//     return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
//   };

//   const initials = adminProfile?.companyName?.charAt(0).toUpperCase() || "A";

//   const menuItems = [
//     { key: "profile", icon: "person-outline" as const, label: "Company Profile", sub: adminProfile?.businessType || "View details", iconBg: "#E3F2FD", iconColor: "#1D6FA4", onPress: () => setActiveModal("profile") },
//     { key: "users", icon: "people-outline" as const, label: "Team Members", sub: `${users.length} employees`, iconBg: "#E8F5E9", iconColor: "#2E7D32", onPress: () => setActiveModal("users") },
//     { key: "projects", icon: "folder-open-outline" as const, label: "Projects", sub: `${projects.length} projects`, iconBg: "#F3E5F5", iconColor: "#7B1FA2", onPress: () => setActiveModal("projects") },
//     { key: "departments", icon: "business-outline" as const, label: "Departments", sub: `${departments.length} departments`, iconBg: "#FFF8E1", iconColor: "#F57F17", onPress: () => setActiveModal("departments") },
//     { key: "createproject", icon: "add-circle-outline" as const, label: "Create Project", sub: "Start a new project", iconBg: "#FCE4EC", iconColor: "#C62828", onPress: () => router.push("/(screens)/create-project") },
//   ];

//   if (loading) return <View style={styles.loaderFull}><ActivityIndicator size="large" color="#1D6FA4" /></View>;

//   return (
//     <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}
//       refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

//       <LinearGradient colors={["#C8DDEF", "#E8F4FB"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.profileSection}>
//         <View style={styles.avatarCircle}><Text style={styles.avatarText}>{initials}</Text></View>
//         <Text style={styles.adminName}>{adminProfile?.companyName || "Company"}</Text>
//         <TouchableOpacity style={styles.adminIdRow} onPress={() => setActiveModal("profile")}>
//           <Text style={styles.adminIdText}>{adminProfile?.businessType || "Admin"}</Text>
//           <Ionicons name="chevron-forward" size={13} color="#1D6FA4" />
//         </TouchableOpacity>
//       </LinearGradient>

//       <View style={styles.statsStrip}>
//         <View style={styles.statPill}><Text style={styles.statValue}>{users.length}</Text><Text style={styles.statLabel}>Members</Text></View>
//         <View style={styles.statDivider} />
//         <View style={styles.statPill}><Text style={styles.statValue}>{projects.length}</Text><Text style={styles.statLabel}>Projects</Text></View>
//         <View style={styles.statDivider} />
//         <View style={styles.statPill}><Text style={styles.statValue}>{departments.length}</Text><Text style={styles.statLabel}>Depts</Text></View>
//       </View>

//       <View style={styles.menuCard}>
//         {menuItems.map((item, index) => (
//           <TouchableOpacity key={item.key} style={[styles.menuRow, index > 0 && styles.menuRowBorder]} onPress={item.onPress} activeOpacity={0.6}>
//             <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
//               <Ionicons name={item.icon} size={22} color={item.iconColor} />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={styles.menuLabel}>{item.label}</Text>
//               <Text style={styles.menuSub}>{item.sub}</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={18} color="#B0BEC5" />
//           </TouchableOpacity>
//         ))}
//       </View>

//       <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
//         <Ionicons name="log-out-outline" size={20} color="#E53935" />
//         <Text style={styles.logoutText}>Logout</Text>
//       </TouchableOpacity>
//       <Text style={styles.version}>WorkPulse v1.0.0</Text>

//       {/* PROFILE MODAL */}
//       <Modal visible={activeModal === "profile"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalSheet}>
//             <View style={styles.modalHandle} />
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Company Profile</Text>
//               <TouchableOpacity onPress={() => setActiveModal(null)}><Ionicons name="close" size={22} color="#455A64" /></TouchableOpacity>
//             </View>
//             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
//               {[
//                 { icon: "business-outline", label: "Company Name", value: adminProfile?.companyName },
//                 { icon: "mail-outline", label: "Email", value: adminProfile?.email },
//                 { icon: "call-outline", label: "Phone", value: adminProfile?.phone },
//                 { icon: "briefcase-outline", label: "Business Type", value: adminProfile?.businessType },
//                 { icon: "location-outline", label: "Address", value: adminProfile?.address },
//                 { icon: "calendar-outline", label: "Registered On", value: formatDate(adminProfile?.createdAt) },
//               ].map((row) => (
//                 <View key={row.label} style={styles.detailRow}>
//                   <Ionicons name={row.icon as any} size={18} color="#1D6FA4" style={{ width: 26 }} />
//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.detailLabel}>{row.label}</Text>
//                     <Text style={styles.detailValue}>{row.value || "—"}</Text>
//                   </View>
//                 </View>
//               ))}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* USERS MODAL */}
//       <Modal visible={activeModal === "users"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalSheet}>
//             <View style={styles.modalHandle} />
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Team Members ({users.length})</Text>
//               <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
//                 <TouchableOpacity style={styles.addDeptHeaderBtn} onPress={() => { setActiveModal(null); setTimeout(() => router.push("/(screens)/add-user"), 300); }}>
//                   <Ionicons name="person-add-outline" size={16} color="#fff" />
//                   <Text style={styles.addDeptHeaderBtnText}>Add</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={() => setActiveModal(null)}><Ionicons name="close" size={22} color="#455A64" /></TouchableOpacity>
//               </View>
//             </View>
//             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
//               {users.length === 0 ? (
//                 <View style={styles.emptyBox}><Ionicons name="people-outline" size={44} color="#CFD8DC" /><Text style={styles.emptyTxt}>Koi user nahi mila</Text></View>
//               ) : users.map((u) => (
//                 <View key={u._id} style={styles.userRow}>
//                   <View style={styles.userAvatar}><Text style={styles.userAvatarTxt}>{u.name?.charAt(0).toUpperCase()}</Text></View>
//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.userName}>{u.name}</Text>
//                     <Text style={styles.userMeta}>{u.email}</Text>
//                     <View style={styles.tagRow}>
//                       <View style={[styles.tag, { backgroundColor: "#E3F2FD" }]}><Text style={[styles.tagTxt, { color: "#1D6FA4" }]}>{u.department}</Text></View>
//                       <View style={[styles.tag, { backgroundColor: "#F5F5F5" }]}><Text style={[styles.tagTxt, { color: "#555" }]}>{u.mobileNo}</Text></View>
//                     </View>
//                   </View>
//                 </View>
//               ))}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* PROJECTS MODAL */}
//       <Modal visible={activeModal === "projects"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalSheet}>
//             <View style={styles.modalHandle} />
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Projects ({projects.length})</Text>
//               <TouchableOpacity onPress={() => setActiveModal(null)}><Ionicons name="close" size={22} color="#455A64" /></TouchableOpacity>
//             </View>
//             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
//               {projects.length === 0 ? (
//                 <View style={styles.emptyBox}><Ionicons name="folder-open-outline" size={44} color="#CFD8DC" /><Text style={styles.emptyTxt}>Koi project nahi mila</Text></View>
//               ) : projects.map((p, i) => (
//                 <View key={p._id} style={styles.projectRow}>
//                   <View style={styles.projectNum}><Text style={styles.projectNumTxt}>{i + 1}</Text></View>
//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.projectName}>{p.name}</Text>
//                     {p.team && <Text style={styles.projectMeta}>Team: {p.team.name}</Text>}
//                     <Text style={styles.projectMeta}>Created: {formatDate(p.createdAt)}{p.dueDate ? `  •  Due: ${formatDate(p.dueDate)}` : ""}</Text>
//                   </View>
//                 </View>
//               ))}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* DEPARTMENTS MODAL */}
//       <Modal visible={activeModal === "departments"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalSheet}>
//             <View style={styles.modalHandle} />
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Departments ({departments.length})</Text>
//               <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
//                 <TouchableOpacity style={styles.addDeptHeaderBtn} onPress={() => { setActiveModal(null); setTimeout(() => setAddDeptVisible(true), 400); }}>
//                   <Ionicons name="add" size={18} color="#fff" />
//                   <Text style={styles.addDeptHeaderBtnText}>New</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={() => setActiveModal(null)}><Ionicons name="close" size={22} color="#455A64" /></TouchableOpacity>
//               </View>
//             </View>
//             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
//               {departments.length === 0 ? (
//                 <View style={styles.emptyBox}>
//                   <Ionicons name="business-outline" size={44} color="#CFD8DC" />
//                   <Text style={styles.emptyTxt}>Koi department nahi hai</Text>
//                   <TouchableOpacity style={styles.createFirstDeptBtn} onPress={() => { setActiveModal(null); setTimeout(() => setAddDeptVisible(true), 400); }}>
//                     <Text style={styles.createFirstDeptText}>+ Create First Department</Text>
//                   </TouchableOpacity>
//                 </View>
//               ) : departments.map((dept) => (
//                 <View key={dept._id} style={styles.deptBlock}>
//                   <TouchableOpacity style={styles.deptHeader} onPress={() => setExpandedDept(expandedDept === dept._id ? null : dept._id)} activeOpacity={0.7}>
//                     <View style={styles.deptIcon}><Ionicons name="layers-outline" size={20} color="#1D6FA4" /></View>
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.deptName}>{dept.name}</Text>
//                       <Text style={styles.deptCount}>{dept.count ?? 0} member{(dept.count ?? 0) !== 1 ? "s" : ""}</Text>
//                     </View>
//                     <Ionicons name={expandedDept === dept._id ? "chevron-up" : "chevron-down"} size={18} color="#90A4AE" />
//                   </TouchableOpacity>
//                   {expandedDept === dept._id && (dept.users ?? []).length === 0 && (
//                     <View style={styles.deptEmptyUsers}><Text style={styles.deptEmptyUsersText}>No members in this department</Text></View>
//                   )}
//                   {expandedDept === dept._id && (dept.users ?? []).map((u) => (
//                     <View key={u._id} style={styles.deptUserRow}>
//                       <View style={styles.deptUserAvatar}><Text style={styles.deptUserAvatarTxt}>{u.name?.charAt(0).toUpperCase()}</Text></View>
//                       <View><Text style={styles.deptUserName}>{u.name}</Text><Text style={styles.deptUserEmail}>{u.email}</Text></View>
//                     </View>
//                   ))}
//                 </View>
//               ))}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ADD DEPARTMENT MODAL */}
//       <Modal visible={addDeptVisible} animationType="slide" transparent onRequestClose={() => setAddDeptVisible(false)}>
//         <View style={styles.modalOverlay}>
//           <View style={[styles.modalSheet, { maxHeight: "42%" }]}>
//             <View style={styles.modalHandle} />
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>New Department</Text>
//               <TouchableOpacity onPress={() => setAddDeptVisible(false)}><Ionicons name="close" size={22} color="#455A64" /></TouchableOpacity>
//             </View>
//             <View style={styles.newDeptForm}>
//               <TextInput
//                 style={styles.newDeptInput}
//                 placeholder="e.g. Finance, Operations, Legal..."
//                 placeholderTextColor="#9CA3AF"
//                 value={newDeptName}
//                 onChangeText={setNewDeptName}
//                 autoFocus
//               />
//               <TouchableOpacity style={[styles.createDeptBtn, creatingDept && { opacity: 0.7 }]} onPress={handleCreateDepartment} disabled={creatingDept} activeOpacity={0.8}>
//                 {creatingDept ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.createDeptBtnText}>Create Department</Text>}
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   root: { flex: 1, backgroundColor: "#F1F5F9" },
//   loaderFull: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F5F9" },
//   profileSection: { paddingTop: 70, paddingBottom: 28, alignItems: "center" },
//   avatarCircle: { width: 86, height: 86, borderRadius: 43, backgroundColor: "#B0C4D8", justifyContent: "center", alignItems: "center", marginBottom: 12, borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 },
//   avatarText: { fontSize: 36, fontWeight: "800", color: "#1D6FA4" },
//   adminName: { fontSize: 22, fontWeight: "800", color: "#1A2E44" },
//   adminIdRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
//   adminIdText: { fontSize: 14, color: "#1D6FA4", fontWeight: "500" },
//   statsStrip: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginTop: -14, borderRadius: 16, paddingVertical: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, marginBottom: 18 },
//   statPill: { flex: 1, alignItems: "center" },
//   statDivider: { width: 1, backgroundColor: "#E0E0E0", marginVertical: 4 },
//   statValue: { fontSize: 20, fontWeight: "800", color: "#1A2E44" },
//   statLabel: { fontSize: 11, color: "#90A4AE", marginTop: 2, fontWeight: "500" },
//   menuCard: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 16, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: "hidden" },
//   menuRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
//   menuRowBorder: { borderTopWidth: 1, borderTopColor: "#F0F4F8" },
//   menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
//   menuLabel: { fontSize: 15, fontWeight: "600", color: "#1A2E44" },
//   menuSub: { fontSize: 12, color: "#90A4AE", marginTop: 1 },
//   logoutRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 6, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#E0E0E0" },
//   logoutText: { color: "#E53935", fontWeight: "700", fontSize: 15 },
//   version: { textAlign: "center", color: "#B0BEC5", fontSize: 12, marginTop: 10 },
//   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
//   modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "88%", paddingHorizontal: 18, paddingBottom: 10 },
//   modalHandle: { width: 40, height: 4, backgroundColor: "#CFD8DC", borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
//   modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F0F4F8", marginBottom: 10 },
//   modalTitle: { fontSize: 17, fontWeight: "800", color: "#1A2E44" },
//   detailRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F5F5F5", gap: 10 },
//   detailLabel: { fontSize: 11, color: "#90A4AE", fontWeight: "500", marginBottom: 2 },
//   detailValue: { fontSize: 14, color: "#1A2E44", fontWeight: "600" },
//   userRow: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F5F5F5", gap: 12, alignItems: "flex-start" },
//   userAvatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#1D6FA4", justifyContent: "center", alignItems: "center" },
//   userAvatarTxt: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   userName: { fontSize: 14, fontWeight: "700", color: "#1A2E44" },
//   userMeta: { fontSize: 12, color: "#90A4AE", marginTop: 2 },
//   tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
//   tag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
//   tagTxt: { fontSize: 11, fontWeight: "600" },
//   projectRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F5F5F5", gap: 12 },
//   projectNum: { width: 30, height: 30, borderRadius: 9, backgroundColor: "#EDE7F6", justifyContent: "center", alignItems: "center" },
//   projectNumTxt: { color: "#7B1FA2", fontWeight: "800", fontSize: 13 },
//   projectName: { fontSize: 14, fontWeight: "700", color: "#1A2E44" },
//   projectMeta: { fontSize: 12, color: "#90A4AE", marginTop: 3 },
//   deptBlock: { borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
//   deptHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
//   deptIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: "#E3F2FD", justifyContent: "center", alignItems: "center" },
//   deptName: { fontSize: 15, fontWeight: "700", color: "#1A2E44" },
//   deptCount: { fontSize: 12, color: "#90A4AE", marginTop: 1 },
//   deptUserRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, paddingLeft: 50, gap: 10, backgroundColor: "#FAFCFF" },
//   deptUserAvatar: { width: 32, height: 32, borderRadius: 9, backgroundColor: "#BBDEFB", justifyContent: "center", alignItems: "center" },
//   deptUserAvatarTxt: { color: "#1D6FA4", fontWeight: "700", fontSize: 13 },
//   deptUserName: { fontSize: 13, fontWeight: "600", color: "#1A2E44" },
//   deptUserEmail: { fontSize: 11, color: "#90A4AE", marginTop: 1 },
//   deptEmptyUsers: { paddingLeft: 50, paddingBottom: 10 },
//   deptEmptyUsersText: { color: "#CBD5E1", fontSize: 12 },
//   addDeptHeaderBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#5f00be", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 4 },
//   addDeptHeaderBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   createFirstDeptBtn: { marginTop: 10, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#EDE7F6", borderRadius: 12 },
//   createFirstDeptText: { color: "#5f00be", fontWeight: "700", fontSize: 14 },
//   emptyBox: { alignItems: "center", paddingVertical: 36, gap: 10 },
//   emptyTxt: { color: "#90A4AE", fontSize: 14 },
//   newDeptForm: { paddingVertical: 10, gap: 14 },
//   newDeptInput: { height: 52, borderWidth: 1, borderColor: "#D8E2F0", borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: "#081B43", backgroundColor: "#F9FBFF" },
//   createDeptBtn: { height: 52, backgroundColor: "#5f00be", borderRadius: 14, justifyContent: "center", alignItems: "center" },
//   createDeptBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
// });






