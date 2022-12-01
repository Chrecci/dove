import React from 'react';
import { View, Text } from 'react-native';

function Payment({ navigation }) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
                onPress={() => navigation.navigate('Profile')}
                style={{ fontSize: 26, fontWeight: 'bold' }}>Go to Profile</Text>
        </View>
    );
}

export default Payment;