import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/auth';
import VokalMascot from '../../components/Mascot';
import { AppText } from '../../components/ui/AppText';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, isLoading } = useAuth();
  const navigation = useNavigation<any>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async () => {
    await signInWithEmail(email, password);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* HEADER HERO CARD */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="bg-espresso rounded-[32px] p-6 mb-6 overflow-hidden relative shadow-md">
          <View className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 bg-mustard" />
          <View className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10 bg-olive" />
          
          <View className="items-center my-2">
            <VokalMascot size={110} />
            <AppText size="3xl" className="text-white font-heading text-center mt-3">Masuk ke VOKAL</AppText>
            <AppText size="xs" className="text-surface/60 font-body text-center mt-1">"Bukan Suaramu, Bukan Uangmu"</AppText>
          </View>
        </Animated.View>

        {/* FORM CARD */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="bg-surface rounded-[28px] p-6 shadow-sm border border-espresso/5">
          
          {/* GOOGLE SIGN-IN BUTTON */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={signInWithGoogle}
            className="w-full bg-cream border border-espresso/10 border-b-2 border-b-espresso/20 py-3.5 px-4 rounded-2xl flex-row items-center justify-center gap-3 mb-4"
          >
            <View className="w-6 h-6 rounded-full bg-mustard items-center justify-center">
              <AppText size="xs" className="font-display text-espresso">G</AppText>
            </View>
            <AppText size="sm" className="font-heading text-espresso">Masuk dengan Google</AppText>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View className="flex-row items-center gap-3 my-3">
            <View className="h-[1px] bg-espresso/10 flex-1" />
            <AppText size="xs" className="font-body text-text-muted uppercase tracking-wider">atau dengan email</AppText>
            <View className="h-[1px] bg-espresso/10 flex-1" />
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
                placeholder="Masukkan kata sandi"
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

          {/* FORGOT PASSWORD LINK */}
          <TouchableOpacity className="align-self-end mb-6" activeOpacity={0.7}>
            <AppText size="xs" className="font-heading text-terracotta text-right">Lupa kata sandi?</AppText>
          </TouchableOpacity>

          {/* PRIMARY CTA BUTTON (Duolingo 3D style) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEmailLogin}
            disabled={isLoading}
            className="w-full bg-mustard py-4 rounded-2xl items-center border-b-4 border-[#d49232] shadow-sm mb-4"
          >
            {isLoading ? (
              <ActivityIndicator color="#3E2E22" />
            ) : (
              <AppText size="base" className="font-heading text-espresso">Masuk</AppText>
            )}
          </TouchableOpacity>

          {/* SWITCH TO REGISTER */}
          <TouchableOpacity
            onPress={() => navigation?.navigate('Register')}
            className="items-center py-2"
            activeOpacity={0.7}
          >
            <AppText size="xs" className="font-body text-text-muted">
              Belum punya akun? <AppText size="xs" className="font-heading text-espresso underline">Daftar Akun Baru</AppText>
            </AppText>
          </TouchableOpacity>

        </Animated.View>

        {/* SECURITY NOTICE PILL */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="bg-mustard/15 border border-mustard/30 rounded-2xl p-4 flex-row items-center gap-3 mt-4">
          <ShieldCheck color="#74822F" size={22} />
          <AppText size="xs" className="text-text-muted font-body leading-relaxed flex-1">
            Suara Anda tidak pernah dikirim ke server manapun. Semua proses verifikasi berjalan 100% lokal di HP Anda.
          </AppText>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}
