import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react-native';
import { useScamContext } from '../../context/ScamContext';

export default function DashboardAnak() {
  const { blockedCalls, addBlockedCall } = useScamContext();

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-espresso text-base font-heading">Laporan Keamanan (Anak)</Text>
      </View>
      
      <View className="bg-surface rounded-2xl p-5 border border-espresso/10 shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="font-heading text-lg text-espresso">{blockedCalls.length} Panggilan Diblokir</Text>
            <Text className="font-body text-xs text-text-muted mt-1">Sistem berhasil melindungi keluarga Anda.</Text>
          </View>
          <View className="w-12 h-12 bg-olive/20 rounded-full items-center justify-center">
            <ShieldAlert color="#74822F" size={24} />
          </View>
        </View>

        {/* Demo Button to add a blocked call */}
        <TouchableOpacity 
          onPress={() => addBlockedCall('Pola suara terdeteksi sangat tergesa-gesa (Indikasi Penipuan Darurat)')}
          className="bg-mustard/20 py-2 rounded-lg items-center border border-mustard/40 mb-4"
        >
          <Text className="text-mustard font-display text-xs">+ (Simulasi) Panggilan Ditolak</Text>
        </TouchableOpacity>

        <View className="bg-cream rounded-xl p-3 border border-espresso/5">
          <Text className="font-heading text-xs text-espresso mb-3">Log Panggilan Terakhir:</Text>
          
          {blockedCalls.length === 0 ? (
            <Text className="font-body text-xs text-text-muted text-center py-2 italic">Belum ada aktivitas mencurigakan.</Text>
          ) : (
            blockedCalls.slice(0, 3).map((call, idx) => (
              <View key={`${call.id || 'call'}_${idx}`} className="flex-row gap-3 mb-3 border-b border-espresso/5 pb-2">
                <View className="bg-warning/20 p-2 rounded-full h-8 w-8 items-center justify-center">
                  <Text className="text-[10px]">📞</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-heading text-xs text-warning">Panggilan Ditolak</Text>
                  <Text className="font-body text-[10px] text-espresso leading-relaxed mt-0.5">{call.reason}</Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <Clock color="#A39686" size={10} />
                    <Text className="font-body text-[9px] text-text-muted">{call.date}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}
