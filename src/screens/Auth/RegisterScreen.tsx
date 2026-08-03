import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/auth';
import { useConfirmModal } from '../../components/ui/ConfirmModal';
import VokalMascot from '../../components/Mascot';

export default function RegisterScreen() {
  const { signUpWithEmail, signUpWithGoogle, isLoading } = useAuth();
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
  const strengthColors = ['bg-espresso/15', 'bg-terracotta', 'bg-mustard', 'bg-olive', 'bg-olive'];

  const { showConfirm } = useConfirmModal();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showConfirm({
        title: 'Formulir Belum Lengkap',
        message: 'Semua kolom wajib diisi.',
        confirmText: 'Mengerti',
        cancelText: '',
        variant: 'mustard',
        iconType: 'warning',
      });
      return;
    }
    if (password !== confirmPassword) {
      showConfirm({
        title: 'Kata Sandi Tidak Cocok',
        message: 'Pastikan Konfirmasi Kata Sandi sama dengan Kata Sandi Anda.',
        confirmText: 'Coba Lagi',
        cancelText: '',
        variant: 'terracotta',
        iconType: 'danger',
      });
      return;
    }
    if (password.length < 8) {
      showConfirm({
        title: 'Kata Sandi Terlalu Pendek',
        message: 'Kata sandi minimal harus terdiri dari 8 karakter.',
        confirmText: 'Mengerti',
        cancelText: '',
        variant: 'mustard',
        iconType: 'warning',
      });
      return;
    }
    await signUpWithEmail(name, email, password);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        
        {/* BACK BUTTON */}
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-espresso/5 border border-espresso/10 items-center justify-center mb-2"
        >
          <ChevronLeft color="#3E2E22" size={24} />
        </TouchableOpacity>

        {/* HEADER AREA */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center mb-6">
          <VokalMascot size={100} />
          <Text className="text-espresso font-heading text-3xl text-center mt-2">Daftar Akun VOKAL</Text>
          <Text className="text-text-muted text-xs font-body text-center mt-1 px-4">
            Bergabunglah dan lindungi keluarga Anda dari kejahatan kloning suara AI.
          </Text>
        </Animated.View>

        {/* FORM CARD */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="bg-surface rounded-[28px] p-6 shadow-sm border border-espresso/5">
          
          {/* GOOGLE SIGN-UP BUTTON */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={signUpWithGoogle}
            className="w-full bg-cream border border-espresso/10 border-b-2 border-b-espresso/20 py-3.5 px-4 rounded-2xl flex-row items-center justify-center gap-3 mb-4"
          >
            <View className="w-6 h-6 rounded-full bg-mustard items-center justify-center">
              <Text className="font-display text-xs text-espresso">G</Text>
            </View>
            <Text className="font-heading text-espresso text-sm">Daftar dengan Google</Text>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View className="flex-row items-center gap-3 my-3">
            <View className="h-[1px] bg-espresso/10 flex-1" />
            <Text className="font-body text-text-muted text-[11px] uppercase tracking-wider">atau isi formulir</Text>
            <View className="h-[1px] bg-espresso/10 flex-1" />
          </View>

          {/* FULL NAME INPUT */}
          <View className="mb-4">
            <Text className="font-heading text-espresso text-xs mb-1.5 uppercase tracking-wider">Nama Lengkap</Text>
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
            <Text className="font-heading text-espresso text-xs mb-1.5 uppercase tracking-wider">Email</Text>
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
            <Text className="font-heading text-espresso text-xs mb-1.5 uppercase tracking-wider">Kata Sandi</Text>
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
              <Text className="font-heading text-[11px] text-espresso w-20 text-right">
                {strengthLabels[strength]}
              </Text>
            </View>
          )}

          {/* CONFIRM PASSWORD INPUT */}
          <View className="mb-4">
            <Text className="font-heading text-espresso text-xs mb-1.5 uppercase tracking-wider">Konfirmasi Kata Sandi</Text>
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

          {/* PRIVACY CARD */}
          <View className="bg-olive/10 border border-olive/20 rounded-2xl p-3.5 flex-row items-start gap-2.5 mb-6">
            <ShieldCheck color="#74822F" size={20} className="mt-0.5" />
            <Text className="font-body text-text-muted text-[11px] leading-relaxed flex-1">
              Dengan mendaftar, Anda menyetujui bahwa data suara tidak pernah dikirim ke server luar. Semua verifikasi berjalan 100% lokal di HP Anda.
            </Text>
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
              <Text className="font-heading text-espresso text-base">Daftar Sekarang</Text>
            )}
          </TouchableOpacity>

          {/* SWITCH TO LOGIN */}
          <TouchableOpacity
            onPress={() => navigation?.navigate('Login')}
            className="items-center py-2"
            activeOpacity={0.7}
          >
            <Text className="font-body text-text-muted text-xs">
              Sudah punya akun? <Text className="font-heading text-espresso underline">Masuk di sini</Text>
            </Text>
          </TouchableOpacity>

        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}
