import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Radar, AlertTriangle, ShieldCheck, Search, PlusCircle, X, Share2, CheckCircle } from 'lucide-react-native';
import { useScamContext, ScamReport, CheckResult } from '../../context/ScamContext';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export default function RadarModus() {
  const { localScams, reportScam, checkNumberDetails } = useScamContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [scamType, setScamType] = useState('Kecelakaan Anak');
  
  const [checkInput, setCheckInput] = useState('');
  const [checkDetails, setCheckDetails] = useState<CheckResult | null>(null);

  // Share Card state
  const [showShareCard, setShowShareCard] = useState(false);
  const [latestReport, setLatestReport] = useState<ScamReport | null>(null);
  const viewShotRef = React.useRef(null);

  const handleReport = async () => {
    if (phoneInput.length < 8) {
      Alert.alert('Gagal', 'Nomor telepon tidak valid.');
      return;
    }
    if (locationInput.length < 3) {
      Alert.alert('Gagal', 'Lokasi (Kecamatan/Kota) wajib diisi.');
      return;
    }
    
    await reportScam(phoneInput, scamType, locationInput);
    
    const clean = phoneInput.replace(/[^0-9+]/g, '');
    const prefix = clean.length > 6 ? clean.substring(0, 6) + '-xxx' : clean + '-xxx';
    setLatestReport({
      id: 'temp',
      phoneHash: '...',
      phonePrefix: prefix,
      type: scamType,
      location: locationInput,
      timestamp: Date.now()
    });

    setModalVisible(false);
    setPhoneInput('');
    setLocationInput('');
    
    setTimeout(() => setShowShareCard(true), 500);
  };

  const shareCard = async () => {
    try {
      if (viewShotRef.current) {
        // @ts-ignore
        const uri = await viewShotRef.current.capture();
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Bagikan Peringatan Scam',
            UTI: 'public.png'
          });
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleCheck = async () => {
    if (checkInput.length < 8) return;
    const res = await checkNumberDetails(checkInput);
    setCheckDetails(res);
  };

  return (
    <View className="mt-6 bg-surface rounded-[24px] p-5 shadow-sm border border-terracotta/10">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-full bg-terracotta/20 items-center justify-center">
            <Radar color="#C1592E" size={20} />
          </View>
          <View>
            <Text className="text-espresso font-heading text-base">Radar Modus Lokal</Text>
            <Text className="text-text-muted font-body text-[10px]">Data Enkripsi Crowdsource</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <PlusCircle color="#C1592E" size={24} />
        </TouchableOpacity>
      </View>

      {/* Cek Nomor */}
      <View className="flex-row items-center bg-cream rounded-xl p-2 mb-4 border border-espresso/10">
        <TextInput 
          placeholder="Cek nomor mencurigakan..."
          keyboardType="phone-pad"
          className="flex-1 font-body text-xs ml-2 h-8 text-espresso"
          value={checkInput}
          onChangeText={(t) => {
            setCheckInput(t);
            setCheckDetails(null);
          }}
        />
        <TouchableOpacity 
          onPress={handleCheck}
          className="bg-espresso p-2 rounded-lg"
        >
          <Search color="#FFF" size={16} />
        </TouchableOpacity>
      </View>

      {checkDetails?.isScam && (
        <View className="bg-warning/20 p-3 rounded-xl mb-4 border border-warning/30">
          <View className="flex-row items-center gap-2 mb-1">
            <AlertTriangle color="#7A2E28" size={16} />
            <Text className="text-warning font-heading text-xs flex-1">
              BAHAYA: Nomor ini telah terdaftar {checkDetails.totalReports}x sebagai Penipuan!
            </Text>
          </View>
          {checkDetails.matchedReport && (
            <Text className="text-espresso font-body text-[11px] ml-6">
              Modus: <Text className="font-bold">{checkDetails.matchedReport.type}</Text> • Area: {checkDetails.matchedReport.location}
            </Text>
          )}
        </View>
      )}
      
      {checkDetails && !checkDetails.isScam && (
        <View className="bg-olive/20 p-3 rounded-xl mb-4 flex-row items-center gap-2 border border-olive/30">
          <ShieldCheck color="#74822F" size={16} />
          <Text className="text-olive font-heading text-xs flex-1">Aman: Belum ada laporan penipuan untuk nomor ini.</Text>
        </View>
      )}

      {/* List Radar Lokal */}
      <View className="bg-cream p-3 rounded-xl">
        <Text className="text-espresso font-heading text-xs mb-3">Terdeteksi di Sekitarmu ({localScams.length}):</Text>
        
        {localScams.length === 0 ? (
          <Text className="text-text-muted font-body text-[11px] text-center italic py-2">
            Belum ada data di lokasimu. Jadilah yang pertama melaporkan untuk melindungi komunitas!
          </Text>
        ) : (
          localScams.slice(0, 3).map((scam, idx) => (
            <View key={`${scam.id || 'scam'}_${idx}`} className="flex-row items-start gap-2 mb-3 border-b border-espresso/5 pb-2">
              <View className="w-8 h-8 rounded-full bg-warning/20 items-center justify-center">
                <Text className="text-xs">⚠️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-warning font-heading text-[11px]">{scam.phonePrefix}</Text>
                <Text className="text-espresso font-body text-[10px]">Modus: {scam.type}</Text>
                <Text className="text-text-muted font-body text-[9px]">📍 {scam.location}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Modal Lapor */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-[32px] p-6 h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-heading text-xl text-espresso">Lapor Nomor Scam</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#3E2E22" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="font-body text-xs text-text-muted mb-2">
                Nomor akan di-Hash (enkripsi) sebelum disimpan untuk menjaga privasi sesuai standar perlindungan data.
              </Text>
              
              <Text className="font-heading text-sm text-espresso mb-1 mt-4">Nomor Penelepon</Text>
              <TextInput 
                keyboardType="phone-pad"
                placeholder="Misal: 0812345678"
                className="bg-cream p-4 rounded-xl font-body text-espresso border border-espresso/10"
                value={phoneInput}
                onChangeText={setPhoneInput}
              />

              <Text className="font-heading text-sm text-espresso mb-1 mt-4">Lokasi (Kecamatan/Kota)</Text>
              <TextInput 
                placeholder="Misal: Kebayoran Baru, Jakarta"
                className="bg-cream p-4 rounded-xl font-body text-espresso border border-espresso/10"
                value={locationInput}
                onChangeText={setLocationInput}
              />

              <Text className="font-heading text-sm text-espresso mb-2 mt-4">Jenis Modus</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {['Kecelakaan Anak', 'Transfer Darurat', 'Suara AI/Kloning', 'Lainnya'].map(type => (
                  <TouchableOpacity 
                    key={type}
                    onPress={() => setScamType(type)}
                    className={`px-4 py-2 rounded-full border ${scamType === type ? 'bg-terracotta border-terracotta' : 'bg-cream border-espresso/20'}`}
                  >
                    <Text className={`font-heading text-xs ${scamType === type ? 'text-white' : 'text-espresso'}`}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                onPress={handleReport}
                className="bg-terracotta py-4 rounded-xl items-center border-b-4 border-[#A3431D]"
              >
                <Text className="text-white font-heading text-base">Enkripsi & Laporkan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Shareable Scam Card Modal */}
      <Modal visible={showShareCard} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/80 px-5">
          
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }} style={{ width: '100%', borderRadius: 24, overflow: 'hidden' }}>
            <View className="bg-cream p-6 items-center w-full">
              <View className="w-16 h-16 rounded-full bg-terracotta/20 items-center justify-center mb-4">
                <ShieldCheck color="#C1592E" size={32} />
              </View>
              <Text className="font-heading text-xl text-espresso text-center mb-2">Saya Baru Saja Menghindari Penipuan!</Text>
              
              <View className="bg-white w-full rounded-xl p-4 my-4 border border-espresso/10 shadow-sm">
                <Text className="font-heading text-sm text-terracotta mb-1">Modus yang dihindari:</Text>
                <Text className="font-body text-espresso text-base mb-3 font-bold">{latestReport?.type}</Text>
                
                <Text className="font-heading text-sm text-terracotta mb-1">Nomor Pelaku:</Text>
                <Text className="font-body text-espresso text-base mb-3 font-bold">{latestReport?.phonePrefix}</Text>
                
                <Text className="font-heading text-sm text-terracotta mb-1">Target Area:</Text>
                <Text className="font-body text-espresso text-base font-bold">{latestReport?.location}</Text>
              </View>

              <Text className="font-body text-[11px] text-text-muted text-center mt-2 px-4">
                Laporan ini telah dienkripsi dan masuk ke Radar Modus VOKAL untuk melindungi komunitas. 
                #AntiScam #BukanSuaramuBukanUangmu
              </Text>
            </View>
          </ViewShot>

          <View className="w-full mt-6 gap-3">
            <TouchableOpacity 
              onPress={shareCard}
              className="w-full bg-mustard py-4 rounded-xl items-center flex-row justify-center gap-2 border-b-4 border-[#d49232]"
            >
              <Share2 color="#3E2E22" size={20} />
              <Text className="text-espresso font-heading text-base">Bagikan ke Status WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowShareCard(false)}
              className="w-full py-4 items-center"
            >
              <Text className="text-white font-heading text-sm">Tutup</Text>
            </TouchableOpacity>
          </View>

        </View>
      </Modal>
    </View>
  );
}
