// src/navigation/AppNavigator.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ایمپورت صفحات موجود
import PhoneNumberScreen from "../screens/auth/PhoneNumberScreen";
import OtpScreen from "../screens/auth/OtpScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import ProfileFormScreen from "../screens/profile/ProfileFormScreen";
import HomeScreen from "../screens/home/HomeScreen";
import SignatureScreen from "../screens/profile/SignatureScreen";
import ProfileEditScreen from "../screens/profile/ProfileEditScreen";
import ReviewsScreen from "../screens/profile/ReviewsScreen";

// ✅ 1. ایمپورت صفحه جدید (آدرس فایل را بر اساس ساختار پروژه‌تان چک کنید)
// فرض بر این است که فایل در مسیر src/components/home/TrainerPublicProfile.js است
import TrainerPublicProfile from "../components/home/TrainerPublicProfile";

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
        
        <Stack.Screen
          name="ProfileEdit"
          component={ProfileEditScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen
          name="ReviewsScreen"
          component={ReviewsScreen}
          options={{ headerShown: false }}
        />

        {/* ✅ 2. اضافه کردن صفحه پروفایل عمومی مربی به استک */}
        {/* نام (name) باید دقیقاً همانی باشد که در navigation.navigate استفاده کردید */}
        <Stack.Screen
          name="TrainerPublicProfile"
          component={TrainerPublicProfile}
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}