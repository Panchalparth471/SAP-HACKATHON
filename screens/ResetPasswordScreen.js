import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import axios from "axios";

const API_URL = "http://192.168.189.54:5001/auth/reset_password";

export default function ResetPasswordScreen({ navigation, route }) {
    const [email, setEmail] = useState(route.params?.email || ""); //  Get email from previous screen
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    //  Handle Password Reset
    const resetPassword = async () => {
        if (!email.trim() || !otp.trim() || !password.trim()) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(API_URL, { email, otp, password });

            if (response.status === 200) {
                Alert.alert("Success", "Password updated successfully!");
                navigation.navigate("login"); //  Redirect to login
            } else {
                Alert.alert("Error", response.data.message || "Something went wrong.");
            }
        } catch (error) {
            Alert.alert("Error", "Invalid OTP or email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Reset Password</Text>
            <Text style={styles.subheader}>Enter OTP and your new password</Text>

            {/*  Email Field */}
            <TextInput
                style={styles.input}
                placeholder="Enter Your Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!route.params?.email} //  If email is passed, disable editing
            />

            {/*  OTP Field */}
            <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                keyboardType="numeric"
                value={otp}
                onChangeText={setOtp}
            />

            {/*  New Password Field */}
            <TextInput
                style={styles.input}
                placeholder="Enter New Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            {/*  Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={resetPassword} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? "Processing..." : "Submit"}</Text>
            </TouchableOpacity>
        </View>
    );
}

//  Reuse existing styles
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9f9f9", padding: 20 },
    header: { fontSize: 24, fontWeight: "bold" },
    subheader: { fontSize: 14, color: "gray", marginBottom: 20 },
    input: { width: "100%", height: 50, borderColor: "#ccc", borderWidth: 1, borderRadius: 5, paddingLeft: 10, marginBottom: 10, backgroundColor: "#fff" },
    submitButton: { backgroundColor: "#007bff", paddingVertical: 12, borderRadius: 5, alignItems: "center", marginBottom: 20, width: "100%" },
    buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});

