import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function AuthScreen() {
  const [isAdmin, setIsAdmin] = useState(true);
  const [mode, setMode] = useState("signin"); // signin | signup | reset

  return (
    <View style={styles.container}>
      
      {/* TITLE */}
      <Text style={styles.title}>Workpulse</Text>

      {/* TOGGLE */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, isAdmin && styles.activeToggle]}
          onPress={() => {
            setIsAdmin(true);
            setMode("signup");
          }}
        >
          <Text style={[styles.toggleText, isAdmin && styles.activeText]}>
            Admin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, !isAdmin && styles.activeToggle]}
          onPress={() => {
            setIsAdmin(false);
            setMode("signin");
          }}
        >
          <Text style={[styles.toggleText, !isAdmin && styles.activeText]}>
            User
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= USER SIGNIN ================= */}
      {!isAdmin && mode === "signin" && (
        <>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <TextInput placeholder="Enter your email" style={styles.input} />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
            <TextInput placeholder="Enter your password" secureTextEntry style={styles.input} />
          </View>

          <TouchableOpacity onPress={() => setMode("reset")} style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signinBtn}>
            <Text style={styles.loginText}>Sign In</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ================= ADMIN SIGNUP ================= */}
      {isAdmin && mode === "signup" && (
        <>
          <Text style={styles.label}>Company Name</Text>
          <View style={styles.inputBox}>
            <Ionicons name="business-outline" size={20} color="#6B7280" />
            <TextInput placeholder="Enter company name" style={styles.input} />
          </View>

          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputBox}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <TextInput placeholder="Enter mobile number" style={styles.input} />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <TextInput placeholder="Enter email" style={styles.input} />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
            <TextInput placeholder="Enter password" secureTextEntry style={styles.input} />
          </View>

          <TouchableOpacity style={styles.signinBtn}>
            <Text style={styles.loginText}>Create Account</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ================= RESET PASSWORD ================= */}
      {mode === "reset" && (
        <>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} />
            <TextInput placeholder="Current password" secureTextEntry style={styles.input} />
          </View>

          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-open-outline" size={20} />
            <TextInput placeholder="New password" secureTextEntry style={styles.input} />
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="shield-checkmark-outline" size={20} />
            <TextInput placeholder="Confirm password" secureTextEntry style={styles.input} />
          </View>

          <TouchableOpacity style={styles.signinBtn}>
            <Text style={styles.loginText}>Reset Password</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode("signin")}>
            <Text style={{ textAlign: "center", marginTop: 10, color: "#6B7280" }}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* ================= SIGNUP LINK FOR USER ================= */}
      {!isAdmin && mode === "signin" && (
        <>
          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Don’t have an account?</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity onPress={() => setMode("signup")} style={styles.signupBtn}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF2F7",
    padding: 20,
    justifyContent: "center",
  },

  /* TITLE */
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1E3A8A",
    textAlign: "center",
    marginBottom: 30,
  },

  /* TOGGLE */
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 30,
    padding: 5,
    marginBottom: 30,
    elevation: 3,
  },

  toggleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
  },

  activeToggle: {
    backgroundColor: "#3B82F6",
  },

  toggleText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 15,
  },

  activeText: {
    color: "#fff",
    fontWeight: "bold",
  },

  /* LABEL */
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },

  /* INPUT */
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 15,
    backgroundColor: "#fff",
    elevation: 2,
  },

  input: {
    marginLeft: 10,
    flex: 1,
    fontSize: 15,
  },

  /* FORGOT */
  forgotContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },

  forgotText: {
    color: "#3B82F6",
    fontWeight: "600",
  },

  /* BUTTON */
  signinBtn: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  loginText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  /* DIVIDER */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#D1D5DB",
  },

  dividerText: {
    marginHorizontal: 10,
    color: "#6B7280",
    fontSize: 13,
  },

  /* SIGNUP BUTTON */
  signupBtn: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#fff",
    elevation: 2,
  },

  signupText: {
    color: "#2563EB",
    fontWeight: "bold",
    fontSize: 16,
  },
});