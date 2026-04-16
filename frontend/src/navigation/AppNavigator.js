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
import InfoScreen from '../screens/main/InfoScreen';
import SupportScreen from '../screens/main/SupportScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { user, loading } = useAuth();
    const { theme, isDark } = useAppTheme();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bg }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            initialRouteName={user ? 'Home' : 'Login'}
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: theme.colors.bg },
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
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="Bidding"
                        component={BiddingScreen}
                        options={{ headerShown: true, title: 'Task Details' }}
                    />
                    <Stack.Screen
                        name="Tracking"
                        component={TrackingScreen}
                        options={{ headerShown: true, title: 'Live Tracking' }}
                    />
                    <Stack.Screen
                        name="Wallet"
                        component={WalletScreen}
                        options={{ headerShown: true, title: 'My Wallet' }}
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
                    <Stack.Screen
                        name="Info"
                        component={InfoScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Support"
                        component={SupportScreen}
                        options={{ headerShown: false }}
                    />
                </>
            ) : (
                // ── Auth stack ───────────────────────────────────────────────
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen
                        name="ForgotPassword"
                        component={ForgotPasswordScreen}
                        options={{
                            headerShown: true,
                            title: 'Reset Password',
                        }}
                    />
                    <Stack.Screen
                        name="ResetPassword"
                        component={ResetPasswordScreen}
                        options={{
                            headerShown: true,
                            title: 'New Password',
                        }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}
