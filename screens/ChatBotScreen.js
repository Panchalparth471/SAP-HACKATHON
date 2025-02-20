import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const API_URL = "http://192.168.189.54:5001/api/v1/ask-ai";

export default function ChatBotScreen() {
    const navigation = useNavigation();
    const [messages, setMessages] = useState([
        { id: "1", text: "Hello! How can I assist you?", sender: "bot" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { id: Date.now().toString(), text: input, sender: "user" };
        setMessages((prev) => [userMessage, ...prev]); 
        setInput("");
        setLoading(true);

        try {
            const response = await axios.post(API_URL, { query: input }); //   Sending POST request with JSON body
            const botMessage = { id: Date.now().toString(), text: response.data, sender: "bot" };
            setMessages((prev) => [botMessage, ...prev]); // Append bot response
        } catch (error) {
            console.error("Chatbot API Error:", error);
            const errorMessage = { id: Date.now().toString(), text: "Error fetching response. Try again.", sender: "bot" };
            setMessages((prev) => [errorMessage, ...prev]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ width: "100%", height: "100%" }}>
            {/* Header */}
            <View style={styles.header}>
                <Icon onPress={() => navigation.goBack()} name="arrow-left" size={40} color="white" />
                <Text style={styles.headerText}>Chat Bot</Text>
            </View>

            {/* Chat Messages */}
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
                <FlatList
                    style={styles.chatList}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    inverted
                    renderItem={({ item }) => (
                        <View style={[styles.message, item.sender === "user" ? styles.userMessage : styles.botMessage]}>
                            <Text style={styles.messageText}>{item.text}</Text>
                        </View>
                    )}
                />

                {/* Chat Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Type a message..."
                        style={styles.input}
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={loading}>
                        {loading ? <ActivityIndicator size="small" color="white" /> : <Icon name="send" size={20} color="white" />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f2f2f2" },
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 70,
        backgroundColor: "#0E64D2",
        alignItems: "center",
        flexDirection: "row",
        padding: 15,
        zIndex: 1000,
        marginTop: 50
    },
    headerText: { color: "white", fontWeight: "500", fontSize: 25, marginLeft: 90 },
    chatList: { padding: 10, marginTop: "20%" },
    message: {
        padding: 12,
        marginVertical: 5,
        borderRadius: 10,
        maxWidth: "75%",
        alignSelf: "flex-start"
    },
    userMessage: { backgroundColor: "#0E64D2", alignSelf: "flex-end" },
    botMessage: { backgroundColor: "#0E64D2", alignSelf: "flex-start" },
    messageText: { color: "white", fontSize: 16 },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderColor: "#ddd"
    },
    input: { flex: 1, padding: 10, fontSize: 16 },
    sendButton: {
        backgroundColor: "#007bff",
        padding: 10,
        borderRadius: 25,
        marginLeft: 5
    }
});
