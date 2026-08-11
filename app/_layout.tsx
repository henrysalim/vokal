
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/auth';

function RootLayoutNav() {
  const { user, isOnboarded } = useAuth();

  return (
    <>
      <Stack>
        {/* Auth / onboarding flow — no header chrome */}
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="register" options={{ headerShown: false, animation: 'slide_from_right' }} />

        {/* Main app */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Misc */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>

      {/*
       * Declarative redirect — evaluated AFTER the Stack has mounted.
       * Expo Router processes <Redirect> as part of the render tree, so
       * the Root Layout is already mounted when the navigation fires.
       */}
      {!isOnboarded && <Redirect href={'/onboarding' as any} />}
      {isOnboarded && !user && <Redirect href={'/login' as any} />}

      <StatusBar style="dark" backgroundColor="transparent" translucent />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
