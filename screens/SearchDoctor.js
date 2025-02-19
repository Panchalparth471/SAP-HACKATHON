import React, { useState, useEffect } from "react";
import { 
    View, Text, TextInput, TouchableOpacity, 
    ActivityIndicator, FlatList, StyleSheet, Alert 
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const SearchDoctor = ({ navigation }) => {
    const [searchText, setSearchText] = useState("");
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [patientId, setPatientId] = useState(null);

    // ✅ Fetch Patient ID from AsyncStorage Once
    useEffect(() => {
        const fetchPatientId = async () => {
            try {
                const token = await AsyncStorage.getItem("auth_token");
                const storedPatientId = await AsyncStorage.getItem("user_id");

                if (!token) {
                    Alert.alert("Error", "You must be logged in to search for doctors.");
                    navigation.navigate("login");
                } else {
                    setPatientId(storedPatientId);
                }
            } catch (error) {
                console.error("Error fetching patient ID:", error);
            }
        };
        fetchPatientId();
    }, []);

    // 🔹 **API: Search for doctors**
    const handleSearch = async () => {
        if (!searchText.trim()) {
            Alert.alert("Error", "Please enter a doctor's name.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get(
                `http://192.168.189.54:5001/api/v1/search-doctor?name=${searchText}`
            );

            if (!response.data || !response.data.doctors || response.data.doctors.length === 0) {
                Alert.alert("No Results", "No doctors found with that name.");
            }

            console.log("Doctor Search Response:", response.data);  // ✅ Log API response
            setDoctors(response.data.doctors);
        } catch (error) {
            console.error("Error fetching doctors:", error.response?.data || error.message);
            Alert.alert("Error", "Something went wrong while searching. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // 🔹 **API: Send request to doctor**
    const handleRequestAccess = async (doctorId) => {
        try {
            const token = await AsyncStorage.getItem("auth_token");

            // ✅ Ensure all required data is available
            if (!token || !patientId || !doctorId) {
                Alert.alert("Error", "Invalid request. Missing user data.");
                console.error("Missing Data:", { token, patientId, doctorId });  // ✅ Log missing data
                return;
            }

            const requestBody = { patient_id: patientId, doctor_id: doctorId };
            console.log("Sending request:", requestBody);  // ✅ Log request payload

            const response = await axios.post(
                "http://192.168.189.54:5001/api/v1/request-access",
                requestBody,
                { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } }
            );

            console.log("Request Response:", response.data);  // ✅ Log API response
            Alert.alert("Success", "Request sent successfully!");
        } catch (error) {
            console.error("Error sending request:", error.response?.data || error.message);
            Alert.alert("Error", error.response?.data?.message || "Could not send request. Try again.");
        }
    };

    return (
        <View style={styles.container}>
            {/* 🔹 Header */}
            <View style={styles.header}>
                <TextInput
                    placeholder="Search for a doctor..."
                    placeholderTextColor="white"
                    value={searchText}
                    onChangeText={setSearchText}
                    style={styles.searchInput}
                />
                <TouchableOpacity onPress={handleSearch}>
                    {isLoading ? <ActivityIndicator size="small" color="white" /> : <Icon name="search" size={30} color="white" />}
                </TouchableOpacity>
            </View>

            {/* 🔹 Doctor List */}
            <FlatList
                data={doctors}
                keyExtractor={(item) => item.doctor_id || item._id}  // ✅ Ensure doctor_id is correct
                renderItem={({ item }) => {
                    console.log("Doctor Item:", item);  // ✅ Log doctor data
                    return (
                        <View style={styles.doctorCard}>
                            <Text style={styles.doctorName}>{item.name}</Text>
                            <Text style={styles.doctorEmail}>{item.email}</Text>
                            <TouchableOpacity 
                                style={styles.button} 
                                onPress={() => handleRequestAccess(item.doctor_id || item._id)}  // ✅ Ensure correct doctor_id
                            >
                                <Text style={styles.buttonText}>Request Access</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />

            {/* 🔹 Footer Navigation */}
            <View style={styles.footer}>
                <Icon name="home" size={40} color="white" onPress={() => navigation.navigate("Home")} />
                <Icon name="camera" size={30} onPress={() => navigation.navigate("scan")} color="white" />
                <Icon name="wechat" size={30} onPress={() => navigation.navigate("chatBot")} color="white" />
                <Icon name="user" size={30} onPress={() => navigation.navigate("Profile")} color="white" />
            </View>
        </View>
    );
};

// 🔹 **Styles**
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "white", paddingBottom: 80 },
    header: { height: 70, backgroundColor: "#0E64D2", marginTop: 50, alignItems: "center", flexDirection: "row", padding: 15, justifyContent: "space-between" },
    searchInput: { color: "white", width: "80%", fontSize: 20, fontWeight: "500", borderWidth: 0 },
    doctorCard: { backgroundColor: "#f0f0f0", padding: 10, borderRadius: 8, margin: 10 },
    doctorName: { fontSize: 18, fontWeight: "bold", color: "#0E64D2" },
    doctorEmail: { fontSize: 16, color: "#555" },
    button: { marginTop: 10, backgroundColor: "#0E64D2", padding: 12, borderRadius: 8, alignItems: "center" },
    buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
    footer: { height: 70, backgroundColor: "#0E64D2", flexDirection: "row", alignItems: "center", justifyContent: "space-between", position: "absolute", bottom: 0, left: 0, right: 0, padding: 15 },
});

export default SearchDoctor;
