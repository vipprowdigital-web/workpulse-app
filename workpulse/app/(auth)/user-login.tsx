import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useRouter } from "expo-router";
import { appStorage } from "@/utils/storage";
import { LinearGradient } from "expo-linear-gradient";
import { apiUrl } from "@/config/env";


export default function UserLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const API_BASE = apiUrl?.trim();
  const BASE_URL = `${API_BASE}/api/user`;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Validation", "Please enter email and password");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Login failed");
        return;
      }

      if (data.role !== "user" || !data.user || !data.token) {
        Alert.alert("Access Denied", "Only user can login here");
        return;
      }

      await appStorage.deleteItem("adminName");
      await appStorage.deleteItem("adminId");
      await appStorage.deleteItem("companyId");

      await appStorage.setItem("token", data.token);
      await appStorage.setItem("role", "user");
      await appStorage.setItem("userId", data.user._id);
      await appStorage.setItem("userName", data.user.name || "User");

      Alert.alert("Success", "Login successful");

      router.replace("/(tabs)");
    } catch (error) {
      console.log("LOGIN ERROR:", error);
      Alert.alert("Error", "Unable to connect to server");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workpulse</Text>

      <Text style={styles.label}>Email</Text>
      <View style={styles.inputBox}>
        <Ionicons name="person-outline" size={20} color="#B8C4E3" />
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#B8C4E3"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.label}>Password</Text>
      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#B8C4E3" />
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor="#B8C4E3"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity activeOpacity={0.8} onPress={handleLogin}>
        <LinearGradient
          colors={["#5f00be", "#127a6e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Login</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d3d7df",
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
      color: "#081B43",
    textAlign: "center",
    marginBottom: 40,
  },

  label: {
    fontSize: 14,
    color: "#ffffff",
    marginBottom: 6,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    backgroundColor: "#173A78",
  },

  input: {
    marginLeft: 10,
    flex: 1,
    color: "#ffffff",
  },

  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
});