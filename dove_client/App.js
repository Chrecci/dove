/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import 'react-native-gesture-handler';

import
 Ionicons
from 'react-native-vector-icons/Ionicons';
 
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
 
import Home from './src/pages/Home';
import Payment from './src/pages/Payment';
import Profile from './src/pages/Profile';
 
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

//Screen names
const homeName = "Home";
const paymentName = "Payment";
const profileName = "Profile";

function App() {
  return (
  <NavigationContainer>
      <Tab.Navigator
        initialRouteName={homeName}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let rn = route.name;

            if (rn === homeName) {
              iconName = focused ? 'ios-home' : 'ios-home-outline';

            } else if (rn === paymentName) {
              iconName = focused ? 'cash' : 'cash-outline';

            } else if (rn === profileName) {
              iconName = focused ? 'ios-person-circle' : 'ios-person-circle-outline';
            }

            // You can return any component that you like here!
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'grey',
          tabBarStyle: {
            paddingVertical: Platform.OS === 'ios' ? 10 : 0,
            height: 90,
            backgroundColor: "white"
          }
        })
      }
        >

        <Tab.Screen name={homeName} component={Home} />
        <Tab.Screen name={paymentName} component={Payment} />
        <Tab.Screen name={profileName} component={Profile} />

      </Tab.Navigator>
    </NavigationContainer>
  )
}

export default App;
