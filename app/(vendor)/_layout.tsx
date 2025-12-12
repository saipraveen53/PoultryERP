import { Stack } from "expo-router";
import React from "react";

export default function VendorLayout() {
  return (
    <Stack
      // hide headers for all screens in this stack so layout doesn't show UI chrome
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Orders" />
      <Stack.Screen name="Report" />
      <Stack.Screen name="History" />
    </Stack>
  );
}