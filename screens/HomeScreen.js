import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const HomeScreen = ({ navigation }) => {
    const [data, setData] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);


    useEffect(() => {
        const fetchSuggestions = async () => {
            if (data.length < 2) {
                setSuggestions([]); 
                return;
            }
            setIsFetchingSuggestions(true);

            try {
                const response = await axios.get(`http://192.168.189.54:5000/medicine_suggestions?query=${data}`);
                setSuggestions(response.data);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            } finally {
                setIsFetchingSuggestions(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(timer);
    }, [data]);

    const handleSearch = async () => {
        if (!data) return;
        setIsLoading(true);

        try {
            console.log("Searching for:", data);
            const response = await axios.get(`http://192.168.189.54:5000/medicine/${data}`);
            navigation.navigate('prescriptionDetails', { searchData: response.data, name: data });
        } catch (error) {
            console.error("API Fetch Error:", error);
        } finally {
            setIsLoading(false); 
        }
    };

    const handleSuggestionPress = (suggestion) => {
        setData(suggestion);
        setSuggestions([]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
  
            <View style={{
                height: 70, backgroundColor: '#0E64D2', marginTop: 50,
                alignItems: 'center', flexDirection: 'row', padding: 15, justifyContent: 'space-between'
            }}>
                <TextInput
                    placeholderTextColor='white'
                    placeholder="Search for a medicine..."
                    value={data}
                    onChangeText={setData}
                    style={{ color: 'white', width: '80%', fontSize: 20, fontWeight: '500', borderWidth: 0 }}
                />
                <TouchableOpacity onPress={handleSearch}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Icon name="search" size={30} color="white" />
                    )}
                </TouchableOpacity>
            </View>

        
            {suggestions.length > 0 && (
                <View style={{ backgroundColor: 'white', borderRadius: 5, elevation: 5, marginTop: 5 }}>
                    {isFetchingSuggestions ? (
                        <ActivityIndicator size="small" color="#0E64D2" style={{ margin: 10 }} />
                    ) : (
                        <FlatList
                            data={suggestions}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleSuggestionPress(item)}>
                                    <Text style={{ padding: 10, fontSize: 18, color: 'black' }}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            )}

           
            <View style={{
                height: 70, backgroundColor: '#0E64D2',
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15
            }}>
                <Icon name="home" size={40} color="white" />
                <Icon name="camera" size={30} color="white" />
                <Icon name="wechat" size={30} color="white" />
                <Icon name="user" onPress={() => navigation.navigate('Profile')} size={30} color="white" />
            </View>
        </View>
    );
};

export default HomeScreen;
