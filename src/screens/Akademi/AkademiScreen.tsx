import React, { useState, useRef } from 'react';
import {
  View, ScrollView, TouchableOpacity, Modal, Dimensions,
  Pressable, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withSequence, withRepeat, FadeInDown, FadeInUp, ZoomIn,
  SlideInDown, SlideOutDown, Easing,
} from 'react-native-reanimated';
import {
  Trophy, Mic, Search, Shield, ChevronRight, X, Check,
  AlertCircle, Phone, RotateCcw, Award, ChevronLeft, Star,
  Heart, Zap, Lock, BookOpen, PlayCircle, CheckCircle2, Flame,
} from 'lucide-react-native';
import { AppText } from '../../components/ui/AppText';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../../context/auth';
import VokalMascot from '../../components/Mascot';
import { QUIZ_QUESTIONS, QUIZ_CATEGORIES, QuizQuestion } from '../../data/quizData';
import { SIM_SCENARIOS, SimScenario } from '../../data/simScamData';

const { width, height } = Dimensions.get('window');

// ─── MODULE DATA ─────────────────────────────────────────────────────
// Setiap modul unlock setelah modul sebelumnya selesai
type ModuleType = 'done' | 'active' | 'locked' | 'chest';

type Module = {
  id: string;
  type: ModuleType;
  title: string;
  subtitle: string;
  xpReward: number;
  category?: string;
  simId?: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
  icon: 'mic' | 'search' | 'shield' | 'phone' | 'star' | 'award';
};

const BASE_MODULES: Omit<Module, 'type'>[] = [
  {
    id: '1',
    title: 'Deteksi Suara AI',
    subtitle: '5 soal deteksi kloning suara',
    xpReward: 110,
    category: 'deteksi_ai',
    bgColor: '#C1592E',
    borderColor: '#8B3D1F',
    shadowColor: '#C1592E',
    icon: 'mic',
  },
  {
    id: '2',
    title: 'Simulasi Darurat',
    subtitle: 'Roleplay telepon scam - Mudah',
    xpReward: 60,
    simId: 'sim_1',
    bgColor: '#E8A33D',
    borderColor: '#b07a28',
    shadowColor: '#E8A33D',
    icon: 'phone',
  },
  {
    id: '3',
    title: 'Kenali Modus',
    subtitle: '5 soal jenis penipuan digital',
    xpReward: 110,
    category: 'kenali_modus',
    bgColor: '#74822F',
    borderColor: '#4f5920',
    shadowColor: '#74822F',
    icon: 'search',
  },
  {
    id: '4',
    title: 'Simulasi OJK',
    subtitle: 'Roleplay petugas palsu - Sedang',
    xpReward: 75,
    simId: 'sim_2',
    bgColor: '#5B8DB8',
    borderColor: '#3a6b94',
    shadowColor: '#5B8DB8',
    icon: 'phone',
  },
  {
    id: '5',
    title: 'Tindakan Tepat',
    subtitle: '5 soal respons menghadapi scam',
    xpReward: 120,
    category: 'tindakan_tepat',
    bgColor: '#74822F',
    borderColor: '#4f5920',
    shadowColor: '#74822F',
    icon: 'shield',
  },
  {
    id: '6',
    title: 'Simulasi Expert',
    subtitle: 'Kloning suara level sulit',
    xpReward: 90,
    simId: 'sim_3',
    bgColor: '#C1592E',
    borderColor: '#8B3D1F',
    shadowColor: '#C1592E',
    icon: 'phone',
  },
  {
    id: '7',
    title: 'Sertifikat Keluarga',
    subtitle: 'Selesaikan semua modul!',
    xpReward: 200,
    bgColor: '#E8A33D',
    borderColor: '#b07a28',
    shadowColor: '#E8A33D',
    icon: 'award',
  },
];

// ─── NODE ICON ────────────────────────────────────────────────────────
function NodeIcon({ icon, color, size = 28 }: { icon: Module['icon']; color: string; size?: number }) {
  switch (icon) {
    case 'mic': return <Mic color={color} size={size} strokeWidth={2.5} />;
    case 'search': return <Search color={color} size={size} strokeWidth={2.5} />;
    case 'shield': return <Shield color={color} size={size} strokeWidth={2.5} />;
    case 'phone': return <Phone color={color} size={size} strokeWidth={2.5} />;
    case 'star': return <Star color={color} size={size} fill={color} />;
    case 'award': return <Award color={color} size={size} strokeWidth={2.5} />;
  }
}

