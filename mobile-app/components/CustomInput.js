import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { moderateScale } from "react-native-size-matters";

const CustomInput = ({
  placeholder,
  iconName,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = "default",
  textAlign = "right",
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}
    >
      {iconName && (
        <MaterialCommunityIcons
          name={iconName}
          size={moderateScale(20)}
          color="#ff7a00"
          style={styles.icon}
        />
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#777"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={[styles.input, { textAlign }]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(25),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    marginBottom: moderateScale(18),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 6,
    elevation: 5,
  },
  inputWrapperFocused: {
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginRight: moderateScale(10),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(15),
    color: "#000",
  },
});

export default CustomInput;
