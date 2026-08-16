import { useNavigation } from "@react-navigation/native";
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/ui/AppText";
import { useConfirmModal } from "../../components/ui/ConfirmModal";
import { useGoogleAuth } from "../../context/GoogleAuthContext";
import {
  analyzeWithGemini,
  GeminiAnalysisFlag,
  GeminiAnalysisResult,
} from "../../utils/geminiAnalyzer";

const GMAIL_FETCH_LIMIT = 15;

function FlagCard({ flag }: { flag: GeminiAnalysisFlag }) {
  const styles = {
    danger: {
      border: "border-terracotta/40",
      bg: "bg-terracotta/8",
      dot: "#C1592E",
    },
    warning: {
      border: "border-mustard/40",
      bg: "bg-mustard/8",
      dot: "#E8A33D",
    },
    info: { border: "border-olive/40", bg: "bg-olive/8", dot: "#74822F" },
  }[flag.level] ?? {
    border: "border-espresso/20",
    bg: "bg-espresso/5",
    dot: "#3E2E22",
  };

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      className={`${styles.bg} border ${styles.border} rounded-2xl p-3.5 mb-2`}
    >
      <View className="flex-row items-center gap-2 mb-1">
        <View
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: styles.dot }}
        />
        <AppText size="sm" className="text-espresso font-heading flex-1">
          {flag.label}
        </AppText>
      </View>
      <AppText size="xs" className="text-espresso/70 font-body leading-relaxed">
        {flag.description}
      </AppText>
    </Animated.View>
  );
}

function ScoreRing({ score, verdict }: { score: number; verdict: string }) {
  const color = score >= 50 ? "#C1592E" : score >= 20 ? "#E8A33D" : "#74822F";
  const bgColor =
    score >= 50
      ? "bg-terracotta/10"
      : score >= 20
        ? "bg-mustard/10"
        : "bg-olive/10";
  const borderColor =
    score >= 50
      ? "border-terracotta/30"
      : score >= 20
        ? "border-mustard/30"
        : "border-olive/30";
  return (
    <View
      className={`items-center py-6 mx-4 rounded-[20px] ${bgColor} border ${borderColor} mb-4`}
    >
      <View
        className="w-28 h-28 rounded-full items-center justify-center border-8 mb-3"
        style={{ borderColor }}
      >
        <AppText size="3xl" className="font-display" style={{ color }}>
          {score}
        </AppText>
        <AppText size="xs" className="text-text-muted font-body">
          / 100
        </AppText>
      </View>
      <View
        className="px-5 py-2 rounded-full"
        style={{ backgroundColor: color }}
      >
        <AppText size="sm" className="text-white font-heading">
          {verdict}
        </AppText>
      </View>
    </View>
  );
}

type EmailItem = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
};

