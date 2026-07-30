import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Bell, ShieldCheck, ChevronRight, Lock } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import VokalMascot from '../../components/Mascot';
import { MOCK_CODEWORD, QUICK_ACTIONS, MOCK_USER } from '../../data/mock';
import { useUser } from '../../context/UserContext';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

export default function HomeScreen() {
  const { xp, level, levelName } = useUser();
  const xpNextLevel = 2000;
  const xpPct = Math.min(100, Math.round((xp / xpNextLevel) * 100));
  const xpWidth = useSharedValue(0);

  useEffect(() => {
    xpWidth.value = withTiming(xpPct, { duration: 1500, easing: Easing.inOut(Easing.cubic) });
  }, [xpPct]);

  const animatedXpStyle = useAnimatedStyle(() => {
    return { width: `${xpWidth.value}%` };
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        
        {/* HERO HEADER WITH MASCOT */}
        <View className="rounded-[32px] overflow-hidden bg-espresso px-5 pt-5 pb-5">
          <View className="absolute top-4 right-4 w-32 h-32 rounded-full opacity-10 bg-mustard" />
          <View className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10 bg-olive" />
          
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-surface/60 text-sm font-body">Selamat pagi 👋</Text>
              <Text className="text-white text-3xl font-heading leading-tight">Hi, {MOCK_USER.name.split(' ')[0]}!</Text>
              <View className="flex-row items-center mt-2 bg-mustard/20 rounded-full px-3 py-1 self-start">
                <Flame color="#E8A33D" size={14} />
                <Text className="text-mustard text-xs font-display ml-1">{MOCK_USER.streak} hari streak</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity className="w-10 h-10 rounded-full bg-surface/10 items-center justify-center relative">
                <Bell color="#FFFFFF" size={20} />
                <View className="absolute top-2 right-2 w-2 h-2 bg-terracotta rounded-full" />
              </TouchableOpacity>
              <View className="w-10 h-10 rounded-full bg-mustard items-center justify-center border-2 border-mustard">
                <Text className="text-espresso font-display text-sm">{MOCK_USER.avatar}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity className="items-center mt-2 mb-4" activeOpacity={0.8}>
            <VokalMascot size={140} />
          </TouchableOpacity>

          <View className="bg-surface/10 rounded-2xl p-4">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-mustard text-lg font-display">Lv.{level}</Text>
                <Text className="text-surface/80 text-xs font-body">{levelName}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-mustard font-display text-sm">{xp.toLocaleString()} </Text>
                <Text className="text-surface/50 text-xs font-body">/ {xpNextLevel.toLocaleString()} XP</Text>
              </View>
            </View>
            <View className="w-full bg-surface/20 rounded-full h-3 overflow-hidden">
              <Animated.View className="h-full bg-mustard rounded-full" style={animatedXpStyle} />
            </View>
            <Text className="text-surface/50 text-[10px] mt-2 font-body text-right">
              {Math.max(0, xpNextLevel - xp)} XP lagi ke level berikutnya
            </Text>
          </View>
        </View>

        {/* DAY STRIP */}
        <View className="mt-4 bg-surface rounded-2xl p-4 shadow-sm flex-row justify-between">
          {DAYS.map((day, i) => {
            const isToday = i === TODAY_IDX;
            return (
              <TouchableOpacity key={day} className="items-center">
                <Text className="text-[11px] font-body text-text-muted mb-1">{day}</Text>
                <View className={`w-10 h-10 rounded-full items-center justify-center ${isToday ? 'bg-mustard' : 'bg-espresso/5'}`}>
                  <Text className={`text-sm font-display ${isToday ? 'text-espresso' : 'text-espresso/60'}`}>
                    {new Date(Date.now() + (i - TODAY_IDX) * 86400000).getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CODEWORD HERO CARD */}
        <TouchableOpacity activeOpacity={0.9} className="mt-4 rounded-[24px] overflow-hidden shadow-sm" style={{ elevation: 2, shadowColor: '#3E2E22', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 }}>
          <View className="p-5 bg-white border border-espresso/5 rounded-[24px]">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-espresso/70 text-xs font-display uppercase tracking-widest mb-1">🔑 Codeword Hari Ini</Text>
                <Text className="text-espresso text-[28px] font-heading tracking-widest">{MOCK_CODEWORD.word}</Text>
                <View className="flex-row items-center gap-1 mt-1 bg-olive/10 px-2 py-1 rounded-full self-start border border-olive/20">
                  <ShieldCheck color="#74822F" size={10} />
                  <Text className="text-olive text-[8px] font-bold uppercase tracking-wider">Secured by Blockchain</Text>
                </View>
              </View>
              <View className="bg-espresso/5 rounded-2xl p-3 items-center">
                <Text className="text-espresso font-display text-2xl">{MOCK_CODEWORD.expiresInHours}</Text>
                <Text className="text-espresso/70 text-[10px] font-body">jam lagi</Text>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} className={`w-8 h-8 rounded-full items-center justify-center border-2 ${i < MOCK_CODEWORD.verifiedCount ? 'bg-olive border-olive' : 'bg-espresso/10 border-cream/50'} -ml-2 first:ml-0`}>
                  {i < MOCK_CODEWORD.verifiedCount ? (
                    <Text className="text-white text-xs font-display">V</Text>
                  ) : (
                    <Lock color="#6B5F52" size={12} opacity={0.5} />
                  )}
                </View>
              ))}
              <Text className="text-xs text-espresso/80 font-body ml-3">
                {MOCK_CODEWORD.verifiedCount}/{MOCK_CODEWORD.totalCount} terverifikasi
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="flex-1 bg-espresso/10 rounded-full h-2 overflow-hidden">
                <View className="h-full bg-olive rounded-full" style={{ width: `${(MOCK_CODEWORD.verifiedCount / MOCK_CODEWORD.totalCount) * 100}%` }} />
              </View>
              <View className="flex-row items-center gap-1">
                <ShieldCheck color="#74822F" size={16} />
                <Text className="text-olive text-xs font-display">{MOCK_CODEWORD.verifiedCount}/{MOCK_CODEWORD.totalCount}</Text>
              </View>
            </View>

            <TouchableOpacity className="mt-5 w-full bg-espresso py-4 rounded-2xl items-center flex-row justify-center gap-2">
              <Text className="text-white">📲</Text>
              <Text className="text-cream font-display text-sm">Bagikan ke Keluarga</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* QUICK ACTIONS */}
        <View className="mt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-espresso text-base font-heading">Aksi Cepat</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-mustard text-xs font-body mr-1">Lihat semua</Text>
              <ChevronRight color="#E8A33D" size={14} />
            </TouchableOpacity>
          </View>
          <View className="flex-row justify-between gap-3 flex-wrap">
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity key={action.id} className={`w-[48%] rounded-2xl p-4 ${action.bg}`}>
                <Text className="text-3xl mb-3">{action.icon}</Text>
                <Text className={`font-heading text-sm mb-1 ${action.textColor}`}>{action.title}</Text>
                <Text className={`font-body text-[11px] opacity-80 ${action.textColor}`}>{action.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AKADEMI VOKAL (MINI) */}
        <View className="mt-6 bg-surface rounded-[24px] p-5 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-mustard/20 items-center justify-center">
                <Text className="text-2xl">🎓</Text>
              </View>
              <View>
                <Text className="text-espresso font-heading text-base">Akademi VOKAL</Text>
                <Text className="text-espresso/60 font-body text-[11px]">Total XP kamu: <Text className="text-mustard font-bold">{xp.toLocaleString()}</Text></Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            activeOpacity={0.8}
            className="w-full bg-mustard py-3 rounded-xl items-center flex-row justify-center gap-2 border-b-4 border-[#d49232]"
            // NOTE: In a real app with navigation props, this would navigate to the Akademi tab
          >
            <Text className="text-espresso font-heading text-sm">Lanjutkan Perjalanan</Text>
            <ChevronRight color="#3E2E22" size={16} />
          </TouchableOpacity>
        </View>

        {/* SKOR EKSPOSUR SUARA */}
        <TouchableOpacity activeOpacity={0.9} className="mt-6 bg-olive/10 border border-olive/20 rounded-[24px] p-5 mb-6 flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-olive/20 items-center justify-center">
            <Text className="text-2xl">📊</Text>
          </View>
          <View className="flex-1">
            <Text className="text-espresso font-heading text-base mb-1">Skor Eksposur Suara</Text>
            <Text className="text-espresso/70 text-[11px] font-body leading-tight">Jejak suaramu di medsos terpantau sedikit. Sangat sulit untuk dikloning AI.</Text>
            <View className="bg-olive px-3 py-1 rounded-full self-start mt-2 shadow-sm">
              <Text className="text-white text-[9px] font-bold">RISIKO RENDAH</Text>
            </View>
          </View>
          <ChevronRight color="#74822F" size={20} opacity={0.5} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
