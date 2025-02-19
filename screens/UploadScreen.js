import React, { useState } from "react";
import { 
    View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Alert, ActivityIndicator 
} from "react-native";
import * as ImagePicker from "expo-image-picker"; 
import Icon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const UploadScreen = () => {
    const [selectedImages, setSelectedImages] = useState([]); // ✅ Store uploaded images
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState(""); // ✅ Store summarized report
    const [extractedText, setExtractedText] = useState(""); // ✅ Store extracted text

    // 🔹 **Pick Multiple Images**
    const handlePickImages = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert("Permission Denied", "You need to allow access to the photo library.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ Only allow images
                allowsMultipleSelection: true,
                quality: 1, // High-quality images
            });

            if (result.canceled) return;

            // ✅ Append newly selected images to the existing list
            setSelectedImages([...selectedImages, ...result.assets]);
        } catch (error) {
            console.error("Error picking images:", error);
            Alert.alert("Error", "Failed to pick images.");
        }
    };

    // 🔹 **Remove Image from List**
    const handleRemoveImage = (index) => {
        setSelectedImages(selectedImages.filter((_, i) => i !== index));
    };

    // 🔹 **Upload Images & Summarize Report**
    const handleUploadImages = async () => {
        try {
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                Alert.alert("Error", "User is not logged in.");
                return;
            }

            const formData = new FormData();
            selectedImages.forEach((file) => {
                formData.append("image", {
                    uri: file.uri,
                    name: file.fileName || `image_${Date.now()}.jpg`,
                    type: "image/jpeg",
                });
            });

            setIsLoading(true);
            const response = await axios.post("http://192.168.189.54:5001/api/v1/upload-reports", formData, {
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "multipart/form-data" },
            });

            setSummary(response.data.summary || "No summary generated.");
            setExtractedText(response.data.recognized_text || "No extracted text available.");
            Alert.alert("Success", "Images uploaded and report summarized!");
            setSelectedImages([]); // ✅ Clear images after upload
        } catch (error) {
            console.error("API Error:", error.response?.data || error.message);
            Alert.alert("Error", "Failed to upload images.");
        } finally {
            setIsLoading(false);
        }
    };

    // 🔹 **Save Summary to User Profile**
    // 🔹 **Save Summary to User Profile**
const handleSaveSummary = async () => {
    try {
        const token = await AsyncStorage.getItem("auth_token");
        if (!token) {
            Alert.alert("Error", "User is not logged in.");
            return;
        }

        const requestBody = {
            extracted_text: extractedText,
            summary: summary,
        };

        setIsLoading(true);
        const response = await axios.post("http://192.168.189.54:5001/api/v1/save-summary", requestBody, {
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        });

        Alert.alert("Success", "Summary saved successfully!");
    } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        Alert.alert("Error", "Failed to save summary.");
    } finally {
        setIsLoading(false);
    }
};


    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={handlePickImages}>
                <Text style={styles.buttonText}>Select Images</Text>
            </TouchableOpacity>

            {/* 🔹 Scrollable List of Images */}
            {selectedImages.length > 0 && (
                <ScrollView style={styles.scrollContainer}>
                    {selectedImages.map((file, index) => (
                        <View key={index} style={styles.imageContainer}>
                            <Image source={{ uri: file.uri }} style={styles.image} />
                            <Text style={styles.imageName}>{file.fileName || `Image ${index + 1}`}</Text>
                            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveImage(index)}>
                                <Icon name="trash" size={20} color="red" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* 🔹 Show Summary After Upload */}
            {isLoading && <ActivityIndicator size="large" color="#0E64D2" style={{ marginTop: 20 }} />}
            {summary && (
                <ScrollView style={styles.summaryContainer}>
                    <Text style={styles.summaryText}><Text style={styles.boldText}>Extracted Text:</Text> {extractedText}</Text>
                    <Text style={styles.summaryText}><Text style={styles.boldText}>Summary:</Text> {summary}</Text>
                </ScrollView>
            )}

            {/* 🔹 Move the Upload Button Lower */}
            {selectedImages.length > 0 && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.uploadButton} onPress={handleUploadImages}>
                        <Text style={styles.buttonText}>Upload & Summarize</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 🔹 Save Summary Button */}
            {summary && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveSummary}>
                        <Text style={styles.buttonText}>Save Summary</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

// ✅ **Updated Styles**
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "white", padding: 20, justifyContent: "space-between" },
    button: { backgroundColor: "#0E64D2", padding: 15, borderRadius: 8, alignItems: "center", marginBottom: 10 },
    buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
    scrollContainer: { marginTop: 10, maxHeight: 250 },
    imageContainer: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#f9f9f9", borderRadius: 8, marginBottom: 10 },
    image: { width: 70, height: 70, borderRadius: 8, marginRight: 10 },
    imageName: { fontSize: 16, color: "#333", flex: 1 },
    removeButton: { padding: 5 },
    uploadButton: { backgroundColor: "#28a745", padding: 15, borderRadius: 8, alignItems: "center" },
    saveButton: { backgroundColor: "#FF9800", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
    summaryContainer: { marginTop: 15, padding: 15, backgroundColor: "#f1f1f1", borderRadius: 8 },
    summaryText: { fontSize: 16, color: "#333", textAlign: "left" },
    boldText: { fontWeight: "bold" },
    buttonContainer: { marginBottom: 20 }, // ✅ Added to push buttons lower
});

export default UploadScreen;
