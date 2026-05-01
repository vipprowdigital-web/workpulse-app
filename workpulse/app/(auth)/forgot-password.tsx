import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Stack } from "expo-router";
import Input from "@/components/input";

export default function ForgotPassword() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>

        <Text style={styles.title}>Forgot Password</Text>

        {/* EMAIL */}
        <Input
          label="Registered Email"
          icon="mail-outline"
          placeholder="Enter your email"
        />

        {/* PHONE */}
        <Input
          label="Phone Number"
          icon="call-outline"
          placeholder="Enter phone number"
        />

        {/* COMPANY NAME */}
        <Input
          label="Company Name"
          icon="business-outline"
          placeholder="Enter company name"
        />

        {/* BUTTON */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Send Password</Text>
        </TouchableOpacity>

      </View>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#081B43",
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 30,
  },

  button: {
    backgroundColor: "#00A693",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});