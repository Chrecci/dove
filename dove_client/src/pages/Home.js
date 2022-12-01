import React from 'react';
import { View, Text } from 'react-native';

function Home({ navigation }) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
                onPress={() => navigation.navigate('Payment')}
                style={{ fontSize: 26, fontWeight: 'bold' }}>Go to Payment</Text>
        </View>
    );
}

export default Home;