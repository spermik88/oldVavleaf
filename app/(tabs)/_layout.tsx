import React from "react";
import { Tabs } from "expo-router";
import { Leaf, Settings, Image } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarStyle: { 
          backgroundColor: Colors.background.dark,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Измерение",
          tabBarIcon: ({ color }) => <Leaf size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}