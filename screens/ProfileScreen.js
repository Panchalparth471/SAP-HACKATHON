import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function ProfileScreen({ route }) {
    const { name, email, contact } = route.params || {}; // Get data from navigation

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Profile</Text>
            </View>
            <View style={styles.profileContainer}>
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.profileImage} />
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{name || 'N/A'}</Text>
                <Text style={styles.label}>Contact</Text>
                <Text style={styles.value}>{contact || 'N/A'}</Text>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{email || 'N/A'}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { backgroundColor: '#007AFF', padding: 20, alignItems: 'center' },
    headerText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    profileContainer: { alignItems: 'center', marginTop: 20 },
    profileImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
    label: { fontSize: 16, fontWeight: 'bold', color: 'gray', marginTop: 10 },
    value: { fontSize: 18, fontWeight: '600', color: '#333' },
});
