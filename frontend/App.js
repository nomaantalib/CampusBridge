import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Platform, LogBox } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  'Cannot record touch end without a touch start'
]);

const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('props.pointerEvents is deprecated') || args[0].includes('Cannot record touch end without a touch start'))) {
    return;
  }
  originalWarn(...args);
};
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('props.pointerEvents is deprecated') || args[0].includes('Cannot record touch end without a touch start'))) {
    return;
  }
  originalError(...args);
};

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  require('./src/styles/webScrollStyles.css');
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}

