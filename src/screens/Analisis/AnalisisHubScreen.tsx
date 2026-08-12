import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Mail, MessageSquare, Phone, Search, ChevronRight } from 'lucide-react-native';
import { AppText } from '../../components/ui/AppText';
import { EMERGENCY_CONTACTS } from '../../data/emergencyContacts';
import { Linking, Alert } from 'react-native';

type AnalisisHubScreenProps = {
  navigation: any;
};

type ToolCard = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  bg: string;
  screenName: string;
};

export default function AnalisisHubScreen({ navigation }: AnalisisHubScreenProps) {
  const tools: ToolCard[] = [
    {
      id: 'cek_suara',
      title: 'Cek Suara',
      description: 'Rekam atau unggah klip audio untuk deteksi suara sintetis AI',
      icon: <Mic color="#3E2E22" size={24} />,
      bg: 'bg-mustard',
      screenName: 'CekSuara',
    },
    {
      id: 'cek_email',
      title: 'Cek Email',
      description: 'Sambungkan Gmail atau tempel teks email, deteksi phishing & domain palsu',
      icon: <Mail color="#FFFFFF" size={24} />,
      badgeColor: 'bg-olive',
      bg: 'bg-terracotta',
      screenName: 'CekEmail',
    },
    {
      id: 'cek_pesan',
      title: 'Cek Pesan/SMS',
      description: 'Tempel teks WA, SMS, atau chat. Analisis 8 pola penipuan sekaligus',
      icon: <MessageSquare color="#FFFFFF" size={24} />,
      badgeColor: 'bg-mustard',
      bg: 'bg-olive',
      screenName: 'CekPesan',
    },
    {
      id: 'cek_nomor',
      title: 'Cek Nomor',
      description: 'Periksa nomor telepon di database crowdsourced laporan penipuan',
      icon: <Search color="#FFFFFF" size={24} />,
      bg: 'bg-espresso',
      screenName: 'CekNomor',
    },
  ];

  const handleCallEmergency = async (phone: string, name: string) => {
    const url = `tel:${phone}`;
    Alert.alert(
      `Hubungi ${name}?`,
      `Kamu akan diarahkan untuk menelepon ${phone}`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Telepon', onPress: () => Linking.openURL(url) },
      ]
    );
  };

  const topContacts = EMERGENCY_CONTACTS.slice(0, 3);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="mb-5">
          <AppText size="3xl" className="text-espresso font-heading">Analisis</AppText>
          <AppText size="sm" className="text-text-muted font-body mt-0.5">
            Pilih jenis ancaman yang ingin kamu periksa
          </AppText>
        </View>

        {/* TOOL CARDS */}
        <View className="gap-3">
          {tools.map(tool => (
            <TouchableOpacity
              key={tool.id}
              className={`${tool.bg} rounded-[24px] p-5 flex-row items-center gap-4`}
              onPress={() => navigation.navigate(tool.screenName)}
              activeOpacity={0.85}
              accessibilityLabel={`Buka ${tool.title}`}
              accessibilityRole="button"
            >
              <View className="w-14 h-14 rounded-2xl bg-surface/15 items-center justify-center flex-shrink-0">
                {tool.icon}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-0.5">
                  <AppText size="base" className="text-white font-heading">{tool.title}</AppText>
                </View>
                <AppText size="sm" className="text-surface/70 font-body leading-relaxed">{tool.description}</AppText>
              </View>
              <ChevronRight color="rgba(255,255,255,0.5)" size={20} />
            </TouchableOpacity>
          ))}
        </View>

        {/* KONTAK DARURAT MINI SECTION */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
            <Phone color="#3E2E22" size={16} />
            <AppText size="base" className="text-espresso font-heading">Kontak Darurat</AppText>
          </View>
            <TouchableOpacity onPress={() => navigation.navigate('KontakDarurat')} className="flex-row items-center gap-1">
              <AppText size="sm" className="text-mustard font-body">Semua</AppText>
              <ChevronRight color="#E8A33D" size={14} />
            </TouchableOpacity>
          </View>

          <View className="gap-2">
            {topContacts.map(contact => (
              <TouchableOpacity
                key={contact.id}
                className="bg-surface rounded-2xl p-4 flex-row items-center gap-3"
                onPress={() => handleCallEmergency(contact.phone, contact.name)}
                activeOpacity={0.8}
                accessibilityLabel={`Hubungi ${contact.name}`}
                style={{ elevation: 1, shadowColor: '#3E2E22', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 }}
              >
                <View className={`w-11 h-11 rounded-xl items-center justify-center ${contact.color}`}>
                  <AppText size="lg">{contact.icon}</AppText>
                </View>
                <View className="flex-1">
                  <AppText size="sm" className="text-espresso font-heading">{contact.shortName}</AppText>
                  <AppText size="sm" className="text-text-muted font-body">{contact.available}</AppText>
                </View>
                <View className="flex-row items-center gap-1.5 bg-espresso/8 rounded-xl px-3 py-2">
                  <Phone color="#3E2E22" size={13} />
                  <AppText size="sm" className="text-espresso font-display">{contact.phone}</AppText>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="mt-3 border border-espresso/20 rounded-2xl py-3.5 items-center flex-row justify-center gap-2"
            onPress={() => navigation.navigate('KontakDarurat')}
            activeOpacity={0.8}
          >
            <Phone color="#3E2E22" size={15} />
            <AppText size="sm" className="text-espresso font-heading">Lihat Semua Kontak Darurat</AppText>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
