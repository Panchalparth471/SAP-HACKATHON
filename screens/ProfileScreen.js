import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState("N/A");
  const [email, setEmail] = useState("N/A");
  const [savedMedicines, setSavedMedicines] = useState([]);
  const [currentMedicines, setCurrentMedicines] = useState([]);

  // Function to handle logout
  async function handleLogout() {
    await AsyncStorage.removeItem("user_email");
    await AsyncStorage.removeItem("user_name");
    await AsyncStorage.removeItem("auth_token");
    navigation.navigate("signup");
  }

  // Fetch user details from backend using get_user_details API
  useFocusEffect(
    useCallback(() => {
      const fetchUserDetails = async () => {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          try {
            const response = await fetch("http://192.168.189.54:5001/api/v1/get_user_details", {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok) {
              const user = data.user;
              setName(user.name || "N/A");
              setEmail(user.email || "N/A");
              setSavedMedicines(user.saved_medicines || []);
              setCurrentMedicines(user.current_medicines || []);
            } else {
              Alert.alert("Error", data.error || "Failed to fetch user details.");
            }
          } catch (error) {
            console.error("Error fetching user details:", error);
            Alert.alert("Error", "Something went wrong. Please try again.");
          }
        } else {
          navigation.navigate("signup");
        }
      };

      fetchUserDetails();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* 🔹 Header with Back Button */}
      <View style={styles.header}>
        <Icon onPress={() => navigation.goBack()} name="arrow-left" size={30} color="white" style={styles.backIcon} />
        <Text style={styles.headerText}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileContainer}>
          <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} style={styles.profileImage} />
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{name}</Text>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email}</Text>
        </View>

        {/* 🔹 Current Medicines Section */}
        <Text style={styles.medicineHeader}>Current Medicines</Text>
        {currentMedicines.length === 0 ? (
          <Text style={styles.noMedicineText}>No active medicines.</Text>
        ) : (
          currentMedicines.map((medicine, index) => (
            <View key={index} style={styles.medicineItem}>
              <Text style={styles.medicineName}>{medicine.name || "Unknown"}</Text>
              <Text style={styles.medicineInfo}>
                Start:{" "}
                {medicine.consulting_date && medicine.consulting_date.$date
                  ? new Date(medicine.consulting_date.$date).toLocaleDateString()
                  : "N/A"}
              </Text>
              <Text style={styles.medicineInfo}>Duration: {medicine.dosage_period} days</Text>
              <Text style={styles.medicineInfo}>
                Times: {Array.isArray(medicine.times) ? medicine.times.join(", ") : "N/A"}
              </Text>
            </View>
          ))
        )}

        {/* 🔹 Saved Medicines Section */}
        <Text style={styles.medicineHeader}>Saved Medicines</Text>
        {savedMedicines.length === 0 ? (
          <Text style={styles.noMedicineText}>No saved medicines.</Text>
        ) : (
          savedMedicines.map((medicine, index) => (
            <TouchableOpacity
              key={index}
              style={styles.medicineItem}
              onPress={() =>
                navigation.navigate("prescriptionDetails", {
                  searchData: medicine,
                  name: medicine.brand_name,
                })
              }
            >
              {/* Medicine Image */}
              <Image
                source={{ uri: medicine.image_url || "https://via.placeholder.com/100" }}
                style={styles.medicineImage}
              />
              {/* Medicine Name */}
              <Text style={styles.medicineName}>{medicine.brand_name || "Unknown"}</Text>
              {/* Medicine Details */}
              <Text style={styles.medicineInfo}>Purpose: {medicine.purpose || "N/A"}</Text>
              <Text style={styles.medicineInfo}>Active Ingredient: {medicine.active_ingredient || "N/A"}</Text>
            </TouchableOpacity>
          ))
        )}

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 🔹 Footer Navigation Bar */}
      <View style={styles.footer}>
        <Icon name="home" size={40} color="white" onPress={() => navigation.navigate("Home")} />
        <Icon name="camera" size={30} onPress={() => navigation.navigate("scan")} color="white" />
        <Icon name="wechat" size={30} onPress={() => navigation.navigate("chatBot")} color="white" />
        <Icon name="user" size={30} onPress={() => navigation.navigate("Profile")} color="white" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { flexGrow: 1, paddingBottom: 80 },
  header: {
    backgroundColor: "#0E64D2",
    padding: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
    marginTop: 50,
  },
  backIcon: {
    position: "absolute",
    left: 20,
    top: 20,
  },
  headerText: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  profileContainer: { alignItems: "center", marginTop: 20 },
  profileImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  label: { fontSize: 16, fontWeight: "bold", color: "gray", marginTop: 10 },
  value: { fontSize: 18, fontWeight: "600", color: "#333" },
  medicineHeader: { fontSize: 20, fontWeight: "bold", marginLeft: 15, marginTop: 20, marginBottom: 10 },
  noMedicineText: { textAlign: "center", color: "gray", fontSize: 16, marginVertical: 20 },
  medicineItem: { backgroundColor: "#f8f8f8", padding: 10, borderRadius: 8, marginHorizontal: 15, marginBottom: 10 },
  medicineName: { fontSize: 18, fontWeight: "600" },
  medicineInfo: { fontSize: 16, color: "gray" },
  medicineImage: { width: 50, height: 50, borderRadius: 10, marginVertical: 5 },
  footer: {
    height: 70,
    backgroundColor: "#0E64D2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  logoutContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  logoutButton: {
    backgroundColor: "#f44336",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
