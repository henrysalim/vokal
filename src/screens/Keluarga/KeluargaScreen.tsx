import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Share, Alert, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, FadeInDown, Layout } from 'react-native-reanimated';
import { 
  Users, 
  BellRing, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  PlusCircle, 
  KeyRound, 
  X, 
  Contact, 
  Search, 
  Check, 
  UserPlus, 
  CheckSquare, 
  Square
} from 'lucide-react-native';
import * as Contacts from 'expo-contacts';
import { FAMILY_MEMBERS } from '../../data/mock';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../../context/auth';
import DashboardAnak from '../../components/ui/DashboardAnak';
import { useConfirmModal } from '../../components/ui/ConfirmModal';

type ContactItem = Contacts.Contact & { id?: string };

// Fallback contacts for simulator / demo mode
const MOCK_FALLBACK_CONTACTS: ContactItem[] = [
  { id: 'c1', contactType: Contacts.ContactTypes.Person, name: 'Nenek Maryam', phoneNumbers: [{ number: '+62 813-9876-5432', label: 'Seluler' }] },
  { id: 'c2', contactType: Contacts.ContactTypes.Person, name: 'Kakek Budi', phoneNumbers: [{ number: '+62 812-3456-7890', label: 'Seluler' }] },
  { id: 'c3', contactType: Contacts.ContactTypes.Person, name: 'Tante Dewi', phoneNumbers: [{ number: '+62 815-1122-3344', label: 'Seluler' }] },
  { id: 'c4', contactType: Contacts.ContactTypes.Person, name: 'Om Roy', phoneNumbers: [{ number: '+62 817-5566-7788', label: 'Seluler' }] },
];

