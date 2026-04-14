import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export default function SimpleInput({ label, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, editable, hasError, placeholder }) {
  return (
    <View style={styles.group}>
      <Text style={[styles.label, hasError && styles.errorLabel]}>{label}</Text>
      <TextInput
        style={[styles.input, hasError && styles.errorInput]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'none'}
        editable={editable !== false}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        autoComplete={secureTextEntry ? "current-password" : "off"}
        textContentType={secureTextEntry ? "password" : "none"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: theme.spacing.md },
  label: { color: theme.colors.textDim, fontSize: 13, fontWeight: '700', marginBottom: 6, letterSpacing: 0.2 },
  errorLabel: { color: theme.colors.danger },
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  errorInput: { borderColor: theme.colors.danger },
});
