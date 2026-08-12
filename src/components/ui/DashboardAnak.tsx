import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react-native';
import { useScamContext } from '../../context/ScamContext';
import { AppText } from './AppText';

export default function DashboardAnak() {
  const { blockedCalls, addBlockedCall } = useScamContext();

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-3">
        <AppText size="base" className="text-espresso font-heading">Laporan Keamanan (Anak)</AppText>
      </View>

      <View className="bg-surface rounded-2xl p-5 border border-espresso/10 shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <AppText size="lg" className="font-heading text-espresso">{blockedCalls.length} Panggilan Diblokir</AppText>
          </View>
          <View className="w-12 h-12 bg-olive/20 rounded-full items-center justify-center">
            <ShieldAlert color="#74822F" size={24} />
          </View>
        </View>

        <View className="bg-cream rounded-xl p-3 border border-espresso/5">
          <AppText size="sm" className="font-heading text-espresso mb-3">Log Panggilan Terakhir:</AppText>

          {blockedCalls.length === 0 ? (
            <AppText size="xs" className="font-body text-text-muted text-center py-2 italic">Belum ada aktivitas mencurigakan.</AppText>
          ) : (
            blockedCalls.slice(0, 3).map((call, idx) => (
              <View key={`${call.id || 'call'}_${idx}`} className="flex-row gap-3 mb-3 border-b border-espresso/5 pb-2">
                <View className="bg-warning/20 p-2 rounded-full h-8 w-8 items-center justify-center">
                  <AppText size="xs">📞</AppText>
                </View>
                <View className="flex-1">
                  <AppText size="sm" className="font-heading text-warning">Panggilan Ditolak</AppText>
                  <AppText size="sm" className="font-body text-espresso leading-relaxed mt-0.5">{call.reason}</AppText>
                  <View className="flex-row items-center gap-1 mt-1">
                    <Clock color="#A39686" size={10} />
                    <AppText size="sm" className="font-body text-text-muted">{call.date}</AppText>
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
