import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/auth';
import VokalMascot from '../../components/Mascot';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, isLoading } = useAuth();
  const navigation = useNavigation<any>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async () => {
    const success = await signInWithEmail(email, password);
    if (success && navigation && navigation.navigate) {
      navigation.navigate('Root');
    }
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
            <Text className="text-white text-3xl font-heading text-center mt-3">Masuk ke VOKAL</Text>
            <Text className="text-surface/60 text-xs font-body text-center mt-1">"Bukan Suaramu, Bukan Uangmu"</Text>
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
              <Text className="font-display text-xs text-espresso">G</Text>
            </View>
            <Text className="font-heading text-espresso text-sm">Masuk dengan Google</Text>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View className="flex-row items-center gap-3 my-3">
            <View className="h-[1px] bg-espresso/10 flex-1" />
            <Text className="font-body text-text-muted text-[11px] uppercase tracking-wider">atau dengan email</Text>
            <View className="h-[1px] bg-espresso/10 flex-1" />
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
            <Text className="font-heading text-terracotta text-xs text-right">Lupa kata sandi?</Text>
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
              <Text className="font-heading text-espresso text-base">Masuk</Text>
            )}
          </TouchableOpacity>

          {/* SWITCH TO REGISTER */}
          <TouchableOpacity
            onPress={() => navigation?.navigate('Register')}
            className="items-center py-2"
            activeOpacity={0.7}
          >
            <Text className="font-body text-text-muted text-xs">
              Belum punya akun? <Text className="font-heading text-espresso underline">Daftar Akun Baru</Text>
            </Text>
          </TouchableOpacity>

        </Animated.View>

        {/* SECURITY NOTICE PILL */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="bg-mustard/15 border border-mustard/30 rounded-2xl p-4 flex-row items-center gap-3 mt-4">
          <ShieldCheck color="#74822F" size={22} />
          <Text className="text-text-muted font-body text-[11px] leading-relaxed flex-1">
            Suara Anda tidak pernah dikirim ke server manapun. Semua proses verifikasi berjalan 100% lokal di HP Anda.
          </Text>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}
