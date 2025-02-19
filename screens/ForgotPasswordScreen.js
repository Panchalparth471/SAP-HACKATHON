import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";

const BACKEND_URL = "http://192.168.189.54:5001/auth/";

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert("Error", "Please enter your email.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/forget_password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", "OTP sent to your email.");
                navigation.navigate("reset", { email }); // ✅ Navigate to Reset Screen with Email
            } else {
                Alert.alert("Error", data.message || "Something went wrong.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Forgot Password</Text>
            <Text style={styles.subheader}>Enter your email to receive an OTP</Text>

            <TextInput
                style={styles.input}
                placeholder="Enter Your Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleForgotPassword} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? "Submitting..." : "Submit"}</Text>
            </TouchableOpacity>

            <Text style={styles.signupText}>
                <Text style={styles.signupLink} onPress={() => navigation.navigate("login")}>
                    Back to login
                </Text>
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9f9f9", padding: 20 },
    header: { fontSize: 24, fontWeight: "bold" },
    subheader: { fontSize: 14, color: "gray", marginBottom: 20 },
    input: { width: "100%", height: 50, borderColor: "#ccc", borderWidth: 1, borderRadius: 5, paddingLeft: 10, marginBottom: 10, backgroundColor: "#fff" },
    submitButton: { backgroundColor: "#007bff", paddingVertical: 12, borderRadius: 5, alignItems: "center", marginBottom: 20, width: "100%" },
    buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
    signupText: { fontSize: 14 },
    signupLink: { color: "#007bff", fontWeight: "bold" },
});
