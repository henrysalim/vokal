import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  LogOut,
  Settings,
  Shield,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import { Image, ScrollView, Switch, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/auth";
import { useConfirmModal } from "../../components/ui/ConfirmModal";
import { useUser } from "../../context/UserContext";
import { useLansia } from "@/src/context/LansiaContext";
import { AppText } from "@/src/components/ui/AppText";

export default function ProfilScreen() {
  const spin = useSharedValue(0);
  const { levelName } = useUser();
  const { user, signOut } = useAuth();
  const { showConfirm } = useConfirmModal();
  const navigation = useNavigation<any>();

  const userName = user?.name || "Pengguna VOKAL";
  const avatarInitials = user?.avatarInitials || "VK";

  React.useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animatedSpin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const handleLogout = () => {
    showConfirm({
      title: "Keluar Akun",
      message: "Apakah Anda yakin ingin keluar dari VOKAL?",
      confirmText: "Ya, Keluar",
      cancelText: "Batal",
      variant: "terracotta",
      iconType: "warning",
      onConfirm: async () => {
        await signOut();
      },
    });
  };

  const avatarUrl = user?.avatarUrl;

  const { isLansiaMode, toggleLansiaMode } = useLansia();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER PROFIL */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          className="items-center mb-8 mt-4"
        >
          <View className="relative items-center justify-center mb-4">
            <Animated.View
              className="absolute w-[100px] h-[100px] rounded-full border-2 border-dashed border-mustard/40"
              style={animatedSpin}
            />
            <View className="w-[88px] h-[88px] bg-espresso rounded-full items-center justify-center border-4 border-cream shadow-sm overflow-hidden">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <AppText size="2xl" className="text-cream font-display">
                  {avatarInitials}
                </AppText>
              )}
            </View>
            <View className="absolute bottom-0 right-0 bg-olive w-7 h-7 rounded-full items-center justify-center border-2 border-cream">
              <Shield color="#FFFFFF" size={14} />
            </View>
          </View>
          <AppText size="xl" className="font-heading text-espresso">
            {userName}
          </AppText>
          <AppText size="sm" className="text-text-muted font-body">{levelName}</AppText>
        </Animated.View>

        {/* MODE LANSIA TOGGLE */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TouchableOpacity
            activeOpacity={0.9}
            className="rounded-2xl overflow-hidden mb-6 shadow-sm"
            style={{ elevation: 1 }}
          >
            <LinearGradient
              colors={["#FFFFFF", "#F0EAE0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4 flex-row items-center justify-between border border-mustard/20"
            >
              <View className="flex-1 pr-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <AppText size="base" className="font-heading text-espresso">
                    Mode Lansia
                  </AppText>
                </View>
                <AppText size="sm" className="font-body text-text-muted leading-tight">
                  Teks lebih besar, panduan suara aktif, dan layout lebih
                  sederhana.
                </AppText>
              </View>
              <Switch
                trackColor={{ false: "#3E2E2220", true: "#E8A33D" }}
                thumbColor={isLansiaMode ? "#FFFFFF" : "#F0EAE0"}
                onValueChange={toggleLansiaMode}
                value={isLansiaMode}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* MENU SETTINGS */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View
            className="bg-surface rounded-3xl overflow-hidden shadow-sm mb-6 border border-espresso/5"
            style={{ elevation: 1 }}
          >
            {[
              {
                icon: <User color="#3E2E22" size={20} />,
                title: "Edit Profil",
                onPress: () => navigation.navigate('EditProfil'),
              },
              { icon: <Bell color="#3E2E22" size={20} />, title: "Notifikasi" },
              {
                icon: <Settings color="#3E2E22" size={20} />,
                title: "Pengaturan Suara",
              },
            ].map((item, index) => (
              <TouchableOpacity
                activeOpacity={0.7}
                key={index}
                onPress={item.onPress}
                className={`flex-row items-center justify-between p-4 ${index !== 2 ? "border-b border-espresso/5" : ""}`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-cream items-center justify-center">
                    {item.icon}
                  </View>
                  <AppText size="sm" className="font-heading text-espresso">
                    {item.title}
                  </AppText>
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
              <AppText size="sm" className="font-heading text-espresso mb-0.5">
                Tentang VOKAL
              </AppText>
              <AppText size="xs" className="font-body text-text-muted">
                Verifikasi Otomatis Kloning Audio Lokal v1.0
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            className="bg-warning/10 rounded-2xl p-4 flex-row items-center justify-center gap-2 border border-warning/20 mt-2"
          >
            <LogOut color="#7A2E28" size={18} />
            <AppText size="sm" className="font-heading text-warning">
              Keluar Akun
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
