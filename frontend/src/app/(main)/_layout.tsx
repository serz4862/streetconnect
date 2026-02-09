import React from 'react';
import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="dog/[id]" />
      <Stack.Screen name="add-dog" />
      <Stack.Screen name="scan-qr" />
      <Stack.Screen name="report/lost" />
      <Stack.Screen name="report/found" />
      <Stack.Screen name="report/issue" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="chat/[id]" />
    </Stack>
  );
}
