import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ErrorBoundary } from "./error-boundary";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <RootLayoutNav />
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#121212" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="settings" 
        options={{ 
          presentation: "card",
          headerShown: true,
          headerTitle: "Настройки",
          headerStyle: { backgroundColor: "#121212" },
          headerTintColor: "#fff",
        }} 
      />
      <Stack.Screen 
        name="gallery" 
        options={{ 
          presentation: "card",
          headerShown: true,
          headerTitle: "Галерея",
          headerStyle: { backgroundColor: "#121212" },
          headerTintColor: "#fff",
        }} 
      />
    </Stack>
  );
}