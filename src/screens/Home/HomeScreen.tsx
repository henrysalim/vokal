import {
  BarChart2,
  BookOpen,
  ChevronRight,
  Flame,
  Lock,
  Phone,
  Share2,
  ShieldCheck,
} from "lucide-react-native";
import React, { useEffect } from "react";
import {
  Linking,
  ScrollView,
  Share,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/auth";
import VokalMascot from "../../components/Mascot";
import { useConfirmModal } from "../../components/ui/ConfirmModal";
import { AppText } from "../../components/ui/AppText";
import RadarModus from "../../components/ui/RadarModus";
import { useLansia } from "../../context/LansiaContext";
import { useUser } from "../../context/UserContext";
import { EMERGENCY_CONTACTS } from "../../data/emergencyContacts";
import { QUICK_ACTIONS } from "../../data/mock";
import { generateRandomSecret } from "../../utils/totp";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

type HomeScreenProps = {
  navigation?: any;
};

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuth();
  const { xp, level, levelName, xpNextLevel, codeword, familySecret, updateFamilySecret } = useUser();
  const { isLansiaMode } = useLansia();
  const { showConfirm } = useConfirmModal();
  const userName = user?.name ? user.name.split(" ")[0] : "Pengguna";
  const xpPct = Math.min(100, Math.round((xp / xpNextLevel) * 100));
  const xpWidth = useSharedValue(0);
  const [familyMemberCount, setFamilyMemberCount] = React.useState(1);

  // Load jumlah anggota keluarga dari Supabase
  React.useEffect(() => {
    if (!isSupabaseConfigured() || !user?.id) return;
    supabase
      .from('profiles')
      .select('family_id')
      .eq('id', user.id)
      .single()
      .then(({ data: myProfile }) => {
        if (!myProfile?.family_id) return;
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', myProfile.family_id)
          .then(({ count }) => {
            if (count !== null) setFamilyMemberCount(count);
          });
      });
  }, [user?.id]);

  const handleShareFamily = () => {
    Share.share({
      message: `Yuk gabung ke jaringan aman keluarga kita di VOKAL.\n\nKata rahasia (Codeword) hari ini adalah: [ ${codeword.word} ]\n\nMasukkan Kunci Rahasia ini di aplikasi VOKAL milikmu: [ ${familySecret} ] agar Codeword anti-scam kita selalu sinkron!`,
    });
  };

  const handleQuickAction = (id: string) => {
    if (id === "cek") {
      navigation?.navigate("Analisis", { screen: "CekSuara" });
    } else if (id === "codeword") {
      showConfirm({
        title: "Atur Ulang Codeword?",
        message: "Kunci rahasia keluarga baru akan diacak. Ini akan merubah kata rahasia (Codeword) hari ini. Pastikan Anda membagikan Kunci Rahasia baru ini ke seluruh anggota keluarga agar tetap sinkron.",
        confirmText: "Ya, Acak Baru",
        cancelText: "Batal",
        variant: "terracotta",
        iconType: "warning",
        onConfirm: async () => {
          const newSecret = generateRandomSecret();
          await updateFamilySecret(newSecret);
          setTimeout(() => {
            showConfirm({
              title: "Codeword Diperbarui!",
              message: `Kunci rahasia baru: [ ${newSecret} ]\n\nCodeword hari ini telah disinkronkan ulang. Segera bagikan kunci baru ini ke keluarga Anda agar tetap sinkron.`,
              confirmText: "Bagikan ke Keluarga",
              cancelText: "Selesai",
              variant: "olive",
              iconType: "success",
              onConfirm: () => {
                setTimeout(() => {
                  Share.share({
                    message: `Yuk gabung ke jaringan aman keluarga kita di VOKAL.\n\nKata rahasia (Codeword) hari ini adalah: [ ${codeword.word} ]\n\nMasukkan Kunci Rahasia baru ini di aplikasi VOKAL milikmu: [ ${newSecret} ] agar Codeword anti-scam kita selalu sinkron!`,
                  });
                }, 500);
              },
            });
          }, 500);
        },
      });
    } else if (id === "latihan") {
      navigation?.navigate("Akademi");
    }
  };

  useEffect(() => {
    xpWidth.value = withTiming(xpPct, {
      duration: 1500,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [xpPct, xpWidth]);

  const animatedXpStyle = useAnimatedStyle(() => {
    return { width: `${xpWidth.value}%` };
  });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO HEADER WITH MASCOT */}
        <View className="rounded-[32px] overflow-hidden bg-espresso px-5 pt-5 pb-5">
          <View className="absolute top-4 right-4 w-32 h-32 rounded-full opacity-10 bg-mustard" />
          <View className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10 bg-olive" />

          <View>
            <AppText
              size="3xl"
              className="text-white font-heading leading-tight"
            >
              Hi, {userName}!
            </AppText>
            <View className="flex-row items-center mt-2 bg-mustard/20 rounded-full px-3 py-1 self-start">
              <Flame color="#E8A33D" size={14} />
              <AppText size="xs" className="text-mustard font-display ml-1">
                1 hari streak
              </AppText>
            </View>
          </View>

          <TouchableOpacity
            className="items-center mt-2 mb-4"
            activeOpacity={0.8}
          >
            <VokalMascot size={140} />
          </TouchableOpacity>

          <View className="bg-surface/10 rounded-2xl p-4">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center gap-2">
                <AppText size="lg" className="text-mustard font-display">
                  Lv.{level}
                </AppText>
                <AppText size="xs" className="text-surface/80 font-body">
                  {levelName}
                </AppText>
              </View>
              <View className="flex-row items-center">
                <AppText size="sm" className="text-mustard font-display">
                  {xp.toLocaleString()}{" "}
                </AppText>
                <AppText size="xs" className="text-surface/50 font-body">
                  / {xpNextLevel.toLocaleString()} XP
                </AppText>
              </View>
            </View>
            <View className="w-full bg-surface/20 rounded-full h-3 overflow-hidden">
              <Animated.View
                className="h-full bg-mustard rounded-full"
                style={animatedXpStyle}
              />
            </View>
            <AppText
              size="xs"
              className="text-surface/50 mt-2 font-body text-right"
            >
              {Math.max(0, xpNextLevel - xp)} XP lagi ke level berikutnya
            </AppText>
          </View>
        </View>

        {/* DAY STRIP */}
        <View className="mt-4 bg-surface rounded-2xl p-4 shadow-sm flex-row justify-between">
          {DAYS.map((day, i) => {
            const isToday = i === TODAY_IDX;
            return (
              <TouchableOpacity key={day} className="items-center">
                <AppText size="xs" className="font-body text-text-muted mb-1">
                  {day}
                </AppText>
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${isToday ? "bg-mustard" : "bg-espresso/5"}`}
                >
                  <AppText
                    size="sm"
                    className={`font-display ${isToday ? "text-espresso" : "text-espresso/60"}`}
                  >
                    {new Date(
                      Date.now() + (i - TODAY_IDX) * 86400000,
                    ).getDate()}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CODEWORD HERO CARD */}
        <TouchableOpacity
          activeOpacity={0.9}
          className="mt-4 rounded-[24px] overflow-hidden shadow-sm"
          style={{
            elevation: 2,
            shadowColor: "#3E2E22",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
          }}
        >
          <View className="p-5 bg-white border border-espresso/5 rounded-[24px]">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 pr-2">
                <AppText
                  size="xs"
                  className="text-espresso/70 font-display uppercase tracking-widest mb-1"
                >
                  Codeword Hari Ini
                </AppText>
                <AppText
                  size="3xl"
                  className="text-espresso font-heading tracking-widest"
                >
                  {codeword.word}
                </AppText>
                <View className="flex-row items-center gap-1 mt-1 bg-olive/10 px-2 py-1 rounded-full self-start border border-olive/20">
                  <ShieldCheck color="#74822F" size={10} />
                  <AppText
                    size="xs"
                    className="text-olive font-bold uppercase tracking-wider"
                  >
                    Secured by Blockchain
                  </AppText>
                </View>
                <AppText
                  size="xs"
                  className="text-espresso/40 font-display mt-2"
                  numberOfLines={1}
                >
                  Hash: 0x
                  {codeword.hash ? codeword.hash.substring(0, 20) : "000000"}...
                </AppText>
              </View>
              <View className="bg-espresso/5 rounded-2xl p-3 items-center">
                <AppText size="2xl" className="text-espresso font-display">
                  {codeword.expiresInHours}
                </AppText>
                <AppText size="xs" className="text-espresso/70 font-body">
                  jam lagi
                </AppText>
              </View>
            </View>

            <View className="flex-row items-center mb-4 flex-wrap gap-y-2">
              <View className="flex-row items-center">
                {[0, 1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    className={`w-8 h-8 rounded-full items-center justify-center border-2 ${i < familyMemberCount ? "bg-olive border-olive" : "bg-espresso/10 border-cream/50"} -ml-2 first:ml-0`}
                  >
                    {i < familyMemberCount ? (
                      <AppText size="xs" className="text-white font-display">
                        V
                      </AppText>
                    ) : (
                      <Lock color="#6B5F52" size={12} opacity={0.5} />
                    )}
                  </View>
                ))}
              </View>
              <AppText size="xs" className="text-espresso/80 font-body ml-3">
                {familyMemberCount}/5{" "}
                terverifikasi
              </AppText>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="flex-1 bg-espresso/10 rounded-full h-2 overflow-hidden">
                <View
                  className="h-full bg-olive rounded-full"
                  style={{
                    width: `${Math.min(100, (familyMemberCount / 5) * 100)}%`,
                  }}
                />
              </View>
              <View className="flex-row items-center gap-1">
                <ShieldCheck color="#74822F" size={16} />
                <AppText size="xs" className="text-olive font-display">
                  {familyMemberCount}/5
                </AppText>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleShareFamily}
              activeOpacity={0.8}
              className="mt-5 w-full bg-espresso py-4 rounded-2xl items-center flex-row justify-center gap-2"
            >
              <Share2 color="#FFFFFF" size={16} />
              <AppText size="sm" className="text-cream font-display">
                Bagikan ke Keluarga
              </AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* QUICK ACTIONS */}
        <View className="mt-6">
          <View className="flex-row justify-between items-center mb-3">
            <AppText size="base" className="text-espresso font-heading">
              Aksi Cepat
            </AppText>
            <TouchableOpacity className="flex-row items-center">
              <AppText size="xs" className="text-mustard font-body mr-1">
                Lihat semua
              </AppText>
              <ChevronRight color="#E8A33D" size={14} />
            </TouchableOpacity>
          </View>
          <View className="flex-row justify-between gap-3 flex-wrap">
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => handleQuickAction(action.id)}
                activeOpacity={0.8}
                className={`${isLansiaMode ? "w-full mb-1" : "w-[48%] mb-1"} rounded-2xl p-4 ${action.bg}`}
              >
                <AppText size="2xl" className="mb-3">
                  {action.icon}
                </AppText>
                <AppText
                  size="sm"
                  className={`font-heading mb-1 ${action.textColor}`}
                >
                  {action.title}
                </AppText>
                <AppText
                  size="sm"
                  className={`font-body opacity-80 ${action.textColor}`}
                >
                  {action.desc}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* RADAR MODUS LOKAL */}
        <RadarModus />

        {/* AKADEMI VOKAL (MINI) */}
        <View className="mt-6 bg-surface rounded-[24px] p-5 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-mustard/20 items-center justify-center">
                <BookOpen color="#E8A33D" size={22} />
              </View>
              <View>
                <AppText size="base" className="text-espresso font-heading">
                  Akademi VOKAL
                </AppText>
                <AppText size="xs" className="text-espresso/60 font-body">
                  Total XP kamu:{" "}
                  <AppText size="xs" className="text-mustard font-bold">
                    {xp.toLocaleString()}
                  </AppText>
                </AppText>
              </View>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('Akademi')}
            className="w-full bg-mustard py-3 rounded-xl items-center flex-row justify-center gap-2 border-b-4 border-[#d49232]"
          >
            <AppText size="sm" className="text-espresso font-heading">
              Lanjutkan Perjalanan
            </AppText>
            <ChevronRight color="#3E2E22" size={16} />
          </TouchableOpacity>
        </View>

        {/* SKOR EKSPOSUR SUARA */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation?.navigate('Analisis', { screen: 'CekSuara' })}
          className="mt-6 bg-olive/10 border border-olive/20 rounded-[24px] p-5 mb-6 flex-row items-center gap-4"
        >
          <View className="w-16 h-16 rounded-full bg-olive/20 items-center justify-center">
            <BarChart2 color="#74822F" size={28} />
          </View>
          <View className="flex-1">
            <AppText size="base" className="text-espresso font-heading mb-1">
              Skor Eksposur Suara
            </AppText>
            <AppText
              size="sm"
              className="text-espresso/70 text-justify font-body leading-tight"
            >
              Jejak suaramu di medsos terpantau sedikit. Sangat sulit untuk
              dikloning AI.
            </AppText>
            <View className="bg-olive px-3 py-1 rounded-full self-start mt-2 shadow-sm">
              <AppText size="xs" className="text-white font-bold">
                RISIKO RENDAH
              </AppText>
            </View>
          </View>
          <ChevronRight color="#74822F" size={20} opacity={0.5} />
        </TouchableOpacity>

        {/* KONTAK DARURAT WIDGET */}
        <View className="mt-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Phone color="#3E2E22" size={16} />
              <AppText size="base" className="text-espresso font-heading">
                Kontak Darurat
              </AppText>
            </View>
            <TouchableOpacity
              className="flex-row items-center gap-1"
              onPress={() =>
                navigation?.navigate("Analisis", { screen: "KontakDarurat" })
              }
            >
              <AppText size="xs" className="text-mustard font-body">
                Semua
              </AppText>
              <ChevronRight color="#E8A33D" size={14} />
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-2">
            {EMERGENCY_CONTACTS.slice(0, 3).map((contact) => (
              <TouchableOpacity
                key={contact.id}
                className={`flex-1 ${contact.color} rounded-2xl py-3.5 px-2 items-center gap-1`}
                onPress={() =>
                  showConfirm({
                    title: `Hubungi ${contact.shortName}?`,
                    message: `Anda akan melakukan panggilan telepon ke nomor ${contact.phone}. Pastikan ini adalah tindakan yang aman.`,
                    confirmText: "Hubungi",
                    cancelText: "Batal",
                    variant: "terracotta",
                    iconType: "question",
                    onConfirm: () => Linking.openURL(`tel:${contact.phone}`),
                  })
                }
                activeOpacity={0.8}
                accessibilityLabel={`Hubungi ${contact.shortName}`}
              >
                <Phone color="#FFFFFF" size={18} />
                <AppText size="xs" className="text-white font-display">
                  {contact.phone}
                </AppText>
                <AppText
                  size="xs"
                  className="text-surface/80 font-body text-center"
                  numberOfLines={1}
                >
                  {contact.shortName}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
