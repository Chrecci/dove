import React from 'react';
import { View, Text } from 'react-native';

function Profile({ navigation }) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
                onPress={() => navigation.navigate('Home')}
                style={{ fontSize: 26, fontWeight: 'bold' }}>Go to Home</Text>
        </View>
    );
}

export default Profile;