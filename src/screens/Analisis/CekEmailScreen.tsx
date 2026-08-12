import { useGoogleAuth } from "@/src/context/GoogleAuthContext";
import * as WebBrowser from "expo-web-browser";
import {
  ChevronRight,
  FileText,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/ui/AppText";
import {
  analyzeForPhishing,
  PhishingAnalysisResult,
  PhishingFlag,
} from "../../utils/phishingEngine";

WebBrowser.maybeCompleteAuthSession();

const GMAIL_FETCH_LIMIT = 10;

function FlagCard({ flag }: { flag: PhishingFlag }) {
  const borderColor =
    flag.level === "danger"
      ? "border-terracotta/40"
      : flag.level === "warning"
        ? "border-mustard/40"
        : "border-olive/40";
  const bgColor =
    flag.level === "danger"
      ? "bg-terracotta/8"
      : flag.level === "warning"
        ? "bg-mustard/8"
        : "bg-olive/8";
  const dotColor =
    flag.level === "danger"
      ? "bg-terracotta"
      : flag.level === "warning"
        ? "bg-mustard"
        : "bg-olive";

  return (
    <View className={`${bgColor} border ${borderColor} rounded-2xl p-3.5 mb-2`}>
      <View className="flex-row items-center gap-2 mb-1">
        <View className={`w-2 h-2 rounded-full ${dotColor}`} />
        <AppText size="sm" className="text-espresso font-heading flex-1">
          {flag.label}
        </AppText>
      </View>
      <AppText size="xs" className="text-espresso/70 font-body leading-relaxed">
        {flag.description}
      </AppText>
    </View>
  );
}

function ScoreRing({ score, verdict }: { score: number; verdict: string }) {
  const color = score >= 50 ? "#C1592E" : score >= 20 ? "#E8A33D" : "#74822F";
  return (
    <View className="items-center py-5">
      <View
        className="w-28 h-28 rounded-full items-center justify-center border-8"
        style={{ borderColor: color }}
      >
        <AppText size="3xl" className="font-display" style={{ color }}>
          {score}
        </AppText>
        <AppText size="xs" className="text-text-muted font-body">
          / 100
        </AppText>
      </View>
      <View
        className="mt-3 px-5 py-2 rounded-full"
        style={{ backgroundColor: color }}
      >
        <AppText size="sm" className="text-white font-heading">
          {verdict}
        </AppText>
      </View>
    </View>
  );
}

export default function CekEmailScreen() {
  const { connectGoogle, ensureFreshToken, googleAccessToken } =
    useGoogleAuth();
  const [mode, setMode] = useState<"choose" | "manual" | "gmail">("choose");
  const [manualText, setManualText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [result, setResult] = useState<PhishingAnalysisResult | null>(null);
  const [gmailEmails, setGmailEmails] = useState<
    Array<{ subject: string; snippet: string; from: string }>
  >([]);
  const [scannedCount, setScannedCount] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [batchIndex, setBatchIndex] = useState<number>(1);

  const handleConnectGmail = async () => {
    try {
      setIsConnectingGmail(true);
      setNextPageToken(null);
      setBatchIndex(1);
      let token = googleAccessToken;
      if (!token) {
        token = await connectGoogle();
      } else {
        token = await ensureFreshToken();
      }

      if (token) {
        await fetchAndAnalyzeGmail(token, null, 1);
      }
    } catch (err: any) {
      Alert.alert("Gagal Hubungkan Gmail", err.message || "Silakan coba lagi.");
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const handleScanNextBatch = async () => {
    if (!nextPageToken) {
      Alert.alert(
        "Akhir Inbox",
        "Semua email terbaru di inbox telah dipindai.",
      );
      return;
    }
    try {
      setIsConnectingGmail(true);
      let token = googleAccessToken;
      if (!token) {
        token = await connectGoogle();
      } else {
        token = await ensureFreshToken();
      }

      if (token) {
        await fetchAndAnalyzeGmail(token, nextPageToken, batchIndex + 1);
      }
    } catch (err: any) {
      Alert.alert(
        "Gagal Pindai Batch Berikutnya",
        err.message || "Silakan coba lagi.",
      );
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const fetchAndAnalyzeGmail = async (
    accessToken: string,
    pageToken?: string | null,
    targetBatch: number = 1,
  ) => {
    try {
      setIsConnectingGmail(true);
      setMode("gmail");

      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${GMAIL_FETCH_LIMIT}&labelIds=INBOX${pageToken ? `&pageToken=${pageToken}` : ""}`;
      const listRes = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const listJson = await listRes.json();

      if (listJson.error) {
        throw new Error(listJson.error.message || "Gagal mengakses API Gmail.");
      }

      const messages: Array<{ id: string }> = listJson.messages || [];
      setNextPageToken(listJson.nextPageToken || null);
      setBatchIndex(targetBatch);

      if (messages.length === 0) {
        Alert.alert(
          "Inbox Kosong",
          "Tidak ditemukan email lebih lanjut di Inbox.",
        );
        return;
      }

      const emailDetails: Array<{
        subject: string;
        snippet: string;
        from: string;
        body: string;
      }> = [];
      for (const msg of messages.slice(0, GMAIL_FETCH_LIMIT)) {
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
        emailDetails.push({
          subject,
          from,
          snippet,
          body: `${subject} ${from} ${snippet}`,
        });
      }

      setGmailEmails(
        emailDetails.map((e) => ({
          subject: e.subject,
          snippet: e.snippet,
          from: e.from,
        })),
      );
      setScannedCount(emailDetails.length);

      const combinedText = emailDetails.map((e) => e.body).join("\n\n");
      const analysis = analyzeForPhishing(combinedText);
      setResult(analysis);
    } catch (err: any) {
      Alert.alert(
        "Gagal Memuat Email",
        err.message || "Pastikan koneksi internet stabil dan coba lagi.",
      );
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const handleAnalyzeManual = () => {
    if (manualText.trim().length < 20) {
      Alert.alert(
        "Teks Terlalu Pendek",
        "Tempel minimal 20 karakter teks email/pesan yang ingin dianalisis.",
      );
      return;
    }
    Keyboard.dismiss();
    setIsAnalyzing(true);
    setTimeout(() => {
      const analysis = analyzeForPhishing(manualText);
      setResult(analysis);
      setIsAnalyzing(false);
    }, 800);
  };

  const handleReset = () => {
    setResult(null);
    setManualText("");
    setGmailEmails([]);
    setNextPageToken(null);
    setBatchIndex(1);
    setMode("choose");
  };

  if (isConnectingGmail) {
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
          {batchIndex > 1 ? `Memuat Email` : "Memuat Konten Gmail..."}
        </AppText>
      </SafeAreaView>
    );
  }

  if (result) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <AppText size="xl" className="text-espresso font-heading">
                Hasil Analisis
              </AppText>
              {mode === "gmail" && (
                <AppText size="xs" className="text-text-muted font-body">
                  Batch #{batchIndex} • {scannedCount} Email Dipindai
                </AppText>
              )}
            </View>
            <TouchableOpacity
              onPress={handleReset}
              className="w-9 h-9 rounded-full bg-espresso/10 items-center justify-center"
              accessibilityLabel="Tutup hasil analisis"
            >
              <X color="#3E2E22" size={18} />
            </TouchableOpacity>
          </View>

          <View
            className="bg-surface rounded-[24px] shadow-sm mb-4"
            style={{ elevation: 2 }}
          >
            <ScoreRing score={result.score} verdict={result.verdict} />
            <View className="px-5 pb-5">
              <AppText
                size="sm"
                className="text-espresso/80 font-body text-center leading-relaxed"
              >
                {result.summary}
              </AppText>
            </View>
          </View>

          <AppText
            size="xs"
            className="text-text-muted font-display uppercase tracking-widest mb-3"
          >
            Temuan Detail
          </AppText>
          {result.flags.map((flag) => (
            <FlagCard key={flag.id} flag={flag} />
          ))}

          {mode === "gmail" && gmailEmails.length > 0 && (
            <>
              <AppText
                size="xs"
                className="text-text-muted font-display uppercase tracking-widest mb-3 mt-4"
              >
                Email Batch #{batchIndex}
              </AppText>
              {gmailEmails.slice(0, 5).map((email, i) => (
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
              {gmailEmails.length > 5 && (
                <AppText
                  size="xs"
                  className="text-text-muted font-body text-center mt-1"
                >
                  ...dan {gmailEmails.length - 5} email lainnya
                </AppText>
              )}
            </>
          )}

          {mode === "gmail" ? (
            <View className="gap-2.5 mt-5">
              <TouchableOpacity
                className="bg-espresso rounded-2xl py-4 items-center flex-row justify-center gap-2"
                onPress={handleScanNextBatch}
                activeOpacity={0.8}
                disabled={!nextPageToken || isConnectingGmail}
                style={{
                  opacity: nextPageToken && !isConnectingGmail ? 1 : 0.6,
                }}
              >
                {isConnectingGmail ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Mail color="#FFFFFF" size={18} />
                    <AppText size="sm" className="text-white font-heading">
                      {nextPageToken
                        ? `Pindai 10 Email Berikutnya (Batch #${batchIndex + 1})`
                        : "Semua Inbox Telah Dipindai"}
                    </AppText>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="border border-espresso/20 rounded-2xl py-3.5 items-center"
                onPress={handleReset}
                activeOpacity={0.8}
              >
                <AppText size="sm" className="text-espresso font-heading">
                  Kembali ke Menu Pilihan
                </AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="mt-5 bg-espresso rounded-2xl py-4 items-center"
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <AppText size="sm" className="text-white font-heading">
                Analisis Teks Lainnya
              </AppText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (mode === "choose") {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="mb-6">
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
              VOKAL menganalisis email/pesan mencurigakan menggunakan 8 kategori
              pola penipuan yang umum di Indonesia.
            </AppText>
          </View>

          {/* HOW IT WORKS */}
          <View className="bg-surface rounded-[20px] p-4 mb-5 shadow-sm">
            <AppText size="sm" className="text-espresso font-heading mb-3">
              Apa yang Dianalisis?
            </AppText>
            {[
              "Domain palsu & link penyingkat berbahaya",
              "Kata-kata mendesak & manipulatif",
              "Modus penipuan berhadiah & lotere",
              "Penyamaran sebagai bank atau pemerintah",
              "Permintaan data finansial & OTP",
              "Pola investasi bodong",
            ].map((item, i) => (
              <AppText
                key={i}
                size="xs"
                className="text-espresso/70 font-body mb-1.5"
              >
                {item}
              </AppText>
            ))}
          </View>

          {/* OPTION 1: Gmail OAuth */}
          <TouchableOpacity
            className="bg-espresso rounded-[20px] p-5 mb-3 flex-row items-center gap-4"
            onPress={handleConnectGmail}
            activeOpacity={0.85}
          >
            <View className="w-14 h-14 rounded-2xl bg-surface/15 items-center justify-center">
              <Mail color="#3E2E22" size={28} />
            </View>
            <View className="flex-1">
              <AppText size="base" className="text-white font-heading mb-0.5">
                Sambungkan Gmail
              </AppText>
              <AppText
                size="xs"
                className="text-surface/60 font-body leading-relaxed"
              >
                VOKAL scan {GMAIL_FETCH_LIMIT} email terbaru secara lokal
              </AppText>
            </View>
            <ChevronRight color="rgba(255,255,255,0.5)" size={20} />
          </TouchableOpacity>

          {/* OPTION 2: Manual paste */}
          <TouchableOpacity
            className="bg-surface border border-espresso/10 rounded-[20px] p-5 flex-row items-center gap-4 shadow-sm"
            onPress={() => setMode("manual")}
            activeOpacity={0.85}
          >
            <View className="w-14 h-14 rounded-2xl bg-olive/10 items-center justify-center">
              <FileText color="#74822F" size={28} />
            </View>
            <View className="flex-1">
              <AppText
                size="base"
                className="text-espresso font-heading mb-0.5"
              >
                Tempel Teks Manual
              </AppText>
              <AppText
                size="xs"
                className="text-text-muted font-body leading-relaxed"
              >
                Copy-paste isi email/SMS/WA yang mencurigakan
              </AppText>
            </View>
            <ChevronRight color="#6B5F52" size={20} />
          </TouchableOpacity>

          {/* Privacy note */}
          <View className="flex-row gap-2 mt-5 items-start">
            <ShieldCheck color="#74822F" size={16} />
            <AppText
              size="sm"
              className="text-olive font-body flex-1 leading-relaxed"
            >
              Analisis dilakukan 100% di perangkatmu. Email & teks tidak pernah
              keluar dari HP kamu.
            </AppText>
          </View>
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
          <AppText size="xl" className="text-espresso font-heading">
            Tempel Teks Email
          </AppText>
        </View>

        <AppText size="xs" className="text-text-muted font-body mb-2">
          Salin seluruh teks email atau pesan mencurigakan, lalu tempel di bawah
          ini:
        </AppText>

        <TextInput
          className="bg-surface rounded-2xl p-4 font-body text-espresso border border-espresso/10"
          style={{
            minHeight: 220,
            textAlignVertical: "top",
            fontSize: 14,
            fontFamily: "DMSans-Regular",
          }}
          placeholder="Contoh: 'Selamat! Anda terpilih memenangkan hadiah Rp 50.000.000. Klik link berikut untuk klaim...'"
          placeholderTextColor="#9E8E7E"
          multiline
          value={manualText}
          onChangeText={setManualText}
          accessibilityLabel="Kolom teks email untuk dianalisis"
        />

        <AppText size="xs" className="text-text-muted font-body mt-2 mb-4">
          {manualText.length} karakter dimasukkan
        </AppText>

        <TouchableOpacity
          className={`rounded-2xl py-4 items-center ${isAnalyzing ? "bg-espresso/50" : "bg-espresso"}`}
          onPress={handleAnalyzeManual}
          disabled={isAnalyzing}
          activeOpacity={0.8}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <AppText size="sm" className="text-white font-heading">
              Analisis Sekarang
            </AppText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
