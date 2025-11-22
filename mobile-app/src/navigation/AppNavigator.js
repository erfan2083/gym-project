// src/navigation/AppNavigator.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PhoneNumberScreen from "../screens/auth/PhoneNumberScreen";
import OtpScreen from "../screens/auth/OtpScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import ProfileFormScreen from "../screens/profile/ProfileFormScreen";
import HomeScreen from "../screens/home/HomeScreen";
import SignatureScreen from "../screens/profile/SignatureScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Login"
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Phone" component={PhoneNumberScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="ResetPas" component={ResetPasswordScreen} />
        <Stack.Screen name="ProfileForm" component={ProfileFormScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Signature" component={SignatureScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
