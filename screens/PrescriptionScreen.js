import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function PrescriptionScreen({ route }) {
    const { searchData } = route.params; // ✅ API response
    const { name } = route.params;
    const navigation = useNavigation();
    console.log(searchData.image_url);

    return (
        <View style={{ flex: 1, backgroundColor: 'white',marginTop:50 }}>
            
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
                style={{ flex: 1, marginTop: 80 }} 
                contentContainerStyle={{ paddingBottom: 20 }}
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
        </View>
    );
}
