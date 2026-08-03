import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withSequence, withSpring, FadeInDown, FadeInUp, ZoomIn, ZoomOut, SlideInDown, SlideOutDown, withRepeat } from 'react-native-reanimated';
import { PhoneCall, BookOpen, HelpCircle, Lock, Trophy, Award, X, Play, CheckCircle2, AlertCircle, Check, Star, Heart, ChevronLeft } from 'lucide-react-native';
import { MOCK_USER } from '../../data/mock';
import VokalMascot from '../../components/Mascot';
import { useUser } from '../../context/UserContext';
import { AppText } from '../../components/ui/AppText';

const { width } = Dimensions.get('window');

// Path Modules (Duolingo Style)
const MODULES = [
  { id: '1', type: 'done', title: 'Setup Codeword', icon: <Check color="#FFFFFF" size={32} strokeWidth={3} />, xp: 0 },
  { id: '2', type: 'active', title: 'Quiz VOKAL', icon: <Star color="#FFFFFF" size={32} fill="#FFFFFF" />, xp: 20, desc: 'Latih telingamu! Apakah suara ini asli atau AI kloningan?' },
  { id: '3', type: 'locked', title: 'Practice Call', icon: <PhoneCall color="#A39686" size={24} />, xp: 50, desc: 'Simulasi menerima telepon scam darurat.' },
  { id: '4', type: 'locked', title: 'Scam Story', icon: <BookOpen color="#A39686" size={24} />, xp: 30, desc: 'Cerita interaktif tentang penipuan AI.' },
  { id: '5', type: 'chest', title: 'Sertifikat', icon: <Award color="#A39686" size={32} />, xp: 0, desc: 'Dapatkan sertifikat Keluarga Anti-Scam!' },
];

