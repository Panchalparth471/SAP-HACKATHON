import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function PrescriptionScreen({ route }) {
    const { searchData } = route.params;
    const { name } = route.params;
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    console.log(searchData.image_url);

    // Save Medicine Function
    const saveMedicine = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("auth_token");
            console.log(token)
            if (!token) {
                Alert.alert("Error", "User not logged in.");
                setLoading(false);
                return;
            }

            const response = await fetch("http://192.168.189.54:5001/api/v1/save_medicine", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    medicine_details: {
                        brand_name: name,
                        generic_name: searchData.generic_name,
                        purpose: searchData.purpose,
                        active_ingredient: searchData.active_ingredient,
                        dosage_and_administration: searchData.dosage_and_administration,
                        image_url: searchData.image_url,
                        do_not_use: searchData.do_not_use,
                        when_using: searchData.when_using,
                        indications_and_usage:searchData.indications_and_usage
                        


                    }
                }),
            });

            const data = await response.json();
            setLoading(false);

            if (response.ok) {
                Alert.alert("Success", "Medicine saved successfully!");
            } else {
                Alert.alert("Error", data.message || "Failed to save medicine.");
            }
        } catch (error) {
            setLoading(false);
            Alert.alert("Error", "Something went wrong. Please try again.");
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'white', marginTop: 50 }}>
            
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 70,
                backgroundColor: '#0E64D2',
                alignItems: 'center',
                flexDirection: 'row',
                padding: 15,
                zIndex: 1000, 
            }}>
                <Icon onPress={() => navigation.goBack()} name="arrow-left" size={40} color="white" />
                <Text style={{ color: 'white', fontWeight: '500', fontSize: 25, marginLeft: 60 }}>Medicine Details</Text>
            </View>

            <ScrollView
                style={{ flex: 1, marginTop: 80, marginBottom: 80 }}  // Ensure space for button
                contentContainerStyle={{ paddingBottom: 100 }}  // Avoid button overlap
                showsVerticalScrollIndicator={false}
            >
                <View style={{
                    width: '98%',
                    borderColor: 'grey',
                    borderWidth: 0.3,
                    alignSelf: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 15,
                    borderRadius: 10,
                    gap: 20,
                    padding: 10
                }}>
                    <View style={{ height: 120, width: 120, borderRadius: 10, borderWidth: 0.3, borderColor: 'grey', padding: 10 }}>
                        <Image source={{ uri: searchData.image_url }} style={{ width: '100%', height: '100%', borderRadius: 10 }} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 5, gap: 5 }}>
                        <Text style={{ color: 'grey', fontWeight: '600' }}>Name:</Text>
                        <Text style={{ color: 'black', fontWeight: '600' }}>{name}</Text>

                        <Text style={{ color: 'grey', fontWeight: '600' }}>Category:</Text>
                        <Text style={{ color: 'black', fontWeight: '600' }}>{searchData.purpose}</Text>

                        <Text style={{ color: 'grey', fontWeight: '600' }}>Weight:</Text>
                        <Text style={{ color: 'black', fontWeight: '600' }}>{searchData.active_ingredient}</Text>
                    </View>
                </View>

                {/* Details Section */}
                <View style={{ padding: 15, marginTop: 10, marginLeft: 10 }}>
                    <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 5 }}>Side Effects:</Text>
                    <Text style={{ fontSize: 18, color: '#555' }}>{searchData.do_not_use}</Text>

                    <Text style={{ fontSize: 24, fontWeight: '600', marginTop: 15, marginBottom: 5 }}>Dosage:</Text>
                    <Text style={{ fontSize: 18, color: '#555' }}>{searchData.dosage_and_administration}</Text>

                    <Text style={{ fontSize: 24, fontWeight: '600', marginTop: 15, marginBottom: 5 }}>How to Use:</Text>
                    <Text style={{ fontSize: 18, color: '#555' }}>{searchData.when_using}</Text>

                    <Text style={{ fontSize: 24, fontWeight: '600', marginTop: 15, marginBottom: 5 }}>Indication and Usage:</Text>
                    <Text style={{ fontSize: 18, color: '#555' }}>{searchData.indications_and_usage}</Text>
                </View>
            </ScrollView>

            {/* Save Medicine Button - Fixed at Bottom */}
            <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'white',
                padding: 10,
                elevation: 10  // Shadow effect
            }}>
                <TouchableOpacity
                    onPress={saveMedicine}
                    disabled={loading}
                    style={{
                        backgroundColor: '#0E64D2',
                        padding: 15,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                        {loading ? "Saving..." : "Save Medicine"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
