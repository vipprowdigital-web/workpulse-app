import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, Alert, ActivityIndicator, TouchableOpacity, Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/button";

type Department = { _id: string; name: string };

export default function AddUserScreen() {
  const [department, setDepartment] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [creatingDept, setCreatingDept] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const API_BASE = process.env.EXPO_PUBLIC_API_URL?.trim();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_BASE}/api/department`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setDepartments(data);
    } catch (e) {
      console.log("Dept fetch error:", e);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) {
      Alert.alert("Validation", "Department name required");
      return;
    }
    try {
      setCreatingDept(true);
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_BASE}/api/department`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newDeptName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to create department");
        return;
      }
      setDepartments((prev) => [data, ...prev]);
      setNewDeptName("");
      setDeptModalVisible(false);
      Alert.alert("Success", `Department "${data.name}" created!`);
    } catch (e) {
      Alert.alert("Error", "Could not create department");
    } finally {
      setCreatingDept(false);
    }
  };

  const handleCreateUser = async () => {
    if (!department || !name || !mobileNo || !email || !password) {
      Alert.alert("Validation", "Please fill all fields");
      return;
    }
    if (mobileNo.length < 10) {
      Alert.alert("Validation", "Please enter a valid mobile number");
      return;
    }
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("Error", "Admin token missing. Please login again.");
        return;
      }
      const response = await fetch(`${API_BASE}/api/user/add-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ department, name, mobileNo, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Error", data.message || "User creation failed");
        return;
      }
      Alert.alert("Success", "User account created successfully");
      setDepartment("");
      setDepartmentId("");
      setName("");
      setMobileNo("");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      Alert.alert("Error", "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrapper} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#081B43", "#5f00be", "#127a6e"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.topCard}
        >
          <Text style={styles.topTitle}>Add User</Text>
          <Text style={styles.topSubTitle}>Create a new user account manually</Text>
        </LinearGradient>

        <View style={styles.formCard}>

          {/* Department Picker */}
          <Text style={styles.label}>Department</Text>
          <View style={styles.deptRow}>
            <TouchableOpacity
              style={styles.deptPicker}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.deptPickerText, !department && { color: "#9CA3AF" }]}>
                {department || "Select Department"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addDeptBtn}
              onPress={() => setDeptModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} placeholder="Enter full name" placeholderTextColor="#7A7A7A" value={name} onChangeText={setName} />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput style={styles.input} placeholder="Enter mobile number" placeholderTextColor="#7A7A7A" keyboardType="phone-pad" value={mobileNo} onChangeText={setMobileNo} />

          <Text style={styles.label}>Email ID</Text>
          <TextInput style={styles.input} placeholder="Enter email address" placeholderTextColor="#7A7A7A" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Create password" placeholderTextColor="#7A7A7A" secureTextEntry value={password} onChangeText={setPassword} />

          <View style={styles.buttonWrap}>
            <Button title={loading ? "Creating..." : "Create Account"} onPress={handleCreateUser} loading={loading} />
          </View>
          {loading && <View style={styles.loaderWrap}><ActivityIndicator size="small" color="#5f00be" /></View>}
        </View>
      </ScrollView>

      {/* Department Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Department</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={22} color="#455A64" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {departments.length === 0 ? (
                <View style={styles.emptyDept}>
                  <Ionicons name="business-outline" size={36} color="#CBD5E1" />
                  <Text style={styles.emptyDeptText}>Koi department nahi hai{"\n"}Pehle department banao</Text>
                </View>
              ) : (
                departments.map((dept) => (
                  <TouchableOpacity
                    key={dept._id}
                    style={[styles.deptOption, department === dept.name && styles.deptOptionActive]}
                    onPress={() => {
                      setDepartment(dept.name);
                      setDepartmentId(dept._id);
                      setPickerVisible(false);
                    }}
                  >
                    <Ionicons name="layers-outline" size={18} color={department === dept.name ? "#fff" : "#5f00be"} />
                    <Text style={[styles.deptOptionText, department === dept.name && { color: "#fff" }]}>
                      {dept.name}
                    </Text>
                    {department === dept.name && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create New Department Modal */}
      <Modal visible={deptModalVisible} transparent animationType="slide" onRequestClose={() => setDeptModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: "40%" }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Department</Text>
              <TouchableOpacity onPress={() => setDeptModalVisible(false)}>
                <Ionicons name="close" size={22} color="#455A64" />
              </TouchableOpacity>
            </View>

            <View style={styles.newDeptForm}>
              <TextInput
                style={styles.newDeptInput}
                placeholder="e.g. Finance, Operations..."
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
                {creatingDept
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.createDeptBtnText}>Create Department</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F7FF" },
  wrapper: { padding: 16, paddingBottom: 30 },
  topCard: { borderRadius: 22, padding: 20, marginTop: 10, marginBottom: 18 },
  topTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  topSubTitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 6 },
  formCard: { backgroundColor: "#fff", borderRadius: 22, padding: 18, shadowColor: "#081B43", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 6 },
  label: { fontSize: 14, fontWeight: "700", color: "#081B43", marginBottom: 8, marginTop: 10 },
  input: { height: 52, borderWidth: 1, borderColor: "#D8E2F0", borderRadius: 14, paddingHorizontal: 14, fontSize: 14, color: "#081B43", backgroundColor: "#F9FBFF" },
  deptRow: { flexDirection: "row", gap: 10 },
  deptPicker: { flex: 1, height: 52, borderWidth: 1, borderColor: "#D8E2F0", borderRadius: 14, paddingHorizontal: 14, backgroundColor: "#F9FBFF", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  deptPickerText: { fontSize: 14, color: "#081B43", flex: 1 },
  addDeptBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: "#5f00be", justifyContent: "center", alignItems: "center" },
  buttonWrap: { marginTop: 22 },
  loaderWrap: { marginTop: 12, alignItems: "center" },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "75%", paddingHorizontal: 18, paddingBottom: 10 },
  modalHandle: { width: 40, height: 4, backgroundColor: "#CFD8DC", borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F0F4F8", marginBottom: 10 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#1A2E44" },
  deptOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, marginBottom: 6, backgroundColor: "#F5F7FF" },
  deptOptionActive: { backgroundColor: "#5f00be" },
  deptOptionText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1A2E44" },
  emptyDept: { alignItems: "center", paddingVertical: 30, gap: 10 },
  emptyDeptText: { color: "#94A3B8", fontSize: 14, textAlign: "center" },

  newDeptForm: { paddingVertical: 10, gap: 14 },
  newDeptInput: { height: 52, borderWidth: 1, borderColor: "#D8E2F0", borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: "#081B43", backgroundColor: "#F9FBFF" },
  createDeptBtn: { height: 52, backgroundColor: "#5f00be", borderRadius: 14, justifyContent: "center", alignItems: "center" },
  createDeptBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
