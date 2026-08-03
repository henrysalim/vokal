import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, User, Mail, CheckCircle2, Camera, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../context/auth';
import { useConfirmModal } from '../../components/ui/ConfirmModal';

export default function EditProfilScreen() {
  const navigation = useNavigation();
  const { user, updateProfile, isLoading } = useAuth();
  const { showConfirm } = useConfirmModal();

  const [name, setName] = useState(user?.name || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl || null);
  const email = user?.email || '';

  const previewInitials = name
    .trim()
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'VK';

  // 📸 Pilih Foto dari Galeri HP
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showConfirm({
        title: 'Izin Ditolak',
        message: 'Izin akses galeri diperlukan untuk memilih foto profil.',
        confirmText: 'Mengerti',
        cancelText: '',
        variant: 'terracotta',
        iconType: 'warning',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setAvatarUri(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showConfirm({
        title: 'Peringatan',
        message: 'Nama tidak boleh kosong.',
        confirmText: 'Mengerti',
        cancelText: '',
        variant: 'mustard',
        iconType: 'warning',
      });
      return;
    }

    const success = await updateProfile(name, avatarUri);
    if (success) {
      showConfirm({
        title: 'Berhasil',
        message: 'Profil Anda telah berhasil diperbarui!',
        confirmText: 'Mantap',
        cancelText: '',
        variant: 'olive',
        iconType: 'success',
        onConfirm: () => navigation.goBack(),
      });
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View className="flex-row items-center justify-between my-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-espresso/10"
          >
            <ChevronLeft color="#3E2E22" size={20} />
          </TouchableOpacity>
          <Text className="font-heading text-lg text-espresso">Edit Profil</Text>
          <View className="w-10" />
        </View>

        {/* AVATAR + TOMBOL UPLOAD FOTO */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center my-6">
          <View className="relative mb-3">
            <TouchableOpacity activeOpacity={0.8} onPress={handlePickImage}>
              <View className="w-28 h-28 bg-espresso rounded-full items-center justify-center border-4 border-mustard/40 shadow-sm overflow-hidden">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-4xl text-cream font-display">{previewInitials}</Text>
                )}
              </View>
              {/* Tombol Ikon Kamera */}
              <View className="absolute bottom-0 right-0 bg-mustard w-9 h-9 rounded-full items-center justify-center border-2 border-cream shadow-sm">
                <Camera color="#3E2E22" size={18} />
              </View>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-4 items-center">
            <TouchableOpacity onPress={handlePickImage}>
              <Text className="text-mustard font-heading text-xs">Ubah Foto</Text>
            </TouchableOpacity>
            {avatarUri && (
              <TouchableOpacity onPress={handleRemoveImage} className="flex-row items-center gap-1">
                <Trash2 color="#7A2E22" size={12} />
                <Text className="text-warning font-heading text-xs">Hapus Foto</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* FORM INPUT */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="bg-surface rounded-3xl p-6 shadow-sm border border-espresso/5 mb-6">
          <View className="mb-5">
            <Text className="font-heading text-xs text-espresso mb-2 uppercase tracking-wider">Nama Lengkap</Text>
            <View className="flex-row items-center bg-cream/60 rounded-2xl px-4 py-3 border border-espresso/10">
              <User color="#3E2E22" size={20} opacity={0.6} />
              <TextInput
                className="flex-1 ml-3 font-body text-espresso text-base"
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#A0958C"
                editable={!isLoading}
              />
            </View>
          </View>

          <View className="mb-2">
            <Text className="font-heading text-xs text-espresso mb-2 uppercase tracking-wider">Alamat Email (Terkunci)</Text>
            <View className="flex-row items-center bg-espresso/5 rounded-2xl px-4 py-3 border border-espresso/10">
              <Mail color="#3E2E22" size={20} opacity={0.4} />
              <TextInput
                className="flex-1 ml-3 font-body text-text-muted text-base"
                value={email}
                editable={false}
              />
            </View>
          </View>
        </Animated.View>

        {/* TOMBOL SIMPAN */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
            className="bg-mustard rounded-2xl py-4 items-center justify-center shadow-sm flex-row gap-2 border border-mustard/20"
          >
            {isLoading ? (
              <ActivityIndicator color="#3E2E22" size="small" />
            ) : (
              <>
                <CheckCircle2 color="#3E2E22" size={20} />
                <Text className="font-heading text-espresso text-base">Simpan Perubahan</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}
