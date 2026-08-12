import React, { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, X, ShieldCheck, RotateCcw, Sparkles, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '../../components/ui/AppText';
import { analyzeWithGemini, GeminiAnalysisResult, GeminiAnalysisFlag } from '../../utils/geminiAnalyzer';

// ─── Sub-Components ───────────────────────────────────────────────

function FlagCard({ flag }: { flag: GeminiAnalysisFlag }) {
  const styles = {
    danger: { border: 'border-terracotta/40', bg: 'bg-terracotta/8', dot: '#C1592E' },
    warning: { border: 'border-mustard/40', bg: 'bg-mustard/8', dot: '#E8A33D' },
    info: { border: 'border-olive/40', bg: 'bg-olive/8', dot: '#74822F' },
  }[flag.level] ?? { border: 'border-espresso/20', bg: 'bg-espresso/5', dot: '#3E2E22' };

  return (
    <Animated.View entering={FadeInDown.springify()} className={`${styles.bg} border ${styles.border} rounded-2xl p-3.5 mb-2`}>
      <View className="flex-row items-center gap-2 mb-1">
        <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: styles.dot }} />
        <AppText size="sm" className="text-espresso font-heading flex-1">{flag.label}</AppText>
      </View>
      <AppText size="xs" className="text-espresso/70 font-body leading-relaxed">{flag.description}</AppText>
    </Animated.View>
  );
}

function ScoreRing({ score, verdict }: { score: number; verdict: string }) {
  const color = score >= 50 ? '#C1592E' : score >= 20 ? '#E8A33D' : '#74822F';
  const bgColor = score >= 50 ? 'bg-terracotta/10' : score >= 20 ? 'bg-mustard/10' : 'bg-olive/10';
  const borderColor = score >= 50 ? 'border-terracotta/30' : score >= 20 ? 'border-mustard/30' : 'border-olive/30';
  return (
    <View className={`items-center py-6 mx-4 rounded-[20px] ${bgColor} border ${borderColor} mb-4`}>
      <View className="w-28 h-28 rounded-full items-center justify-center border-8 mb-3" style={{ borderColor }}>
        <AppText size="3xl" className="font-display" style={{ color }}>{score}</AppText>
        <AppText size="xs" className="text-text-muted font-body">/ 100</AppText>
      </View>
      <View className="px-5 py-2 rounded-full" style={{ backgroundColor: color }}>
        <AppText size="sm" className="text-white font-heading">{verdict}</AppText>
      </View>
    </View>
  );
}

// ─── Sample Texts ─────────────────────────────────────────────────

const SAMPLES = [
  {
    label: '📦 Penipuan Hadiah',
    text: 'Selamat! Anda terpilih sebagai pemenang undian berhadiah Rp 50.000.000. Segera klaim hadiah hari ini sebelum batas waktu habis! Klik bit.ly/klaim-hadiah atau hubungi CS: 0812-XXXX. Jangan beritahu orang lain dulu!',
  },
  {
    label: '🏦 Phishing Bank',
    text: 'Yth Nasabah BCA, rekening Anda akan diblokir dalam 24 jam karena aktivitas mencurigakan. Segera verifikasi akun di mybca-security.id dan masukkan PIN ATM serta kode OTP untuk konfirmasi. Tim Keamanan BCA.',
  },
  {
    label: '✅ Pesan Normal',
    text: 'Halo, saya ingin konfirmasi jadwal meeting besok pukul 10.00 WIB di kantor pusat. Apakah bisa? Mohon konfirmasi ya. Terima kasih.',
  },
];

// ─── Main Screen ──────────────────────────────────────────────────

