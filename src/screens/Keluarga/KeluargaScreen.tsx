import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Contacts from "expo-contacts";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertCircle,
  BellRing,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Contact,
  KeyRound,
  Lock,
  Phone,
  PlusCircle,
  Search,
  Share2,
  ShieldCheck,
  Square,
  Trash2,
  UserPlus,
  X,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/auth";
import { useUser } from "../../context/UserContext";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

import { AppText } from "../../components/ui/AppText";
import { useConfirmModal } from "../../components/ui/ConfirmModal";

type ContactItem = Contacts.Contact & { id?: string };

const MOCK_FALLBACK_CONTACTS: ContactItem[] = [
  {
    id: "c1",
    contactType: Contacts.ContactTypes.Person,
    name: "Nenek Maryam",
    phoneNumbers: [{ number: "+62 813-9876-5432", label: "Seluler" }],
  },
  {
    id: "c2",
    contactType: Contacts.ContactTypes.Person,
    name: "Kakek Budi",
    phoneNumbers: [{ number: "+62 812-3456-7890", label: "Seluler" }],
  },
  {
    id: "c3",
    contactType: Contacts.ContactTypes.Person,
    name: "Tante Dewi",
    phoneNumbers: [{ number: "+62 815-1122-3344", label: "Seluler" }],
  },
  {
    id: "c4",
    contactType: Contacts.ContactTypes.Person,
    name: "Om Roy",
    phoneNumbers: [{ number: "+62 817-5566-7788", label: "Seluler" }],
  },
];

type FamilyMember = {
  id: string;
  name: string;
  role: string;
  status: string;
  verified: boolean;
  phone?: string;
};

