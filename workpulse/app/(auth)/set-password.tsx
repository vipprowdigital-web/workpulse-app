import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Stack } from "expo-router";
import Input from "@/components/input";

export default function ResetPassword() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>

        {/* TITLE */}
        <Text style={styles.title}>Reset Password</Text>

        {/* CURRENT PASSWORD */}
        <Input
          label="Current Password"
          icon="lock-closed-outline"
          placeholder="Enter current password"
          secure
        />

        {/* NEW PASSWORD */}
        <Input
          label="New Password"
          icon="lock-open-outline"
          placeholder="Enter new password"
          secure
        />

        {/* CONFIRM PASSWORD */}
        <Input
          label="Confirm Password"
          icon="checkmark-done-outline"
          placeholder="Confirm new password"
          secure
        />

        {/* BUTTON */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Update Password</Text>
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
    backgroundColor: "#9B42F2",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});