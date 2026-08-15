import React from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, ChevronLeft } from "lucide-react-native";
import { AppText } from "../../components/ui/AppText";
import RadarModus from "../../components/ui/RadarModus";
import { useNavigation } from "@react-navigation/native";

export default function CekNomorScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
      <View className="flex-row items-center px-5 pt-3 pb-1 gap-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-espresso/8 items-center justify-center">
          <ChevronLeft color="#3E2E22" size={24} />
        </TouchableOpacity>
        <AppText size="lg" className="text-espresso font-heading">Kembali</AppText>
      </View>
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 120 }}>
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
