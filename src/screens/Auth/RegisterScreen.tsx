import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, Users, ChevronDown } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/auth';
import { useConfirmModal } from '../../components/ui/ConfirmModal';
import VokalMascot from '../../components/Mascot';
import { AppText } from '../../components/ui/AppText';

export default function RegisterScreen() {
  const { signUpWithEmail, signUpWithGoogle, isLoading } = useAuth();
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [familyCode, setFamilyCode] = useState('');
  const [showFamilyField, setShowFamilyField] = useState(false);

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    return strength;
  };

  const strength = getPasswordStrength();
  const strengthLabels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
  const strengthColors = ['bg-espresso/15', 'bg-terracotta', 'bg-mustard', 'bg-olive', 'bg-olive'];

  const { showConfirm } = useConfirmModal();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Semua kolom wajib diisi.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Kata Sandi Terlalu Lemah', 'Kata sandi minimal harus 6 karakter.');
      return;
    }
    if (showFamilyField && familyCode && familyCode.length !== 8) {
      showConfirm({
        title: 'Kode Keluarga Tidak Valid',
        message: 'Kode keluarga harus terdiri dari 8 karakter alfanumerik.',
        confirmText: 'Mengerti',
        cancelText: 'Batal',
        variant: 'terracotta',
        iconType: 'warning',
      });
      return;
    }
    await signUpWithEmail(name, email, password, familyCode || undefined);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

        {/* HEADER AREA */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center mb-6">
          <VokalMascot size={100} />
          <AppText size="3xl" className="text-espresso font-heading text-center mt-2">Daftar Akun VOKAL</AppText>
          <AppText size="xs" className="text-text-muted font-body text-center mt-1 px-4">
            Bergabunglah dan lindungi keluarga Anda dari kejahatan kloning suara AI.
          </AppText>
        </Animated.View>

        {/* FORM CARD */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="bg-surface rounded-[28px] p-6 shadow-sm border border-espresso/5">

          {/* INFO BOX UNTUK JURI */}
          <View className="bg-terracotta/10 border border-terracotta/30 rounded-2xl p-4 mb-4">
            <AppText size="sm" className="text-terracotta font-heading mb-1">Informasi Penting Penjurian</AppText>
            <AppText size="xs" className="text-espresso font-body leading-relaxed">
              Karena aplikasi VOKAL saat ini masih dalam tahap pengembangan, proses pendaftaran atau masuk dengan Google akan menampilkan peringatan keamanan dari Google (layar tidak aman). Anda perlu menekan tombol Advanced (Lanjutan) lalu mengeklik tautan ke vokal (unsafe) untuk melanjutkan ke dalam aplikasi.
            </AppText>
          </View>

          {/* GOOGLE SIGN-UP BUTTON */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={signUpWithGoogle}
            className="w-full bg-cream border border-espresso/10 border-b-2 border-b-espresso/20 py-3.5 px-4 rounded-2xl flex-row items-center justify-center gap-3 mb-4"
          >
            <View className="w-6 h-6 rounded-full bg-mustard items-center justify-center">
              <AppText size="xs" className="font-display text-espresso">G</AppText>
            </View>
            <AppText size="sm" className="font-heading text-espresso">Daftar dengan Google</AppText>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View className="flex-row items-center gap-3 my-3">
            <View className="h-[1px] bg-espresso/10 flex-1" />
            <AppText size="xs" className="font-body text-text-muted uppercase tracking-wider">atau isi formulir</AppText>
            <View className="h-[1px] bg-espresso/10 flex-1" />
          </View>

          {/* FULL NAME INPUT */}
          <View className="mb-4">
            <AppText size="xs" className="font-heading text-espresso mb-1.5 uppercase tracking-wider">Nama Lengkap</AppText>
            <View className="flex-row items-center bg-cream/70 border border-espresso/10 rounded-2xl px-4 py-3.5">
              <User color="#3E2E22" size={18} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nama Lengkap Anda"
                placeholderTextColor="#A39686"
                autoCapitalize="words"
                className="flex-1 ml-3 font-body text-sm text-espresso p-0"
              />
            </View>
          </View>

          {/* EMAIL INPUT */}
          <View className="mb-4">
            <AppText size="xs" className="font-heading text-espresso mb-1.5 uppercase tracking-wider">Email</AppText>
            <View className="flex-row items-center bg-cream/70 border border-espresso/10 rounded-2xl px-4 py-3.5">
              <Mail color="#3E2E22" size={18} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="nama@email.com"
                placeholderTextColor="#A39686"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 ml-3 font-body text-sm text-espresso p-0"
              />
            </View>
          </View>

          {/* PASSWORD INPUT */}
          <View className="mb-2">
            <AppText size="xs" className="font-heading text-espresso mb-1.5 uppercase tracking-wider">Kata Sandi</AppText>
            <View className="flex-row items-center bg-cream/70 border border-espresso/10 rounded-2xl px-4 py-3.5">
              <Lock color="#3E2E22" size={18} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Minimal 8 karakter"
                placeholderTextColor="#A39686"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="flex-1 ml-3 font-body text-sm text-espresso p-0"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                {showPassword ? <EyeOff color="#3E2E22" size={18} /> : <Eye color="#3E2E22" size={18} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* PASSWORD STRENGTH INDICATOR */}
          {password.length > 0 && (
            <View className="flex-row items-center gap-2 mb-4 mt-1">
              <View className="flex-1 flex-row gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${i <= strength ? strengthColors[strength] : 'bg-espresso/10'}`}
                  />
                ))}
              </View>
              <AppText size="xs" className="font-heading text-espresso w-20 text-right">
                {strengthLabels[strength]}
              </AppText>
            </View>
          )}

          {/* CONFIRM PASSWORD INPUT */}
          <View className="mb-4">
            <AppText size="xs" className="font-heading text-espresso mb-1.5 uppercase tracking-wider">Konfirmasi Kata Sandi</AppText>
            <View className="flex-row items-center bg-cream/70 border border-espresso/10 rounded-2xl px-4 py-3.5">
              <Lock color="#3E2E22" size={18} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Ulangi kata sandi"
                placeholderTextColor="#A39686"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="flex-1 ml-3 font-body text-sm text-espresso p-0"
              />
            </View>
          </View>

          {/* FAMILY CODE — OPTIONAL */}
          <TouchableOpacity
            onPress={() => setShowFamilyField(!showFamilyField)}
            className="flex-row items-center gap-2 mb-3"
            activeOpacity={0.7}
          >
            <Users color="#74822F" size={16} />
            <AppText size="xs" className="font-heading text-olive flex-1">Bergabung ke Keluarga (Opsional)</AppText>
            <ChevronDown color="#74822F" size={16} style={{ transform: [{ rotate: showFamilyField ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>

          {showFamilyField && (
            <View className="bg-olive/8 border border-olive/20 rounded-2xl p-3.5 mb-4">
              <AppText size="xs" className="font-body text-text-muted leading-relaxed mb-3">
                Masukkan kode keluarga jika ada anggota keluarga yang sudah punya akun VOKAL. Kosongkan jika mendaftar sendiri.
              </AppText>
              <View className="flex-row items-center bg-cream border border-olive/20 rounded-2xl px-4 py-3.5">
                <Users color="#74822F" size={18} />
                <TextInput
                  value={familyCode}
                  onChangeText={text => setFamilyCode(text.toUpperCase())}
                  placeholder="Contoh: VOKAL2026"
                  placeholderTextColor="#A39686"
                  autoCapitalize="characters"
                  maxLength={16}
                  className="flex-1 ml-3 font-body text-sm text-espresso p-0 tracking-widest"
                />
              </View>
            </View>
          )}

          {/* PRIVACY CARD */}
          <View className="bg-olive/10 border border-olive/20 rounded-2xl p-3.5 flex-row items-start gap-2.5 mb-6">
            <ShieldCheck color="#74822F" size={20} className="mt-0.5" />
            <AppText size="xs" className="font-body text-text-muted leading-relaxed flex-1">
              Dengan mendaftar, Anda menyetujui bahwa data suara tidak pernah dikirim ke server luar. Semua verifikasi berjalan 100% lokal di HP Anda.
            </AppText>
          </View>

          {/* PRIMARY CTA BUTTON (Duolingo 3D style) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={isLoading}
            className="w-full bg-mustard py-4 rounded-2xl items-center border-b-4 border-[#d49232] shadow-sm mb-4"
          >
            {isLoading ? (
              <ActivityIndicator color="#3E2E22" />
            ) : (
              <AppText size="base" className="font-heading text-espresso">Daftar Sekarang</AppText>
            )}
          </TouchableOpacity>

          {/* SWITCH TO LOGIN */}
          <TouchableOpacity
            onPress={() => navigation?.navigate('Login')}
            className="items-center py-2"
            activeOpacity={0.7}
          >
            <AppText size="xs" className="font-body text-text-muted">
              Sudah punya akun? <AppText size="xs" className="font-heading text-espresso underline">Masuk di sini</AppText>
            </AppText>
          </TouchableOpacity>

        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}
