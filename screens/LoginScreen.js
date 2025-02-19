import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const BACKEND_URL = Constants.expoConfig.extra.backendUrl;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        await AsyncStorage.setItem("user_email", email);
        await AsyncStorage.setItem("auth_token", data.token);
        
        console.log(await AsyncStorage.getItem("auth_token"))
        Alert.alert("Success", "Login successful!");
        navigation.navigate("Home");
      } else {
        Alert.alert("Error", data.message || "Login failed.");
      }
    } catch (error) {
      setLoading(false);
      console.log(error)
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome Back!</Text>
      <Text style={styles.subheader}>Login to your account</Text>

      <TextInput style={styles.input} placeholder="Enter Your Email" onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Enter Your Password" secureTextEntry={true} onChangeText={setPassword} />

      <TouchableOpacity>
        <Text style={styles.forgotPassword} onPress={() => navigation.navigate("forgot")}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
      </TouchableOpacity>

      <Text style={styles.signupText}>
        Don't have an account? {" "}
        <Text style={styles.signupLink} onPress={() => navigation.navigate("signup")}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subheader: {
    fontSize: 14,
    color: "gray",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    color: "#007bff",
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    color: "#007bff",
    fontWeight: "bold",
  },
});
