import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

export default function SimpleInput({ 
  label, 
  value, 
  onChangeText, 
  secureTextEntry, 
  keyboardType, 
  autoCapitalize, 
  editable, 
  hasError, 
  placeholder,
  showPasswordToggle 
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { theme, isDark } = useAppTheme();

  return (
    <View style={[styles.group, { marginBottom: theme.spacing.md }]}>
      <Text style={[
        styles.label, 
        { color: theme.colors.textDim },
        hasError && { color: theme.colors.danger }
      ]}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input, 
            { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            },
            hasError && { borderColor: theme.colors.danger }, 
            showPasswordToggle && { paddingRight: 50 }
          ]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'none'}
          editable={editable !== false}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          autoComplete={secureTextEntry ? "current-password" : "off"}
          textContentType={secureTextEntry ? "password" : "none"}
        />
        {showPasswordToggle && secureTextEntry && (
          <TouchableOpacity 
            style={styles.toggle} 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Text style={styles.toggleText}>{isPasswordVisible ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, letterSpacing: 0.2 },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    borderWidth: 1.5,
  },
  toggle: {
    position: 'absolute',
    right: 5,
    height: '100%',
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 20,
    opacity: 0.8,
  }
});
