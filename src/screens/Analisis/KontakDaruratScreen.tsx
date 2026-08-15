import React from 'react';
import { View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Shield, AlertTriangle, Landmark, Radio, CreditCard } from 'lucide-react-native';
import { AppText } from '../../components/ui/AppText';
import { useConfirmModal } from '../../components/ui/ConfirmModal';
import { EMERGENCY_CONTACTS, EmergencyContact } from '../../data/emergencyContacts';


function getContactIcon(iconName: string, color: string = "#FFFFFF") {
  switch (iconName) {
    case "Shield":
      return <Shield color={color} size={24} />;
    case "Landmark":
      return <Landmark color={color} size={24} />;
    case "Radio":
      return <Radio color={color} size={24} />;
    case "AlertTriangle":
      return <AlertTriangle color={color} size={24} />;
    case "CreditCard":
      return <CreditCard color={color} size={24} />;
    default:
      return <Shield color={color} size={24} />;
  }
}

function ContactCard({ contact, onCall }: { contact: EmergencyContact; onCall: (phone: string, name: string) => void }) {
  return (
    <View className="bg-surface rounded-[20px] p-4 mb-3 shadow-sm" style={{ elevation: 1, shadowColor: '#3E2E22', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 }}>
      <View className="flex-row items-center gap-3">
        <View className={`w-14 h-14 rounded-2xl items-center justify-center ${contact.color}`}>
          {getContactIcon(contact.icon)}
        </View>
        <View className="flex-1">
          <AppText size="sm" className="text-espresso font-heading leading-tight">{contact.name}</AppText>
          <AppText size="sm" className="text-text-muted font-body mt-0.5" numberOfLines={2}>{contact.description}</AppText>
          <View className="flex-row items-center mt-1 gap-1">
            <View className="w-1.5 h-1.5 rounded-full bg-olive" />
            <AppText size="sm" className="text-olive font-body">{contact.available}</AppText>
          </View>
        </View>
      </View>
      <TouchableOpacity
        className="mt-3 bg-espresso rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
        onPress={() => onCall(contact.phone, contact.name)}
        activeOpacity={0.8}
        accessibilityLabel={`Hubungi ${contact.name}`}
        accessibilityRole="button"
      >
        <Phone color="#FFFFFF" size={16} />
        <AppText size="sm" className="text-white font-heading">Hubungi {contact.shortName}</AppText>
        <AppText size="sm" className="text-mustard font-display ml-1">{contact.phone}</AppText>
      </TouchableOpacity>
    </View>
  );
}

export default function KontakDaruratScreen() {
  const { showConfirm } = useConfirmModal();

  const handleCall = async (phone: string, name: string) => {
    const url = `tel:${phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      showConfirm({
        title: 'Perangkat Tidak Mendukung',
        message: `Perangkat ini tidak mendukung panggilan telepon. Silakan hubungi ${name} di nomor ${phone} secara manual.`,
        confirmText: 'Mengerti',
        cancelText: '',
        variant: 'terracotta',
        iconType: 'warning',
      });
      return;
    }
    showConfirm({
      title: `Hubungi ${name}?`,
      message: `Anda akan melakukan panggilan telepon ke nomor ${phone}. Pastikan ini adalah tindakan yang aman.`,
      confirmText: 'Hubungi',
      cancelText: 'Batal',
      variant: 'terracotta',
      iconType: 'question',
      onConfirm: () => Linking.openURL(url),
    });
  };

  const polisi = EMERGENCY_CONTACTS.filter(c => c.category === 'kepolisian' || c.category === 'umum');
  const keuangan = EMERGENCY_CONTACTS.filter(c => c.category === 'keuangan');
  const siber = EMERGENCY_CONTACTS.filter(c => c.category === 'siber');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-5">
          <View className="flex-row items-center gap-3 mb-1">
            <View className="w-10 h-10 rounded-2xl bg-terracotta items-center justify-center">
              <Shield color="#FFFFFF" size={18} />
            </View>
            <AppText size="2xl" className="text-espresso font-heading">Kontak Darurat</AppText>
          </View>
          <AppText size="sm" className="text-text-muted font-body leading-relaxed">
            Nomor resmi yang bisa kamu hubungi langsung jika menjadi korban atau target penipuan.
          </AppText>
        </View>

        {/* TIPS BANNER */}
        <View className="bg-mustard/15 border border-mustard/30 rounded-2xl p-4 mb-5 flex-row gap-3 items-start">
          <AlertTriangle color="#E8A33D" size={18} />
          <View className="flex-1">
            <AppText size="sm" className="text-espresso font-heading mb-0.5">Jangan panik, simpan nomor ini</AppText>
            <AppText size="sm" className="text-espresso/70 text-justify font-body leading-relaxed">
              Penipu sering menyamar sebagai lembaga resmi. Jika ada yang menghubungimu mengaku dari instansi ini, tutup telepon dan hubungi langsung lewat tombol di bawah.
            </AppText>
          </View>
        </View>

        {/* SECTION: Darurat & Kepolisian */}
        <AppText size="sm" className="text-text-muted font-display uppercase tracking-widest mb-2">Darurat &amp; Kepolisian</AppText>
        {polisi.map(c => <ContactCard key={c.id} contact={c} onCall={handleCall} />)}

        {/* SECTION: Finansial */}
        <AppText size="sm" className="text-text-muted font-display uppercase tracking-widest mb-2 mt-3">Pengaduan Keuangan</AppText>
        {keuangan.map(c => <ContactCard key={c.id} contact={c} onCall={handleCall} />)}

        {/* SECTION: Siber */}
        <AppText size="sm" className="text-text-muted font-display uppercase tracking-widest mb-2 mt-3">Keamanan Siber</AppText>
        {siber.map(c => <ContactCard key={c.id} contact={c} onCall={handleCall} />)}
      </ScrollView>
    </SafeAreaView>
  );
}