export default function CekPesanScreen() {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GeminiAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (inputText.trim().length < 15) {
      Alert.alert('Teks Terlalu Pendek', 'Masukkan minimal 15 karakter teks pesan yang ingin dicek.');
      return;
    }
    Keyboard.dismiss();
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeWithGemini({
        type: 'text',
        content: inputText,
        analysisType: 'message',
      });
      setResult(analysis);
    } catch (err: any) {
      Alert.alert('Analisis Gagal', err.message || 'Periksa koneksi internet dan coba lagi.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setInputText('');
  };

  // ── Analyzing State ───────────────────────────────────────────────
  if (isAnalyzing) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-cream items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-olive/10 items-center justify-center mb-4 border-2 border-olive/20">
          <Sparkles color="#74822F" size={36} />
        </View>
        <AppText size="lg" className="text-espresso font-heading text-center mb-2">Gemini Sedang Menganalisis</AppText>
        <AppText size="sm" className="text-text-muted font-body text-center leading-relaxed">
          Memeriksa pola penipuan, link berbahaya, dan manipulasi teks...
        </AppText>
        <ActivityIndicator color="#74822F" style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  // ── Result State ──────────────────────────────────────────────────
  if (result) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-cream">
        <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 120 }}>

          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <AppText size="xl" className="text-espresso font-heading">Hasil Analisis</AppText>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Sparkles color="#74822F" size={12} />
                <AppText size="xs" className="text-olive font-body">Dianalisis oleh Gemini AI</AppText>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleReset}
              className="w-9 h-9 rounded-full bg-espresso/10 items-center justify-center"
              accessibilityLabel="Analisis ulang"
            >
              <X color="#3E2E22" size={18} />
            </TouchableOpacity>
          </View>

          {/* Score */}
          <ScoreRing score={result.score} verdict={result.verdict} />

          {/* Summary */}
          <View className="bg-surface rounded-2xl p-4 mb-5 border border-espresso/8">
            <AppText size="sm" className="text-espresso/80 font-body leading-relaxed">{result.summary}</AppText>
          </View>

          {/* Teks yang dianalisis */}
          <View className="bg-espresso/5 rounded-xl px-4 py-3 mb-4 border border-espresso/10">
            <AppText size="xs" className="text-text-muted font-display uppercase tracking-widest mb-1">Teks yang Dianalisis</AppText>
            <AppText size="xs" className="text-espresso/70 font-body leading-relaxed" numberOfLines={3}>{inputText}</AppText>
          </View>

          {/* Flags */}
          {result.flags.length > 0 && (
            <>
              <AppText size="xs" className="text-text-muted font-display uppercase tracking-widest mb-3">
                Temuan Detail
              </AppText>
              {result.flags.map(flag => <FlagCard key={flag.id} flag={flag} />)}
            </>
          )}

          {result.flags.length === 0 && result.score < 20 && (
            <View className="bg-olive/10 rounded-2xl p-4 flex-row gap-3 items-center border border-olive/20">
              <ShieldCheck color="#74822F" size={24} />
              <View className="flex-1">
                <AppText size="sm" className="text-olive font-heading">Tidak Ada Tanda Bahaya</AppText>
                <AppText size="xs" className="text-olive/70 font-body mt-0.5">Pesan ini tampak aman. Tidak ada pola penipuan yang terdeteksi.</AppText>
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View className="gap-3 mt-5">
            <TouchableOpacity
              onPress={handleAnalyze}
              activeOpacity={0.85}
              className="bg-olive rounded-2xl py-4 items-center flex-row justify-center gap-2"
            >
              <RotateCcw color="#FFFFFF" size={16} />
              <AppText size="sm" className="text-white font-heading">Analisis Ulang Teks Ini</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleReset}
              activeOpacity={0.85}
              className="border border-espresso/20 rounded-2xl py-3.5 items-center"
            >
              <AppText size="sm" className="text-espresso font-heading">Cek Pesan Lain</AppText>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Input State ───────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} className="mb-5">
          <View className="flex-row items-center gap-3 mb-1">
            <View className="w-10 h-10 rounded-2xl bg-olive items-center justify-center">
              <MessageSquare color="#FFFFFF" size={18} />
            </View>
            <AppText size="2xl" className="text-espresso font-heading">Cek Pesan</AppText>
          </View>
          <AppText size="sm" className="text-text-muted font-body leading-relaxed">
            Tempel teks WA, SMS, atau chat yang mencurigakan. Gemini AI akan menganalisis 8+ pola penipuan Indonesia.
          </AppText>
        </Animated.View>

        {/* Gemini badge */}
        <Animated.View entering={FadeInDown.delay(50).springify()} className="flex-row items-center gap-2 bg-olive/10 border border-olive/20 rounded-xl px-3 py-2.5 mb-5">
          <Sparkles color="#74822F" size={16} />
          <AppText size="xs" className="text-olive font-body flex-1">
            Ditenagai oleh Google Gemini AI — analisis cerdas dan kontekstual
          </AppText>
        </Animated.View>

        {/* Input */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <TextInput
            className="bg-surface rounded-2xl p-4 text-espresso border border-espresso/10"
            style={{ minHeight: 180, textAlignVertical: 'top', fontSize: 14, fontFamily: 'DMSans-Regular' }}
            placeholder="Tempel teks di sini..."
            placeholderTextColor="#9E8E7E"
            multiline
            value={inputText}
            onChangeText={setInputText}
            accessibilityLabel="Kolom teks pesan untuk dianalisis"
          />
          <AppText size="xs" className="text-text-muted font-body mt-2 mb-4">
            {inputText.length} karakter {inputText.length < 15 && inputText.length > 0 ? '(min. 15)' : ''}
          </AppText>
        </Animated.View>

        {/* Analyze button */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <TouchableOpacity
            className="rounded-2xl py-4 items-center flex-row justify-center gap-2 mb-5"
            style={{ backgroundColor: inputText.trim().length < 15 ? '#9E8E7E' : '#74822F' }}
            onPress={handleAnalyze}
            disabled={inputText.trim().length < 15}
            activeOpacity={0.85}
          >
            <Sparkles color="#FFFFFF" size={18} />
            <AppText size="base" className="text-white font-heading">Analisis dengan Gemini</AppText>
          </TouchableOpacity>
        </Animated.View>

        {/* Sample texts */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <AppText size="xs" className="text-text-muted font-display uppercase tracking-widest mb-3">
            Coba Contoh
          </AppText>
          <View className="gap-2">
            {SAMPLES.map((s, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setInputText(s.text)}
                activeOpacity={0.8}
                className="bg-surface border border-espresso/10 rounded-xl p-3.5 flex-row items-center justify-between"
              >
                <AppText size="sm" className="text-espresso font-heading">{s.label}</AppText>
                <ChevronRight color="#9E8E7E" size={16} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}
