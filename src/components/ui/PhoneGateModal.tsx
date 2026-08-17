import { Phone, ShieldCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../../../context/auth';
import { AppText } from './AppText';

type Props = {
  visible: boolean;
};

export function PhoneGateModal({ visible }: Props) {
  const { updateProfile, user, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    const cleaned = phone.trim().replace(/\s+/g, '');
    if (!cleaned) {
      setError('Nomor HP tidak boleh kosong.');
      return;
    }
    // Basic Indonesian phone number check: min 9 digits
    const digits = cleaned.replace(/[^0-9]/g, '');
    if (digits.length < 9 || digits.length > 15) {
      setError('Format nomor HP tidak valid. Contoh: 081234567890');
      return;
    }
    setError('');
    // Preserve existing name and avatarUrl
    await updateProfile(user?.name || '', user?.avatarUrl ?? null, cleaned);
    // Modal closes automatically when user.phone is set in auth context
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-cream"
      >
        <View className="flex-1 justify-center px-6">

          {/* BADGE */}
          <Animated.View
            entering={FadeInUp.delay(100).springify()}
            className="items-center mb-8"
          >
            <View className="w-24 h-24 rounded-full bg-mustard/20 items-center justify-center mb-4 border-4 border-mustard/30">
              <ShieldCheck color="#E8A33D" size={44} />
            </View>
            <AppText size="2xl" className="font-heading text-espresso text-center">
              Satu Langkah Lagi
            </AppText>
            <AppText size="sm" className="font-body text-text-muted text-center mt-2 px-4 leading-relaxed">
              Nomor HP-mu diperlukan agar anggota keluarga dapat menemukanmu dan memverifikasi undangan di VOKAL.
            </AppText>
          </Animated.View>

          {/* FORM */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <AppText size="xs" className="font-heading text-espresso mb-2 uppercase tracking-wider">
              Nomor Telepon (WhatsApp)
            </AppText>

            <View
              className={`flex-row items-center bg-surface rounded-2xl px-4 py-3.5 border ${
                error ? 'border-terracotta' : 'border-espresso/15'
              } mb-1.5`}
            >
              <Phone color="#3E2E22" size={20} opacity={0.6} />
              <TextInput
                className="flex-1 ml-3 font-body text-espresso text-base"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  if (error) setError('');
                }}
                placeholder="Contoh: 081234567890"
                placeholderTextColor="#A0958C"
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handleSave}
                editable={!isLoading}
              />
            </View>

            {error ? (
              <AppText size="xs" className="text-terracotta font-body ml-1 mb-3">
                {error}
              </AppText>
            ) : (
              <AppText size="xs" className="text-text-muted font-body ml-1 mb-3">
                Nomor ini tidak akan dibagikan ke pihak luar.
              </AppText>
            )}

            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              activeOpacity={0.85}
              className="bg-mustard rounded-2xl py-4 items-center justify-center flex-row gap-2 border-b-4 border-[#d49232] shadow-sm mt-2"
            >
              {isLoading ? (
                <ActivityIndicator color="#3E2E22" size="small" />
              ) : (
                <>
                  <ShieldCheck color="#3E2E22" size={20} />
                  <AppText size="base" className="font-heading text-espresso">
                    Simpan & Lanjutkan
                  </AppText>
                </>
              )}
            </TouchableOpacity>

            <AppText size="xs" className="font-body text-text-muted text-center mt-5 px-6 leading-relaxed">
              Kamu bisa mengubah nomor ini kapan saja melalui menu Edit Profil.
            </AppText>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
