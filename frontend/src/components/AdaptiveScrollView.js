import React from 'react';
import { 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform, 
    StyleSheet, 
    View 
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

/**
 * A standard wrapper for all screens to ensure:
 * 1. Consistent Scrollbar behavior (persistent on mobile, styled on web)
 * 2. Responsive padding and alignment
 * 3. Correct Keyboard handling
 * 4. Theme awareness
 */
const AdaptiveScrollView = ({ 
    children, 
    contentContainerStyle, 
    keyboardShouldPersistTaps = 'handled',
    ...props 
}) => {
    const { theme } = useAppTheme();
    const Container = Platform.OS === 'web' ? View : KeyboardAvoidingView;

    return (
        <Container 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={[styles.container, { backgroundColor: theme.colors.bg }]}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.content, contentContainerStyle]}
                keyboardShouldPersistTaps={keyboardShouldPersistTaps}
                keyboardDismissMode="on-drag"
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={true}
                {...props}
            >
                {children}
            </ScrollView>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: '5%',
        paddingBottom: 40,
    }
});

export default AdaptiveScrollView;
