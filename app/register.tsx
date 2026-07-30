/**
 * RegisterScreen — VOKAL (Redesigned v2)
 *
 * Modern "hero header + card overlay" layout matching LoginScreen, with:
 * - Espresso-dark header (contrasting vs mustard login for visual variety)
 * - White card slides up with spring animation
 * - Staggered FadeInDown for all form fields
 * - Animated password strength bars (withSpring width)
 * - Spring press button feedback
 *
 * STYLING NOTE: StyleSheet (not NativeWind) — see CLAUDE.md §4 exception.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

// ─── Animated Input Field ─────────────────────────────────────────────────────

function AnimatedField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  delay = 0,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'words';
  delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = useSharedValue(0);

  useEffect(() => {
    borderColor.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);

  const wrapperStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value === 1 ? Colors.mustard : Colors.taupe,
    shadowOpacity: borderColor.value * 0.18,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(18)} style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.inputWrapper, wrapperStyle]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.taupe}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </Animated.View>
    </Animated.View>
  );
}

// ─── Animated Password Strength ───────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const label = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'][strength];
  const color = [Colors.taupe, Colors.warning, Colors.terracotta, Colors.olive, Colors.olive][strength];

  const bar1 = useSharedValue(0);
  const bar2 = useSharedValue(0);
  const bar3 = useSharedValue(0);
  const bar4 = useSharedValue(0);

  const bars = [bar1, bar2, bar3, bar4];

  useEffect(() => {
    bars.forEach((bar, i) => {
      bar.value = withSpring(strength > i ? 1 : 0, { damping: 16, stiffness: 200 });
    });
  }, [strength]);

  const barStyles = bars.map((bar) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: withTiming(0.3 + bar.value * 0.7, { duration: 200 }),
      backgroundColor: color,
    })),
  );

  if (!password) return null;

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.strengthRow}>
      <View style={styles.strengthBars}>
        {barStyles.map((barStyle, i) => (
          <Animated.View key={i} style={[styles.strengthBar, barStyle]} />
        ))}
      </View>
      {label ? <Text style={[styles.strengthLabel, { color }]}>{label}</Text> : null}
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

export default function RegisterScreen() {
  const { signUpWithEmail, signUpWithGoogle, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Header entrance
  const headerOpacity = useSharedValue(0);
  const headerTranslate = useSharedValue(-20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerTranslate.value = withDelay(80, withSpring(0, { damping: 14, stiffness: 100 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslate.value }],
  }));

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Semua kolom wajib diisi.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Kata sandi tidak cocok.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Kata sandi minimal 8 karakter.');
      return;
    }
    await signUpWithEmail(name, email, password);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.espresso} />

      {/* ── Espresso dark header ── */}
      <View style={styles.header}>
        {/* Decorative accents */}
        <View style={styles.hDecor1} />
        <View style={styles.hDecor2} />

        {/* Back + Title */}
        <Animated.View style={[styles.headerContent, headerStyle]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Kembali</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Buat Akun</Text>
          <Text style={styles.headerSub}>Bergabunglah dan lindungi keluarga Anda.</Text>
        </Animated.View>
      </View>

      {/* ── Form card ── */}
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
            {/* Google button */}
            <Animated.View entering={FadeInDown.delay(200).springify().damping(18)}>
              <Pressable
                style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.85 }]}
                onPress={signUpWithGoogle}
              >
                <View style={styles.googleG}>
                  <Text style={styles.googleGText}>G</Text>
                </View>
                <Text style={styles.googleLabel}>Daftar dengan Google</Text>
              </Pressable>
            </Animated.View>

            {/* Divider */}
            <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau isi formulir</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* Form fields */}
            <AnimatedField
              label="Nama Lengkap"
              value={name}
              onChangeText={setName}
              placeholder="Nama Anda"
              autoCapitalize="words"
              delay={280}
            />
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
              placeholder="Minimal 8 karakter"
              secureTextEntry
              delay={400}
            />

            {/* Password strength */}
            <PasswordStrength password={password} />

            <AnimatedField
              label="Konfirmasi Kata Sandi"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Ulangi kata sandi"
              secureTextEntry
              delay={460}
            />

            {/* Privacy note */}
            <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.privacyCard}>
              <Text style={styles.privacyIcon}>🔒</Text>
              <Text style={styles.privacyText}>
                Suara Anda tidak pernah dikirim ke server. Semua verifikasi berjalan langsung di perangkat Anda.
              </Text>
            </Animated.View>

            {/* CTA */}
            <SpringButton
              onPress={handleRegister}
              loading={isLoading}
              label="Daftar Sekarang"
              delay={540}
            />

            {/* Switch */}
            <Animated.View entering={FadeInDown.delay(580).springify()} style={styles.switchRow}>
              <Pressable onPress={() => router.replace('/login' as any)}>
                <Text style={styles.switchText}>
                  Sudah punya akun? <Text style={styles.switchBold}>Masuk</Text>
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const HEADER_H = Platform.OS === 'ios' ? 210 : 190;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.espresso },

  // ── Header
  header: {
    height: HEADER_H,
    backgroundColor: Colors.espresso,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  hDecor1: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.mustard,
    opacity: 0.12,
  },
  hDecor2: {
    position: 'absolute',
    bottom: 30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.terracotta,
    opacity: 0.15,
  },
  headerContent: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[7],
    gap: Spacing[1],
  },
  backBtn: { marginBottom: Spacing[3] },
  backText: { fontSize: Typography.sm, color: Colors.mustard, fontWeight: '600', opacity: 0.9 },
  headerTitle: {
    fontSize: Typography['3xl'],
    fontWeight: '800',
    color: Colors.surface,
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: Typography.base, color: Colors.taupe, opacity: 0.8 },

  // ── Card
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: Colors.espresso,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
  },
  cardScroll: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
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
  dividerText: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: '500' },

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

  // ── Strength
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginTop: -Spacing[3],
    marginBottom: Spacing[4],
  },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 5 },
  strengthBar: { flex: 1, height: 4, borderRadius: Radius.full },
  strengthLabel: { fontSize: Typography.xs, fontWeight: '700', width: 76, textAlign: 'right' },

  // ── Privacy
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.cream,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    marginBottom: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.taupe,
  },
  privacyIcon: { fontSize: 18, marginTop: 1 },
  privacyText: { flex: 1, fontSize: Typography.sm, color: Colors.textMuted, lineHeight: 20 },

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
  switchRow: { alignItems: 'center' },
  switchText: { fontSize: Typography.base, color: Colors.textMuted },
  switchBold: { fontWeight: '800', color: Colors.espresso },
});
