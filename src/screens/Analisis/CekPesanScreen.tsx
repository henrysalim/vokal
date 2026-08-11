import React, { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, X, ShieldCheck } from 'lucide-react-native';
import { AppText } from '../../components/ui/AppText';
import { analyzeForPhishing, PhishingAnalysisResult, PhishingFlag } from '../../utils/phishingEngine';

function FlagCard({ flag }: { flag: PhishingFlag }) {
  const borderColor = flag.level === 'danger' ? 'border-terracotta/40' : flag.level === 'warning' ? 'border-mustard/40' : 'border-olive/40';
  const bgColor = flag.level === 'danger' ? 'bg-terracotta/8' : flag.level === 'warning' ? 'bg-mustard/8' : 'bg-olive/8';
  const dotColor = flag.level === 'danger' ? 'bg-terracotta' : flag.level === 'warning' ? 'bg-mustard' : 'bg-olive';

  return (
    <View className={`${bgColor} border ${borderColor} rounded-2xl p-3.5 mb-2`}>
      <View className="flex-row items-center gap-2 mb-1">
        <View className={`w-2 h-2 rounded-full ${dotColor}`} />
        <AppText size="sm" className="text-espresso font-heading flex-1">{flag.label}</AppText>
      </View>
      <AppText size="xs" className="text-espresso/70 font-body leading-relaxed">{flag.description}</AppText>
    </View>
  );
}

function ScoreRing({ score, verdict }: { score: number; verdict: string }) {
  const color = score >= 50 ? '#C1592E' : score >= 20 ? '#E8A33D' : '#74822F';
  return (
    <View className="items-center py-5">
      <View
        className="w-28 h-28 rounded-full items-center justify-center border-8"
        style={{ borderColor: color }}
      >
        <AppText size="3xl" className="font-display" style={{ color }}>{score}</AppText>
        <AppText size="xs" className="text-text-muted font-body">/ 100</AppText>
      </View>
      <View className="mt-3 px-5 py-2 rounded-full" style={{ backgroundColor: color }}>
        <AppText size="sm" className="text-white font-heading">{verdict}</AppText>
      </View>
    </View>
  );
}

const SAMPLE_TEXTS = [
  {
    label: 'Contoh: Penipuan Hadiah',
    text: 'Selamat! Anda terpilih sebagai pemenang beruntung undian berhadiah Rp 50.000.000. Segera klaim hadiah Anda hari ini sebelum batas waktu habis. Klik bit.ly/hadiah-vokal atau hubungi CS kami. Jangan beritahu orang lain dulu!',
  },
  {
    label: 'Contoh: Phishing Bank',
    text: 'Yth Nasabah BCA, rekening Anda akan diblokir dalam 24 jam karena aktivitas mencurigakan. Segera verifikasi akun Anda sekarang juga di mybca-security.id dan masukkan PIN ATM dan kode OTP untuk konfirmasi. Tim Keamanan BCA.',
  },
  {
    label: 'Contoh: Pesan Normal',
    text: 'Halo, saya ingin konfirmasi jadwal meeting besok pukul 10.00 WIB. Apakah bisa di kantor pusat? Terima kasih.',
  },
];

