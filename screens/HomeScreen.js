import React, { useState, useEffect } from "react";
import { 
    View, Text, TextInput, TouchableOpacity, ActivityIndicator, 
    ScrollView, StyleSheet, Alert, FlatList 
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const HomeScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [authorizedPatients, setAuthorizedPatients] = useState([]); //  Store authorized patients' details

    //  Fetch user role & authorized patients (if doctor)
    useEffect(() => {
        const fetchUserData = async () => {
            const role = await AsyncStorage.getItem("user_role");
            setUserRole(role);

            if (role === "doctor") {
                fetchAuthorizedPatients();
            }
        };
        fetchUserData();
    }, []);

    // 🔹 **Fetch Authorized Patients' Details**
    const fetchAuthorizedPatients = async () => {
        try {
            const token = await AsyncStorage.getItem("auth_token");
            const userId = await AsyncStorage.getItem("user_id");
            if (!token || !userId) return;

            console.log("Fetching authorized patients for doctor:", userId);

            const response = await axios.get(
                `http://192.168.189.54:5001/api/v1/get-authorized-patients-data/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Authorized Patients API Response:", response.data);
            setAuthorizedPatients(response.data.authorized_patients);
        } catch (error) {
            console.error("Error fetching authorized patients:", error.response?.data || error.message);
            Alert.alert("Error", "Could not fetch authorized patients.");
        }
    };

    // 🔹 **Search for Medicine & Navigate**
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            Alert.alert("Error", "Please enter a medicine name.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get(`http://192.168.189.54:5001/api/v1/medicine/${searchQuery}`);
            navigation.navigate("prescriptionDetails", { searchData: response.data, name: searchQuery });
        } catch (error) {
            console.error("API Fetch Error:", error.response?.data || error.message);
            Alert.alert("Error", "Medicine not found.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* 🔹 Search Bar Restored at the Top */}
            <View style={styles.searchContainer}>
                <TextInput
                    placeholderTextColor="white"
                    placeholder="Search for a medicine..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                />
                <TouchableOpacity onPress={handleSearch}>
                    {isLoading ? <ActivityIndicator size="small" color="white" /> : <Icon name="search" size={30} color="white" />}
                </TouchableOpacity>
            </View>

            {userRole === "doctor" ? (
                <ScrollView>
                    <Text style={styles.heading}>Authorized Patients</Text>
                    {authorizedPatients.length === 0 ? (
                        <Text style={styles.noPatientsText}>No authorized patients found.</Text>
                    ) : (
                        <FlatList
                            data={authorizedPatients}
                            keyExtractor={(item) => item.patient_id}
                            renderItem={({ item }) => (
                                <View style={styles.patientCard}>
                                    <Text style={styles.patientText}>🩺 <Text style={styles.boldText}>Name:</Text> {item.name}</Text>

                                    {/* 🔹 Full List of Saved Medicines */}
                                    <Text style={styles.boldText}>💊 Saved Medicines:</Text>
                                    {item.saved_medicines.length > 0 ? (
                                        item.saved_medicines.map((med, index) => (
                                            <Text key={index} style={styles.patientDetail}>- {med.brand_name || "Unknown Medicine"}</Text>
                                        ))
                                    ) : (
                                        <Text style={styles.patientDetail}>No saved medicines.</Text>
                                    )}

                                    {/* 🔹 Full List of Reports */}
                                    <Text style={styles.boldText}>📑 Reports:</Text>
                                    {item.reports.length > 0 ? (
                                        item.reports.map((report, index) => (
                                            <Text key={index} style={styles.patientDetail}>- {report.summary || "No summary available"}</Text>
                                        ))
                                    ) : (
                                        <Text style={styles.patientDetail}>No reports available.</Text>
                                    )}

                                    {/* 🔹 Full List of Current Medicines */}
                                    <Text style={styles.boldText}>⏳ Current Medicines:</Text>
                                    {item.current_medicines.length > 0 ? (
                                        item.current_medicines.map((med, index) => (
                                            <Text key={index} style={styles.patientDetail}>- {med.name || "Unknown Medicine"}</Text>
                                        ))
                                    ) : (
                                        <Text style={styles.patientDetail}>No current medicines.</Text>
                                    )}
                                </View>
                            )}
                        />
                    )}
                </ScrollView>
            ) : (
                <>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("search")}>
                        <Text style={styles.buttonText}>Search & Request Doctor</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("addMedicine")}>
                        <Text style={styles.buttonText}>Add Medicine Schedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("uploadReports")}>
                        <Text style={styles.buttonText}>Add Reports</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* 🔹 Footer Navigation */}
            <View style={styles.footer}>
                <Icon name="home" size={40} color="white" />
                <Icon name="camera" size={30} onPress={() => navigation.navigate("scan")} color="white" />
                <Icon name="wechat" size={30} onPress={() => navigation.navigate("chatBot")} color="white" />
                <Icon name="user" size={30} onPress={() => navigation.navigate("Profile")} color="white" />
            </View>
        </View>
    );
};

//  **Updated Styles**
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "white", paddingBottom: 80 },

    // 🔹 Search Bar at the Top
    searchContainer: { 
        height: 70, backgroundColor: "#0E64D2", 
        marginTop: 50, alignItems: "center", flexDirection: "row", 
        padding: 15, justifyContent: "space-between"
    },
    searchInput: { color: "white", width: "80%", fontSize: 18, fontWeight: "500" },

    heading: { fontSize: 20, fontWeight: "bold", marginVertical: 10, textAlign: "center" },
    
    patientCard: { backgroundColor: "#f1f1f1", padding: 15, margin: 8, borderRadius: 8 },
    
    patientText: { fontSize: 16, color: "#333", marginBottom: 5 },
    boldText: { fontWeight: "bold", fontSize: 16, color: "#000" },
    patientDetail: { fontSize: 14, color: "#555", marginLeft: 10 },

    noPatientsText: { textAlign: "center", fontSize: 16, color: "#555", marginTop: 10 },
    
    button: { backgroundColor: "#0E64D2", padding: 15, borderRadius: 8, alignItems: "center", margin: 10 },
    buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },

    footer: { 
        height: 70, backgroundColor: "#0E64D2", 
        flexDirection: "row", alignItems: "center", 
        justifyContent: "space-between", position: "absolute", 
        bottom: 0, left: 0, right: 0, padding: 15 
    },
});

export default HomeScreen;
