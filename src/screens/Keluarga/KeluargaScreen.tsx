import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, FadeInDown, Layout } from 'react-native-reanimated';
import { Users, BellRing, ShieldCheck, ChevronDown, ChevronUp, AlertCircle, PlusCircle, KeyRound, X } from 'lucide-react-native';
import { FAMILY_MEMBERS, MOCK_CODEWORD } from '../../data/mock';
import { useUser } from '../../context/UserContext';

export default function KeluargaScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [tempSeed, setTempSeed] = useState('');
  const { familySecret, updateFamilySecret, codeword } = useUser();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <TouchableOpacity activeOpacity={0.9} className="rounded-[32px] overflow-hidden mb-6 shadow-sm" style={{ elevation: 2, shadowColor: '#3E2E22', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 }}>
            <LinearGradient colors={['#3E2E22', '#5A4634']} className="p-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-cream font-heading text-xl">Family Trust Graph</Text>
                <View className="bg-mustard/20 px-3 py-1 rounded-full">
                  <Text className="text-mustard text-xs font-display">{FAMILY_MEMBERS.length} Anggota</Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center mb-4">
                <View className="items-center">
                  <Text className="text-white text-3xl font-display">{codeword.word ? '3' : '0'}/5</Text>
                  <Text className="text-cream/60 text-[10px] font-body mt-1">Hafal Codeword</Text>
                </View>
                <View className="w-[1px] h-10 bg-cream/20" />
                <View className="items-center">
                  <Text className="text-olive text-3xl font-display">Aman</Text>
                  <Text className="text-cream/60 text-[10px] font-body mt-1">Status Keamanan</Text>
                </View>
              </View>

              <View className="flex-row gap-2 mt-2">
                <TouchableOpacity activeOpacity={0.8} className="flex-1 bg-mustard rounded-xl py-3 flex-row justify-center items-center gap-2">
                  <PlusCircle color="#3E2E22" size={16} />
                  <Text className="text-espresso font-display text-xs">Undang</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={() => {
                    setTempSeed(familySecret);
                    setShowSeedModal(true);
                  }}
                  className="flex-1 bg-olive rounded-xl py-3 flex-row justify-center items-center gap-2"
                >
                  <KeyRound color="#FFFFFF" size={16} />
                  <Text className="text-white font-display text-xs">Ubah Seed</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text className="text-espresso text-base font-heading mb-3">Daftar Anggota</Text>
        </Animated.View>

        {/* LIST KELUARGA */}
        <View className="gap-3 mb-6">
          {FAMILY_MEMBERS.map((member, i) => {
            const isExpanded = expandedId === member.id;
            const isMe = member.role.includes('Anda');
            const isSafe = member.status === 'Aman';
            const isWaiting = member.status === 'Menunggu';
            
            return (
              <Animated.View entering={FadeInDown.delay(300 + i * 100).springify()} key={member.id} layout={Layout.springify()} className="bg-surface rounded-2xl overflow-hidden shadow-sm" style={{ elevation: 1 }}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(member.id)} className="p-4 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className={`w-12 h-12 rounded-full items-center justify-center border-2 ${isSafe ? 'border-olive bg-olive/10' : isWaiting ? 'border-espresso/20 bg-espresso/5' : 'border-terracotta bg-terracotta/10'}`}>
                      <Text className={`font-display text-lg ${isSafe ? 'text-olive' : isWaiting ? 'text-espresso/50' : 'text-terracotta'}`}>
                        {member.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <View className="flex-row items-center gap-2">
                        <Text className="font-heading text-espresso text-sm">{member.name}</Text>
                        {isMe && <View className="bg-mustard/20 px-2 py-0.5 rounded-md"><Text className="text-mustard text-[9px] font-display">ADMIN</Text></View>}
                      </View>
                      <Text className="font-body text-text-muted text-xs mt-0.5">{member.role}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center gap-2">
                    {isSafe ? <ShieldCheck color="#74822F" size={16} /> : isWaiting ? null : <AlertCircle color="#C1592E" size={16} />}
                    {isExpanded ? <ChevronUp color="#3E2E22" size={20} opacity={0.5} /> : <ChevronDown color="#3E2E22" size={20} opacity={0.5} />}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <Animated.View entering={FadeIn} exiting={FadeOut} className="px-4 pb-4 pt-1 border-t border-espresso/5">
                    <Text className="text-xs font-body text-text-muted mb-3">Status Codeword: {member.verified ? <Text className="text-olive font-bold">Terverifikasi</Text> : <Text className="text-terracotta font-bold">Belum</Text>}</Text>
                    
                    {!isMe && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity className="flex-1 bg-terracotta/10 border border-terracotta/30 py-2 rounded-xl items-center flex-row justify-center gap-2">
                          <BellRing color="#C1592E" size={14} />
                          <Text className="text-terracotta font-display text-[11px]">Kirim Alarm Senyap</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}
        </View>

      </ScrollView>

      {/* SEED MODAL */}
      <Modal visible={showSeedModal} transparent animationType="fade">
        <View className="flex-1 bg-espresso/90 justify-center px-5">
          <View className="bg-cream rounded-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-heading text-lg text-espresso">Kunci Rahasia (Seed)</Text>
              <TouchableOpacity onPress={() => setShowSeedModal(false)} className="bg-espresso/10 p-2 rounded-full">
                <X color="#3E2E22" size={16} />
              </TouchableOpacity>
            </View>
            <Text className="font-body text-xs text-text-muted mb-4">
              Masukkan kalimat unik rahasia keluargamu. Pastikan setiap HP keluarga memasukkan seed yang persis sama agar Codeword TOTP selalu sinkron.
            </Text>
            
            <TextInput
              className="bg-white border border-espresso/20 rounded-xl p-4 font-body text-espresso mb-4"
              value={tempSeed}
              onChangeText={setTempSeed}
              placeholder="Contoh: KeluargaCemara2026"
              placeholderTextColor="#A39686"
              autoCapitalize="none"
            />

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                updateFamilySecret(tempSeed);
                setShowSeedModal(false);
              }}
              className="w-full bg-mustard py-4 rounded-xl items-center border-b-4 border-[#d49232]"
            >
              <Text className="font-heading text-espresso text-base">Simpan & Sinkronisasi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
