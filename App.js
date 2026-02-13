import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from './src/constants/theme';
import HomeScreen from './src/screens/HomeScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import MandiScreen from './src/screens/MandiScreen';
import AdvisoryScreen from './src/screens/AdvisoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
    // ‘‘</UV> ’’
    return (
        <NavigationContainer>
            <StatusBar style="dark" />
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        if (route.name === 'Home') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'Weather') {
                            iconName = focused ? 'cloud' : 'cloud-outline';
                        } else if (route.name === 'Mandi') {
                            iconName = focused ? 'cart' : 'cart-outline';
                        } else if (route.name === 'Advisory') {
                            iconName = focused ? 'bulb' : 'bulb-outline';
                        } else if (route.name === 'Settings') {
                            iconName = focused ? 'settings' : 'settings-outline';
                        }

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: COLORS.primary,
                    tabBarInactiveTintColor: 'gray',
                    headerShown: false,
                })}
            >
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Weather" component={WeatherScreen} />
                <Tab.Screen name="Mandi" component={MandiScreen} />
                <Tab.Screen name="Advisory" component={AdvisoryScreen} />
                <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
