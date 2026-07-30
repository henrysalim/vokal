/**
 * OnboardingScreen — VOKAL
 *
 * Modern swipeable onboarding with:
 * - Full-bleed per-slide hero area with layered blob shapes
 * - Reanimated spring-in animations for content on slide change
 * - Stretching active dot indicator
 * - Spring press feedback on interactive CTA buttons
 *
 * STYLING NOTE: StyleSheet (not NativeWind) — see CLAUDE.md §4 exception.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

const { width: W } = Dimensions.get('window');

// ─── Slide data ───────────────────────────────────────────────────────────────

type Slide = {
  id: string;
  emoji: string;
  blobColor: string;
  blobAccent: string;
  title: string;
  subtitle: string;
  tag: string;
};

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🎙️',
    blobColor: Colors.mustard,
    blobAccent: Colors.mustardSoft,
    title: 'Suara Bisa Dipalsukan',
    subtitle: 'AI kini bisa meniru suara siapapun hanya dari beberapa detik audio — video TikTok, status WhatsApp, atau klip podcast.',
    tag: 'Masalah',
  },
  {
    id: '2',
    emoji: '🔐',
    blobColor: Colors.lavender,
    blobAccent: '#C8C0F8',
    title: '4 Lapisan Perlindungan',
    subtitle: 'Codeword Keluarga · Deteksi AI Lokal · Voice Exposure Score · Akademi VOKAL — semuanya berjalan tanpa mengirim audio ke server.',
    tag: 'Solusi',
  },
  {
    id: '3',
    emoji: '👨‍👩‍👧‍👦',
    blobColor: Colors.rose,
    blobAccent: '#E5BFB8',
    title: 'Dirancang Untuk Semua Usia',
    subtitle: 'Mode Lansia hadir dengan huruf besar, tombol tunggal, dan panduan suara — sehingga orang tua pun nyaman menggunakannya.',
    tag: 'Inklusif',
  },
  {
    id: '4',
    emoji: '🛡️',
    blobColor: Colors.mustardSoft,
    blobAccent: Colors.mustard,
    title: 'Mulai Jaga Keluarga Sekarang',
    subtitle: '"Bukan Suaramu, Bukan Uangmu" — VOKAL melindungi keluarga Indonesia dari penipuan kloning suara AI.',
    tag: 'VOKAL',
  },
];

// ─── Animated Dot ─────────────────────────────────────────────────────────────

function AnimatedDot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 28 : 8);

  useEffect(() => {
    width.value = withSpring(active ? 28 : 8, { damping: 16, stiffness: 180 });
  }, [active]);

  const style = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <Animated.View
      style={[
        styles.dot,
        style,
        { backgroundColor: active ? Colors.espresso : Colors.taupe },
      ]}
    />
  );
}

// ─── Slide Hero Illustration ──────────────────────────────────────────────────

function SlideHero({ slide, active }: { slide: Slide; active: boolean }) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 13, stiffness: 110 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.7, { duration: 200 });
    }
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.heroWrapper, animStyle]}>
      <View style={[styles.blobOuter, { backgroundColor: slide.blobAccent }]} />
      <View style={[styles.blobInner, { backgroundColor: slide.blobColor }]} />
      <Text style={styles.heroEmoji}>{slide.emoji}</Text>
    </Animated.View>
  );
}

// ─── Slide Content Text ───────────────────────────────────────────────────────

function SlideContent({ slide, active }: { slide: Slide; active: boolean }) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      opacity.value = withDelay(100, withTiming(1, { duration: 300 }));
      translateY.value = withDelay(100, withSpring(0, { damping: 16, stiffness: 100 }));
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(20, { duration: 150 });
    }
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.contentBlock, animStyle]}>
      <View style={[styles.tagPill, { backgroundColor: slide.blobColor }]}>
        <Text style={styles.tagText}>{slide.tag}</Text>
      </View>
      <Text style={styles.slideTitle}>{slide.title}</Text>
      <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
    </Animated.View>
  );
}

// ─── Animated CTA Button ──────────────────────────────────────────────────────

function AnimatedPressButton({ onPress, isLast }: { onPress: () => void; isLast: boolean }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.ctaWrapper, animStyle]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 20, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        onPress={onPress}
        style={styles.ctaBtn}
      >
        <Text style={styles.ctaText}>
          {isLast ? 'Mulai Sekarang  →' : 'Lanjut  →'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    router.replace('/login' as any);
  };

  const isLast = activeIndex === SLIDES.length - 1;
  const activeSlide = SLIDES[activeIndex];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Dynamic background tint */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: activeSlide.blobColor + '35' }]} />

      <SafeAreaView style={styles.safe}>
        {/* Top bar with Skip button */}
        <View style={styles.topBar}>
          {!isLast ? (
            <Pressable style={styles.skipBtn} onPress={handleFinish} hitSlop={16}>
              <Text style={styles.skipText}>Lewati</Text>
            </Pressable>
          ) : (
            <View style={{ height: 32 }} />
          )}
        </View>

        {/* Swipeable FlatList taking the full hero & content area */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          style={styles.flatList}
          renderItem={({ item, index }) => (
            <View style={styles.slideContainer}>
              {/* Hero top illustration */}
              <View style={styles.heroArea}>
                <SlideHero slide={item} active={index === activeIndex} />
              </View>

              {/* Content card */}
              <View style={styles.contentCard}>
                <SlideContent slide={item} active={index === activeIndex} />
              </View>
            </View>
          )}
        />

        {/* Bottom controls overlay (Dots + CTA + Links) */}
        <View style={styles.bottomBar}>
          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <AnimatedDot key={i} active={i === activeIndex} />
            ))}
          </View>

          {/* Primary CTA Button */}
          <AnimatedPressButton onPress={handleNext} isLast={isLast} />

          {/* Secondary Link */}
          {isLast ? (
            <Pressable
              style={styles.switchBtn}
              onPress={() => router.push('/login' as any)}
              hitSlop={12}
            >
              <Text style={styles.switchText}>
                Sudah punya akun? <Text style={styles.switchBold}>Masuk</Text>
              </Text>
            </Pressable>
          ) : (
            <View style={{ height: 22 }} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  safe: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: Spacing[5],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 12) + 4 : 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 20,
  },
  skipBtn: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    backgroundColor: Colors.surface + 'DD',
    borderRadius: Radius.full,
  },
  skipText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: '700',
  },

  // FlatList & Slide layout
  flatList: {
    flex: 1,
  },
  slideContainer: {
    width: W,
    flex: 1,
  },
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 220,
  },
  blobOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.5,
  },
  blobInner: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    shadowColor: Colors.espresso,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  heroEmoji: {
    fontSize: 88,
    lineHeight: 96,
  },

  // Content Card (Bottom half of each slide)
  contentCard: {
    height: 260,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    shadowColor: Colors.espresso,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 6,
  },
  contentBlock: {
    flex: 1,
  },
  tagPill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    marginBottom: Spacing[3],
  },
  tagText: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.espresso,
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.espresso,
    lineHeight: 32,
    marginBottom: Spacing[2],
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    lineHeight: 24,
  },

  // Fixed Bottom Bar Controls
  bottomBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[6],
    paddingBottom: Platform.OS === 'android' ? Spacing[6] : Spacing[4],
    gap: Spacing[4],
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dot: {
    height: 8,
    borderRadius: Radius.full,
  },

  // CTA Button
  ctaWrapper: {
    width: '100%',
  },
  ctaBtn: {
    backgroundColor: Colors.mustard,
    borderRadius: Radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: Colors.mustard,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaText: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.espresso,
    letterSpacing: 0.3,
  },

  // Switch link
  switchBtn: {
    alignItems: 'center',
    paddingVertical: Spacing[1],
  },
  switchText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  switchBold: {
    fontWeight: '800',
    color: Colors.espresso,
  },
});
