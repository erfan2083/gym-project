import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

export default function CustomInput({ value, onChangeText, placeholder, secureTextEntry }) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
});
