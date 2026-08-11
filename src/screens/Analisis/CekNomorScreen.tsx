import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { AppText } from '../../components/ui/AppText';
import RadarModus from '../../components/ui/RadarModus';

export default function CekNomorScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="mb-5">
          <View className="flex-row items-center gap-3 mb-1">
            <View className="w-10 h-10 rounded-2xl bg-espresso items-center justify-center">
              <Search color="#FFFFFF" size={20} />
            </View>
            <AppText size="2xl" className="text-espresso font-heading">Cek Nomor</AppText>
          </View>
          <AppText size="sm" className="text-text-muted font-body leading-relaxed">
            Periksa nomor telepon di database laporan penipuan crowdsourced. Semakin banyak orang melapor, semakin akurat hasilnya.
          </AppText>
        </View>
        <RadarModus />
      </ScrollView>
    </SafeAreaView>
  );
}
