import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = () => {
    // Navigate to ProfileScreen with user data
    navigation.navigate("Profile", { name, email, contact });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create an account</Text>
      <Text style={styles.subtitle}>Get Your Prescriptions today!</Text>

      <TextInput style={styles.input} placeholder="Enter Your Username" onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Enter Your Email" keyboardType="email-address" onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Enter Your Phone Number" keyboardType="phone-pad" onChangeText={setContact} />
      <TextInput style={styles.input} placeholder="Enter Your Password" secureTextEntry={true} onChangeText={setPassword} />

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupText}>Sign Up</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <Text style={styles.dividerText}>Or With</Text>
      </View>

      <TouchableOpacity style={styles.googleButton}>
        <Image source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }} style={styles.googleIcon} />
        <Text style={styles.googleText}>Signup with Google</Text>
      </TouchableOpacity>

      <Text style={styles.loginText}>
        Already have an account?{" "}
        <Text style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
          Login
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9f9f9", paddingHorizontal: 20 },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "gray", marginBottom: 20 },
  input: { width: "100%", padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 10, backgroundColor: "#fff" },
  signupButton: { width: "100%", backgroundColor: "#007bff", padding: 12, borderRadius: 8, alignItems: "center" },
  signupText: { color: "white", fontSize: 16, fontWeight: "bold" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, width: "100%" },
  dividerText: { flex: 1, textAlign: "center", fontSize: 14, color: "gray", position: "relative" },
  googleButton: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, width: "100%", justifyContent: "center" },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleText: { fontSize: 16, fontWeight: "bold" },
  loginText: { marginTop: 15, fontSize: 14 },
  loginLink: { color: "#007bff", fontWeight: "bold" },
});