export default function KeluargaScreen() {
  const { user } = useAuth();
  const currentUserName = user?.name || "Pengguna VOKAL";
  const { familySecret, updateFamilySecret, codeword } = useUser();
  const { showConfirm } = useConfirmModal();

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() => [
    {
      id: user?.id || "my-user",
      name: `${user?.name || currentUserName} (Anda)`,
      role: "Admin",
      status: "Aman",
      verified: true,
    },
  ]);
  const [refreshing, setRefreshing] = useState(false);

  const PENDING_STORAGE_KEY = user?.id
    ? `@vokal_pending_members_${user.id}`
    : "@vokal_pending_members_guest";

  const getPendingMembers = useCallback(async (): Promise<FamilyMember[]> => {
    try {
      const data = await AsyncStorage.getItem(PENDING_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, [PENDING_STORAGE_KEY]);

  const savePendingMembers = useCallback(
    async (members: FamilyMember[]) => {
      try {
        await AsyncStorage.setItem(
          PENDING_STORAGE_KEY,
          JSON.stringify(members),
        );
      } catch (e) {
        console.error("Error saving pending members:", e);
      }
    },
    [PENDING_STORAGE_KEY],
  );

  const loadFamilyMembers = useCallback(async () => {
    const selfMember: FamilyMember = {
      id: user?.id || "my-user",
      name: `${user?.name || currentUserName} (Anda)`,
      role: "Admin",
      status: "Aman",
      verified: true,
      phone: user?.phone || undefined,
    };

    const savedPending = await getPendingMembers();

    if (!isSupabaseConfigured() || !user?.id) {
      setFamilyMembers([selfMember, ...savedPending]);
      return;
    }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("family_id, families(family_secret)")
      .eq("id", user.id)
      .single();

    const myFamilyId = myProfile?.family_id;
    const myFamilySecret =
      (myProfile?.families as any)?.family_secret || familySecret;

    if (!myFamilyId) {
      setFamilyMembers([selfMember, ...savedPending]);
      return;
    }

    let { data: members, error: memErr } = await supabase
      .from("profiles")
      .select("id, name, phone, xp, avatar_initials")
      .eq("family_id", myFamilyId)
      .neq("id", user.id);

    if (memErr) {
      const { data: fallbackMembers } = await supabase
        .from("profiles")
        .select("id, name, xp, avatar_initials")
        .eq("family_id", myFamilyId)
        .neq("id", user.id);
      members = (fallbackMembers as any) || null;
    }

    const otherMembers: FamilyMember[] = (members || []).map((m: any) => ({
      id: m.id,
      name: m.name || "Anggota Keluarga",
      phone: m.phone || undefined,
      role: "Anggota",
      status: "Aman",
      verified: true,
    }));

    const dbNames = new Set(
      otherMembers.map((m) => (m.name || "").toLowerCase()),
    );
    const activePending = savedPending.filter(
      (p) => !dbNames.has((p.name || "").toLowerCase()),
    );

    setFamilyMembers([selfMember, ...otherMembers, ...activePending]);
  }, [user?.id, user?.name, currentUserName, familySecret, getPendingMembers]);

  React.useEffect(() => {
    loadFamilyMembers();
  }, [loadFamilyMembers]);

  useFocusEffect(
    useCallback(() => {
      loadFamilyMembers();
    }, [loadFamilyMembers]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFamilyMembers();
    setRefreshing(false);
  }, [loadFamilyMembers]);

  const [deviceContacts, setDeviceContacts] = useState<ContactItem[]>([]);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [tempSeed, setTempSeed] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "uninvited">("all");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleInvite = async () => {
    if (!familySecret || familySecret === "VOKAL_DEFAULT_SECRET") {
      showConfirm({
        title: "Atur Seed Dulu",
        message:
          'Kamu harus mengatur Seed Keluarga terlebih dahulu sebelum mengundang anggota.\n\nKlik "Atur Seed" di bawah untuk melanjutkan.',
        confirmText: "Atur Seed",
        cancelText: "Nanti",
        variant: "mustard",
        iconType: "warning",
        onConfirm: () => {
          setTempSeed(familySecret);
          setShowSeedModal(true);
        },
      });
      return;
    }

    setIsLoadingContacts(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
          sort: Contacts.SortTypes.FirstName,
        });
        if (data && data.length > 0) {
          setDeviceContacts(data);
        } else {
          setDeviceContacts(MOCK_FALLBACK_CONTACTS);
        }
      } else {
        setDeviceContacts(MOCK_FALLBACK_CONTACTS);
      }
    } catch (error) {
      console.error(error);
      setDeviceContacts(MOCK_FALLBACK_CONTACTS);
    } finally {
      setIsLoadingContacts(false);
      setSearchQuery("");
      setSelectedContactIds([]);
      setShowContactsModal(true);
    }
  };

  const sanitizeString = useCallback((str?: string | null) => {
    if (!str) return "";
    return str.replace(/null|undefined/gi, "").trim();
  }, []);

  const getCleanName = useCallback(
    (contact: ContactItem) => {
      const cleanName = sanitizeString(contact.name);
      if (cleanName.length > 0) return cleanName;

      const cleanFirst = sanitizeString(contact.firstName);
      const cleanLast = sanitizeString(contact.lastName);
      const full = `${cleanFirst} ${cleanLast}`.trim();
      if (full.length > 0) return full;

      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        const cleanPhone = sanitizeString(contact.phoneNumbers[0].number);
        if (cleanPhone.length > 0) return cleanPhone;
      }

      return "Tanpa Nama";
    },
    [sanitizeString],
  );

  const filteredContacts = useMemo(() => {
    return deviceContacts.filter((contact) => {
      const cleanName = sanitizeString(contact.name);
      const cleanFirst = sanitizeString(contact.firstName);
      const cleanPhone =
        contact.phoneNumbers && contact.phoneNumbers.length > 0
          ? sanitizeString(contact.phoneNumbers[0].number)
          : "";

      const hasValidName = cleanName.length > 0 || cleanFirst.length > 0;
      const hasValidPhone = cleanPhone.length > 0;

      if (!hasValidName && !hasValidPhone) return false;

      const displayName = getCleanName(contact);
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        displayName.toLowerCase().includes(query) ||
        (hasValidPhone && cleanPhone.includes(query));

      if (filterMode === "uninvited") {
        const isAlreadyInFamily = familyMembers.some(
          (m) => m.name.toLowerCase() === displayName.toLowerCase(),
        );
        return matchesSearch && !isAlreadyInFamily;
      }

      return matchesSearch;
    });
  }, [
    deviceContacts,
    searchQuery,
    filterMode,
    familyMembers,
    getCleanName,
    sanitizeString,
  ]);

  const toggleSelectContact = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId],
    );
  };

  const toggleSelectAllFiltered = () => {
    const pickableFiltered = filteredContacts.filter((c) => {
      const displayName = getCleanName(c);
      const isAlreadyInFamily = familyMembers.some(
        (m) => m.name.toLowerCase() === displayName.toLowerCase(),
      );
      return !isAlreadyInFamily;
    });

    const pickableIds = pickableFiltered.map((c) => c.id || getCleanName(c));

    const allSelected =
      pickableIds.length > 0 &&
      pickableIds.every((id) => selectedContactIds.includes(id));
    if (allSelected) {
      setSelectedContactIds((prev) =>
        prev.filter((id) => !pickableIds.includes(id)),
      );
    } else {
      setSelectedContactIds((prev) =>
        Array.from(new Set([...prev, ...pickableIds])),
      );
    }
  };

  const addContactsToFamily = async (contactsToAdd: ContactItem[]) => {
    if (contactsToAdd.length === 0) return;

    const newMembers: FamilyMember[] = contactsToAdd.map((contact) => {
      const cleanName = getCleanName(contact);
      const rawPhone = contact.phoneNumbers?.[0]?.number || "";
      return {
        id: contact.id || Date.now().toString() + Math.random().toString(),
        name: cleanName,
        role: "Anggota Keluarga",
        status: "Menunggu",
        verified: false,
        phone: rawPhone,
      };
    });

    const currentPending = await getPendingMembers();
    const existingNames = new Set([
      ...familyMembers.map((m) => (m.name || "").toLowerCase()),
      ...currentPending.map((m) => (m.name || "").toLowerCase()),
    ]);
    const filteredNew = newMembers.filter(
      (m) => !existingNames.has((m.name || "").toLowerCase()),
    );

    if (filteredNew.length > 0) {
      const updatedPending = [...currentPending, ...filteredNew];
      await savePendingMembers(updatedPending);
      setFamilyMembers((prev) => [...prev, ...filteredNew]);
    }

    setShowContactsModal(false);
    setSelectedContactIds([]);
    setSearchQuery("");

    const firstCleanName = getCleanName(contactsToAdd[0]);
    const namesText =
      contactsToAdd.length === 1
        ? firstCleanName
        : `${contactsToAdd.length} kontak terpilih`;

    setTimeout(() => {
      showConfirm({
        title: "Kirim Undangan",
        message: `Kirimkan Kunci Rahasia (Seed) ke ${namesText}?`,
        confirmText: "Kirim via WhatsApp",
        cancelText: "Nanti",
        variant: "mustard",
        iconType: "share",
        onConfirm: () => {
          const firstPhone = contactsToAdd[0]?.phoneNumbers?.[0]?.number;
          let cleanedPhone = firstPhone
            ? firstPhone.replace(/[^0-9]/g, "")
            : "";
          if (cleanedPhone.startsWith("0")) {
            cleanedPhone = "62" + cleanedPhone.substring(1);
          }

          const messageText = encodeURIComponent(
            `Yuk gabung ke jaringan aman keluarga kita di VOKAL. Masukkan Kunci Rahasia ini di aplikasimu: [ ${familySecret} ] agar Codeword anti-scam kita tersinkronisasi!`,
          );
          if (cleanedPhone) {
            const waUrl = `whatsapp://send?phone=${cleanedPhone}&text=${messageText}`;
            const webWaUrl = `https://wa.me/${cleanedPhone}?text=${messageText}`;
            Linking.canOpenURL(waUrl)
              .then((supported) => {
                if (supported) {
                  Linking.openURL(waUrl);
                } else {
                  Linking.openURL(webWaUrl);
                }
              })
              .catch(() => {
                Linking.openURL(webWaUrl);
              });
          } else {
            Share.share({
              message: `Yuk gabung ke jaringan aman keluarga kita di VOKAL. Masukkan Kunci Rahasia ini di aplikasimu: [ ${familySecret} ] agar Codeword anti-scam kita tersinkronisasi!`,
            });
          }
        },
      });
    }, 400);
  };

  const removePendingMember = (memberId: string, memberName: string) => {
    showConfirm({
      title: "Hapus Undangan",
      message: `Hapus ${memberName} dari daftar keluarga?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      variant: "terracotta",
      iconType: "danger",
      onConfirm: async () => {
        const currentPending = await getPendingMembers();
        const updatedPending = currentPending.filter(
          (m) => m.id !== memberId && m.name !== memberName,
        );
        await savePendingMembers(updatedPending);
        setFamilyMembers((prev) => prev.filter((m) => m.id !== memberId));
      },
    });
  };

  const resendInvite = (member: FamilyMember) => {
    let cleanedPhone = member.phone ? member.phone.replace(/[^0-9]/g, "") : "";
    if (cleanedPhone.startsWith("0")) {
      cleanedPhone = "62" + cleanedPhone.substring(1);
    }

    const messageText = encodeURIComponent(
      `Yuk gabung ke jaringan aman keluarga kita di VOKAL. Masukkan Kunci Rahasia ini di aplikasimu: [ ${familySecret} ] agar Codeword anti-scam kita tersinkronisasi!`,
    );
    if (cleanedPhone) {
      const waUrl = `whatsapp://send?phone=${cleanedPhone}&text=${messageText}`;
      const webWaUrl = `https://wa.me/${cleanedPhone}?text=${messageText}`;
      Linking.canOpenURL(waUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(waUrl);
          } else {
            Linking.openURL(webWaUrl);
          }
        })
        .catch(() => {
          Linking.openURL(webWaUrl);
        });
    } else {
      Share.share({
        message: `Yuk gabung ke jaringan aman keluarga kita di VOKAL. Masukkan Kunci Rahasia ini di aplikasimu: [ ${familySecret} ] agar Codeword anti-scam kita tersinkronisasi!`,
      });
    }
  };

  const handlePickSelected = () => {
    const selected = deviceContacts.filter((c) =>
      selectedContactIds.includes(c.id || c.name || ""),
    );
    if (selected.length === 0) {
      showConfirm({
        title: "Pilih Kontak",
        message:
          "Pilih setidaknya 1 kontak untuk diundang ke jaringan keluarga.",
        confirmText: "Mengerti",
        cancelText: "",
        variant: "mustard",
        iconType: "warning",
      });
      return;
    }
    addContactsToFamily(selected);
  };

  const handleSilentAlarm = (memberName: string) => {
    Share.share({
      message: `🚨 ALARM SENYAP dari VOKAL\n\n${currentUserName} mengirimkan sinyal darurat! Harap segera hubungi mereka sekarang.\n\nSeseorang mungkin sedang dalam situasi berbahaya. Jangan abaikan pesan ini.`,
    }).catch(() => {});
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#C1592E"]}
            tintColor="#C1592E"
          />
        }
      >
        {/* HEADER */}
        <View style={{ height: 16 }} />
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View
            className="rounded-[28px] overflow-hidden mb-5"
            style={{
              elevation: 2,
              shadowColor: "#3E2E22",
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 12,
            }}
          >
            <LinearGradient
              colors={["#3E2E22", "#5A4634"]}
              style={{ padding: 20, borderRadius: 28 }}
            >
              {/* Title row */}
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-3">
                  <AppText
                    size="lg"
                    className="text-cream font-heading"
                    numberOfLines={1}
                  >
                    Jaringan Keluarga
                  </AppText>
                  <AppText size="xs" className="text-cream/50 font-body mt-0.5">
                    Lindungi satu sama lain
                  </AppText>
                </View>
                <View className="bg-mustard/20 px-3 py-1.5 rounded-full flex-shrink-0">
                  <AppText size="xs" className="text-mustard font-display">
                    {familyMembers.length} Anggota
                  </AppText>
                </View>
              </View>

              {/* Status row */}
              <View className="flex-row items-center gap-3 mb-5">
                <View className="flex-1 bg-cream/8 rounded-2xl p-3 items-center">
                  <AppText size="2xl" className="text-olive font-display">
                    Aman
                  </AppText>
                  <AppText size="xs" className="text-cream/60 font-body mt-0.5">
                    Status
                  </AppText>
                </View>
                <View className="flex-1 bg-cream/8 rounded-2xl p-3 items-center">
                  <AppText size="2xl" className="text-mustard font-display">
                    {familyMembers.filter((m) => m.verified).length}
                  </AppText>
                  <AppText size="xs" className="text-cream/60 font-body mt-0.5">
                    Terverifikasi
                  </AppText>
                </View>
              </View>

              {/* Action buttons */}
              <View className="flex-row gap-2">
                {(() => {
                  const seedNotSet =
                    !familySecret || familySecret === "VOKAL_DEFAULT_SECRET";
                  return (
                    <TouchableOpacity
                      onPress={handleInvite}
                      disabled={isLoadingContacts}
                      activeOpacity={0.8}
                      className={`flex-1 rounded-xl py-3 flex-row justify-center items-center gap-1.5 ${seedNotSet ? "bg-mustard/50" : "bg-mustard"}`}
                    >
                      {isLoadingContacts ? (
                        <ActivityIndicator size="small" color="#3E2E22" />
                      ) : (
                        <>
                          {seedNotSet ? (
                            <Lock color="#3E2E22" size={15} />
                          ) : (
                            <PlusCircle color="#3E2E22" size={15} />
                          )}
                          <AppText
                            size="xs"
                            className="text-espresso font-display"
                          >
                            Undang
                          </AppText>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })()}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setTempSeed(familySecret);
                    setShowSeedModal(true);
                  }}
                  className="flex-1 bg-olive rounded-xl py-3 flex-row justify-center items-center gap-1.5"
                >
                  <KeyRound color="#FFFFFF" size={15} />
                  <AppText size="xs" className="text-white font-display">
                    Ubah Seed
                  </AppText>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* EMERGENCY CALL SECTION */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className="bg-terracotta/8 border border-terracotta/20 rounded-[28px] p-5 mb-5"
        >
          <View className="flex-row items-center gap-2.5 mb-3.5">
            <View className="w-10 h-10 rounded-full bg-terracotta/20 items-center justify-center">
              <Phone color="#C1592E" size={20} fill="#C1592E" />
            </View>
            <View className="flex-1">
              <AppText size="base" className="text-espresso font-heading">
                Hubungi Darurat Anggota 🚨
              </AppText>
              <AppText size="xs" className="text-text-muted font-body mt-0.5">
                Telepon langsung nomor anggota keluarga Anda
              </AppText>
            </View>
          </View>

          {familyMembers.length === 1 ? (
            <View className="py-4 items-center bg-cream/30 rounded-2xl border border-dashed border-espresso/15">
              <AppText
                size="xs"
                className="text-text-muted font-body text-center px-4 leading-relaxed"
              >
                Belum ada anggota keluarga terhubung. Klik "Undang" di atas
                untuk menambahkan!
              </AppText>
            </View>
          ) : (
            <View className="gap-2.5">
              {familyMembers.map((member, idx) => {
                if (member.id === user?.id) return null;
                const hasPhone = member.phone && member.phone.trim().length > 0;
                const displayPhone = hasPhone
                  ? member.phone
                  : "Belum Mengisi No. Telp";

                return (
                  <TouchableOpacity
                    key={member.id || idx}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!hasPhone) {
                        showConfirm({
                          title: "Nomor Belum Ada",
                          message: `${member.name} belum menambahkan nomor telepon di profil mereka.`,
                          confirmText: "Mengerti",
                          cancelText: "",
                          variant: "mustard",
                          iconType: "warning",
                        });
                        return;
                      }

                      showConfirm({
                        title: "Hubungi Anggota Keluarga",
                        message: `Apakah Anda yakin ingin menelpon ${member.name} (${displayPhone}) secara langsung?`,
                        confirmText: "Panggil Sekarang",
                        cancelText: "Batal",
                        variant: "terracotta",
                        iconType: "info",
                        onConfirm: () => {
                          Linking.openURL(`tel:${displayPhone}`).catch(() => {
                            showConfirm({
                              title: "Gagal Memanggil",
                              message:
                                "Format nomor tidak didukung di perangkat ini atau aplikasi telepon tidak tersedia.",
                              confirmText: "Tutup",
                              cancelText: "",
                              variant: "terracotta",
                              iconType: "danger",
                            });
                          });
                        },
                      });
                    }}
                    className="bg-white rounded-2xl p-4 flex-row items-center justify-between border border-espresso/5 shadow-sm"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full bg-espresso/5 items-center justify-center">
                        <AppText
                          size="sm"
                          className="text-espresso font-display"
                        >
                          {member.name.substring(0, 2).toUpperCase()}
                        </AppText>
                      </View>
                      <View>
                        <AppText
                          size="sm"
                          className="text-espresso font-heading"
                        >
                          {member.name}
                        </AppText>
                        <AppText
                          size="xs"
                          className={`font-body mt-0.5 ${hasPhone ? "text-text-muted" : "text-terracotta font-bold"}`}
                        >
                          {displayPhone}
                        </AppText>
                      </View>
                    </View>
                    <View
                      className={`p-2.5 rounded-full ${hasPhone ? "bg-terracotta" : "bg-espresso/20"}`}
                    >
                      <Phone color="#FFFFFF" size={16} fill="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <AppText size="base" className="text-espresso font-heading mb-3 mt-1">
            Daftar Anggota
          </AppText>
        </Animated.View>

        {/* LIST KELUARGA */}
        <View className="gap-3 mb-6">
          {familyMembers.map((member, i) => {
            const isExpanded = expandedId === member.id;
            const isMe = member.role.includes("Anda");
            const isSafe = member.status === "Aman";
            const isWaiting = member.status === "Menunggu";
            const uniqueKey = `${member.id || "mem"}_${i}`;

            return (
              <Animated.View
                entering={FadeInDown.delay(300 + i * 100).springify()}
                key={uniqueKey}
                layout={Layout.springify()}
                className="bg-surface rounded-2xl overflow-hidden shadow-sm"
                style={{ elevation: 1 }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(member.id)}
                  className="p-4 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center border-2 ${isSafe ? "border-olive bg-olive/10" : isWaiting ? "border-espresso/20 bg-espresso/5" : "border-terracotta bg-terracotta/10"}`}
                    >
                      <AppText
                        size="lg"
                        className={`font-display ${isSafe ? "text-olive" : isWaiting ? "text-espresso/50" : "text-terracotta"}`}
                      >
                        {member.name.substring(0, 2).toUpperCase()}
                      </AppText>
                    </View>
                    <View>
                      <View className="flex-row items-center gap-2">
                        <AppText
                          size="sm"
                          className="font-heading text-espresso"
                        >
                          {member.name}
                        </AppText>
                        {isMe && (
                          <View className="bg-mustard/20 px-2 py-0.5 rounded-md">
                            <AppText
                              size="xs"
                              className="text-mustard font-display"
                            >
                              ADMIN
                            </AppText>
                          </View>
                        )}
                      </View>
                      <AppText
                        size="xs"
                        className="font-body text-text-muted mt-0.5"
                      >
                        {member.role}
                      </AppText>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    {isSafe ? (
                      <ShieldCheck color="#74822F" size={16} />
                    ) : isWaiting ? null : (
                      <AlertCircle color="#C1592E" size={16} />
                    )}
                    {isExpanded ? (
                      <ChevronUp color="#3E2E22" size={20} opacity={0.5} />
                    ) : (
                      <ChevronDown color="#3E2E22" size={20} opacity={0.5} />
                    )}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    className="px-4 pb-4 pt-1 border-t border-espresso/5"
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-2">
                        <AppText
                          size="xs"
                          className="font-body text-text-muted"
                        >
                          Status Codeword:
                        </AppText>
                        {member.verified ? (
                          <AppText size="xs" className="text-olive font-bold">
                            Terverifikasi ✓
                          </AppText>
                        ) : (
                          <AppText size="xs" className="text-mustard font-bold">
                            Menunggu Bergabung...
                          </AppText>
                        )}
                      </View>
                      {isWaiting && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() =>
                            removePendingMember(member.id, member.name)
                          }
                          className="p-1.5 rounded-lg bg-terracotta/10 flex-row items-center gap-1"
                        >
                          <Trash2 color="#C1592E" size={14} />
                          <AppText
                            size="xs"
                            className="text-terracotta font-display"
                          >
                            Hapus
                          </AppText>
                        </TouchableOpacity>
                      )}
                    </View>

                    {!isMe && (
                      <View className="flex-row gap-2">
                        {isWaiting ? (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => resendInvite(member)}
                            className="flex-1 bg-mustard/15 border border-mustard/30 py-2.5 px-4 rounded-xl items-center flex-row justify-center gap-2"
                          >
                            <Share2 color="#855B14" size={14} />
                            <AppText
                              size="xs"
                              className="text-espresso font-display"
                            >
                              Kirim Ulang Undangan
                            </AppText>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleSilentAlarm(member.name)}
                            className="flex-1 bg-terracotta/10 border border-terracotta/30 py-2.5 px-4 rounded-xl items-center flex-row justify-center gap-2"
                          >
                            <BellRing color="#C1592E" size={14} />
                            <AppText
                              size="xs"
                              className="text-terracotta font-display"
                            >
                              Kirim Alarm Senyap
                            </AppText>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* SEED MODAL */}
      <Modal visible={showSeedModal} transparent animationType="fade">
        <View className="flex-1 bg-espresso/90 justify-center items-center px-5">
          <View className="bg-cream rounded-3xl p-6 w-full max-h-[85%]">
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View className="flex-row justify-between items-center mb-4">
                <AppText size="lg" className="font-heading text-espresso">
                  Kunci Rahasia (Seed)
                </AppText>
                <TouchableOpacity
                  onPress={() => setShowSeedModal(false)}
                  className="bg-espresso/10 p-2 rounded-full"
                >
                  <X color="#3E2E22" size={16} />
                </TouchableOpacity>
              </View>
              <AppText
                size="sm"
                className="font-body text-justify text-text-muted mb-4"
              >
                Masukkan kalimat unik rahasia keluargamu. Pastikan setiap HP
                keluarga memasukkan seed yang persis sama agar Codeword TOTP
                selalu sinkron.
              </AppText>

              <TextInput
                className="bg-white border border-espresso/20 rounded-xl p-4 font-body text-espresso mb-4"
                value={tempSeed}
                onChangeText={setTempSeed}
                placeholder="Contoh: KeluargaCemara2026"
                placeholderTextColor="#A39686"
                autoCapitalize="none"
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  await updateFamilySecret(tempSeed);
                  setShowSeedModal(false);
                  await loadFamilyMembers();
                }}
                className="w-full bg-mustard py-4 rounded-xl items-center border-b-4 border-[#d49232]"
              >
                <AppText size="base" className="font-heading text-espresso">
                  Simpan & Sinkronisasi
                </AppText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CONTACTS MODAL WITH SEARCH & PICK */}
      <Modal visible={showContactsModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-cream rounded-t-[32px] h-[85%] flex-col">
            {/* Modal Header */}
            <View className="p-5 pb-3 border-b border-espresso/10">
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <AppText size="xl" className="font-heading text-espresso">
                    Undang Keluarga
                  </AppText>
                  <AppText
                    size="xs"
                    className="font-body text-text-muted mt-0.5"
                  >
                    Filter & pilih kontak HP yang ingin diundang
                  </AppText>
                </View>
                <TouchableOpacity
                  onPress={() => setShowContactsModal(false)}
                  className="bg-espresso/10 p-2.5 rounded-full"
                >
                  <X color="#3E2E22" size={18} />
                </TouchableOpacity>
              </View>

              {/* SEARCH BAR */}
              <View className="flex-row items-center bg-white border border-espresso/15 rounded-2xl px-3.5 py-2.5 shadow-sm">
                <Search color="#8C7A6B" size={18} />
                <TextInput
                  className="flex-1 ml-2.5 font-body text-sm text-espresso p-0"
                  placeholder="Cari nama atau nomor HP..."
                  placeholderTextColor="#A39686"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    className="p-1"
                  >
                    <X color="#8C7A6B" size={16} />
                  </TouchableOpacity>
                )}
              </View>

              {/* FILTER CHIPS & SELECTION CONTROLS */}
              <View className="flex-row items-center justify-between mt-3 pt-1">
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setFilterMode("all")}
                    className={`px-3 py-1.5 rounded-full border ${filterMode === "all" ? "bg-espresso border-espresso" : "bg-surface border-espresso/15"}`}
                  >
                    <AppText
                      size="xs"
                      className={`font-display ${filterMode === "all" ? "text-cream" : "text-espresso/70"}`}
                    >
                      Semua ({deviceContacts.length})
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setFilterMode("uninvited")}
                    className={`px-3 py-1.5 rounded-full border ${filterMode === "uninvited" ? "bg-espresso border-espresso" : "bg-surface border-espresso/15"}`}
                  >
                    <AppText
                      size="xs"
                      className={`font-display ${filterMode === "uninvited" ? "text-cream" : "text-espresso/70"}`}
                    >
                      Belum Diundang
                    </AppText>
                  </TouchableOpacity>
                </View>

                {filteredContacts.length > 0 && (
                  <TouchableOpacity
                    onPress={toggleSelectAllFiltered}
                    className="flex-row items-center gap-1.5 px-2 py-1 bg-mustard/15 rounded-lg border border-mustard/30"
                  >
                    <CheckSquare size={13} color="#E8A33D" />
                    <AppText size="xs" className="font-display text-espresso">
                      Pilih Semua
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* CONTACTS LIST (VIRTUALIZED FOR HIGH PERFORMANCE) */}
            <FlatList
              className="flex-1 px-5 pt-3"
              data={filteredContacts}
              keyExtractor={(item, index) => item.id || `${item.name}-${index}`}
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={5}
              removeClippedSubviews={true}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="items-center justify-center py-12">
                  <Contact color="#A39686" size={40} opacity={0.5} />
                  <AppText
                    size="base"
                    className="font-heading text-espresso mt-3"
                  >
                    Kontak tidak ditemukan
                  </AppText>
                  <AppText
                    size="xs"
                    className="font-body text-text-muted text-center mt-1 px-6"
                  >
                    Coba kata kunci pencarian lain atau ganti filter kontak.
                  </AppText>
                </View>
              }
              ListFooterComponent={<View className="h-24" />}
              renderItem={({ item: contact }) => {
                const displayName = getCleanName(contact);
                const contactId = contact.id || displayName;
                const isAlreadyInFamily = familyMembers.some(
                  (m) => m.name.toLowerCase() === displayName.toLowerCase(),
                );
                const isSelected = selectedContactIds.includes(contactId);

                return (
                  <TouchableOpacity
                    key={contactId}
                    disabled={isAlreadyInFamily}
                    activeOpacity={0.7}
                    onPress={() => toggleSelectContact(contactId)}
                    className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border ${
                      isSelected
                        ? "bg-mustard/10 border-mustard shadow-sm"
                        : isAlreadyInFamily
                          ? "bg-espresso/5 border-espresso/10 opacity-60"
                          : "bg-surface border-espresso/10 shadow-sm"
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      {/* Checkbox / Avatar */}
                      {!isAlreadyInFamily && (
                        <View className="p-0.5">
                          {isSelected ? (
                            <CheckSquare color="#E8A33D" size={20} />
                          ) : (
                            <Square color="#A39686" size={20} />
                          )}
                        </View>
                      )}

                      <View className="w-10 h-10 rounded-full bg-mustard/20 items-center justify-center">
                        <AppText
                          size="sm"
                          className="font-heading text-espresso"
                        >
                          {displayName.substring(0, 2).toUpperCase()}
                        </AppText>
                      </View>

                      <View className="flex-1">
                        <AppText
                          size="sm"
                          className="font-heading text-espresso"
                          numberOfLines={1}
                        >
                          {displayName}
                        </AppText>
                        {contact.phoneNumbers &&
                          contact.phoneNumbers.length > 0 &&
                          contact.phoneNumbers[0].number &&
                          contact.phoneNumbers[0].number !== "null" && (
                            <AppText
                              size="xs"
                              className="font-body text-text-muted mt-0.5"
                              numberOfLines={1}
                            >
                              {contact.phoneNumbers[0].number}
                            </AppText>
                          )}
                      </View>
                    </View>

                    {/* PICK / STATUS BUTTON */}
                    {isAlreadyInFamily ? (
                      <View className="bg-espresso/10 px-3 py-1.5 rounded-full">
                        <AppText
                          size="xs"
                          className="text-espresso/60 font-display"
                        >
                          Sudah Ada
                        </AppText>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => addContactsToFamily([contact])}
                        className="bg-mustard px-3.5 py-1.5 rounded-full flex-row items-center gap-1 shadow-sm"
                      >
                        <UserPlus color="#3E2E22" size={13} />
                        <AppText
                          size="xs"
                          className="text-espresso font-display"
                        >
                          Pilih
                        </AppText>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            {/* BOTTOM BATCH PICK BAR */}
            {selectedContactIds.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                exiting={FadeOut.duration(150)}
                className="p-4 bg-surface border-t border-espresso/10 shadow-lg flex-row items-center justify-between"
              >
                <View>
                  <AppText size="sm" className="font-heading text-espresso">
                    {selectedContactIds.length} Kontak Dipilih
                  </AppText>
                  <AppText size="xs" className="font-body text-text-muted">
                    Siap ditambahkan ke jaringan
                  </AppText>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handlePickSelected}
                  className="bg-mustard px-5 py-3 rounded-xl flex-row items-center gap-2 border-b-2 border-[#d49232]"
                >
                  <UserPlus color="#3E2E22" size={16} />
                  <AppText size="sm" className="font-heading text-espresso">
                    Pilih & Undang ({selectedContactIds.length})
                  </AppText>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
