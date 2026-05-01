

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import Button from "@/components/button";

export default function AuthScreen() {
  const [isAdmin, setIsAdmin] = useState(true);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Auto login — agar token hai aur forceLogout nahi hai
  useEffect(() => {
    const checkAuth = async () => {
      const forceLogout = await SecureStore.getItemAsync("forceLogout");
      if (forceLogout === "true") {
        // Logout hua tha — yahan rukna hai, tabs pe nahi jana
        await SecureStore.deleteItemAsync("forceLogout");
        return;
      }
      const token = await SecureStore.getItemAsync("token");
      const role = await SecureStore.getItemAsync("role");
      if (token && role) {
        router.replace("/(tabs)");
      }
    };
    checkAuth();
  }, []);

  const handleAdminLogin = async () => {
    if (!email || !password) {
      Alert.alert("Validation", "Enter email & password");
      return;
    }
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert("Error", data.message || "Login failed"); return; }
      if (data.role !== "admin" || !data.admin || !data.token) {
        Alert.alert("Access Denied", "Only admin can login here"); return;
      }
      await SecureStore.deleteItemAsync("userId");
      await SecureStore.deleteItemAsync("userName");
      await SecureStore.setItemAsync("token", data.token);
      await SecureStore.setItemAsync("role", "admin");
      await SecureStore.setItemAsync("adminId", data.admin._id);
      await SecureStore.setItemAsync("companyId", data.admin._id);
      await SecureStore.setItemAsync("adminEmail", data.admin.email || "");
      await SecureStore.setItemAsync("adminName", data.admin.companyName);
      router.replace("/(tabs)");
    } catch (error) {
      console.log("ADMIN LOGIN ERROR:", error);
      Alert.alert("Error", "Unable to connect to server");
    }
  };

  const handleUserLogin = async () => {
    if (!email || !password) {
      Alert.alert("Validation", "Please enter email and password");
      return;
    }
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert("Error", data.message || "Login failed"); return; }
      if (data.role !== "user" || !data.user || !data.token) {
        Alert.alert("Access Denied", "Only user can login here"); return;
      }
      await SecureStore.deleteItemAsync("adminName");
      await SecureStore.deleteItemAsync("adminId");
      await SecureStore.deleteItemAsync("companyId");
      await SecureStore.setItemAsync("token", data.token);
      await SecureStore.setItemAsync("role", "user");
      await SecureStore.setItemAsync("userId", data.user._id);
      await SecureStore.setItemAsync("userName", data.user.name || "User");
      router.replace("/(tabs)");
    } catch (error) {
      console.log("USER LOGIN ERROR:", error);
      Alert.alert("Error", "Unable to connect to server");
    }
  };

  const handleToggle = (adminMode: boolean) => {
    setIsAdmin(adminMode);
    setEmail("");
    setPassword("");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Workpulse</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity style={styles.toggleBtn} onPress={() => handleToggle(true)}>
          {isAdmin ? (
            <LinearGradient
              colors={["#5f00be", "#00A693"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.activeToggle}
            >
              <Text style={styles.activeText}>Admin</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.toggleText}>Admin</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleBtn} onPress={() => handleToggle(false)}>
          {!isAdmin ? (
            <LinearGradient
              colors={["#5f00be", "#00A693"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.activeToggle}
            >
              <Text style={styles.activeText}>User</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.toggleText}>User</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {isAdmin ? "Admin Account" : "User Account"}
      </Text>

      <Text style={styles.label}>{isAdmin ? "Email Address" : "Email"}</Text>
      <View style={styles.inputBox}>
        <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <Text style={styles.label}>Password</Text>
      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {isAdmin && (
        <View style={styles.passwordRow}>
          <TouchableOpacity onPress={() => router.push("/(auth)/set-password")}>
            <Text style={styles.linkText}>Set Password</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      )}

      <Button
        title={isAdmin ? "Admin Sign In" : "User Login"}
        onPress={isAdmin ? handleAdminLogin : handleUserLogin}
      />

      {isAdmin && (
        <>
          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Don't have an account?</Text>
            <View style={styles.line} />
          </View>
          <Button
            title="Sign Up"
            onPress={() => router.push("/(auth)/admin-signup")}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#d3d7df",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 35,
    textAlign: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#0F2A5F",
    borderRadius: 30,
    padding: 5,
    marginBottom: 10,
  },
  toggleBtn: { flex: 1 },
  activeToggle: {
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  toggleText: {
    textAlign: "center",
    padding: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  activeText: { color: "#fff", fontWeight: "bold" },
  subtitle: {
    color: "#9CA3AF",
    textAlign: "center",
    fontSize: 13,
    marginBottom: 24,
  },
  label: { color: "#CBD5F5", marginBottom: 6, fontSize: 14 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    backgroundColor: "#0F2A5F",
  },
  input: { marginLeft: 10, flex: 1, color: "#fff" },
  passwordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  linkText: { color: "#00A693", fontWeight: "600" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  line: { flex: 1, height: 1, backgroundColor: "#1E3A8A" },
  dividerText: { marginHorizontal: 10, color: "#9CA3AF" },
});

// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ScrollView,
// } from "react-native";
// import { useState } from "react";
// import { useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import * as SecureStore from "expo-secure-store";
// import Button from "@/components/button";

// export default function AuthScreen() {
//   const [isAdmin, setIsAdmin] = useState(true);
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   // ✅ Admin Login
//   const handleAdminLogin = async () => {
//     if (!email || !password) {
//       Alert.alert("Validation", "Enter email & password");
//       return;
//     }
//     try {
//       const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await res.json();
//       if (!res.ok) { Alert.alert("Error", data.message || "Login failed"); return; }
//       if (data.role !== "admin" || !data.admin || !data.token) {
//         Alert.alert("Access Denied", "Only admin can login here"); return;
//       }
//       await SecureStore.deleteItemAsync("userId");
//       await SecureStore.deleteItemAsync("userName");
//       await SecureStore.setItemAsync("token", data.token);
//       await SecureStore.setItemAsync("role", "admin");
//       await SecureStore.setItemAsync("adminId", data.admin._id);
//       await SecureStore.setItemAsync("companyId", data.admin._id);
//       await SecureStore.setItemAsync("adminEmail", data.admin.email || "");
//       await SecureStore.setItemAsync("adminName", data.admin.companyName);
//       router.replace("/(tabs)");
//     } catch (error) {
//       console.log("ADMIN LOGIN ERROR:", error);
//       Alert.alert("Error", "Unable to connect to server");
//     }
//   };

//   // ✅ User Login
//   const handleUserLogin = async () => {
//     if (!email || !password) {
//       Alert.alert("Validation", "Please enter email and password");
//       return;
//     }
//     try {
//       const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await res.json();
//       if (!res.ok) { Alert.alert("Error", data.message || "Login failed"); return; }
//       if (data.role !== "user" || !data.user || !data.token) {
//         Alert.alert("Access Denied", "Only user can login here"); return;
//       }
//       await SecureStore.deleteItemAsync("adminName");
//       await SecureStore.deleteItemAsync("adminId");
//       await SecureStore.deleteItemAsync("companyId");
//       await SecureStore.setItemAsync("token", data.token);
//       await SecureStore.setItemAsync("role", "user");
//       await SecureStore.setItemAsync("userId", data.user._id);
//       await SecureStore.setItemAsync("userName", data.user.name || "User");
//       router.replace("/(tabs)");
//     } catch (error) {
//       console.log("USER LOGIN ERROR:", error);
//       Alert.alert("Error", "Unable to connect to server");
//     }
//   };

//   // ✅ Toggle switch karne pe fields clear ho
//   const handleToggle = (adminMode: boolean) => {
//     setIsAdmin(adminMode);
//     setEmail("");
//     setPassword("");
//   };

//   return (
//     <ScrollView
//       contentContainerStyle={styles.container}
//       keyboardShouldPersistTaps="handled"
//     >
//       <Text style={styles.title}>Workpulse</Text>

//       {/* ✅ Toggle — ek hi page pe dono */}
//       <View style={styles.toggleContainer}>
//         <TouchableOpacity style={styles.toggleBtn} onPress={() => handleToggle(true)}>
//           {isAdmin ? (
//             <LinearGradient
//               colors={["#5f00be", "#00A693"]}
//               start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//               style={styles.activeToggle}
//             >
//               <Text style={styles.activeText}>Admin</Text>
//             </LinearGradient>
//           ) : (
//             <Text style={styles.toggleText}>Admin</Text>
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.toggleBtn} onPress={() => handleToggle(false)}>
//           {!isAdmin ? (
//             <LinearGradient
//               colors={["#5f00be", "#00A693"]}
//               start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//               style={styles.activeToggle}
//             >
//               <Text style={styles.activeText}>User</Text>
//             </LinearGradient>
//           ) : (
//             <Text style={styles.toggleText}>User</Text>
//           )}
//         </TouchableOpacity>
//       </View>

//       {/* ✅ Subtitle */}
//       <Text style={styles.subtitle}>
//         {isAdmin ? "Admin Account" : "User Account"}
//       </Text>

//       {/* Email */}
//       <Text style={styles.label}>{isAdmin ? "Email Address" : "Email"}</Text>
//       <View style={styles.inputBox}>
//         <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
//         <TextInput
//           placeholder="Enter your email"
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={email}
//           onChangeText={setEmail}
//           autoCapitalize="none"
//           keyboardType="email-address"
//         />
//       </View>

//       {/* Password */}
//       <Text style={styles.label}>Password</Text>
//       <View style={styles.inputBox}>
//         <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
//         <TextInput
//           placeholder="Enter your password"
//           placeholderTextColor="#9CA3AF"
//           secureTextEntry
//           style={styles.input}
//           value={password}
//           onChangeText={setPassword}
//         />
//       </View>

//       {/* Admin extra links */}
//       {isAdmin && (
//         <View style={styles.passwordRow}>
//           <TouchableOpacity onPress={() => router.push("/(auth)/set-password")}>
//             <Text style={styles.linkText}>Set Password</Text>
//           </TouchableOpacity>
//           <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
//             <Text style={styles.linkText}>Forgot Password?</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* ✅ Login Button — dono ke liye alag handler */}
//       <Button
//         title={isAdmin ? "Admin Sign In" : "User Login"}
//         onPress={isAdmin ? handleAdminLogin : handleUserLogin}
//       />

//       {/* Admin signup option */}
//       {isAdmin && (
//         <>
//           <View style={styles.dividerRow}>
//             <View style={styles.line} />
//             <Text style={styles.dividerText}>Don't have an account?</Text>
//             <View style={styles.line} />
//           </View>
//           <Button
//             title="Sign Up"
//             onPress={() => router.push("/(auth)/admin-signup")}
//           />
//         </>
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     backgroundColor: "#d3d7df",
//     padding: 20,
//     justifyContent: "center",
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: "bold",
//     color: "#FFFFFF",
//     marginBottom: 35,
//     textAlign: "center",
//   },
//   toggleContainer: {
//     flexDirection: "row",
//     backgroundColor: "#0F2A5F",
//     borderRadius: 30,
//     padding: 5,
//     marginBottom: 10,
//   },
//   toggleBtn: { flex: 1 },
//   activeToggle: {
//     padding: 12,
//     borderRadius: 25,
//     alignItems: "center",
//   },
//   toggleText: {
//     textAlign: "center",
//     padding: 12,
//     color: "#9CA3AF",
//     fontWeight: "600",
//   },
//   activeText: { color: "#fff", fontWeight: "bold" },
//   subtitle: {
//     color: "#9CA3AF",
//     textAlign: "center",
//     fontSize: 13,
//     marginBottom: 24,
//   },
//   label: { color: "#CBD5F5", marginBottom: 6, fontSize: 14 },
//   inputBox: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderRadius: 12,
//     padding: 14,
//     marginBottom: 15,
//     backgroundColor: "#0F2A5F",
//   },
//   input: { marginLeft: 10, flex: 1, color: "#fff" },
//   passwordRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 20,
//   },
//   linkText: { color: "#00A693", fontWeight: "600" },
//   dividerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 25,
//   },
//   line: { flex: 1, height: 1, backgroundColor: "#1E3A8A" },
//   dividerText: { marginHorizontal: 10, color: "#9CA3AF" },
// });


// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from "react-native";
// import { useState } from "react";
// import { useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import * as SecureStore from "expo-secure-store";
// import Button from "@/components/button";

// export default function AuthScreen() {
//   const [isAdmin, setIsAdmin] = useState(true);
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const handleAdminLogin = async () => {
//     if (!email || !password) {
//       Alert.alert("Validation", "Enter email & password");
//       return;
//     }

//     try {
//       const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           email,
//           password,
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         Alert.alert("Error", data.message || "Login failed");
//         return;
//       }

//       if (data.role !== "admin" || !data.admin || !data.token) {
//         Alert.alert("Access Denied", "Only admin can login here");
//         return;
//       }

//       await SecureStore.setItemAsync("token", data.token);
//       await SecureStore.setItemAsync("role", "admin");
//       await SecureStore.setItemAsync("adminId", data.admin._id);
//       await SecureStore.setItemAsync("companyId", data.admin._id);
//       await SecureStore.setItemAsync("adminEmail", data.admin.email || "");
//       await SecureStore.setItemAsync("adminName", data.admin.companyName);

//       router.replace("/(tabs)");
//     } catch (error) {
//       console.log("ADMIN LOGIN ERROR:", error);
//       Alert.alert("Error", "Unable to connect to server");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Workpulse</Text>

//       <View style={styles.toggleContainer}>
//         <TouchableOpacity
//           style={styles.toggleBtn}
//           onPress={() => setIsAdmin(true)}
//         >
//           {isAdmin ? (
//             <LinearGradient
//               colors={["#5f00be", "#00A693"]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={styles.activeToggle}
//             >
//               <Text style={styles.activeText}>Admin</Text>
//             </LinearGradient>
//           ) : (
//             <Text style={styles.toggleText}>Admin</Text>
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.toggleBtn}
//           onPress={() => {
//             setIsAdmin(false);
//             router.push("/(auth)/user-login");
//           }}
//         >
//           {!isAdmin ? (
//             <LinearGradient
//               colors={["#5f00be", "#00A693"]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={styles.activeToggle}
//             >
//               <Text style={styles.activeText}>User</Text>
//             </LinearGradient>
//           ) : (
//             <Text style={styles.toggleText}>User</Text>
//           )}
//         </TouchableOpacity>
//       </View>

//       <Text style={styles.label}>Email Address</Text>
//       <View style={styles.inputBox}>
//         <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
//         <TextInput
//           placeholder="Enter your email"
//           placeholderTextColor="#9CA3AF"
//           style={styles.input}
//           value={email}
//           onChangeText={setEmail}
//           autoCapitalize="none"
//         />
//       </View>

//       <Text style={styles.label}>Password</Text>
//       <View style={styles.inputBox}>
//         <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
//         <TextInput
//           placeholder="Enter your password"
//           placeholderTextColor="#9CA3AF"
//           secureTextEntry
//           style={styles.input}
//           value={password}
//           onChangeText={setPassword}
//         />
//       </View>

//       <View style={styles.passwordRow}>
//         <TouchableOpacity onPress={() => router.push("/(auth)/set-password")}>
//           <Text style={styles.linkText}>Set Password</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => router.push("/(auth)/forgot-password")}
//         >
//           <Text style={styles.linkText}>Forgot Password?</Text>
//         </TouchableOpacity>
//       </View>

//       <Button title="Sign In" onPress={handleAdminLogin} />

//       <View style={styles.dividerRow}>
//         <View style={styles.line} />
//         <Text style={styles.dividerText}>Don’t have an account?</Text>
//         <View style={styles.line} />
//       </View>

//       <Button
//         title="Sign Up"
//         onPress={() => router.push("/(auth)/admin-signup")}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#d3d7df",
//     padding: 20,
//     justifyContent: "center",
//   },

//   title: {
//     fontSize: 32,
//     fontWeight: "bold",
//     color: "#FFFFFF",
//     marginBottom: 35,
//     textAlign: "center",
//   },

//   toggleContainer: {
//     flexDirection: "row",
//     backgroundColor: "#0F2A5F",
//     borderRadius: 30,
//     padding: 5,
//     marginBottom: 30,
//   },

//   toggleBtn: {
//     flex: 1,
//   },

//   activeToggle: {
//     padding: 12,
//     borderRadius: 25,
//     alignItems: "center",
//   },

//   toggleText: {
//     textAlign: "center",
//     padding: 12,
//     color: "#9CA3AF",
//     fontWeight: "600",
//   },

//   activeText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },

//   label: {
//     color: "#CBD5F5",
//     marginBottom: 6,
//     fontSize: 14,
//   },

//   inputBox: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderRadius: 12,
//     padding: 14,
//     marginBottom: 15,
//     backgroundColor: "#0F2A5F",
//   },

//   input: {
//     marginLeft: 10,
//     flex: 1,
//     color: "#fff",
//   },

//   passwordRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 20,
//   },

//   linkText: {
//     color: "#00A693",
//     fontWeight: "600",
//   },

//   dividerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 25,
//   },

//   line: {
//     flex: 1,
//     height: 1,
//     backgroundColor: "#1E3A8A",
//   },

//   dividerText: {
//     marginHorizontal: 10,
//     color: "#9CA3AF",
//   },
// });


