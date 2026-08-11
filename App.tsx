import { DMSans_400Regular, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import { GraduationCap, Home, ScanSearch, User, Users } from "lucide-react-native";
import React, { useCallback } from "react";
import { ActivityIndicator, Text, TextProps, View } from "react-native";
import "./global.css";

import AkademiScreen from "./src/screens/Akademi/AkademiScreen";
import LoginScreen from "./src/screens/Auth/LoginScreen";
import RegisterScreen from "./src/screens/Auth/RegisterScreen";
import CekSuaraScreen from "./src/screens/CekSuara/CekSuaraScreen";
import HomeScreen from "./src/screens/Home/HomeScreen";
import KeluargaScreen from "./src/screens/Keluarga/KeluargaScreen";
import OnboardingScreen from "./src/screens/Onboarding/OnboardingScreen";
import ProfilScreen from "./src/screens/Profil/ProfilScreen";
import EditProfilScreen from "./src/screens/Profil/EditProfilScreen";

import AnalisisHubScreen from "./src/screens/Analisis/AnalisisHubScreen";
import CekEmailScreen from "./src/screens/Analisis/CekEmailScreen";
import CekPesanScreen from "./src/screens/Analisis/CekPesanScreen";
import KontakDaruratScreen from "./src/screens/Analisis/KontakDaruratScreen";
import CekNomorScreen from "./src/screens/Analisis/CekNomorScreen";

import { AuthProvider, useAuth } from "./context/auth";
import { ConfirmModalProvider } from "./src/components/ui/ConfirmModal";
import { LansiaProvider } from "./src/context/LansiaContext";
import { ScamProvider } from "./src/context/ScamContext";
import { UserProvider } from "./src/context/UserContext";

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AnalisisStack = createNativeStackNavigator();

interface AppTextProps extends TextProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

const fontScaleMap = {
  xs: { normal: "text-xs", lansia: "text-sm font-medium" },
  sm: { normal: "text-sm", lansia: "text-base font-semibold" },
  base: { normal: "text-base", lansia: "text-lg font-bold" },
  lg: { normal: "text-lg", lansia: "text-xl font-bold" },
  xl: { normal: "text-xl", lansia: "text-2xl font-bold" },
  "2xl": { normal: "text-2xl", lansia: "text-3xl font-extrabold" },
  "3xl": { normal: "text-3xl", lansia: "text-4xl font-extrabold" },
};

function AnalisisNavigator() {
  return (
    <AnalisisStack.Navigator screenOptions={{ headerShown: false }}>
      <AnalisisStack.Screen name="AnalisisHub" component={AnalisisHubScreen} />
      <AnalisisStack.Screen name="CekSuara" component={CekSuaraScreen} />
      <AnalisisStack.Screen name="CekEmail" component={CekEmailScreen} />
      <AnalisisStack.Screen name="CekPesan" component={CekPesanScreen} />
      <AnalisisStack.Screen name="CekNomor" component={CekNomorScreen} />
      <AnalisisStack.Screen name="KontakDarurat" component={KontakDaruratScreen} />
    </AnalisisStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#3E2E22",
          borderTopWidth: 0,
          elevation: 0,
          height: 90,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingBottom: 24,
          paddingTop: 12,
          shadowColor: "#3E2E22",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
        },
        tabBarActiveTintColor: "#E8A33D",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.4)",
        tabBarLabelStyle: {
          fontFamily: "DMSans-Regular",
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Beranda"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Akademi"
        component={AkademiScreen}
        options={{
          tabBarIcon: ({ color }) => <GraduationCap color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Analisis"
        component={AnalisisNavigator}
        options={{
          tabBarLabel: "Analisis",
          tabBarIcon: () => (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#E8A33D",
                borderWidth: 3,
                borderColor: "#F5C97A",
                alignItems: "center",
                justifyContent: "center",
                marginTop: -40,
                shadowColor: "#E8A33D",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.55,
                shadowRadius: 24,
              }}
            >
              <ScanSearch color="#3E2E22" size={24} />
            </View>
          ),
          tabBarLabelStyle: {
            fontFamily: "PlusJakartaSans-ExtraBold",
            fontSize: 9,
            color: "#E8A33D",
            marginTop: 4,
          },
        }}
      />
      <Tab.Screen
        name="Keluarga"
        component={KeluargaScreen}
        options={{
          tabBarIcon: ({ color }) => <Users color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={22} />,
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { user, isOnboarded, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F0EAE0",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#E8A33D" />
      </View>
    );
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isOnboarded ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Root" component={TabNavigator} />
        </>
      ) : !user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Root" component={TabNavigator} />
          <Stack.Screen name="EditProfil" component={EditProfilScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    "PlusJakartaSans-Bold": PlusJakartaSans_700Bold,
    "PlusJakartaSans-ExtraBold": PlusJakartaSans_800ExtraBold,
    "PlusJakartaSans-Regular": PlusJakartaSans_400Regular,
    "DMSans-Regular": DMSans_400Regular,
    "DMSans-Bold": DMSans_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <View
        style={{ flex: 1, backgroundColor: "#F0EAE0" }}
        onLayout={onLayoutRootView}
      >
        <NavigationContainer>
          <UserProvider>
            <LansiaProvider>
              <ScamProvider>
                <ConfirmModalProvider>
                  <MainNavigator />
                </ConfirmModalProvider>
              </ScamProvider>
            </LansiaProvider>
          </UserProvider>
        </NavigationContainer>
      </View>
    </AuthProvider>
  );
}