export default function AkademiScreen() {
  const [selectedModule, setSelectedModule] = useState<typeof MODULES[0] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<'asli' | 'ai' | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTrack, setShowTrack] = useState(false);
  
  const { xp, lives, leaderboard, addXP, reduceLife, resetLives } = useUser();
  
  const scaleAnim = useSharedValue(1);
  const bounceAnim = useSharedValue(0);

  React.useEffect(() => {
    bounceAnim.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedBounce = useAnimatedStyle(() => ({ transform: [{ translateY: bounceAnim.value }] }));
  const animatedScale = useAnimatedStyle(() => ({ transform: [{ scale: scaleAnim.value }] }));

  const handleNodeClick = (mod: typeof MODULES[0]) => {
    if (mod.type === 'locked' || mod.type === 'chest') return; // Bisa tambahkan getaran/shake
    setSelectedModule(mod);
  };

  const startModule = () => {
    setSelectedModule(null);
    if (selectedModule?.id === '2') {
      setTimeout(() => setShowQuiz(true), 300);
    }
  };

  const handleAnswer = (answer: 'asli' | 'ai') => {
    setQuizAnswer(answer);
    if (answer === 'asli') {
      reduceLife();
    } else {
      addXP(20);
    }
    setQuizFinished(true);
    scaleAnim.value = withSequence(withSpring(1.1), withSpring(1));
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setTimeout(() => {
      setQuizAnswer(null);
      setQuizFinished(false);
      if (lives <= 1 && quizAnswer === 'asli') resetLives(); // reset jika mati
    }, 500);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      
      {/* HEADER STICKY (XP & LEADERBOARD BTN) */}
      <View className="flex-row justify-between items-center px-5 pt-4 pb-2 z-10 bg-cream">
        <View className="flex-row items-center bg-mustard/20 px-3 py-2 rounded-full border border-mustard/30">
          <AppText size="xl" className="mr-1">🔥</AppText>
          <AppText size="sm" className="font-heading text-mustard">{MOCK_USER.xp} XP</AppText>
        </View>
        <TouchableOpacity onPress={() => setShowLeaderboard(true)} className="w-10 h-10 rounded-full bg-espresso/5 border border-espresso/10 items-center justify-center">
          <Trophy color="#3E2E22" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 160, paddingTop: 40 }} showsVerticalScrollIndicator={false}>
        
        {!showTrack ? (
          <Animated.View entering={FadeInDown.springify()} className="px-5 mb-8">
            <View className="bg-surface rounded-[24px] p-6 shadow-sm border border-espresso/5">
              <View className="items-center mb-6 mt-2">
                <AppText size="3xl" className="font-display text-espresso">{xp.toLocaleString()}</AppText>
                <AppText size="xs" className="text-text-muted font-body uppercase tracking-widest mt-1">Total XP Kamu</AppText>
              </View>
              
              <AppText size="lg" className="text-espresso font-heading text-center mb-2">🎓 Selamat Datang di Akademi!</AppText>
              <AppText size="sm" className="text-text-muted font-body text-center mb-8 leading-relaxed">
                Kumpulkan XP dengan menyelesaikan misi dan kuis untuk melatih instingmu. Buktikan kamu yang paling jago membedakan suara asli dan AI kloningan.
              </AppText>
              
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setShowTrack(true)}
                className="w-full bg-mustard py-4 rounded-2xl items-center border-b-4 border-[#d49232]"
              >
                <AppText size="base" className="font-heading text-espresso">Mulai Perjalanan</AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
        <View className="items-center px-5 relative mb-12">
          {/* BACK BUTTON */}
          <View className="w-full flex-row justify-start mb-4 -ml-4 z-30">
            <TouchableOpacity onPress={() => setShowTrack(false)} className="w-10 h-10 rounded-full bg-espresso/5 items-center justify-center border border-espresso/10">
              <ChevronLeft color="#3E2E22" size={24} />
            </TouchableOpacity>
          </View>

          {/* CONNECTING LINES */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' }}>
            {MODULES.map((mod, index) => {
              if (index === MODULES.length - 1) return null;
              const offsetX = Math.sin(index * 1.5) * (width * 0.25);
              const nextOffsetX = Math.sin((index + 1) * 1.5) * (width * 0.25);
              const dx = nextOffsetX - offsetX;
              const dy = 112;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              const isDone = mod.type === 'done';
              return (
                <View 
                  key={`line-${index}`}
                  style={{
                    position: 'absolute',
                    top: index * 112 + 40 - 2,
                    transform: [
                      { translateX: (offsetX + nextOffsetX) / 2 },
                      { rotate: `${angle}deg` }
                    ],
                    width: length,
                    height: 4,
                    borderBottomWidth: 4,
                    borderStyle: 'dashed',
                    borderColor: isDone ? '#74822F' : '#E8E2D9',
                  }}
                />
              );
            })}
          </View>

          {MODULES.map((mod, index) => {
            // Kalkulasi zigzag (serpentine)
            const offsetX = Math.sin(index * 1.5) * (width * 0.25);
            
            const isDone = mod.type === 'done';
            const isActive = mod.type === 'active';
            const isChest = mod.type === 'chest';
            
            // Warna node
            let bgColor = 'bg-espresso/10';
            let borderColor = 'border-espresso/15';
            let shadowStyle = {};

            if (isDone) {
              bgColor = 'bg-olive';
              borderColor = 'border-[#5c6823]';
              shadowStyle = { shadowColor: '#74822F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 0 };
            } else if (isActive) {
              bgColor = 'bg-mustard';
              borderColor = 'border-[#d49232]';
              shadowStyle = { shadowColor: '#E8A33D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.6, shadowRadius: 0 };
            } else if (isChest) {
              bgColor = 'bg-terracotta/20';
              borderColor = 'border-terracotta/30';
            }

            return (
              <Animated.View 
                entering={FadeInDown.delay(index * 150).springify()} 
                key={mod.id} 
                className="mb-8 items-center"
                style={{ transform: [{ translateX: offsetX }] }}
              >
                {/* MASCOT ON ACTIVE NODE */}
                {isActive && (
                  <Animated.View style={animatedBounce} className="absolute -top-16 z-20">
                    <VokalMascot size={70} />
                  </Animated.View>
                )}

                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => handleNodeClick(mod)}
                  className={`w-20 h-20 rounded-full items-center justify-center border-b-4 ${bgColor} ${borderColor}`}
                  style={shadowStyle}
                >
                  {mod.icon}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        )}

        {/* LEADERBOARD (Moved back to main screen) */}
        <Animated.View entering={FadeInDown.delay(800).springify()} className="px-5">
          <View className="bg-espresso rounded-[24px] p-5 overflow-hidden shadow-md">
            <LinearGradient colors={['rgba(232, 163, 61, 0.1)', 'transparent']} className="absolute inset-0" />
            <View className="flex-row items-center gap-2 mb-4">
              <Trophy color="#E8A33D" size={20} />
              <AppText size="base" className="text-white font-heading">Papan Peringkat RT/RW</AppText>
            </View>
            
            <View className="gap-3">
              {leaderboard.map((item, i) => (
                <View key={item.name} className={`flex-row items-center p-3 rounded-2xl ${item.isMe ? 'bg-mustard border border-mustard/50' : 'bg-surface/10'}`}>
                  <AppText size="sm" className={`font-display w-6 text-center ${item.isMe ? 'text-espresso' : 'text-cream/50'}`}>#{item.rank}</AppText>
                  <AppText size="sm" className={`flex-1 font-heading ml-2 ${item.isMe ? 'text-espresso' : 'text-cream'}`}>{item.name}</AppText>
                  <AppText size="xs" className={`font-display ${item.isMe ? 'text-espresso' : 'text-mustard'}`}>{item.score.toLocaleString()} XP</AppText>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* BOTTOM SHEET MODAL (MODULE DETAILS) */}
      {/* BOTTOM SHEET MODAL (MODULE DETAILS) */}
      <Modal visible={!!selectedModule} transparent animationType="none">
        <View className="flex-1 justify-end bg-espresso/40">
          <TouchableOpacity className="absolute inset-0" onPress={() => setSelectedModule(null)} />
          <Animated.View entering={SlideInDown.springify()} exiting={SlideOutDown} className="bg-cream rounded-t-[32px] p-6 pt-8 border-t border-espresso/10 max-h-[85%]">
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View className="items-center mb-6">
                <View className="w-16 h-1 rounded-full bg-espresso/10 absolute -top-4" />
                <AppText size="2xl" className="font-heading text-espresso text-center">{selectedModule?.title}</AppText>
                <AppText size="sm" className="font-body text-text-muted text-center mt-2 px-4">{selectedModule?.desc}</AppText>
                
                <View className="flex-row items-center bg-mustard/20 px-4 py-2 rounded-full mt-4">
                  <AppText size="sm" className="font-heading text-mustard">Ganjaran: +{selectedModule?.xp} XP</AppText>
                </View>
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={startModule}
                className="w-full bg-mustard py-4 rounded-2xl items-center border-b-4 border-[#d49232] shadow-sm mb-4"
              >
                <AppText size="lg" className="font-heading text-espresso">Mulai Latihan</AppText>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* QUIZ MODAL (Existing logic) */}
      <Modal visible={showQuiz} transparent animationType="fade">
        <View className="flex-1 bg-espresso/90 justify-center items-center px-5">
          <Animated.View entering={ZoomIn.springify()} exiting={ZoomOut} className="bg-cream w-full rounded-[32px] overflow-hidden shadow-xl border border-espresso/10 max-h-[90%]">
            <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ padding: 24 }}>
              <View className="flex-row justify-between items-center mb-6">
                <AppText size="lg" className="text-espresso font-heading">Quiz VOKAL</AppText>
                
                <View className="flex-row gap-1">
                  {[0, 1, 2].map((i) => (
                    <Heart key={i} color={i < lives ? "#C1592E" : "#A39686"} size={20} fill={i < lives ? "#C1592E" : "transparent"} opacity={i < lives ? 1 : 0.4} />
                  ))}
                </View>

                <TouchableOpacity onPress={closeQuiz} className="w-8 h-8 rounded-full bg-espresso/10 items-center justify-center">
                  <X color="#3E2E22" size={18} />
                </TouchableOpacity>
              </View>

              <AppText size="sm" className="text-text-muted font-body mb-4 text-center">Dengarkan klip suara berikut:</AppText>
              
              <View className="bg-surface rounded-3xl p-5 items-center mb-6 border border-espresso/5 shadow-sm">
                <TouchableOpacity className="w-16 h-16 rounded-full bg-mustard items-center justify-center mb-3">
                  <Play color="#3E2E22" size={24} fill="#3E2E22" />
                </TouchableOpacity>
                <AppText size="xs" className="text-espresso font-display">"Ma, ini Rini, minta transfer cepat 2 juta..."</AppText>
              </View>

              <AppText size="base" className="text-espresso font-heading text-center mb-4">Apakah ini Suara Asli atau AI Kloningan?</AppText>

              <View className="flex-row gap-3">
                <TouchableOpacity disabled={quizFinished} onPress={() => handleAnswer('asli')} className={`flex-1 py-4 rounded-2xl items-center border-2 ${quizAnswer === 'asli' ? 'bg-terracotta border-terracotta' : 'bg-surface border-espresso/10'}`}>
                  <AppText size="sm" className={`font-display ${quizAnswer === 'asli' ? 'text-white' : 'text-espresso'}`}>Suara Asli</AppText>
                </TouchableOpacity>
                <TouchableOpacity disabled={quizFinished} onPress={() => handleAnswer('ai')} className={`flex-1 py-4 rounded-2xl items-center border-2 ${quizAnswer === 'ai' ? 'bg-olive border-olive' : 'bg-surface border-espresso/10'}`}>
                  <AppText size="sm" className={`font-display ${quizAnswer === 'ai' ? 'text-white' : 'text-espresso'}`}>AI Kloningan</AppText>
                </TouchableOpacity>
              </View>

              {quizFinished && (
                <Animated.View style={animatedScale} className={`mt-6 p-4 rounded-2xl flex-row items-start gap-3 ${quizAnswer === 'ai' ? 'bg-olive/10 border-olive/20' : 'bg-terracotta/10 border-terracotta/20'} border`}>
                  {quizAnswer === 'ai' ? <CheckCircle2 color="#74822F" size={24} /> : <AlertCircle color="#C1592E" size={24} />}
                  <View className="flex-1">
                    <AppText size="sm" className={`font-heading mb-1 ${quizAnswer === 'ai' ? 'text-olive' : 'text-terracotta'}`}>
                      {quizAnswer === 'ai' ? 'Tepat Sekali! (+20 XP)' : lives === 0 ? 'Game Over! Nyawa Habis!' : 'Oops, Hampir Benar! (-1 Nyawa)'}
                    </AppText>
                    <AppText size="xs" className="font-body text-text-muted leading-relaxed">
                      {quizAnswer === 'ai' ? 'Nada bicaranya kaku dan tidak ada jeda napas yang natural.' : 'Ini adalah kloningan AI. Tidak ada suara napas dan nadanya sangat kaku.'}
                    </AppText>
                  </View>
                </Animated.View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* LEADERBOARD MODAL */}
      <Modal visible={showLeaderboard} transparent animationType="slide">
        <View className="flex-1 justify-end bg-espresso/50">
          <View className="bg-cream rounded-t-[32px] p-6 pt-8 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center gap-2">
                <Trophy color="#E8A33D" size={24} />
                <AppText size="xl" className="font-heading text-espresso">Papan Peringkat</AppText>
              </View>
              <TouchableOpacity onPress={() => setShowLeaderboard(false)} className="bg-espresso/10 p-2 rounded-full">
                <X color="#3E2E22" size={16} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-3 pb-8">
                {leaderboard.map((item, i) => (
                  <View key={item.name} className={`flex-row items-center p-4 rounded-2xl ${item.isMe ? 'bg-mustard/20 border border-mustard/50' : 'bg-surface border border-espresso/5'}`}>
                    <AppText size="sm" className={`font-display w-6 text-center ${item.isMe ? 'text-espresso' : 'text-espresso/40'}`}>#{item.rank}</AppText>
                    <AppText size="sm" className={`flex-1 font-heading ml-2 ${item.isMe ? 'text-espresso' : 'text-espresso/70'}`}>{item.name}</AppText>
                    <AppText size="xs" className={`font-display ${item.isMe ? 'text-espresso' : 'text-mustard'}`}>{item.score.toLocaleString()} XP</AppText>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
