import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Stack } from "expo-router";
import Input from "@/components/input";
import Button from "@/components/button";

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
      <Button title="Update Password" />

      </View>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
      backgroundColor: "#e8ecf5",
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a1818",
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