export default function KeluargaScreen() {
  const { user } = useAuth();
  const currentUserName = user?.name || 'Pengguna VOKAL';

  const [familyMembers, setFamilyMembers] = useState(() => [
    { id: user?.id || 'my-user', name: `${currentUserName} (Anda)`, role: 'Kepala Keluarga (Admin)', status: 'Aman', verified: true }
  ]);

  React.useEffect(() => {
    if (user?.name) {
      setFamilyMembers(prev => {
        const hasMe = prev.some(m => m.role.includes('Anda'));
        if (!hasMe) {
          return [{ id: user.id, name: `${user.name} (Anda)`, role: 'Kepala Keluarga (Admin)', status: 'Aman', verified: true }, ...prev];
        } else {
          return prev.map(m => m.role.includes('Anda') ? { ...m, id: user.id, name: `${user.name} (Anda)` } : m);
        }
      });
    }
  }, [user?.name, user?.id]);
  const [deviceContacts, setDeviceContacts] = useState<ContactItem[]>([]);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [tempSeed, setTempSeed] = useState('');

  // Filter & Selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'uninvited'>('all');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const { familySecret, updateFamilySecret, codeword } = useUser();
  const { showConfirm } = useConfirmModal();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleInvite = async () => {
    setIsLoadingContacts(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
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
      setSearchQuery('');
      setSelectedContactIds([]);
      setShowContactsModal(true);
    }
  };

  // Helper to sanitize contact names from system metadata (e.g. "null null", "undefined", etc.)
  const sanitizeString = useCallback((str?: string | null) => {
    if (!str) return '';
    return str.replace(/null|undefined/gi, '').trim();
  }, []);

  const getCleanName = useCallback((contact: ContactItem) => {
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

    return 'Tanpa Nama';
  }, [sanitizeString]);

  // Filter contacts based on search query and uninvited filter
  const filteredContacts = useMemo(() => {
    return deviceContacts.filter(contact => {
      const cleanName = sanitizeString(contact.name);
      const cleanFirst = sanitizeString(contact.firstName);
      const cleanPhone = contact.phoneNumbers && contact.phoneNumbers.length > 0 
        ? sanitizeString(contact.phoneNumbers[0].number) 
        : '';

      const hasValidName = cleanName.length > 0 || cleanFirst.length > 0;
      const hasValidPhone = cleanPhone.length > 0;

      // Ignore corrupted / metadata-only system contacts (e.g., "null null" without phone number)
      if (!hasValidName && !hasValidPhone) return false;

      const displayName = getCleanName(contact);
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || (
        displayName.toLowerCase().includes(query) ||
        (hasValidPhone && cleanPhone.includes(query))
      );

      if (filterMode === 'uninvited') {
        const isAlreadyInFamily = familyMembers.some(m => 
          m.name.toLowerCase() === displayName.toLowerCase()
        );
        return matchesSearch && !isAlreadyInFamily;
      }

      return matchesSearch;
    });
  }, [deviceContacts, searchQuery, filterMode, familyMembers, getCleanName, sanitizeString]);

  const toggleSelectContact = (contactId: string) => {
    setSelectedContactIds(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId) 
        : [...prev, contactId]
    );
  };

  const toggleSelectAllFiltered = () => {
    const pickableFiltered = filteredContacts.filter(c => {
      const displayName = getCleanName(c);
      const isAlreadyInFamily = familyMembers.some(m => 
        m.name.toLowerCase() === displayName.toLowerCase()
      );
      return !isAlreadyInFamily;
    });

    const pickableIds = pickableFiltered.map(c => c.id || getCleanName(c));

    const allSelected = pickableIds.length > 0 && pickableIds.every(id => selectedContactIds.includes(id));
    if (allSelected) {
      setSelectedContactIds(prev => prev.filter(id => !pickableIds.includes(id)));
    } else {
      setSelectedContactIds(prev => Array.from(new Set([...prev, ...pickableIds])));
    }
  };

  const addContactsToFamily = (contactsToAdd: ContactItem[]) => {
    if (contactsToAdd.length === 0) return;

    const newMembers = contactsToAdd.map(contact => {
      const cleanName = getCleanName(contact);
      return {
        id: contact.id || Date.now().toString() + Math.random().toString(),
        name: cleanName,
        role: 'Anggota Baru',
        risk: 0,
        status: 'Menunggu',
        verified: false
      };
    });

    setFamilyMembers(prev => {
      const existingNames = new Set(prev.map(m => m.name.toLowerCase()));
      const filteredNew = newMembers.filter(m => !existingNames.has(m.name.toLowerCase()));
      return [...prev, ...filteredNew];
    });

    setShowContactsModal(false);
    setSelectedContactIds([]);
    setSearchQuery('');

    const firstCleanName = getCleanName(contactsToAdd[0]);
    const namesText = contactsToAdd.length === 1 
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
          Share.share({
            message: `Yuk gabung ke jaringan aman keluarga kita di VOKAL. Masukkan Kunci Rahasia ini di aplikasimu: [${familySecret}] agar Codeword anti-scam kita tersinkronisasi!`
          });
        }
      });
    }, 400);
  };

  const handlePickSelected = () => {
    const selected = deviceContacts.filter(c => selectedContactIds.includes(c.id || c.name || ''));
    if (selected.length === 0) {
      Alert.alert("Peringatan", "Pilih setidaknya 1 kontak untuk diundang.");
      return;
    }
    addContactsToFamily(selected);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <TouchableOpacity activeOpacity={0.9} className="rounded-[32px] overflow-hidden mb-6 shadow-sm" style={{ elevation: 2, shadowColor: '#3E2E22', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 }}>
            <LinearGradient colors={['#3E2E22', '#5A4634']} className="p-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-cream font-heading text-xl">Family Trust Graph</Text>
                <View className="bg-mustard/20 px-3 py-1 rounded-full">
                  <Text className="text-mustard text-xs font-display">{familyMembers.length} Anggota</Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center mb-4">
                <View className="items-center">
                  <Text className="text-white text-3xl font-display">{codeword.word ? '3' : '0'}/5</Text>
                  <Text className="text-cream/60 text-[10px] font-body mt-1">Hafal Codeword</Text>
                </View>
                <View className="w-[1px] h-10 bg-cream/20" />
                <View className="items-center">
                  <Text className="text-olive text-3xl font-display">Aman</Text>
                  <Text className="text-cream/60 text-[10px] font-body mt-1">Status Keamanan</Text>
                </View>
              </View>

              <View className="flex-row gap-2 mt-2">
                <TouchableOpacity 
                  onPress={handleInvite} 
                  disabled={isLoadingContacts}
                  activeOpacity={0.8} 
                  className="flex-1 bg-mustard rounded-xl py-3 flex-row justify-center items-center gap-2"
                >
                  {isLoadingContacts ? (
                    <ActivityIndicator size="small" color="#3E2E22" />
                  ) : (
                    <>
                      <PlusCircle color="#3E2E22" size={16} />
                      <Text className="text-espresso font-display text-xs">Undang</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={() => {
                    setTempSeed(familySecret);
                    setShowSeedModal(true);
                  }}
                  className="flex-1 bg-olive rounded-xl py-3 flex-row justify-center items-center gap-2"
                >
                  <KeyRound color="#FFFFFF" size={16} />
                  <Text className="text-white font-display text-xs">Ubah Seed</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <DashboardAnak />
          <Text className="text-espresso text-base font-heading mb-3">Daftar Anggota</Text>
        </Animated.View>

        {/* LIST KELUARGA */}
        <View className="gap-3 mb-6">
          {familyMembers.map((member, i) => {
            const isExpanded = expandedId === member.id;
            const isMe = member.role.includes('Anda');
            const isSafe = member.status === 'Aman';
            const isWaiting = member.status === 'Menunggu';
            const uniqueKey = `${member.id || 'mem'}_${i}`;
            
            return (
              <Animated.View entering={FadeInDown.delay(300 + i * 100).springify()} key={uniqueKey} layout={Layout.springify()} className="bg-surface rounded-2xl overflow-hidden shadow-sm" style={{ elevation: 1 }}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(member.id)} className="p-4 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className={`w-12 h-12 rounded-full items-center justify-center border-2 ${isSafe ? 'border-olive bg-olive/10' : isWaiting ? 'border-espresso/20 bg-espresso/5' : 'border-terracotta bg-terracotta/10'}`}>
                      <Text className={`font-display text-lg ${isSafe ? 'text-olive' : isWaiting ? 'text-espresso/50' : 'text-terracotta'}`}>
                        {member.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <View className="flex-row items-center gap-2">
                        <Text className="font-heading text-espresso text-sm">{member.name}</Text>
                        {isMe && <View className="bg-mustard/20 px-2 py-0.5 rounded-md"><Text className="text-mustard text-[9px] font-display">ADMIN</Text></View>}
                      </View>
                      <Text className="font-body text-text-muted text-xs mt-0.5">{member.role}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center gap-2">
                    {isSafe ? <ShieldCheck color="#74822F" size={16} /> : isWaiting ? null : <AlertCircle color="#C1592E" size={16} />}
                    {isExpanded ? <ChevronUp color="#3E2E22" size={20} opacity={0.5} /> : <ChevronDown color="#3E2E22" size={20} opacity={0.5} />}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <Animated.View entering={FadeIn} exiting={FadeOut} className="px-4 pb-4 pt-1 border-t border-espresso/5">
                    <Text className="text-xs font-body text-text-muted mb-3">Status Codeword: {member.verified ? <Text className="text-olive font-bold">Terverifikasi</Text> : <Text className="text-terracotta font-bold">Belum</Text>}</Text>
                    
                    {!isMe && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity className="flex-1 bg-terracotta/10 border border-terracotta/30 py-2 rounded-xl items-center flex-row justify-center gap-2">
                          <BellRing color="#C1592E" size={14} />
                          <Text className="text-terracotta font-display text-[11px]">Kirim Alarm Senyap</Text>
                        </TouchableOpacity>
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
        <View className="flex-1 bg-espresso/90 justify-center px-5">
          <View className="bg-cream rounded-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-heading text-lg text-espresso">Kunci Rahasia (Seed)</Text>
              <TouchableOpacity onPress={() => setShowSeedModal(false)} className="bg-espresso/10 p-2 rounded-full">
                <X color="#3E2E22" size={16} />
              </TouchableOpacity>
            </View>
            <Text className="font-body text-xs text-text-muted mb-4">
              Masukkan kalimat unik rahasia keluargamu. Pastikan setiap HP keluarga memasukkan seed yang persis sama agar Codeword TOTP selalu sinkron.
            </Text>
            
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
              onPress={() => {
                updateFamilySecret(tempSeed);
                setShowSeedModal(false);
              }}
              className="w-full bg-mustard py-4 rounded-xl items-center border-b-4 border-[#d49232]"
            >
              <Text className="font-heading text-espresso text-base">Simpan & Sinkronisasi</Text>
            </TouchableOpacity>
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
                  <Text className="font-heading text-xl text-espresso">Undang Keluarga</Text>
                  <Text className="font-body text-xs text-text-muted mt-0.5">
                    Filter & pilih kontak HP yang ingin diundang
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowContactsModal(false)} className="bg-espresso/10 p-2.5 rounded-full">
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
                  <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                    <X color="#8C7A6B" size={16} />
                  </TouchableOpacity>
                )}
              </View>

              {/* FILTER CHIPS & SELECTION CONTROLS */}
              <View className="flex-row items-center justify-between mt-3 pt-1">
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setFilterMode('all')}
                    className={`px-3 py-1.5 rounded-full border ${filterMode === 'all' ? 'bg-espresso border-espresso' : 'bg-surface border-espresso/15'}`}
                  >
                    <Text className={`text-xs font-display ${filterMode === 'all' ? 'text-cream' : 'text-espresso/70'}`}>
                      Semua ({deviceContacts.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setFilterMode('uninvited')}
                    className={`px-3 py-1.5 rounded-full border ${filterMode === 'uninvited' ? 'bg-espresso border-espresso' : 'bg-surface border-espresso/15'}`}
                  >
                    <Text className={`text-xs font-display ${filterMode === 'uninvited' ? 'text-cream' : 'text-espresso/70'}`}>
                      Belum Diundang
                    </Text>
                  </TouchableOpacity>
                </View>

                {filteredContacts.length > 0 && (
                  <TouchableOpacity 
                    onPress={toggleSelectAllFiltered} 
                    className="flex-row items-center gap-1.5 px-2 py-1 bg-mustard/15 rounded-lg border border-mustard/30"
                  >
                    <CheckSquare size={13} color="#E8A33D" />
                    <Text className="text-[11px] font-display text-espresso">Pilih Semua</Text>
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
                  <Text className="font-heading text-base text-espresso mt-3">Kontak tidak ditemukan</Text>
                  <Text className="font-body text-xs text-text-muted text-center mt-1 px-6">
                    Coba kata kunci pencarian lain atau ganti filter kontak.
                  </Text>
                </View>
              }
              ListFooterComponent={<View className="h-24" />}
              renderItem={({ item: contact }) => {
                const displayName = getCleanName(contact);
                const contactId = contact.id || displayName;
                const isAlreadyInFamily = familyMembers.some(m => 
                  m.name.toLowerCase() === displayName.toLowerCase()
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
                        ? 'bg-mustard/10 border-mustard shadow-sm' 
                        : isAlreadyInFamily 
                        ? 'bg-espresso/5 border-espresso/10 opacity-60' 
                        : 'bg-surface border-espresso/10 shadow-sm'
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
                        <Text className="font-heading text-espresso text-sm">
                          {displayName.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      
                      <View className="flex-1">
                        <Text className="font-heading text-espresso text-sm" numberOfLines={1}>
                          {displayName}
                        </Text>
                        {contact.phoneNumbers && contact.phoneNumbers.length > 0 && contact.phoneNumbers[0].number && contact.phoneNumbers[0].number !== 'null' && (
                          <Text className="font-body text-text-muted text-xs mt-0.5" numberOfLines={1}>
                            {contact.phoneNumbers[0].number}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* PICK / STATUS BUTTON */}
                    {isAlreadyInFamily ? (
                      <View className="bg-espresso/10 px-3 py-1.5 rounded-full">
                        <Text className="text-espresso/60 font-display text-[10px]">Sudah Ada</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => addContactsToFamily([contact])}
                        className="bg-mustard px-3.5 py-1.5 rounded-full flex-row items-center gap-1 shadow-sm"
                      >
                        <UserPlus color="#3E2E22" size={13} />
                        <Text className="text-espresso font-display text-[11px]">Pilih</Text>
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
                  <Text className="font-heading text-sm text-espresso">
                    {selectedContactIds.length} Kontak Dipilih
                  </Text>
                  <Text className="font-body text-[11px] text-text-muted">
                    Siap ditambahkan ke jaringan
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handlePickSelected}
                  className="bg-mustard px-5 py-3 rounded-xl flex-row items-center gap-2 border-b-2 border-[#d49232]"
                >
                  <UserPlus color="#3E2E22" size={16} />
                  <Text className="font-heading text-espresso text-sm">
                    Pilih & Undang ({selectedContactIds.length})
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

