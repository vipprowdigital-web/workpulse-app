import { View, Text, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type InputProps = {
  label?: string;
  icon: any;
  placeholder: string;
  secure?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
};

export default function Input({ label, icon, placeholder, secure, value, onChangeText }: InputProps) {
  return (
    <View style={{ marginBottom: 8 }}>
      
      {label && <Text style={{ marginBottom: 5 }}>{label}</Text>}

      <View style={styles.inputBox}>
        <Ionicons name={icon} size={20} color="#9B42F2" />

        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secure}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    backgroundColor: "#fff",
  },

  input: {
    marginLeft: 10,
    flex: 1,
    color: "#000", // 👈 white hata diya (warna invisible hoga)
  },
});