/**
 * LoginScreen — VOKAL (Redesigned v2)
 *
 * Modern "hero header + card overlay" layout with Reanimated animations:
 * - Mustard hero header with VOKAL shield logo (spring-bounce on mount)
 * - White card slides up from below on mount
 * - Form fields stagger in with FadeInDown.delay(n)
 * - Button spring-presses on interaction
 * - Input focus ring animates with withTiming
 *
 * STYLING NOTE: StyleSheet (not NativeWind) — see CLAUDE.md §4 exception.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

// ─── VOKAL Shield Logo (pure Views) ──────────────────────────────────────────

function VokalShield({ size = 72 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size * 1.1,
        backgroundColor: Colors.espresso,
        borderRadius: size * 0.22,
        borderBottomLeftRadius: size * 0.5,
        borderBottomRightRadius: size * 0.5,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.espresso,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
      }}
    >
      {/* Sound wave bars */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {[7, 14, 20, 14, 7].map((h, i) => (
          <View
            key={i}
            style={{
              width: size * 0.055,
              height: h * (size / 72),
              backgroundColor: Colors.mustard,
              borderRadius: 4,
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Animated Input Field ─────────────────────────────────────────────────────

function AnimatedField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  delay = 0,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = useSharedValue(0);

  useEffect(() => {
    borderColor.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);

  const inputStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value === 1 ? Colors.mustard : Colors.taupe,
    shadowOpacity: borderColor.value * 0.18,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(18)} style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.inputWrapper, inputStyle]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.taupe}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </Animated.View>
    </Animated.View>
  );
}

// ─── Spring Press Button ──────────────────────────────────────────────────────

function SpringButton({
  onPress,
  loading,
  label,
  delay = 0,
}: {
  onPress: () => void;
  loading?: boolean;
  label: string;
  delay?: number;
}) {
  const scale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(18)}
      style={[styles.btnWrapper, btnStyle]}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 20, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 300 }); }}
        onPress={onPress}
        disabled={loading}
        style={[styles.primaryBtn, loading && { opacity: 0.65 }]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.espresso} />
        ) : (
          <Text style={styles.primaryBtnText}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Logo spring entrance
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 350 });
    logoScale.value = withDelay(80, withSpring(1, { damping: 12, stiffness: 110 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const handleEmailLogin = async () => {
    await signInWithEmail(email, password);
    if (email && password) router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.mustard} />

      {/* ── Mustard hero header ── */}
      <View style={styles.header}>
        {/* Decorative circles */}
        <View style={styles.hDecor1} />
        <View style={styles.hDecor2} />
        <View style={styles.hDecor3} />

        {/* Logo block */}
        <SafeAreaView>
          <Animated.View style={[styles.logoBlock, logoStyle]}>
            <VokalShield size={64} />
            <Text style={styles.wordmark}>VOKAL</Text>
            <Text style={styles.tagline}>Bukan Suaramu, Bukan Uangmu</Text>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── Form card slides up ── */}
      <Animated.View
        entering={FadeInUp.delay(150).springify().damping(18).stiffness(100)}
        style={styles.card}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.cardScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Heading */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text style={styles.cardHeading}>Selamat datang kembali 👋</Text>
              <Text style={styles.cardSub}>Masuk untuk melanjutkan perlindungan keluarga.</Text>
            </Animated.View>

            {/* Google button */}
            <Animated.View entering={FadeInDown.delay(260).springify().damping(18)}>
              <Pressable
                style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                onPress={signInWithGoogle}
              >
                <View style={styles.googleG}>
                  <Text style={styles.googleGText}>G</Text>
                </View>
                <Text style={styles.googleLabel}>Masuk dengan Google</Text>
              </Pressable>
            </Animated.View>

            {/* Divider */}
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* Fields */}
            <AnimatedField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              keyboardType="email-address"
              delay={340}
            />
            <AnimatedField
              label="Kata Sandi"
              value={password}
              onChangeText={setPassword}
              placeholder="Masukkan kata sandi"
              secureTextEntry
              delay={400}
            />

            {/* Forgot */}
            <Animated.View entering={FadeInDown.delay(440).springify()} style={styles.forgotRow}>
              <Pressable hitSlop={10}>
                <Text style={styles.forgotText}>Lupa kata sandi?</Text>
              </Pressable>
            </Animated.View>

            {/* CTA */}
            <SpringButton
              onPress={handleEmailLogin}
              loading={isLoading}
              label="Masuk"
              delay={480}
            />

            {/* Switch */}
            <Animated.View entering={FadeInDown.delay(520).springify()} style={styles.switchRow}>
              <Pressable onPress={() => router.push('/register' as any)}>
                <Text style={styles.switchText}>
                  Belum punya akun? <Text style={styles.switchBold}>Daftar</Text>
                </Text>
              </Pressable>
            </Animated.View>

            {/* Privacy */}
            <Animated.View entering={FadeInDown.delay(560).springify()} style={styles.privacyRow}>
              <Text style={styles.privacyText}>🔒 Suara Anda tidak pernah dikirim ke server manapun.</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const HEADER_H = Platform.OS === 'ios' ? 240 : 220;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.mustard },

  // ── Header
  header: {
    height: HEADER_H,
    backgroundColor: Colors.mustard,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  hDecor1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.mustardSoft,
    opacity: 0.6,
  },
  hDecor2: {
    position: 'absolute',
    top: 20,
    right: 60,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.espresso,
    opacity: 0.06,
  },
  hDecor3: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.terracotta,
    opacity: 0.12,
  },
  logoBlock: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[7],
    gap: Spacing[2],
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.espresso,
    letterSpacing: 5,
    marginTop: Spacing[2],
  },
  tagline: {
    fontSize: Typography.sm,
    color: Colors.espresso,
    opacity: 0.65,
    fontStyle: 'italic',
  },

  // ── Card
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: Colors.espresso,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  cardScroll: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  cardHeading: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.espresso,
    marginBottom: Spacing[1],
    letterSpacing: -0.4,
  },
  cardSub: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    marginBottom: Spacing[6],
  },

  // ── Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: Colors.taupe,
    borderRadius: Radius.full,
    paddingVertical: 15,
    paddingHorizontal: Spacing[5],
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  googleG: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.mustard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGText: { fontSize: 15, fontWeight: '900', color: Colors.espresso },
  googleLabel: { fontSize: Typography.base, fontWeight: '600', color: Colors.espresso },

  // ── Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.taupe, opacity: 0.5 },
  dividerText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: '500' },

  // ── Field
  field: { marginBottom: Spacing[4] },
  fieldLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.espresso,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    shadowColor: Colors.mustard,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 0,
  },
  input: {
    paddingVertical: 15,
    paddingHorizontal: Spacing[4],
    fontSize: Typography.base,
    color: Colors.espresso,
  },

  // ── Forgot
  forgotRow: { alignItems: 'flex-end', marginTop: -Spacing[2], marginBottom: Spacing[5] },
  forgotText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.terracotta },

  // ── Button
  btnWrapper: { marginBottom: Spacing[4] },
  primaryBtn: {
    backgroundColor: Colors.mustard,
    borderRadius: Radius.full,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: Colors.mustard,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: { fontSize: Typography.lg, fontWeight: '800', color: Colors.espresso, letterSpacing: 0.3 },

  // ── Switch
  switchRow: { alignItems: 'center', marginBottom: Spacing[4] },
  switchText: { fontSize: Typography.base, color: Colors.textMuted },
  switchBold: { fontWeight: '800', color: Colors.espresso },

  // ── Privacy
  privacyRow: { alignItems: 'center' },
  privacyText: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
