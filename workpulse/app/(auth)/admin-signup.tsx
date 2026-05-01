import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Alert } from "react-native";
import { useState } from "react";
import Button from "@/components/button";
import Input from "@/components/input";

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

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/signup`, {
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
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Company Account</Text>

          <Input label="Company Name" icon="business-outline" placeholder="Enter company name" value={companyName} onChangeText={setCompanyName} />

          <Input label="Email" icon="mail-outline" placeholder="Enter email" value={email} onChangeText={setEmail} />

          <Input label="Phone Number" icon="call-outline" placeholder="Enter phone number" value={phone} onChangeText={setPhone} />

          <Input label="Business Type" icon="briefcase-outline" placeholder="e.g IT, Marketing" value={businessType} onChangeText={setBusinessType} />

          <Input label="Address" icon="location-outline" placeholder="Enter address" value={address} onChangeText={setAddress} />

          <Input label="Password" icon="lock-closed-outline" placeholder="Enter password" secure={true} value={password} onChangeText={setPassword} />

          <View style={{ height: 12 }} />

          <Button title="Create Account" onPress={handleSignup} loading={loading} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 30,
  },

  container: {
    flex: 1,
    backgroundColor: "#EEF2F7",
    paddingHorizontal: 16,
    paddingTop: 30,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#1E3A8A",
  },
});


// import { View, Text, StyleSheet, ScrollView } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter, Stack } from "expo-router";
// import { Alert } from "react-native";
// import { useState } from "react";
// import Button from "@/components/button";
// import Input from "@/components/input";

// export default function AdminSignup() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   // 🔥 FORM STATE
//   const [companyName, setCompanyName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [businessType, setBusinessType] = useState("");
//   const [address, setAddress] = useState("");
//   const [password, setPassword] = useState(""); // 👈 NEW

//   // 🔥 API CALL
//   const handleSignup = async () => {
//     if (!companyName || !email || !phone || !businessType || !address || !password) {
//       Alert.alert("Error", "All fields are required");
//       return;
//     }

//     try {
//       setLoading(true);

//       const res = await fetch("http://192.168.29.192:5000/api/auth/signup", {
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
//           password, // 👈 IMPORTANT
//         }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         Alert.alert("Success", "Account created successfully!");
//         router.replace("/"); // login page
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

//           <Input
//             label="Company Name"
//             icon="business-outline"
//             placeholder="Enter company name"
//             value={companyName}
//             onChangeText={setCompanyName}
//           />

//           <Input
//             label="Email"
//             icon="mail-outline"
//             placeholder="Enter email"
//             value={email}
//             onChangeText={setEmail}
//           />

//           <Input
//             label="Phone Number"
//             icon="call-outline"
//             placeholder="Enter phone number"
//             value={phone}
//             onChangeText={setPhone}
//           />

//           <Input
//             label="Business Type"
//             icon="briefcase-outline"
//             placeholder="e.g IT, Marketing"
//             value={businessType}
//             onChangeText={setBusinessType}
//           />

//           <Input
//             label="Address"
//             icon="location-outline"
//             placeholder="Enter address"
//             value={address}
//             onChangeText={setAddress}
//           />

//           {/* 🔥 NEW PASSWORD FIELD */}
//           <Input
//             label="Password"
//             icon="lock-closed-outline"
//             placeholder="Enter password"
//             secure={true}
//             value={password}
//             onChangeText={setPassword}
//           />

//           <View style={{ height: 12 }} />

//           <Button
//             title="Create Account"
//             onPress={handleSignup}
//             loading={loading}
//           />
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
//     paddingTop: 30,
//   },

//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 15,
//     color: "#1E3A8A",
//   },
// });

// import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Stack } from "expo-router";
// import { Alert } from "react-native";
// import { useState } from "react";
// import Button from "@/components/button";
// import Input from "@/components/input";

// export default function AdminSignup() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//  const handleSignup = () => {
//   setLoading(true);

//   setTimeout(() => {
//     Alert.alert("Success", "Account created successfully!");
//     router.replace("/");
//     setLoading(false);
//   }, 1500);
// };

// return (
//   <>
//     <Stack.Screen options={{ headerShown: false }} />

//     <View style={styles.container}>
//       <Text style={styles.title}>Create Company Account</Text>

//       <Input label="Company Name" icon="business-outline" placeholder="Enter company name" />
//       <Input label="Email" icon="mail-outline" placeholder="Enter email" />
//       <Input label="Phone Number" icon="call-outline" placeholder="Enter phone number" />
//       <Input label="Business Type" icon="briefcase-outline" placeholder="e.g IT, Marketing" />
//       <Input label="Address" icon="location-outline" placeholder="Enter address" />

//     <Button 
//   title="Create Account" 
//   onPress={handleSignup} 
//   loading={loading} 
// />
//     </View>
//   </>
// );
  
// }
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#EEF2F7",
//     padding: 20,
//     justifyContent: "center",
//   },

//   title: {
//     fontSize: 26,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 25,
//     color: "#1E3A8A",
//   },



//   buttonText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
// });