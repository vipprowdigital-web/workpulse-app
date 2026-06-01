import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Alert } from "react-native";
import { useState } from "react";
import Button from "@/components/button";
import { KeyboardAvoidingView, Platform, StatusBar, SafeAreaView } from "react-native";
import Input from "@/components/input";
import { apiUrl } from "../../config/env";

export default function AdminSignup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    if (!companyName || !email || !phone || !businessType || !address || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${apiUrl}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          email,
          phone,
          businessType,
          address,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Account created successfully!");
        router.replace("/");
      } else {
        Alert.alert("Error", data.message || "Signup failed");
      }
    } catch (error) {
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#EEF2F7" 
        translucent={false} 
      />

      {/* 🚨 STICKY HEADER: Title ko ScrollView se bahar nikal diya taaki ye apni jagah fix rahe */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Create Company Account</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -50}
      >
        {/* Ab sirf inputs scroll honge, title apni jagah fixed rahega */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.formContainer}>
            <Input label="Company Name" icon="business-outline" placeholder="Enter company name" value={companyName} onChangeText={setCompanyName} />

            <Input label="Email" icon="mail-outline" placeholder="Enter email" value={email} onChangeText={setEmail} />

            <Input label="Phone Number" icon="call-outline" placeholder="Enter phone number" value={phone} onChangeText={setPhone} />

            <Input label="Business Type" icon="briefcase-outline" placeholder="e.g IT, Marketing" value={businessType} onChangeText={setBusinessType} />

            <Input label="Address" icon="location-outline" placeholder="Enter address" value={address} onChangeText={setAddress} />

            <Input label="Password" icon="lock-closed-outline" placeholder="Enter password" secure={true} value={password} onChangeText={setPassword} />

            <View style={styles.buttonWrapper}>
              <Button title="Create Account" onPress={handleSignup} loading={loading} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF2F7",
  },
  // 🚨 NEW STYLE: Title ko fixed top background dene ke liye
  headerContainer: {
    backgroundColor: "#EEF2F7",
    paddingTop: Platform.OS === "android" ? 80 : 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1E3A8A",
  },
  keyboardView: {
    flex: 1,
    backgroundColor: "#EEF2F7",
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 10, // Title ke thoda niche se inputs start honge
    paddingBottom: 40,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#EEF2F7",
    paddingHorizontal: 16,
  },
  buttonWrapper: {
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
});

// import { View, Text, StyleSheet, ScrollView } from "react-native";
// import { useRouter, Stack } from "expo-router";
// import { Alert } from "react-native";
// import { useState } from "react";
// import Button from "@/components/button";
// import Input from "@/components/input";
// import {apiUrl} from "../../config/env";

// export default function AdminSignup() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   const [companyName, setCompanyName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [businessType, setBusinessType] = useState("");
//   const [address, setAddress] = useState("");
//   const [password, setPassword] = useState("");

//   const handleSignup = async () => {
//     if (!companyName || !email || !phone || !businessType || !address || !password) {
//       Alert.alert("Error", "All fields are required");
//       return;
//     }

//     try {
//       setLoading(true);

//       // const res = await fetch(`${apiUrl}/api/auth/signup`, {
//       const res = await fetch(`${apiUrl}/api/auth/signup`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           companyName,
//           email,
//           phone,
//           businessType,
//           address,
//           password,
//         }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         Alert.alert("Success", "Account created successfully!");
//         router.replace("/");
//       } else {
//         Alert.alert("Error", data.message || "Signup failed");
//       }
//     } catch (error) {
//       Alert.alert("Error", "Network error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <Stack.Screen options={{ headerShown: false }} />

//       <ScrollView
//         contentContainerStyle={styles.scrollContainer}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.container}>
//           <Text style={styles.title}>Create Company Account</Text>

//           <Input label="Company Name" icon="business-outline" placeholder="Enter company name" value={companyName} onChangeText={setCompanyName} />

//           <Input label="Email" icon="mail-outline" placeholder="Enter email" value={email} onChangeText={setEmail} />

//           <Input label="Phone Number" icon="call-outline" placeholder="Enter phone number" value={phone} onChangeText={setPhone} />

//           <Input label="Business Type" icon="briefcase-outline" placeholder="e.g IT, Marketing" value={businessType} onChangeText={setBusinessType} />

//           <Input label="Address" icon="location-outline" placeholder="Enter address" value={address} onChangeText={setAddress} />

//           <Input label="Password" icon="lock-closed-outline" placeholder="Enter password" secure={true} value={password} onChangeText={setPassword} />

//           <View style={{ height: 12 }} />

//           <Button title="Create Account" onPress={handleSignup} loading={loading} />
//         </View>
//       </ScrollView>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   scrollContainer: {
//     paddingBottom: 30,
//   },

//   container: {
//     flex: 1,
//     backgroundColor: "#EEF2F7",
//     paddingHorizontal: 16,
//     paddingTop: 70,
//   },

//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 15,
//     color: "#1E3A8A",
//   },
// });

