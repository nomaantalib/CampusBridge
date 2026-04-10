import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import BiddingScreen from '../screens/BiddingScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import TrackingScreen from '../screens/TrackingScreen';
import WalletScreen from '../screens/WalletScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'CampusBridge' }} />
            <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ title: 'Post a Task' }} />
            <Stack.Screen name="Bidding" component={BiddingScreen} options={{ title: 'Place a Bid' }} />
            <Stack.Screen name="Tracking" component={TrackingScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
        </Stack.Navigator>
    );
}