// ─── QUIZ SESSION ─────────────────────────────────────────────────────
function QuizSession({
  questions, lives, onClose, onComplete, onReduceLife,
}: {
  questions: QuizQuestion[];
  lives: number;
  onClose: () => void;
  onComplete: (xpEarned: number, correct: number) => void;
  onReduceLife: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [currentLives, setCurrentLives] = useState(lives);
  const [done, setDone] = useState(false);

  const scaleAnim = useSharedValue(1);
  const shakeAnim = useSharedValue(0);
  const q = questions[idx];
  const progress = (idx + 1) / questions.length;

  const shake = () => {
    shakeAnim.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
  }));

  const handleSelect = (optId: string) => {
    if (answered) return;
    setSelected(optId);
    setAnswered(true);
    const isCorrect = optId === q.correctId;
    if (isCorrect) {
      setXpEarned(p => p + q.xpReward);
      setCorrect(p => p + 1);
      scaleAnim.value = withSequence(withSpring(1.05), withSpring(1));
    } else {
      shake();
      const newLives = currentLives - 1;
      setCurrentLives(newLives);
      onReduceLife();
      if (newLives <= 0) {
        setTimeout(() => setDone(true), 1200);
        return;
      }
    }
  };

  const handleNext = () => {
    if (idx >= questions.length - 1) {
      setDone(true);
      return;
    }
    setIdx(p => p + 1);
    setSelected(null);
    setAnswered(false);
  };

  const getOptionStyle = (optId: string) => {
    if (!answered) return 'bg-surface border-espresso/10';
    if (optId === q.correctId) return 'bg-olive/15 border-olive';
    if (optId === selected) return 'bg-terracotta/10 border-terracotta';
    return 'bg-surface border-espresso/5 opacity-40';
  };

  if (done) {
    const passed = correct >= Math.ceil(questions.length / 2) && currentLives > 0;
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-cream">
        <Animated.View entering={FadeInDown.springify()} className="flex-1 items-center justify-center px-6">
          <View className={`w-28 h-28 rounded-full items-center justify-center mb-6 ${passed ? 'bg-olive/15' : 'bg-terracotta/10'}`}>
            {passed ? <Award color="#74822F" size={52} /> : <RotateCcw color="#C1592E" size={44} />}
          </View>

          <AppText size="3xl" className={`font-heading text-center mb-2 ${passed ? 'text-olive' : 'text-terracotta'}`}>
            {passed ? 'Luar Biasa!' : currentLives <= 0 ? 'Nyawa Habis!' : 'Coba Lagi'}
          </AppText>
          <AppText size="sm" className="text-text-muted font-body text-center mb-6 leading-relaxed">
            Benar {correct} dari {questions.length} soal
            {currentLives <= 0 ? '\nNyawa kamu habis di sesi ini.' : ''}
          </AppText>

          {/* Lives remaining */}
          <View className="flex-row gap-2 mb-5">
            {Array.from({ length: lives }).map((_, i) => (
              <Heart key={i} color="#C1592E" size={22} fill={i < currentLives ? '#C1592E' : 'transparent'} opacity={i < currentLives ? 1 : 0.3} />
            ))}
          </View>

          <View className="bg-mustard/15 border border-mustard/30 rounded-2xl px-8 py-4 mb-8 items-center">
            <AppText size="2xl" className="text-mustard font-display">+{xpEarned} XP</AppText>
            <AppText size="xs" className="text-text-muted font-body mt-0.5">diperoleh dalam sesi ini</AppText>
          </View>

          <TouchableOpacity className="w-full bg-espresso rounded-2xl py-4 items-center" onPress={() => onComplete(xpEarned, correct)} activeOpacity={0.85}>
            <AppText size="sm" className="text-white font-heading">Kembali ke Peta</AppText>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-cream">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={onClose} className="w-9 h-9 rounded-full bg-espresso/8 items-center justify-center">
            <X color="#3E2E22" size={18} />
          </TouchableOpacity>
          {/* Lives */}
          <View className="flex-row gap-1.5">
            {Array.from({ length: lives }).map((_, i) => (
              <Heart key={i} color="#C1592E" size={20} fill={i < currentLives ? '#C1592E' : 'transparent'} opacity={i < currentLives ? 1 : 0.25} />
            ))}
          </View>
          <View className="bg-mustard/15 rounded-full px-3 py-1">
            <AppText size="xs" className="text-mustard font-display">+{xpEarned} XP</AppText>
          </View>
        </View>
        {/* Progress */}
        <View className="h-3 bg-espresso/8 rounded-full overflow-hidden">
          <Animated.View className="h-full bg-mustard rounded-full" style={{ width: `${progress * 100}%` }} />
        </View>
        <View className="flex-row justify-between mt-1">
          <AppText size="xs" className="text-text-muted font-body">{q.categoryLabel}</AppText>
          <AppText size="xs" className="text-text-muted font-body">{idx + 1}/{questions.length}</AppText>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View entering={FadeInDown.duration(300)} key={q.id}>
          <Animated.View style={shakeStyle}>
            <AppText size="lg" className="text-espresso font-heading leading-snug mt-4 mb-6">{q.question}</AppText>

            <View className="gap-3">
              {q.options.map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => handleSelect(opt.id)}
                  disabled={answered}
                  className={`rounded-2xl p-4 border-2 flex-row items-center gap-3 ${getOptionStyle(opt.id)}`}
                  activeOpacity={0.75}
                >
                  <View className={`w-7 h-7 rounded-full border-2 items-center justify-center flex-shrink-0 ${answered && opt.id === q.correctId ? 'bg-olive border-olive' : answered && opt.id === selected ? 'bg-terracotta border-terracotta' : 'border-espresso/15'}`}>
                    {answered && opt.id === q.correctId && <Check color="#fff" size={14} strokeWidth={3} />}
                    {answered && opt.id === selected && opt.id !== q.correctId && <X color="#fff" size={14} strokeWidth={3} />}
                  </View>
                  <AppText size="sm" className={`flex-1 font-body leading-snug ${answered && opt.id === q.correctId ? 'text-olive' : answered && opt.id === selected ? 'text-terracotta' : 'text-espresso'}`}>
                    {opt.text}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {answered && (
            <Animated.View entering={FadeInDown.duration(350)} className={`mt-4 rounded-2xl p-4 border flex-row gap-3 ${selected === q.correctId ? 'bg-olive/10 border-olive/25' : 'bg-terracotta/8 border-terracotta/20'}`}>
              {selected === q.correctId ? <CheckCircle2 color="#74822F" size={20} /> : <AlertCircle color="#C1592E" size={20} />}
              <View className="flex-1">
                <AppText size="sm" className={`font-heading mb-1 ${selected === q.correctId ? 'text-olive' : 'text-terracotta'}`}>
                  {selected === q.correctId ? `Benar! +${q.xpReward} XP` : 'Kurang tepat'}
                </AppText>
                <AppText size="xs" className="text-espresso/70 font-body leading-relaxed">{q.explanation}</AppText>
              </View>
            </Animated.View>
          )}

          {answered && (
            <TouchableOpacity className="mt-5 bg-espresso rounded-2xl py-4 items-center" onPress={handleNext} activeOpacity={0.85}>
              <AppText size="sm" className="text-white font-heading">
                {idx >= questions.length - 1 ? 'Lihat Hasil' : 'Lanjutkan'}
              </AppText>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── SIM SESSION ──────────────────────────────────────────────────────
function SimSession({
  scenario, lives, onClose, onComplete, onReduceLife,
}: {
  scenario: SimScenario;
  lives: number;
  onClose: () => void;
  onComplete: (xp: number) => void;
  onReduceLife: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [currentLives, setCurrentLives] = useState(lives);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const step = scenario.steps[stepIdx];
  const selOpt = step?.options.find(o => o.id === selectedOpt);
  const isLast = stepIdx >= scenario.steps.length - 1;

  const handleSelect = (optId: string) => {
    if (answered) return;
    const opt = step.options.find(o => o.id === optId);
    if (!opt) return;
    setSelectedOpt(optId);
    setAnswered(true);
    if (opt.xpDelta > 0) { setXpEarned(p => p + opt.xpDelta); if (opt.isCorrect) setCorrectCount(p => p + 1); }
    if (opt.xpDelta < 0) {
      const nl = currentLives - 1;
      setCurrentLives(nl);
      onReduceLife();
      if (nl <= 0) { setTimeout(() => setDone(true), 1200); return; }
    }
  };

  const handleNext = () => {
    if (isLast || currentLives <= 0) { setDone(true); return; }
    setStepIdx(p => p + 1);
    setSelectedOpt(null);
    setAnswered(false);
  };

  if (done) {
    const passed = currentLives > 0 && correctCount >= Math.ceil(scenario.steps.length / 2);
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-cream">
        <Animated.View entering={FadeInDown.springify()} className="flex-1 items-center justify-center px-6">
          <View className={`w-28 h-28 rounded-full items-center justify-center mb-6 ${passed ? 'bg-olive/15' : 'bg-terracotta/10'}`}>
            {passed ? <Award color="#74822F" size={52} /> : <RotateCcw color="#C1592E" size={44} />}
          </View>
          <AppText size="2xl" className="text-espresso font-heading text-center mb-2">
            {passed ? 'Skenario Berhasil!' : currentLives <= 0 ? 'Nyawa Habis!' : 'Coba Lagi'}
          </AppText>
          <AppText size="xs" className="text-text-muted font-body text-center mb-5">{correctCount}/{scenario.steps.length} respons terbaik</AppText>

          <View className="flex-row gap-2 mb-5">
            {Array.from({ length: lives }).map((_, i) => (
              <Heart key={i} color="#C1592E" size={22} fill={i < currentLives ? '#C1592E' : 'transparent'} opacity={i < currentLives ? 1 : 0.25} />
            ))}
          </View>

          <View className="bg-mustard/15 border border-mustard/30 rounded-2xl px-8 py-4 mb-8 items-center w-full">
            <AppText size="2xl" className="text-mustard font-display">+{xpEarned} XP</AppText>
          </View>
          <TouchableOpacity className="w-full bg-espresso rounded-2xl py-4 items-center" onPress={() => onComplete(xpEarned)} activeOpacity={0.85}>
            <AppText size="sm" className="text-white font-heading">Kembali ke Peta</AppText>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-cream">
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={onClose} className="w-9 h-9 rounded-full bg-espresso/8 items-center justify-center">
          <X color="#3E2E22" size={18} />
        </TouchableOpacity>
        <View className="flex-row gap-1.5">
          {Array.from({ length: lives }).map((_, i) => (
            <Heart key={i} color="#C1592E" size={20} fill={i < currentLives ? '#C1592E' : 'transparent'} opacity={i < currentLives ? 1 : 0.25} />
          ))}
        </View>
        <AppText size="xs" className="text-text-muted font-body">{stepIdx + 1}/{scenario.steps.length}</AppText>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40 }}>
        {stepIdx === 0 && (
          <Animated.View entering={FadeInDown.duration(300)} className="bg-espresso/6 rounded-2xl p-4 mb-4 border border-espresso/10 mt-3">
            <AppText size="xs" className="text-text-muted font-display uppercase tracking-widest mb-1">Situasi</AppText>
            <AppText size="xs" className="text-espresso/70 font-body leading-relaxed">{scenario.context}</AppText>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(350)} key={step.id}>
          {/* Caller bubble */}
          <View className="bg-terracotta/10 border border-terracotta/20 rounded-[20px] rounded-tl-sm p-4 mb-5 mt-2">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-6 h-6 rounded-full bg-terracotta items-center justify-center">
                <Phone color="#fff" size={12} />
              </View>
              <AppText size="xs" className="text-terracotta font-display uppercase tracking-widest">Penipu berkata</AppText>
            </View>
            <AppText size="sm" className="text-espresso font-body leading-relaxed italic">{step.scammerLine}</AppText>
          </View>

          <AppText size="sm" className="text-espresso font-heading mb-3">Kamu merespons:</AppText>

          <View className="gap-3">
            {step.options.map(opt => {
              const isSel = selectedOpt === opt.id;
              let cls = 'border-espresso/10 bg-surface';
              if (answered && isSel) cls = opt.isCorrect ? 'border-olive bg-olive/10' : 'border-terracotta bg-terracotta/8';
              return (
                <TouchableOpacity key={opt.id} onPress={() => handleSelect(opt.id)} disabled={answered} className={`rounded-2xl p-4 border-2 ${cls}`} activeOpacity={0.75}>
                  <AppText size="sm" className="text-espresso font-body leading-snug">{opt.text}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {answered && selOpt && (
            <Animated.View entering={FadeInDown.duration(350)} className={`mt-4 rounded-2xl p-4 border flex-row gap-3 ${selOpt.isCorrect ? 'bg-olive/10 border-olive/25' : 'bg-terracotta/8 border-terracotta/20'}`}>
              {selOpt.isCorrect ? <CheckCircle2 color="#74822F" size={20} /> : <AlertCircle color="#C1592E" size={20} />}
              <View className="flex-1">
                <AppText size="sm" className={`font-heading mb-1 ${selOpt.isCorrect ? 'text-olive' : 'text-terracotta'}`}>
                  {selOpt.isCorrect ? `+${selOpt.xpDelta} XP — Respons Tepat!` : selOpt.xpDelta < 0 ? '-1 Nyawa' : 'Kurang Optimal'}
                </AppText>
                <AppText size="xs" className="text-espresso/70 font-body leading-relaxed">{selOpt.feedback}</AppText>
              </View>
            </Animated.View>
          )}

          {answered && (
            <TouchableOpacity className="mt-5 bg-espresso rounded-2xl py-4 items-center" onPress={handleNext} activeOpacity={0.85}>
              <AppText size="sm" className="text-white font-heading">{isLast || currentLives <= 0 ? 'Lihat Hasil' : 'Lanjutkan'}</AppText>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── NODE COMPONENT ───────────────────────────────────────────────────
function PathNode({
  mod, index, onPress, bounceAnim,
}: {
  mod: Module;
  index: number;
  onPress: () => void;
  bounceAnim?: any;
}) {
  const isDone = mod.type === 'done';
  const isActive = mod.type === 'active';
  const isLocked = mod.type === 'locked';
  const isChest = mod.type === 'chest';

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceAnim && isActive ? bounceAnim.value : 0 }],
  }));

  // Offset sinusoidal
  const offsetX = Math.sin(index * 1.4) * (width * 0.22);

  const nodeBg = isDone
    ? mod.bgColor
    : isActive
    ? mod.bgColor
    : isChest
    ? '#E8A33D'
    : '#D4C9BC';

  const borderCol = isDone
    ? mod.borderColor
    : isActive
    ? mod.borderColor
    : '#B5A898';

  const shadowStyle = !isLocked ? {
    shadowColor: nodeBg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isActive ? 0.55 : 0.3,
    shadowRadius: 0,
    elevation: isActive ? 8 : 4,
  } : {};

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={[{ transform: [{ translateX: offsetX }] }, animStyle]}
      className="items-center mb-8"
    >
      {/* Mascot on active node */}
      {isActive && bounceAnim && (
        <Animated.View className="absolute -top-16 z-20">
          <VokalMascot size={68} />
        </Animated.View>
      )}

      {/* XP badge */}
      {!isLocked && !isDone && (
        <View className="absolute -top-1 -right-6 bg-mustard rounded-full px-2 py-0.5 z-10 border-2 border-cream">
          <AppText size="xs" className="text-espresso font-display" style={{ fontSize: 9 }}>+{mod.xpReward}</AppText>
        </View>
      )}

      <TouchableOpacity
        onPress={onPress}
        disabled={isLocked}
        activeOpacity={0.8}
        style={[{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: nodeBg,
          borderBottomWidth: 5,
          borderColor: borderCol,
          alignItems: 'center',
          justifyContent: 'center',
        }, shadowStyle]}
      >
        {isDone ? (
          <Check color="#FFFFFF" size={32} strokeWidth={3} />
        ) : isLocked ? (
          <Lock color="#A39686" size={24} />
        ) : isChest ? (
          <Award color="#3E2E22" size={32} />
        ) : (
          <NodeIcon icon={mod.icon} color="#FFFFFF" size={28} />
        )}
      </TouchableOpacity>

      {/* Title below node */}
      <View className="mt-2 items-center" style={{ maxWidth: 100 }}>
        <AppText size="xs" className={`font-heading text-center ${isLocked ? 'text-text-muted' : 'text-espresso'}`} numberOfLines={1}>
          {mod.title}
        </AppText>
      </View>
    </Animated.View>
  );
}

// ─── LEADERBOARD MINI ─────────────────────────────────────────────────
function LeaderboardMini({ leaderboard, loading }: { leaderboard: any[]; loading: boolean }) {
  if (loading) return (
    <View className="py-4 items-center">
      <AppText size="xs" className="text-text-muted font-body">Memuat peringkat...</AppText>
    </View>
  );
  if (leaderboard.length === 0) return (
    <View className="py-4 items-center">
      <AppText size="xs" className="text-text-muted font-body">Selesaikan kuis untuk masuk papan!</AppText>
    </View>
  );
  return (
    <View className="gap-2">
      {leaderboard.slice(0, 5).map((entry, i) => {
        const medals = ['#E8A33D', '#C0C0C0', '#CD7F32'];
        return (
          <View key={`${entry.name}-${i}`} className={`flex-row items-center py-2.5 px-3 rounded-xl ${entry.isMe ? 'bg-mustard/15' : 'bg-surface/10'}`}>
            <View className="w-6 items-center mr-2">
              {i < 3 ? <Trophy color={medals[i]} size={14} fill={medals[i]} /> : <AppText size="xs" className="text-cream/50 font-display">#{entry.rank}</AppText>}
            </View>
            <View className="w-8 h-8 rounded-full bg-surface/15 items-center justify-center mr-2">
              <AppText size="xs" className={`font-display ${entry.isMe ? 'text-espresso' : 'text-cream'}`}>{entry.initials}</AppText>
            </View>
            <AppText size="sm" className={`flex-1 font-heading ${entry.isMe ? 'text-espresso' : 'text-cream'}`}>{entry.name}{entry.isMe ? ' (Kamu)' : ''}</AppText>
            <AppText size="xs" className={`font-display ${entry.isMe ? 'text-espresso' : 'text-mustard'}`}>{entry.score.toLocaleString()} XP</AppText>
          </View>
        );
      })}
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────
export default function AkademiScreen() {
  const [showPath, setShowPath] = useState(false);
  const [selectedMod, setSelectedMod] = useState<Module | null>(null);
  const [activeQuizCategory, setActiveQuizCategory] = useState<string | null>(null);
  const [activeSimId, setActiveSimId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const { xp, level, levelName, lives, leaderboard, isLoadingLeaderboard, addXP, reduceLife, resetLives, refreshLeaderboard } = useUser();
  const { user } = useAuth();

  // Bounce for active node
  const bounceAnim = useSharedValue(0);
  React.useEffect(() => {
    bounceAnim.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ), -1, true,
    );
  }, []);

  // Build modules with type based on completedIds
  const modules: Module[] = BASE_MODULES.map((m, i) => {
    const isDone = completedIds.has(m.id);
    const prevDone = i === 0 || completedIds.has(BASE_MODULES[i - 1].id);
    const isChest = m.icon === 'award';
    const allPrevDone = BASE_MODULES.slice(0, i).every(pm => completedIds.has(pm.id));
    let type: ModuleType = 'locked';
    if (isDone) type = 'done';
    else if (isChest) type = allPrevDone ? 'chest' : 'locked';
    else if (prevDone) type = 'active';
    return { ...m, type };
  });

  const activeModIdx = modules.findIndex(m => m.type === 'active');

  const xpNextLevel = level < 3 ? [500, 1500, 3000][level] : 9999;
  const xpPct = Math.min(100, Math.round((xp / xpNextLevel) * 100));

  const handleNodePress = (mod: Module) => {
    if (mod.type === 'locked') return;
    setSelectedMod(mod);
  };

  const startModule = () => {
    if (!selectedMod) return;
    setSelectedMod(null);
    setTimeout(() => {
      if (selectedMod.category) {
        setActiveQuizCategory(selectedMod.category);
        setShowQuiz(true);
      } else if (selectedMod.simId) {
        setActiveSimId(selectedMod.simId);
        setShowSim(true);
      }
    }, 300);
  };

  const handleQuizComplete = (xpEarned: number, correct: number) => {
    if (xpEarned > 0) addXP(xpEarned);
    if (correct >= Math.ceil(5 / 2) && lives > 0 && selectedMod?.id) {
      // Mark as done only if passed
    }
    if (activeModIdx >= 0) {
      setCompletedIds(prev => new Set([...prev, modules[activeModIdx].id]));
    }
    setShowQuiz(false);
    setActiveQuizCategory(null);
  };

  const handleSimComplete = (xpEarned: number) => {
    if (xpEarned > 0) addXP(xpEarned);
    if (activeModIdx >= 0) {
      setCompletedIds(prev => new Set([...prev, modules[activeModIdx].id]));
    }
    setShowSim(false);
    setActiveSimId(null);
  };

  const currentSim = activeSimId ? SIM_SCENARIOS.find(s => s.id === activeSimId) : null;
  const quizQs = activeQuizCategory ? QUIZ_QUESTIONS.filter(q => q.category === activeQuizCategory) : [];

  // ── LANDING VIEW ────────────────────────────────────────────────────
  if (!showPath) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-cream">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* HERO CARD */}
          <View className="mx-5 mt-5 rounded-[28px] overflow-hidden" style={{ elevation: 8, shadowColor: '#3E2E22', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20 }}>
            <LinearGradient colors={['#3E2E22', '#5A3E2B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-6">
              {/* Decorative circles */}
              <View style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(232,163,61,0.1)' }} />
              <View style={{ position: 'absolute', bottom: -30, left: -10, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(116,130,47,0.12)' }} />

              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <AppText size="xs" className="text-surface/50 font-body uppercase tracking-widest">Akademi VOKAL</AppText>
                  <AppText size="2xl" className="text-white font-heading">{levelName}</AppText>
                </View>
                <View className="items-end">
                  <AppText size="xs" className="text-surface/50 font-body mb-0.5">Total XP</AppText>
                  <AppText size="2xl" className="text-mustard font-display">{xp.toLocaleString()}</AppText>
                </View>
              </View>

              {/* XP Bar */}
              <View className="bg-surface/15 rounded-full h-2.5 overflow-hidden mb-1.5">
                <View className="h-full bg-mustard rounded-full" style={{ width: `${xpPct}%` }} />
              </View>
              <AppText size="xs" className="text-surface/40 font-body">{xp.toLocaleString()} / {xpNextLevel.toLocaleString()} XP</AppText>

              {/* Lives */}
              <View className="flex-row items-center gap-3 mt-4">
                <View className="flex-row gap-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart key={i} color="#C1592E" size={18} fill={i < lives ? '#C1592E' : 'transparent'} opacity={i < lives ? 1 : 0.3} />
                  ))}
                </View>
                <AppText size="xs" className="text-surface/60 font-body">{lives} nyawa tersisa</AppText>
                {lives < 3 && (
                  <TouchableOpacity onPress={resetLives} className="ml-auto bg-mustard/20 rounded-full px-3 py-1">
                    <AppText size="xs" className="text-mustard font-display">Isi Ulang</AppText>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                className="mt-5 bg-mustard rounded-2xl py-4 items-center flex-row justify-center gap-2"
                style={{ borderBottomWidth: 4, borderColor: '#b07a28' }}
                onPress={() => setShowPath(true)}
                activeOpacity={0.85}
              >
                <PlayCircle color="#3E2E22" size={20} />
                <AppText size="base" className="text-espresso font-heading">Mulai Perjalanan</AppText>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* STAT CARDS */}
          <View className="flex-row gap-3 mx-5 mt-4">
            {[
              { label: 'Modul Selesai', value: `${completedIds.size}/${BASE_MODULES.length - 1}`, icon: <BookOpen color="#74822F" size={18} /> },
              { label: 'Nyawa', value: `${lives}/3`, icon: <Heart color="#C1592E" size={18} fill={lives > 0 ? '#C1592E' : 'transparent'} /> },
            ].map((stat, i) => (
              <View key={i} className="flex-1 bg-surface rounded-2xl p-4 border border-espresso/6" style={{ elevation: 1, shadowColor: '#3E2E22', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 }}>
                <View className="mb-2">{stat.icon}</View>
                <AppText size="xl" className="text-espresso font-display">{stat.value}</AppText>
                <AppText size="xs" className="text-text-muted font-body">{stat.label}</AppText>
              </View>
            ))}
          </View>

          {/* LEADERBOARD */}
          <View className="mx-5 mt-4 rounded-[24px] overflow-hidden" style={{ elevation: 4, shadowColor: '#3E2E22', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 }}>
            <LinearGradient colors={['#2A1F17', '#3E2E22']} className="p-5">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <Trophy color="#E8A33D" size={20} />
                  <AppText size="base" className="text-white font-heading">Papan Peringkat</AppText>
                </View>
                <TouchableOpacity onPress={refreshLeaderboard} className="bg-surface/10 rounded-full px-3 py-1">
                  <AppText size="xs" className="text-surface/60 font-body">Perbarui</AppText>
                </TouchableOpacity>
              </View>
              <LeaderboardMini leaderboard={leaderboard} loading={isLoadingLeaderboard} />
            </LinearGradient>
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PATH VIEW ───────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      {/* Path Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <TouchableOpacity onPress={() => setShowPath(false)} className="w-9 h-9 rounded-full bg-espresso/8 items-center justify-center">
          <ChevronLeft color="#3E2E22" size={22} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-3">
          {/* Lives */}
          <View className="flex-row gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} color="#C1592E" size={18} fill={i < lives ? '#C1592E' : 'transparent'} opacity={i < lives ? 1 : 0.25} />
            ))}
          </View>
          {/* XP */}
          <View className="flex-row items-center bg-mustard/15 rounded-full px-3 py-1.5 gap-1.5">
            <Zap color="#E8A33D" size={13} fill="#E8A33D" />
            <AppText size="xs" className="text-mustard font-display">{xp.toLocaleString()} XP</AppText>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 60, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Connecting dashed lines */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' }}>
          {modules.map((mod, index) => {
            if (index >= modules.length - 1) return null;
            const offsetX = Math.sin(index * 1.4) * (width * 0.22);
            const nextOffsetX = Math.sin((index + 1) * 1.4) * (width * 0.22);
            const dx = nextOffsetX - offsetX;
            const dy = 116;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const isDone = mod.type === 'done';
            return (
              <View
                key={`line-${index}`}
                style={{
                  position: 'absolute',
                  top: index * 116 + 100,
                  transform: [{ translateX: (offsetX + nextOffsetX) / 2 }, { rotate: `${angle}deg` }],
                  width: length,
                  height: 5,
                  borderBottomWidth: 5,
                  borderStyle: 'dashed',
                  borderColor: isDone ? '#74822F' : '#E0D5C8',
                }}
              />
            );
          })}
        </View>

        {/* Nodes */}
        {modules.map((mod, index) => (
          <PathNode
            key={mod.id}
            mod={mod}
            index={index}
            onPress={() => handleNodePress(mod)}
            bounceAnim={bounceAnim}
          />
        ))}
      </ScrollView>

      {/* MODULE DETAIL BOTTOM SHEET */}
      <Modal visible={!!selectedMod} transparent animationType="none">
        <Pressable className="flex-1 justify-end bg-espresso/50" onPress={() => setSelectedMod(null)}>
          <Pressable>
            <Animated.View entering={SlideInDown.springify()} exiting={SlideOutDown} className="bg-cream rounded-t-[32px] p-6 pt-8 border-t border-espresso/10">
              <View className="w-12 h-1.5 rounded-full bg-espresso/10 self-center mb-5" />

              <View className="items-center mb-5">
                <View className="w-16 h-16 rounded-full items-center justify-center mb-3" style={{ backgroundColor: selectedMod?.bgColor }}>
                  {selectedMod && <NodeIcon icon={selectedMod.icon} color="#FFFFFF" size={28} />}
                </View>
                <AppText size="xl" className="text-espresso font-heading text-center">{selectedMod?.title}</AppText>
                <AppText size="sm" className="text-text-muted font-body text-center mt-1">{selectedMod?.subtitle}</AppText>
                <View className="flex-row items-center bg-mustard/15 rounded-full px-4 py-2 mt-3 gap-1.5">
                  <Zap color="#E8A33D" size={13} fill="#E8A33D" />
                  <AppText size="sm" className="text-mustard font-display">+{selectedMod?.xpReward} XP</AppText>
                </View>
              </View>

              <TouchableOpacity
                className="w-full bg-mustard rounded-2xl py-4 items-center"
                style={{ borderBottomWidth: 4, borderColor: '#b07a28' }}
                onPress={startModule}
                activeOpacity={0.85}
              >
                <AppText size="base" className="text-espresso font-heading">Mulai Latihan</AppText>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* QUIZ MODAL */}
      <Modal visible={showQuiz} animationType="slide" statusBarTranslucent>
        {showQuiz && quizQs.length > 0 && (
          <QuizSession
            questions={quizQs}
            lives={lives}
            onClose={() => { setShowQuiz(false); setActiveQuizCategory(null); }}
            onComplete={handleQuizComplete}
            onReduceLife={reduceLife}
          />
        )}
      </Modal>

      {/* SIM MODAL */}
      <Modal visible={showSim} animationType="slide" statusBarTranslucent>
        {showSim && currentSim && (
          <SimSession
            scenario={currentSim}
            lives={lives}
            onClose={() => { setShowSim(false); setActiveSimId(null); }}
            onComplete={handleSimComplete}
            onReduceLife={reduceLife}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}
