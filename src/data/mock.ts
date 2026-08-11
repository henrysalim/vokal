

export const MOCK_USER = {
  name: 'Budi Santoso',
  avatar: 'BS',
  level: 2,
  levelName: 'Voice Detective',
  xp: 1571,
  xpNextLevel: 2000,
  streak: 7,
  familyVerified: 4,
  familyTotal: 5,
};

export const MOCK_CODEWORD = {
  word: 'SINGA EMAS',
  verifiedCount: 4,
  totalCount: 5,
  expiresInHours: 6,
};

export const LEVELS = [
  { id: 0, name: 'Newbie Guardian', minXP: 0, icon: '🛡️' },
  { id: 1, name: 'Voice Detective', minXP: 500, icon: '🔍' },
  { id: 2, name: 'Family Protector', minXP: 1500, icon: '👨‍👩‍👧‍👦' },
  { id: 3, name: 'VOKAL Master', minXP: 3000, icon: '🏆' },
];

export const BADGES = [
  { id: 'first_check', label: 'Cek Pertama', icon: '🎯', earned: true },
  { id: 'family_setup', label: 'Keluarga Aman', icon: '❤️', earned: true },
  { id: 'streak_7', label: '7 Hari Berturut', icon: '🔥', earned: true },
  { id: 'quiz_ace', label: 'Quiz Master', icon: '🧠', earned: false },
  { id: 'vokal_master', label: 'VOKAL Master', icon: '👑', earned: false },
];

export const QUICK_ACTIONS = [
  {
    id: 'cek',
    title: 'Cek Suara Ini',
    desc: 'Analisis klip suara sekarang',
    icon: '🎙️',
    bg: 'bg-mustard',
    textColor: 'text-espresso',
  },
  {
    id: 'codeword',
    title: 'Atur Codeword',
    desc: 'Perbarui kata rahasia keluarga',
    icon: '🔑',
    bg: 'bg-terracotta',
    textColor: 'text-white',
  },
  {
    id: 'latihan',
    title: 'Latihan Keluarga',
    desc: 'Simulasi panggilan palsu',
    icon: '🎭',
    bg: 'bg-olive',
    textColor: 'text-white',
  },
];

export const FAMILY_MEMBERS = [
  { id: '1', name: 'Budi Santoso', role: 'Anda (Admin)', risk: 0, status: 'Aman', verified: true },
  { id: '2', name: 'Sri Wahyuni', role: 'Ibu', risk: 8, status: 'Aman', verified: true },
  { id: '3', name: 'Hadi Pranoto', role: 'Ayah', risk: 12, status: 'Waspada', verified: true },
  { id: '4', name: 'Rini Santoso', role: 'Kakak', risk: 0, status: 'Aman', verified: true },
  { id: '5', name: 'Joko Anwar', role: 'Adik', risk: 0, status: 'Menunggu', verified: false },
];

export const LEADERBOARD = [
  { rank: 1, name: 'Keluarga Wijaya', score: 2840, isMe: false },
  { rank: 2, name: 'Keluarga Santoso', score: 1571, isMe: true },
  { rank: 3, name: 'Keluarga Pratama', score: 1120, isMe: false },
  { rank: 4, name: 'Keluarga Kusuma', score: 890, isMe: false },
  { rank: 5, name: 'Keluarga Siregar', score: 560, isMe: false },
];
