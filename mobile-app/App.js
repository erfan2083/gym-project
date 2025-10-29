import React, { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import * as Splash from "expo-splash-screen";
import { useFonts } from "expo-font";

import SplashScreen from "./src/screens/Splash/SplashScreen";
import AppNavigator from "./src/navigation/AppNavigator";

Splash.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Vazirmatn_700Bold: require("./assets/fonts/Vazirmatn-Bold.ttf"),
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded) {
      Splash.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar hidden />
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <AppNavigator />
      )}
    </>
  );
}
