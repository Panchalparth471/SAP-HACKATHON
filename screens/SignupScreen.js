import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import RNPickerSelect from "react-native-picker-select";

const BACKEND_URL = Constants.expoConfig.extra.backendUrl;

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(""); // Role will be selected from dropdown
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !role) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        console.log("Signup Response:", data); // ✅ Debugging log

        // ✅ Ensure user_id exists in response before storing
        if (!data.user_id) {
          Alert.alert("Error", "Signup successful, but user ID is missing.");
          return;
        }

        // ✅ Store all user details in AsyncStorage
        await AsyncStorage.setItem("user_id", data.user_id);
        await AsyncStorage.setItem("user_name", name);
        await AsyncStorage.setItem("user_email", email);
        await AsyncStorage.setItem("user_role", role);
        await AsyncStorage.setItem("auth_token", data.token);

        Alert.alert("Success", "Account created successfully!");
        navigation.navigate("Profile", { name, email, role });
      } else {
        Alert.alert("Error", data.message || "Signup failed.");
      }
    } catch (error) {
      setLoading(false);
      console.error("Signup Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create an account</Text>
      <Text style={styles.subtitle}>Get Your Prescriptions today!</Text>

      <TextInput style={styles.input} placeholder="Enter Your Username" onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Enter Your Email" keyboardType="email-address" onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Enter Your Password" secureTextEntry={true} onChangeText={setPassword} />

      {/* Role Selection Dropdown */}
      <RNPickerSelect
        onValueChange={(value) => setRole(value)}
        items={[
          { label: "Doctor", value: "doctor" },
          { label: "Patient", value: "patient" },
        ]}
        style={pickerSelectStyles}
        placeholder={{ label: "Select Your Role", value: null }}
      />

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading}>
        <Text style={styles.signupText}>{loading ? "Signing Up..." : "Sign Up"}</Text>
      </TouchableOpacity>

      <Text style={styles.loginText}>
        Already have an account?{" "}
        <Text style={styles.loginLink} onPress={() => navigation.navigate("login")}>
          Login
        </Text>
      </Text>
    </View>
  );
}

// 🔹 **Styles**
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9f9f9", paddingHorizontal: 20 },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "gray", marginBottom: 20 },
  input: { width: "100%", padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 10, backgroundColor: "#fff" },
  signupButton: { width: "100%", backgroundColor: "#007bff", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 10 },
  signupText: { color: "white", fontSize: 16, fontWeight: "bold" },
  loginText: { marginTop: 15, fontSize: 14 },
  loginLink: { color: "#007bff", fontWeight: "bold" },
});

// Custom styles for Picker
const pickerSelectStyles = {
  inputIOS: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#000",
  },
  inputAndroid: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#000",
  },
};