export default function CekPesanScreen() {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PhishingAnalysisResult | null>(null);

  const handleAnalyze = () => {
    if (inputText.trim().length < 15) {
      Alert.alert('Teks Terlalu Pendek', 'Masukkan minimal 15 karakter teks pesan yang ingin dicek.');
      return;
    }
    Keyboard.dismiss();
    setIsAnalyzing(true);
    setTimeout(() => {
      const analysis = analyzeForPhishing(inputText);
      setResult(analysis);
      setIsAnalyzing(false);
    }, 700);
  };

  const handleReset = () => {
    setResult(null);
    setInputText('');
  };

  if (result) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-cream">
        <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="flex-row items-center justify-between mb-4">
            <AppText size="xl" className="text-espresso font-heading">Hasil Analisis</AppText>
            <TouchableOpacity onPress={handleReset} className="w-9 h-9 rounded-full bg-espresso/10 items-center justify-center" accessibilityLabel="Reset analisis">
              <X color="#3E2E22" size={18} />
            </TouchableOpacity>
          </View>

          <View className="bg-surface rounded-[24px] shadow-sm mb-4" style={{ elevation: 2 }}>
            <ScoreRing score={result.score} verdict={result.verdict} />
            <View className="px-5 pb-5">
              <AppText size="sm" className="text-espresso/80 font-body text-center leading-relaxed">{result.summary}</AppText>
            </View>
          </View>

          <AppText size="xs" className="text-text-muted font-display uppercase tracking-widest mb-3">Temuan Detail</AppText>
          {result.flags.map(flag => <FlagCard key={flag.id} flag={flag} />)}

          {/* Teks Yang Dianalisis */}
          <View className="mt-4 bg-espresso/5 rounded-2xl p-4 border border-espresso/8">
            <AppText size="xs" className="text-text-muted font-display uppercase tracking-widest mb-2">Teks yang dianalisis</AppText>
            <AppText size="xs" className="text-espresso/70 font-body leading-relaxed">{inputText}</AppText>
          </View>

          <TouchableOpacity
            className="mt-5 bg-espresso rounded-2xl py-4 items-center"
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <AppText size="sm" className="text-white font-heading">Cek Pesan Lain</AppText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-5">
          <View className="w-10 h-10 rounded-2xl bg-olive items-center justify-center">
            <MessageSquare color="#FFFFFF" size={18} />
          </View>
          <View>
            <AppText size="2xl" className="text-espresso font-heading">Cek Pesan/SMS</AppText>
            <AppText size="xs" className="text-text-muted font-body">Tempel teks WA, SMS, atau chat mencurigakan</AppText>
          </View>
        </View>

        {/* Text Input */}
        <TextInput
          className="bg-surface rounded-2xl p-4 border border-espresso/10"
          style={{ minHeight: 180, textAlignVertical: 'top', fontSize: 14, fontFamily: 'DMSans-Regular', color: '#3E2E22' }}
          placeholder={'Tempel teks pesan di sini...\n\nContoh: "Selamat! Kamu menang hadiah..."'}
          placeholderTextColor="#9E8E7E"
          multiline
          value={inputText}
          onChangeText={setInputText}
          accessibilityLabel="Kolom teks pesan untuk dianalisis"
        />

        <AppText size="xs" className="text-text-muted font-body mt-2">{inputText.length} karakter</AppText>

        {/* Quick samples */}
        <AppText size="xs" className="text-text-muted font-display uppercase tracking-widest mt-4 mb-2">Coba dengan contoh</AppText>
        {SAMPLE_TEXTS.map((sample, i) => (
          <TouchableOpacity
            key={i}
            className="bg-surface border border-espresso/8 rounded-2xl px-4 py-3 mb-2 flex-row items-center"
            onPress={() => setInputText(sample.text)}
            activeOpacity={0.7}
          >
            <AppText size="xs" className="text-espresso font-body flex-1">{sample.label}</AppText>
          </TouchableOpacity>
        ))}

        {/* Privacy note */}
        <View className="flex-row gap-2 mt-4 items-start">
          <ShieldCheck color="#74822F" size={14} />
          <AppText size="xs" className="text-olive font-body flex-1 leading-relaxed">
            Analisis berjalan 100% offline di perangkatmu. Teks tidak pernah dikirim ke server.
          </AppText>
        </View>

        {/* CTA */}
        <TouchableOpacity
          className={`rounded-2xl py-4 items-center mt-5 ${isAnalyzing ? 'bg-espresso/50' : 'bg-espresso'}`}
          onPress={handleAnalyze}
          disabled={isAnalyzing}
          activeOpacity={0.8}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <AppText size="sm" className="text-white font-heading">Analisis Pesan</AppText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