function EmailListItem({
  email,
  selected,
  onToggle,
}: {
  email: EmailItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.75}
      className={`rounded-2xl p-4 mb-2.5 border ${selected ? "bg-terracotta/8 border-terracotta/30" : "bg-surface border-espresso/8"}`}
    >
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5">
          {selected ? (
            <CheckSquare color="#C1592E" size={22} fill="#C1592E" />
          ) : (
            <Square color="#9E8E7E" size={22} />
          )}
        </View>
        <View className="flex-1">
          <AppText
            size="sm"
            className="text-text-muted font-body mb-0.5"
            numberOfLines={1}
          >
            {email.from}
          </AppText>
          <AppText
            size="base"
            className="text-espresso font-heading leading-tight"
            numberOfLines={2}
          >
            {email.subject}
          </AppText>
          <AppText
            size="sm"
            className="text-text-muted font-body mt-1 leading-relaxed"
            numberOfLines={2}
          >
            {email.snippet}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CekEmailScreen() {
  const navigation = useNavigation();
  const {
    connectGoogle,
    ensureFreshToken,
    googleAccessToken,
    isGoogleConnected,
  } = useGoogleAuth();
  const { showConfirm } = useConfirmModal();

  type Mode = "choose" | "manual" | "gmail_list" | "result";
  const [mode, setMode] = useState<Mode>("choose");
  const [manualText, setManualText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [result, setResult] = useState<GeminiAnalysisResult | null>(null);

  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [analyzedEmails, setAnalyzedEmails] = useState<
    { subject: string; from: string; snippet: string }[]
  >([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleConnectGmail = async () => {
    try {
      setIsLoadingGmail(true);
      let token = googleAccessToken;
      if (!token) token = await connectGoogle();
      else token = await ensureFreshToken();
      if (!token) return;
      await fetchGmailEmails(token);
    } catch (err: any) {
      showConfirm({
        title: "Gagal Hubungkan Gmail",
        message: err.message || "Silakan coba lagi.",
        confirmText: "Mengerti",
        cancelText: "",
        variant: "terracotta",
        iconType: "danger",
      });
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const fetchGmailEmails = async (accessToken: string, pageToken?: string) => {
    const isLoadMore = !!pageToken;
    let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${GMAIL_FETCH_LIMIT}&labelIds=INBOX`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const listRes = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const listJson = await listRes.json();

    if (listJson.error)
      throw new Error(listJson.error.message || "Gagal akses Gmail API.");

    const messages: Array<{ id: string }> = listJson.messages || [];
    if (messages.length === 0) {
      if (!isLoadMore) {
        showConfirm({
          title: "Inbox Kosong",
          message: "Tidak ditemukan email di Inbox.",
          confirmText: "Mengerti",
          cancelText: "",
          variant: "mustard",
          iconType: "info",
        });
      } else {
        setNextPageToken(null);
      }
      return;
    }

    const fetched: EmailItem[] = [];
    for (const msg of messages) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const msgJson = await msgRes.json();
      const headers: Array<{ name: string; value: string }> =
        msgJson.payload?.headers || [];
      const subject =
        headers.find((h) => h.name === "Subject")?.value || "(Tanpa Judul)";
      const from =
        headers.find((h) => h.name === "From")?.value ||
        "(Pengirim Tidak Diketahui)";
      const snippet = msgJson.snippet || "";
      fetched.push({
        id: msg.id,
        subject,
        from,
        snippet,
        body: `${subject} ${from} ${snippet}`,
      });
    }

    setNextPageToken(listJson.nextPageToken || null);

    if (isLoadMore) {
      setEmails((prev) => [...prev, ...fetched]);
    } else {
      setEmails(fetched);
      setSelectedIds({});
      setMode("gmail_list");
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      let token = googleAccessToken;
      if (!token) token = await connectGoogle();
      else token = await ensureFreshToken();
      if (!token) return;
      await fetchGmailEmails(token, nextPageToken);
    } catch (err: any) {
      showConfirm({
        title: "Gagal Memuat Lebih Banyak",
        message: err.message || "Silakan coba lagi.",
        confirmText: "Mengerti",
        cancelText: "",
        variant: "terracotta",
        iconType: "danger",
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const runGeminiAnalysis = async (
    text: string,
    type: "email" | "message" = "email",
  ) => {
    try {
      return await analyzeWithGemini({
        type: "text",
        content: text,
        analysisType: type,
      });
    } catch (err: any) {
      throw new Error(
        err.message || "Analisis Gemini gagal. Periksa koneksi internet.",
      );
    }
  };

  const handleAnalyzeSelected = async () => {
    const selectedCount = Object.values(selectedIds).filter(Boolean).length;
    if (selectedCount === 0) {
      showConfirm({
        title: "Pilih Email",
        message: "Pilih setidaknya 1 email untuk dianalisis.",
        confirmText: "Mengerti",
        cancelText: "",
        variant: "mustard",
        iconType: "warning",
      });
      return;
    }
    const selected = emails.filter((e) => selectedIds[e.id]);
    const combined = selected
      .map((e) => `Dari: ${e.from}\nJudul: ${e.subject}\n${e.snippet}`)
      .join("\n\n---\n\n");

    setIsAnalyzing(true);
    try {
      const analysis = await runGeminiAnalysis(combined, "email");
      setAnalyzedEmails(
        selected.map((e) => ({
          subject: e.subject,
          from: e.from,
          snippet: e.snippet,
        })),
      );
      setResult(analysis);
      const status =
        analysis.score >= 50
          ? "bahaya"
          : analysis.score >= 20
            ? "waspada"
            : "aman";
      import("../../utils/analysisHistory").then(({ addAnalysisLog }) => {
        addAnalysisLog(
          "email",
          "Cek Email: Hasil Analisis",
          `Gemini AI: ${analysis.verdict} (Skor Phishing: ${analysis.score}/100).`,
          status,
        );
      });
      setMode("result");
    } catch (err: any) {
      showConfirm({
        title: "Analisis Gagal",
        message: err.message || "Coba lagi atau gunakan metode manual.",
        confirmText: "Mengerti",
        cancelText: "",
        variant: "terracotta",
        iconType: "danger",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeManual = async () => {
    if (manualText.trim().length < 20) {
      showConfirm({
        title: "Teks Terlalu Pendek",
        message:
          "Tempel minimal 20 karakter teks email/pesan yang ingin dianalisis.",
        confirmText: "Mengerti",
        cancelText: "",
        variant: "mustard",
        iconType: "warning",
      });
      return;
    }
    Keyboard.dismiss();
    setIsAnalyzing(true);
    try {
      const analysis = await runGeminiAnalysis(manualText, "email");
      setResult(analysis);
      const status =
        analysis.score >= 50
          ? "bahaya"
          : analysis.score >= 20
            ? "waspada"
            : "aman";
      import("../../utils/analysisHistory").then(({ addAnalysisLog }) => {
        addAnalysisLog(
          "email",
          "Cek Email: Hasil Analisis",
          `Gemini AI: ${analysis.verdict} (Skor Phishing: ${analysis.score}/100).`,
          status,
        );
      });
      setMode("result");
    } catch (err: any) {
      showConfirm({
        title: "Analisis Gagal",
        message: err.message || "Coba lagi.",
        confirmText: "Mengerti",
        cancelText: "",
        variant: "terracotta",
        iconType: "danger",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setManualText("");
    setEmails([]);
    setSelectedIds({});
    setAnalyzedEmails([]);
    setNextPageToken(null);
    setMode("choose");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const selectedCount = Object.values(prev).filter(Boolean).length;
      const allSelected = selectedCount === emails.length;
      const next: Record<string, boolean> = {};
      emails.forEach((e) => {
        next[e.id] = !allSelected;
      });
      return next;
    });
  };

  if (isLoadingGmail) {
    return (
      <SafeAreaView
        edges={["top"]}
        className="flex-1 bg-cream items-center justify-center px-8"
      >
        <ActivityIndicator size="large" color="#E8A33D" />
        <AppText
          size="base"
          className="text-espresso font-heading mt-4 text-center"
        >
          Memuat Email dari Gmail...
        </AppText>
        <AppText
          size="xs"
          className="text-text-muted font-body text-center mt-2 leading-relaxed"
        >
          Mengambil {GMAIL_FETCH_LIMIT} email terbaru dari Inbox kamu.
        </AppText>
      </SafeAreaView>
    );
  }

  if (isAnalyzing) {
    return (
      <SafeAreaView
        edges={["top"]}
        className="flex-1 bg-cream items-center justify-center px-8"
      >
        <View className="w-20 h-20 rounded-full bg-terracotta/10 items-center justify-center mb-4 border-2 border-terracotta/20">
          <Sparkles color="#C1592E" size={36} />
        </View>
        <AppText
          size="lg"
          className="text-espresso font-heading text-center mb-2"
        >
          Gemini AI Sedang Menganalisis
        </AppText>
        <AppText
          size="sm"
          className="text-text-muted font-body text-center leading-relaxed"
        >
          Memeriksa pola phishing, link mencurigakan, dan indikator penipuan...
        </AppText>
        <ActivityIndicator color="#C1592E" style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  if (mode === "gmail_list") {
    const selectedCount = Object.values(selectedIds).filter(Boolean).length;
    const allSelected = selectedCount === emails.length;

    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
        {/* Header */}
        <View className="px-5 pt-4 pb-3 bg-cream border-b border-espresso/8">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => {
                  setMode("choose");
                  setEmails([]);
                }}
                className="w-9 h-9 rounded-full bg-espresso/10 items-center justify-center"
              >
                <X color="#3E2E22" size={18} />
              </TouchableOpacity>
              <View>
                <AppText size="lg" className="text-espresso font-heading">
                  Pilih Email
                </AppText>
                <AppText size="xs" className="text-text-muted font-body">
                  {emails.length} email dari Inbox Gmail
                </AppText>
              </View>
            </View>
            <TouchableOpacity
              onPress={toggleSelectAll}
              className="bg-espresso/8 px-3 py-1.5 rounded-full"
            >
              <AppText size="xs" className="text-espresso font-heading">
                {allSelected ? "Batal Semua" : "Pilih Semua"}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Selected count bar */}
          {selectedCount > 0 && (
            <View className="bg-terracotta/10 rounded-xl px-3 py-2 flex-row items-center gap-2 border border-terracotta/20">
              <CheckSquare color="#C1592E" size={16} />
              <AppText size="xs" className="text-terracotta font-heading">
                {selectedCount} email dipilih untuk dianalisis
              </AppText>
            </View>
          )}
        </View>

        <ScrollView
          className="flex-1 px-5 pt-3"
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          {emails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              selected={!!selectedIds[email.id]}
              onToggle={() => toggleSelect(email.id)}
            />
          ))}

          {nextPageToken && (
            <TouchableOpacity
              onPress={handleLoadMore}
              disabled={isLoadingMore}
              activeOpacity={0.8}
              className="bg-surface border border-espresso/15 rounded-2xl py-3.5 px-4 items-center justify-center my-3 flex-row gap-2 min-h-11"
            >
              {isLoadingMore ? (
                <>
                  <ActivityIndicator size="small" color="#C1592E" />
                  <AppText size="sm" className="text-espresso font-heading">
                    Memuat Email Lainnya...
                  </AppText>
                </>
              ) : (
                <AppText size="sm" className="text-espresso font-heading">
                  Muat Lebih Banyak Email
                </AppText>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Analyze button fixed at bottom (pushed up to clear the absolute tab bar) */}
        <View className="px-5 pb-8 pt-3 bg-cream border-t border-espresso/8 mb-[95px]">
          <TouchableOpacity
            onPress={handleAnalyzeSelected}
            activeOpacity={selectedCount === 0 ? 1 : 0.85}
            className="rounded-2xl py-4 items-center flex-row justify-center gap-2"
            style={{
              backgroundColor: selectedCount === 0 ? "#9E8E7E" : "#C1592E",
            }}
          >
            <Sparkles color="#FFFFFF" size={18} />
            <AppText size="base" className="text-white font-heading">
              {selectedCount === 0
                ? "Pilih Email Dulu"
                : `Analisis ${selectedCount} Email dengan Gemini`}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === "result" && result) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <AppText size="xl" className="text-espresso font-heading">
                Hasil Analisis
              </AppText>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Sparkles color="#C1592E" size={12} />
                <AppText size="xs" className="text-terracotta font-body">
                  Dianalisis oleh Gemini AI
                </AppText>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleReset}
              className="w-9 h-9 rounded-full bg-espresso/10 items-center justify-center"
              accessibilityLabel="Kembali ke menu pilihan"
            >
              <X color="#3E2E22" size={18} />
            </TouchableOpacity>
          </View>

          {/* Score */}
          <ScoreRing score={result.score} verdict={result.verdict} />

          {/* Summary */}
          <View className="bg-surface rounded-2xl p-4 mb-5 border border-espresso/8">
            <AppText
              size="sm"
              className="text-espresso/80 font-body leading-relaxed"
            >
              {result.summary}
            </AppText>
          </View>

          {/* Flags */}
          {result.flags.length > 0 && (
            <>
              <AppText
                size="xs"
                className="text-text-muted font-display uppercase tracking-widest mb-3"
              >
                Temuan Detail
              </AppText>
              {result.flags.map((flag) => (
                <FlagCard key={flag.id} flag={flag} />
              ))}
            </>
          )}

          {/* Analyzed emails list */}
          {analyzedEmails.length > 0 && (
            <>
              <AppText
                size="xs"
                className="text-text-muted font-display uppercase tracking-widest mb-3 mt-4"
              >
                Email Yang Dianalisis ({analyzedEmails.length})
              </AppText>
              {analyzedEmails.map((email, i) => (
                <View
                  key={i}
                  className="bg-surface rounded-2xl p-4 mb-2 border border-espresso/5"
                >
                  <AppText
                    size="xs"
                    className="text-espresso/50 font-body"
                    numberOfLines={1}
                  >
                    Dari: {email.from}
                  </AppText>
                  <AppText
                    size="sm"
                    className="text-espresso font-heading mt-0.5"
                    numberOfLines={1}
                  >
                    {email.subject}
                  </AppText>
                  <AppText
                    size="xs"
                    className="text-text-muted font-body mt-1"
                    numberOfLines={2}
                  >
                    {email.snippet}
                  </AppText>
                </View>
              ))}
            </>
          )}

          {/* Action buttons */}
          <View className="gap-3 mt-5">
            {emails.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setResult(null);
                  setMode("gmail_list");
                }}
                activeOpacity={0.85}
                className="bg-espresso rounded-2xl py-4 items-center flex-row justify-center gap-2"
              >
                <RotateCcw color="#FFFFFF" size={16} />
                <AppText size="sm" className="text-white font-heading">
                  Pilih Email Lain
                </AppText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleReset}
              activeOpacity={0.85}
              className="border border-espresso/20 rounded-2xl py-3.5 items-center"
            >
              <AppText size="sm" className="text-espresso font-heading">
                Kembali ke Menu Pilihan
              </AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (mode === "choose") {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
        <View className="flex-row items-center px-5 pt-3 pb-1 gap-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-espresso/8 items-center justify-center"
          >
            <ChevronLeft color="#3E2E22" size={24} />
          </TouchableOpacity>
          <AppText size="lg" className="text-espresso font-heading">
            Kembali
          </AppText>
        </View>
        <ScrollView
          className="flex-1 px-5 pt-2"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <Animated.View entering={FadeInDown.springify()} className="mb-6">
            <View className="flex-row items-center gap-3 mb-1">
              <View className="w-10 h-10 rounded-2xl bg-terracotta items-center justify-center">
                <Mail color="#FFFFFF" size={18} />
              </View>
              <AppText size="2xl" className="text-espresso font-heading">
                Cek Email Phishing
              </AppText>
            </View>
            <AppText
              size="sm"
              className="text-text-muted font-body leading-relaxed"
            >
              Gunakan Gemini AI untuk mendeteksi phishing, link berbahaya, dan
              modus penipuan dalam email atau pesan.
            </AppText>
          </Animated.View>

          {/* Gemini badge */}
          <Animated.View
            entering={FadeInDown.delay(50).springify()}
            className="flex-row items-center gap-2 bg-terracotta/10 border border-terracotta/20 rounded-xl px-3 py-2.5 mb-5"
          >
            <Sparkles color="#C1592E" size={16} />
            <AppText
              size="xs"
              className="text-terracotta font-body flex-1 leading-relaxed"
            >
              Ditenagai oleh Google Gemini 3.1 Flash-Lite - analisis AI yang
              akurat dan kontekstual untuk penipuan Indonesia.
            </AppText>
          </Animated.View>

          {/* Option 1: Gmail */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <TouchableOpacity
              className="bg-espresso rounded-[20px] p-5 mb-3 flex-row items-center gap-4"
              onPress={handleConnectGmail}
              activeOpacity={0.85}
            >
              <View className="w-14 h-14 rounded-2xl bg-mustard/20 items-center justify-center">
                <Mail color="#E8A33D" size={28} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <AppText size="base" className="text-white font-heading">
                    Sambungkan Gmail
                  </AppText>
                  {isGoogleConnected && (
                    <View className="bg-olive/30 px-2 py-0.5 rounded-full">
                      <AppText size="xs" className="text-olive font-bold">
                        TERHUBUNG
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText
                  size="xs"
                  className="text-surface/60 font-body leading-relaxed"
                >
                  Pilih email mana yang mau dianalisis dari {GMAIL_FETCH_LIMIT}{" "}
                  terbaru
                </AppText>
              </View>
              <ChevronRight color="rgba(255,255,255,0.4)" size={20} />
            </TouchableOpacity>
          </Animated.View>

          {/* Option 2: Manual */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <TouchableOpacity
              className="bg-surface border border-espresso/10 rounded-[20px] p-5 flex-row items-center gap-4"
              onPress={() => setMode("manual")}
              activeOpacity={0.85}
            >
              <View className="w-14 h-14 rounded-2xl bg-olive/10 items-center justify-center">
                <FileText color="#74822F" size={28} />
              </View>
              <View className="flex-1">
                <AppText
                  size="base"
                  className="text-espresso font-heading mb-1"
                >
                  Tempel Teks Manual
                </AppText>
                <AppText
                  size="xs"
                  className="text-text-muted font-body leading-relaxed"
                >
                  Copy-paste isi email, SMS, atau pesan WA yang mencurigakan
                </AppText>
              </View>
              <ChevronRight color="#6B5F52" size={20} />
            </TouchableOpacity>
          </Animated.View>

          {/* Privacy note */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="flex-row gap-2 mt-5 items-start"
          >
            <ShieldCheck color="#74822F" size={16} />
            <AppText
              size="xs"
              className="text-olive font-body flex-1 leading-relaxed"
            >
              Teks diproses secara aman melalui Supabase Edge Function. API key
              Gemini tidak pernah ada di perangkatmu.
            </AppText>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex-row items-center gap-3 mb-5">
          <TouchableOpacity
            onPress={() => setMode("choose")}
            className="w-9 h-9 rounded-full bg-espresso/10 items-center justify-center"
            accessibilityLabel="Kembali"
          >
            <X color="#3E2E22" size={18} />
          </TouchableOpacity>
          <View>
            <AppText size="xl" className="text-espresso font-heading">
              Tempel Teks
            </AppText>
            <AppText size="xs" className="text-text-muted font-body">
              Analisis dengan Gemini AI
            </AppText>
          </View>
        </View>

        <AppText size="xs" className="text-text-muted font-body mb-2">
          Salin seluruh teks email atau pesan mencurigakan, lalu tempel di bawah
          ini:
        </AppText>

        <TextInput
          className="bg-surface rounded-2xl p-4 text-espresso border border-espresso/10"
          style={{
            minHeight: 200,
            textAlignVertical: "top",
            fontSize: 14,
            fontFamily: "DMSans-Regular",
          }}
          placeholder="Contoh: 'Selamat! Anda terpilih memenangkan hadiah Rp 50.000.000. Klik link berikut...'"
          placeholderTextColor="#9E8E7E"
          multiline
          value={manualText}
          onChangeText={setManualText}
          accessibilityLabel="Kolom teks email untuk dianalisis"
        />

        <AppText size="xs" className="text-text-muted font-body mt-2 mb-5">
          {manualText.length} karakter
        </AppText>

        <TouchableOpacity
          className="rounded-2xl py-4 items-center flex-row justify-center gap-2"
          style={{
            backgroundColor: manualText.length < 20 ? "#9E8E7E" : "#C1592E",
          }}
          onPress={handleAnalyzeManual}
          disabled={manualText.length < 20}
          activeOpacity={0.85}
        >
          <Sparkles color="#FFFFFF" size={18} />
          <AppText size="sm" className="text-white font-heading">
            Analisis dengan Gemini
          </AppText>
        </TouchableOpacity>

        {manualText.length < 20 && manualText.length > 0 && (
          <AppText
            size="xs"
            className="text-text-muted font-body text-center mt-2"
          >
            Perlu minimal 20 karakter
          </AppText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
