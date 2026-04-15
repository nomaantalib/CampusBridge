import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
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
import ActivityScreen from '../screens/main/ActivityScreen';
import LobbyMapScreen from '../screens/main/LobbyMapScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';

const Stack = createStackNavigator();

// Smooth slide-from-right for auth stack, and from-bottom for modals
const authTransition  = TransitionPresets.SlideFromRightIOS;
const modalTransition = TransitionPresets.ModalSlideFromBottomIOS;

export default function AppNavigator() {
    const { user, loading } = useAuth();
    const { theme, isDark } = useAppTheme();

    if (loading) {
        return (
            <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: theme?.colors?.bg || '#0F172A' }}>
                <ActivityIndicator size="large" color={theme?.colors?.primary || '#2563EB'} />
            </View>
        );
    }

    const commonHeaderOptions = {
        headerShown: true,
        headerStyle: { 
            backgroundColor: theme.colors.card,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 16 },
        headerBackTitleVisible: false,
    };

    return (
        <Stack.Navigator
            initialRouteName={user ? 'Home' : 'Login'}
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                style: { pointerEvents: 'auto' },
                presentation: 'card',
                cardStyle: { backgroundColor: theme.colors.bg },
                ...TransitionPresets.SlideFromRightIOS,
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
                            ...commonHeaderOptions,
                            title: 'Post a Task',
                            presentation: 'modal',
                            ...TransitionPresets.ModalSlideFromBottomIOS,
                        }}
                    />
                    <Stack.Screen
                        name="Bidding"
                        component={BiddingScreen}
                        options={{
                            ...commonHeaderOptions,
                            title: 'Task Details',
                        }}
                    />
                    <Stack.Screen
                        name="Tracking"
                        component={TrackingScreen}
                        options={{
                            ...commonHeaderOptions,
                            title: 'Live Tracking',
                        }}
                    />
                    <Stack.Screen
                        name="Wallet"
                        component={WalletScreen}
                        options={{
                            ...commonHeaderOptions,
                            title: 'My Wallet',
                        }}
                    />
                    <Stack.Screen
                        name="Activity"
                        component={ActivityScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Admin"
                        component={AdminScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="LobbyMap"
                        component={LobbyMapScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="EditProfile"
                        component={EditProfileScreen}
                        options={{ headerShown: false }}
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
                            ...commonHeaderOptions,
                            title: 'Reset Password',
                        }}
                    />
                    <Stack.Screen
                        name="ResetPassword"
                        component={ResetPasswordScreen}
                        options={{
                            ...commonHeaderOptions,
                            title: 'New Password',
                        }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}
