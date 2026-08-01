import "./global.css";
import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Home, GraduationCap, Users, User } from 'lucide-react-native';
import HomeScreen from './src/screens/Home/HomeScreen';
import AkademiScreen from './src/screens/Akademi/AkademiScreen';
import CekSuaraScreen from './src/screens/CekSuara/CekSuaraScreen';
import KeluargaScreen from './src/screens/Keluarga/KeluargaScreen';
import ProfilScreen from './src/screens/Profil/ProfilScreen';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#3E2E22',
          borderTopWidth: 0,
          elevation: 0,
          height: 90,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingBottom: 24,
          paddingTop: 12,
          shadowColor: '#3E2E22',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
        },
        tabBarActiveTintColor: '#E8A33D',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
        tabBarLabelStyle: {
          fontFamily: 'DMSans-Regular',
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Beranda" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={22} />,
        }}
      />
      <Tab.Screen 
        name="Akademi" 
        component={AkademiScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={22} />,
        }}
      />
      <Tab.Screen 
        name="Fab" 
        component={CekSuaraScreen} 
        options={{
          tabBarLabel: 'Cek Suara',
          tabBarIcon: () => (
            <View 
              style={{
                width: 60, height: 60, borderRadius: 30, 
                backgroundColor: '#E8A33D', 
                borderWidth: 3, borderColor: '#F5C97A',
                alignItems: 'center', justifyContent: 'center',
                marginTop: -40,
                shadowColor: '#E8A33D', shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.55, shadowRadius: 24,
              }}
            >
              <Text style={{ fontSize: 24 }}>🎙️</Text>
            </View>
          ),
          tabBarLabelStyle: {
            fontFamily: 'PlusJakartaSans-ExtraBold',
            fontSize: 9,
            color: '#E8A33D',
            marginTop: 4,
          }
        }}
      />
      <Tab.Screen 
        name="Keluarga" 
        component={KeluargaScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={22} />,
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfilScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={22} />,
        }}
      />
    </Tab.Navigator>
  );
}

import { UserProvider } from './src/context/UserContext';
import { ScamProvider } from './src/context/ScamContext';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-Bold': DMSans_700Bold,
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
    <UserProvider>
      <ScamProvider>
        <View style={{ flex: 1, backgroundColor: '#F0EAE0' }} onLayout={onLayoutRootView}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Root" component={TabNavigator} />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </ScamProvider>
    </UserProvider>
  );
}
