import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const BACKEND_URL = "http://192.168.189.54:5001/api/v1";

// Function to clean medicine name (remove units like mg, g, mL, tablet, etc.)
const cleanMedicineName = (medicine) => {
    return medicine.replace(/\s*\d+(\.\d+)?\s?(mg|g|mcg|kg|mL|L|IU|tablet|capsule|drop|suppository|puff|ampoule|vial|patch|spray|dose|units|%)\b/gi, '').trim();
};

export default function Scan() {
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [medicines, setMedicines] = useState([]); // Extracted medicine names
    const [medicineDetails, setMedicineDetails] = useState([]); // API-fetched details
    const [isProcessed, setIsProcessed] = useState(false); // ✅ Track whether API has been called
    const navigation = useNavigation();

    // 📸 Open Camera
    const pickImageFromCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            alert('Camera permission is required!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1], 
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            extractMedicines(result.assets[0].uri);
        }
    };

    // 🖼 Upload from Gallery
    const pickImageFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Gallery permission is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1], 
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            extractMedicines(result.assets[0].uri);
        }
    };

    // 🧠 Extract Medicines via API
   const extractMedicines = async (imageUri) => {
    setMedicines([]); 
    setMedicineDetails([]); 
    setIsProcessed(false);
    setLoading(true);

    try {
        const formData = new FormData();
        formData.append("image", {
            uri: imageUri,
            name: "photo.jpg",
            type: "image/jpeg",
        });

        const response = await fetch(`${BACKEND_URL}/extract_medicines`, {
            method: "POST",
            headers: { "Content-Type": "multipart/form-data" },
            body: formData,
        });

        const data = await response.json();
        if (response.ok && data.medicines.length > 0) {
            const cleanedMedicines = data.medicines.flat().map(cleanMedicineName);
            setMedicines(cleanedMedicines);  
            fetchMedicineDetails(cleanedMedicines);
        } else {
            setIsProcessed(true);
            Alert.alert("No Medicines Found", "Could not detect medicines in the image.");
            setLoading(false);
        }
    } catch (error) {
        Alert.alert("Error", "Failed to process image.");
        setLoading(false);
    }
};

const fetchMedicineDetails = async (medicineList) => {
    setMedicineDetails([]);
    const fetchedDetails = [];

    for (let med of medicineList) {
        try {
            const cleanedMed = cleanMedicineName(med);
            console.log(`Fetching details for: ${cleanedMed}`);

            const response = await fetch(`${BACKEND_URL}/medicine/${encodeURIComponent(cleanedMed)}`);
            const data = await response.json();

            if (response.ok) {
                fetchedDetails.push({ ...data, extracted_name: cleanedMed });
            }
        } catch (error) {
            console.log(`❌ Error fetching details for ${med}:`, error);
        }
    }

    setMedicineDetails(fetchedDetails);
    setLoading(false);
};




    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
            {/* 🏷 Header */}
            <View style={{
                width: '100%',
                height: 70,
                backgroundColor: '#0E64D2',
                alignItems: 'center',
                flexDirection: 'row',
                padding: 15,
                zIndex: 1000,
            }}>
                <Icon onPress={() => navigation.goBack()} name="arrow-left" size={40} color="white" />
                <Text style={{ color: 'white', fontWeight: '500', fontSize: 25, marginLeft: 60 }}>Scan Prescription</Text>
            </View>

            {/* 📤 Image Upload Options */}
            {!imageUri ? (
                <>
                    <TouchableOpacity onPress={pickImageFromCamera} style={{ backgroundColor: '#007bff', padding: 15, borderRadius: 8, marginTop: 15 }}>
                        <Text style={{ color: '#fff', fontSize: 16 }}>📸 Capture Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImageFromGallery} style={{ backgroundColor: '#28a745', padding: 15, borderRadius: 8, marginTop: 15 }}>
                        <Text style={{ color: '#fff', fontSize: 16 }}>🖼 Upload from Gallery</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Image source={{ uri: imageUri }} style={{ width: "90%", height: 300, borderRadius: 10 }} />
                    <TouchableOpacity onPress={pickImageFromCamera} style={{ marginTop: 20, backgroundColor: '#007bff', padding: 15, borderRadius: 8 }}>
                        <Text style={{ color: '#fff', fontSize: 16 }}>🔄 Retake</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* ⏳ Loading Indicator */}
            {loading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />}

            {/* 💊 Medicine List */}
            <ScrollView style={{ width: "90%", marginTop: 20 }}>
                {isProcessed && medicines.length === 0 ? (
                    <Text style={{ fontSize: 16, color: "gray", textAlign: "center", marginTop: 20 }}>
                        No valid medicines found.
                    </Text>
                ) : (
                    medicineDetails.map((medicine, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => navigation.navigate("prescriptionDetails", { searchData: medicine, name: medicine.extracted_name })}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 10,
                                borderBottomWidth: 1,
                                borderBottomColor: "#ccc"
                            }}
                        >
                            <Image source={{ uri: medicine.image_url }} style={{ width: 60, height: 60, borderRadius: 10, marginRight: 10 }} />
                            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{medicine.extracted_name}</Text>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
