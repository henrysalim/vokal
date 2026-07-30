import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Bell, Settings, CircleHelp, Shield, LogOut, ChevronRight } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { MOCK_USER } from '../../data/mock';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../../context/auth';

export default function ProfilScreen() {
  const [isLansiaMode, setIsLansiaMode] = useState(false);
  const spin = useSharedValue(0);
  const { levelName } = useUser();
  const { signOut } = useAuth();
  const navigation = useNavigation<any>();

  React.useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 10000, easing: Easing.linear }), -1, false);
  }, []);

  const animatedSpin = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  const handleLogout = () => {
    Alert.alert(
      'Keluar Akun',
      'Apakah Anda yakin ingin keluar dari VOKAL?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: () => {
            signOut();
            if (navigation && navigation.navigate) {
              navigation.navigate('Login');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        
        {/* HEADER PROFIL */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center mb-8 mt-4">
          <View className="relative items-center justify-center mb-4">
            <Animated.View className="absolute w-[100px] h-[100px] rounded-full border-2 border-dashed border-mustard/40" style={animatedSpin} />
            <View className="w-[88px] h-[88px] bg-espresso rounded-full items-center justify-center border-4 border-cream shadow-sm">
              <Text className="text-3xl text-cream font-display">{MOCK_USER.avatar}</Text>
            </View>
            <View className="absolute bottom-0 right-0 bg-olive w-7 h-7 rounded-full items-center justify-center border-2 border-cream">
              <Shield color="#FFFFFF" size={14} />
            </View>
          </View>
          <Text className="text-2xl font-heading text-espresso">{MOCK_USER.name}</Text>
          <Text className="text-text-muted text-sm font-body">{levelName}</Text>
        </Animated.View>

        {/* MODE LANSIA TOGGLE */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TouchableOpacity activeOpacity={0.9} className="rounded-2xl overflow-hidden mb-6 shadow-sm" style={{ elevation: 1 }}>
            <LinearGradient colors={['#FFFFFF', '#F0EAE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="p-4 flex-row items-center justify-between border border-mustard/20">
              <View className="flex-1 pr-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="font-heading text-espresso text-base">Mode Lansia</Text>
                  <View className="bg-mustard px-2 py-0.5 rounded-full"><Text className="text-espresso text-[9px] font-bold">REKOMENDASI</Text></View>
                </View>
                <Text className="font-body text-text-muted text-[11px] leading-tight">Teks lebih besar, panduan suara aktif, dan layout lebih sederhana.</Text>
              </View>
              <Switch
                trackColor={{ false: '#3E2E2220', true: '#E8A33D' }}
                thumbColor={isLansiaMode ? '#FFFFFF' : '#F0EAE0'}
                onValueChange={() => setIsLansiaMode(!isLansiaMode)}
                value={isLansiaMode}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* MENU SETTINGS */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View className="bg-surface rounded-3xl overflow-hidden shadow-sm mb-6 border border-espresso/5" style={{ elevation: 1 }}>
            {[
              { icon: <User color="#3E2E22" size={20} />, title: 'Edit Profil' },
              { icon: <Bell color="#3E2E22" size={20} />, title: 'Notifikasi' },
              { icon: <Settings color="#3E2E22" size={20} />, title: 'Pengaturan Suara' },
            ].map((item, index) => (
              <TouchableOpacity activeOpacity={0.7} key={index} className={`flex-row items-center justify-between p-4 ${index !== 2 ? 'border-b border-espresso/5' : ''}`}>
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-cream items-center justify-center">
                    {item.icon}
                  </View>
                  <Text className="font-heading text-espresso text-sm">{item.title}</Text>
                </View>
                <ChevronRight color="#3E2E22" size={16} opacity={0.3} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ABOUT & LOGOUT */}
        <View className="gap-2 mb-6">
          <TouchableOpacity className="bg-[#FFFFFF] rounded-2xl p-4 flex-row items-center gap-3 border border-espresso/5">
            <CircleHelp color="#74822F" size={20} />
            <View className="flex-1">
              <Text className="font-heading text-espresso text-sm mb-0.5">Tentang VOKAL</Text>
              <Text className="font-body text-text-muted text-[10px]">Verifikasi Otomatis Kloning Audio Lokal v1.0</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            className="bg-warning/10 rounded-2xl p-4 flex-row items-center justify-center gap-2 border border-warning/20 mt-2"
          >
            <LogOut color="#7A2E28" size={18} />
            <Text className="font-heading text-warning text-sm">Keluar Akun</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
