import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ShieldCheck, PhoneCall, HeartHandshake, ArrowRight, Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/auth';
import VokalMascot from '../../components/Mascot';
import { AppText } from '../../components/ui/AppText';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    badge: 'ANCAMAN AI',
    title: 'Suara Bisa Dipalsukan',
    desc: 'Penipu kini menggunakan AI kloningan suara untuk berpura-pura menjadi keluarga yang meminta uang darurat.',
    icon: <PhoneCall color="#C1592E" size={28} />,
    accentBg: 'bg-rose/40',
  },
  {
    id: '2',
    badge: 'TEKNOLOGI LOKAL',
    title: '4 Lapisan Perlindungan',
    desc: 'Codeword TOTP, Deteksi AI Lokal, Voice Exposure Score, dan Akademi VOKAL bekerja 100% tanpa internet.',
    icon: <Lock color="#74822F" size={28} />,
    accentBg: 'bg-olive/20',
  },
  {
    id: '3',
    badge: 'INKLUSIF',
    title: 'Dirancang Untuk Semua Usia',
    desc: 'Mode Lansia khusus dengan teks ekstra besar, panduan suara, dan tombol tunggal yang sangat ramah orang tua.',
    icon: <HeartHandshake color="#C1592E" size={28} />,
    accentBg: 'bg-lavender',
  },
  {
    id: '4',
    badge: 'VOKAL AMAN',
    title: 'Bukan Suaramu, Bukan Uangmu',
    desc: 'VOKAL siap menjaga seluruh anggota keluargamu dari kejahatan berbasis kloning suara AI di Indonesia.',
    icon: <ShieldCheck color="#74822F" size={28} />,
    accentBg: 'bg-mustard/30',
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const navigation = useNavigation<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    if (navigation && navigation.navigate) {
      navigation.navigate('Login');
    }
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-cream justify-between">
      
      {/* TOP BAR */}
      <View className="flex-row justify-between items-center px-6 pt-2 pb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-mustard items-center justify-center border border-espresso/20">
            <ShieldCheck color="#3E2E22" size={18} />
          </View>
          <AppText size="lg" className="font-heading text-espresso tracking-widest">VOKAL</AppText>
        </View>

        {!isLast ? (
          <TouchableOpacity
            onPress={handleFinish}
            activeOpacity={0.7}
            className="px-4 py-1.5 rounded-full bg-espresso/5 border border-espresso/10"
          >
            <AppText size="xs" className="font-heading text-espresso">Lewati</AppText>
          </TouchableOpacity>
        ) : (
          <View className="w-16" />
        )}
      </View>

      {/* MASCOT HERO AREA */}
      <View className="items-center justify-center my-4">
        <Animated.View entering={FadeInUp.delay(200).springify()} className="relative items-center justify-center">
          <View className="w-64 h-64 rounded-full bg-mustard/15 absolute" />
          <View className="w-48 h-48 rounded-full bg-surface border border-espresso/5 items-center justify-center shadow-sm">
            <VokalMascot size={150} />
          </View>
        </Animated.View>
      </View>

      {/* SWIPEABLE SLIDES CAROUSEL */}
      <View className="h-44">
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={{ width }} className="px-6 items-center justify-center">
              <View className="bg-surface rounded-[24px] p-6 shadow-sm border border-espresso/5 w-full items-center">
                <View className="flex-row items-center gap-2 mb-2 bg-mustard/20 px-3 py-1 rounded-full border border-mustard/30">
                  {item.icon}
                  <AppText size="xs" className="font-display text-espresso tracking-wider">{item.badge}</AppText>
                </View>
                <AppText size="xl" className="font-heading text-espresso text-center mb-2">{item.title}</AppText>
                <AppText size="xs" className="font-body text-text-muted text-center leading-relaxed px-2">
                  {item.desc}
                </AppText>
              </View>
            </View>
          )}
        />
      </View>

      {/* BOTTOM CONTROLS */}
      <View className="px-6 pb-6 pt-4">
        {/* DOTS INDICATOR */}
        <View className="flex-row justify-center items-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`h-2.5 rounded-full ${i === activeIndex ? 'w-8 bg-mustard border border-[#d49232]' : 'w-2.5 bg-espresso/15'}`}
            />
          ))}
        </View>

        {/* PRIMARY CTA BUTTON (Duolingo 3D style) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleNext}
          className="w-full bg-mustard py-4 rounded-2xl items-center border-b-4 border-[#d49232] shadow-sm flex-row justify-center gap-2 mb-3"
        >
          <AppText size="base" className="font-heading text-espresso">
            {isLast ? 'Mulai Sekarang' : 'Lanjut'}
          </AppText>
          <ArrowRight color="#3E2E22" size={18} />
        </TouchableOpacity>

        {/* SECONDARY LOGIN LINK */}
        <TouchableOpacity
          onPress={handleFinish}
          className="items-center py-2"
          activeOpacity={0.7}
        >
          <AppText size="xs" className="font-body text-text-muted">
            Sudah punya akun? <AppText size="xs" className="font-heading text-espresso underline">Masuk di sini</AppText>
          </AppText>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
