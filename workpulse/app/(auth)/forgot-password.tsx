import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Stack } from "expo-router";
import Input from "@/components/input";
import Button from "@/components/button";

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
           <Button title="Send Password" />
      

      </View>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#dde2eb",
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a1717",
    textAlign: "center",
    marginBottom: 30,
  },

 

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});