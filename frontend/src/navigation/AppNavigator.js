import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import HomeScreen from '../screens/main/HomeScreen';
import WalletScreen from '../screens/main/WalletScreen';
import AdminScreen from '../screens/main/AdminScreen';
import BiddingScreen from '../screens/task/BiddingScreen';
import CreateTaskScreen from '../screens/task/CreateTaskScreen';
import TrackingScreen from '../screens/task/TrackingScreen';

const Stack = createStackNavigator();

// Smooth slide-from-right for auth stack, and from-bottom for modals
const authTransition  = TransitionPresets.SlideFromRightIOS;
const modalTransition = TransitionPresets.ModalSlideFromBottomIOS;

export default function AppNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0F172A' }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <Stack.Navigator
            initialRouteName={user ? 'Home' : 'Login'}
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                style: { pointerEvents: 'auto' },
                presentation: 'card',
                cardStyle: { backgroundColor: '#0F172A' },
            }}
        >
            {user ? (
                // ── Authenticated stack ──────────────────────────────────────
                <>
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="CreateTask"
                        component={CreateTaskScreen}
                        options={{
                            headerShown: true,
                            title: 'Post a Task',
                            headerStyle: { backgroundColor: '#0F172A' },
                            headerTintColor: '#F8FAFC',
                            headerTitleStyle: { fontWeight: '700' },
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="Bidding"
                        component={BiddingScreen}
                        options={{
                            headerShown: true,
                            title: 'Task Details',
                            headerStyle: { backgroundColor: '#0F172A' },
                            headerTintColor: '#F8FAFC',
                            headerTitleStyle: { fontWeight: '700' },
                            ...authTransition,
                        }}
                    />
                    <Stack.Screen
                        name="Tracking"
                        component={TrackingScreen}
                        options={{
                            headerShown: true,
                            title: 'Live Tracking',
                            headerStyle: { backgroundColor: '#0F172A' },
                            headerTintColor: '#F8FAFC',
                            headerTitleStyle: { fontWeight: '700' },
                            ...authTransition,
                        }}
                    />
                    <Stack.Screen
                        name="Wallet"
                        component={WalletScreen}
                        options={{
                            headerShown: true,
                            title: 'My Wallet',
                            headerStyle: { backgroundColor: '#0F172A' },
                            headerTintColor: '#F8FAFC',
                            headerTitleStyle: { fontWeight: '700' },
                            ...authTransition,
                        }}
                    />
                    <Stack.Screen
                        name="Admin"
                        component={AdminScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                </>
            ) : (
                // ── Auth stack ───────────────────────────────────────────────
                <>
                    <Stack.Screen name="Login"    component={LoginScreen}   />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen
                        name="ForgotPassword"
                        component={ForgotPasswordScreen}
                        options={{
                            headerShown: true,
                            title: 'Reset Password',
                            headerStyle: { backgroundColor: '#0F172A' },
                            headerTintColor: '#F8FAFC',
                            headerTitleStyle: { fontWeight: '700' },
                        }}
                    />
                    <Stack.Screen
                        name="ResetPassword"
                        component={ResetPasswordScreen}
                        options={{
                            headerShown: true,
                            title: 'New Password',
                            headerStyle: { backgroundColor: '#0F172A' },
                            headerTintColor: '#F8FAFC',
                            headerTitleStyle: { fontWeight: '700' },
                        }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}
