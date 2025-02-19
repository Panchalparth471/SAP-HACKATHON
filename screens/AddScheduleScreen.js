import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";

export default function AddScheduleScreen({ navigation }) {
  const [name, setName] = useState("");
  const [consultingDate, setConsultingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dosagePeriod, setDosagePeriod] = useState("");
  const [numMedicines, setNumMedicines] = useState("");
  const [mealTimes, setMealTimes] = useState({ Breakfast: null, Lunch: null, Dinner: null });
  const [showPicker, setShowPicker] = useState({ Breakfast: false, Lunch: false, Dinner: false });

  const handleAddMedicine = async () => {
    if (!name || !consultingDate || !dosagePeriod || !numMedicines || Object.values(mealTimes).some(time => time === null)) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    const token = await AsyncStorage.getItem("auth_token");
    if (!token) {
      Alert.alert("Error", "Authentication token is missing.");
      return;
    }

    try {
      const response = await axios.post(
        "http://192.168.189.54:5001/api/v1/add_medicine",
        {
          name,
          consulting_date: consultingDate.toISOString().split("T")[0],
          dosage_period: dosagePeriod,
          num_medicines: numMedicines,
          times: Object.values(mealTimes).map(time => time.toLocaleTimeString()),
        },
        {
            headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
        }
      );

      Alert.alert("Success", response.data.message);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Failed to add medicine.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="arrow-left" size={24} color="white" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Add Medicine Schedule</Text>
      </View>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.label}>Medicine Name:</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />

        <Text style={styles.label}>Consulting Date:</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
          <Text>{consultingDate.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={consultingDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setConsultingDate(date);
            }}
          />
        )}

        <Text style={styles.label}>Dosage Period (days):</Text>
        <TextInput value={dosagePeriod} onChangeText={setDosagePeriod} keyboardType="numeric" style={styles.input} />

        <Text style={styles.label}>Number of Medicines:</Text>
        <TextInput value={numMedicines} onChangeText={setNumMedicines} keyboardType="numeric" style={styles.input} />

        {['Breakfast', 'Lunch', 'Dinner'].map((meal) => (
          <View key={meal}>
            <Text style={styles.label}>{meal} Time:</Text>
            <TouchableOpacity onPress={() => setShowPicker(prev => ({ ...prev, [meal]: true }))} style={styles.input}>
              <Text>{mealTimes[meal] ? mealTimes[meal].toLocaleTimeString() : "Select Time"}</Text>
            </TouchableOpacity>
            {showPicker[meal] && (
              <DateTimePicker
                value={mealTimes[meal] || new Date()}
                mode="time"
                display="default"
                onChange={(event, date) => {
                  setShowPicker(prev => ({ ...prev, [meal]: false }));
                  if (date) setMealTimes(prev => ({ ...prev, [meal]: date }));
                }}
              />
            )}
          </View>
        ))}

        <Button title="Add Medicine" onPress={handleAddMedicine} />
      </ScrollView>
      <View style={styles.footer}>
        <Icon name="home" size={30} color="white" onPress={() => navigation.navigate("Home")} />
        <Icon name="camera" size={30} color="white" onPress={() => navigation.navigate("scan")} />
        <Icon name="wechat" size={30} color="white" onPress={() => navigation.navigate("chatBot")} />
        <Icon name="user" size={30} color="white" onPress={() => navigation.navigate("Profile")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", marginTop:50 },
  header: { flexDirection: "row", alignItems: "center", backgroundColor: "#0E64D2", padding: 15 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "white", marginLeft: 10 },
  scrollContainer: { paddingBottom: 20,padding:10 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 },
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
});
