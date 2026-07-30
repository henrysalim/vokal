import { useState, useEffect, useRef } from 'react'

// --- MOCK DATA (simulation — replace with real API in production) ---
const MOCK_USER = {
  name: 'Budi Santoso',
  avatar: 'BS',
  level: 2,
  levelName: 'Voice Detective',
  xp: 1571,
  xpNextLevel: 2000,
  streak: 7,
  familyVerified: 4,
  familyTotal: 5,
}

const MOCK_CODEWORD = {
  word: 'SINGA EMAS',
  verifiedCount: 4,
  totalCount: 5,
  expiresInHours: 6,
}

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

const LEVELS = [
  { id: 0, name: 'Newbie Guardian', minXP: 0, icon: '🛡️' },
  { id: 1, name: 'Voice Detective', minXP: 500, icon: '🔍' },
  { id: 2, name: 'Family Protector', minXP: 1500, icon: '👨‍👩‍👧‍👦' },
  { id: 3, name: 'VOKAL Master', minXP: 3000, icon: '🏆' },
]

const BADGES = [
  { id: 'first_check', label: 'Cek Pertama', icon: '🎯', earned: true },
  { id: 'family_setup', label: 'Keluarga Aman', icon: '❤️', earned: true },
  { id: 'streak_7', label: '7 Hari Berturut', icon: '🔥', earned: true },
  { id: 'quiz_ace', label: 'Quiz Master', icon: '🧠', earned: false },
  { id: 'vokal_master', label: 'VOKAL Master', icon: '👑', earned: false },
]

const QUICK_ACTIONS = [
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
  {
    id: 'scanner',
    title: 'Voice Scanner',
    desc: 'Periksa rekaman sebelum posting',
    icon: '📡',
    bg: 'bg-espresso',
    textColor: 'text-cream',
  },
]

const NAV_ITEMS = [
  { id: 'home', label: 'Beranda', icon: HomeIcon },
  { id: 'akademi', label: 'Akademi', icon: AkademiIcon },
  { id: 'fab', label: '', icon: null },
  { id: 'keluarga', label: 'Keluarga', icon: KeluargaIcon },
  { id: 'profil', label: 'Profil', icon: ProfilIcon },
]

// --- SVG ICONS ---
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3L21 12V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V12Z"
        fill={active ? '#E8A33D' : '#6B5F52'} />
    </svg>
  )
}
function AkademiIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"
        fill={active ? '#E8A33D' : '#6B5F52'} />
    </svg>
  )
}
function KeluargaIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"
        fill={active ? '#E8A33D' : '#6B5F52'} />
    </svg>
  )
}
function ProfilIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
        fill={active ? '#E8A33D' : '#6B5F52'} />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
        fill="#3E2E22" />
    </svg>
  )
}
function ShieldCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6V12C4 16.42 7.56 20.57 12 22C16.44 20.57 20 16.42 20 12V6L12 2Z" fill="#74822F" opacity="0.3"/>
      <path d="M12 2L4 6V12C4 16.42 7.56 20.57 12 22C16.44 20.57 20 16.42 20 12V6L12 2ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="#74822F"/>
    </svg>
  )
}
function FireIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M13.5 0.67L14.83 3.33C15.5 4.67 17 5.5 18.5 5.5C19.78 5.5 20.83 6.56 20.83 7.83C20.83 11.5 17.83 14.5 14 14.5C12.78 14.5 11.61 14.17 10.61 13.61L10.5 13.5C9.06 12.06 8.17 10.17 8.17 8.17C8.17 6.89 9.06 5.78 10.33 5.5C10.89 5.39 11.28 4.89 11.17 4.33L10.61 1.67C10.5 1.11 10.83 0.56 11.39 0.44C12.11 0.28 12.94 0.39 13.5 0.67Z" fill="#C1592E"/>
      <path d="M5 14C5 18.42 8.58 22 13 22C17.42 22 21 18.42 21 14C21 12.28 20.44 10.69 19.5 9.39C18.39 10.67 16.78 11.5 15 11.5C11.69 11.5 9 8.81 9 5.5C9 4.5 9.25 3.56 9.67 2.72C7 4.06 5 6.83 5 10V14Z" fill="#E8A33D"/>
    </svg>
  )
}
function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#E8A33D' : '#D4C4B0'}>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>
  )
}
function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 18L15 12L9 6" stroke="#6B5F52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#6B5F52" opacity="0.5">
      <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z"/>
    </svg>
  )
}

// --- MASCOT SVG (matches the uploaded image: shield + sound waves + smiley face) ---
function VokalMascot({ size = 120 }: { size?: number }) {
  return (
    <div className="mascot-float" style={{ width: size, height: size * 0.85 }}>
      <svg viewBox="0 0 200 170" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        {/* Left sound waves */}
        <g className="wave-left" style={{ transformOrigin: '55px 85px' }}>
          <path d="M52 55 Q32 85 52 115" stroke="#C1592E" strokeWidth="7" strokeLinecap="round" fill="none"/>
          <path d="M42 45 Q14 85 42 125" stroke="#74822F" strokeWidth="7" strokeLinecap="round" fill="none"/>
          <path d="M32 35 Q-4 85 32 135" stroke="#E8A33D" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.6"/>
        </g>

        {/* Right sound waves */}
        <g className="wave-right" style={{ transformOrigin: '145px 85px' }}>
          <path d="M148 55 Q168 85 148 115" stroke="#C1592E" strokeWidth="7" strokeLinecap="round" fill="none"/>
          <path d="M158 45 Q186 85 158 125" stroke="#74822F" strokeWidth="7" strokeLinecap="round" fill="none"/>
          <path d="M168 35 Q204 85 168 135" stroke="#E8A33D" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.6"/>
        </g>

        {/* Shield body */}
        <path d="M100 18 L148 38 L148 88 C148 118 126 140 100 152 C74 140 52 118 52 88 L52 38 Z"
          fill="#E8A33D" />
        {/* Shield shadow/highlight */}
        <path d="M100 18 L100 152 C74 140 52 118 52 88 L52 38 Z"
          fill="rgba(62,46,34,0.08)" />
        {/* Shield outline */}
        <path d="M100 18 L148 38 L148 88 C148 118 126 140 100 152 C74 140 52 118 52 88 L52 38 Z"
          stroke="#3E2E22" strokeWidth="5" fill="none" strokeLinejoin="round"/>

        {/* Eyes */}
        <g className="mascot-blink" style={{ transformOrigin: '85px 82px' }}>
          <circle cx="85" cy="82" r="6" fill="#3E2E22"/>
          <circle cx="115" cy="82" r="6" fill="#3E2E22"/>
        </g>
        {/* Eye glints */}
        <circle cx="87" cy="80" r="2" fill="white"/>
        <circle cx="117" cy="80" r="2" fill="white"/>

        {/* Smile */}
        <path d="M88 100 Q100 114 112 100" stroke="#3E2E22" strokeWidth="4.5" strokeLinecap="round" fill="none"/>

        {/* Cheek blush */}
        <circle cx="76" cy="95" r="7" fill="#C1592E" opacity="0.25"/>
        <circle cx="124" cy="95" r="7" fill="#C1592E" opacity="0.25"/>
      </svg>
    </div>
  )
}

// --- XP PROGRESS BAR ---
function XPBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--xp-width', `${pct}%`)
    }
  }, [pct])

  return (
    <div className="w-full bg-espresso/10 rounded-full h-3 overflow-hidden">
      <div
        ref={ref}
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #E8A33D 0%, #F5C97A 100%)',
          transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 0 8px rgba(232,163,61,0.6)',
        }}
      />
    </div>
  )
}

// --- LEVEL PROGRESS TRACK ---
function LevelTrack({ currentLevel }: { currentLevel: number }) {
  return (
    <div className="flex items-center justify-between w-full px-1 relative">
      <div className="absolute left-6 right-6 top-4 h-0.5 bg-espresso/10 z-0" />
      {LEVELS.map((lvl, i) => {
        const done = i < currentLevel
        const active = i === currentLevel
        const locked = i > currentLevel
        return (
          <div key={lvl.id} className="flex flex-col items-center gap-1 z-10">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all ${
                active
                  ? 'bg-mustard shadow-lg scale-110'
                  : done
                  ? 'bg-olive'
                  : 'bg-espresso/10'
              }`}
              style={active ? { boxShadow: '0 0 0 4px rgba(232,163,61,0.25)' } : {}}
            >
              {locked ? <LockIcon /> : <span>{lvl.icon}</span>}
            </div>
            <span
              className={`text-[9px] font-semibold text-center leading-tight max-w-[52px] ${
                active ? 'text-espresso' : done ? 'text-olive' : 'text-muted/60'
              }`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {lvl.name.split(' ')[0]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// --- CIRCULAR DAY STRIP ---
function DayStrip({ todayIdx }: { todayIdx: number }) {
  const [selected, setSelected] = useState(todayIdx)
  const streakDays = [0, 1, 2, 3, 4, 5, 6].slice(0, todayIdx + 1)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    const diff = i - todayIdx
    d.setDate(d.getDate() + diff)
    return d.getDate()
  })

  return (
    <div className="flex justify-between items-center gap-1">
      {DAYS.map((day, i) => {
        const isToday = i === todayIdx
        const isSel = i === selected
        const hasStreak = streakDays.includes(i)
        return (
          <button
            key={day}
            onClick={() => setSelected(i)}
            className="flex flex-col items-center gap-1 min-w-[40px] min-h-[60px] justify-center"
          >
            <span className="text-[11px] font-semibold text-muted" style={{ fontFamily: 'var(--font-body)' }}>
              {day}
            </span>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all ${
                isSel
                  ? 'bg-mustard shadow-md scale-110'
                  : isToday
                  ? 'border-2 border-mustard bg-mustard-light'
                  : 'bg-espresso/8'
              }`}
              style={isSel ? { boxShadow: '0 4px 12px rgba(232,163,61,0.4)' } : {}}
            >
              <span
                className={`text-sm font-bold ${isSel ? 'text-espresso' : isToday ? 'text-mustard' : 'text-espresso/60'}`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {dates[i]}
              </span>
              {hasStreak && !isSel && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-terracotta rounded-full flex items-center justify-center">
                  <span className="text-[7px]">🔥</span>
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// --- RISK METER (pill bar) ---
function RiskMeterMini({ score = 22 }: { score?: number }) {
  const color = score < 30 ? '#74822F' : score < 70 ? '#E8A33D' : '#7A2E28'
  const label = score < 30 ? 'AMAN' : score < 70 ? 'WASPADA' : 'BAHAYA'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-espresso/10 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
        style={{ background: color, fontFamily: 'var(--font-display)' }}>
        {label}
      </span>
    </div>
  )
}

// --- FAMILY MEMBER AVATARS ---
function FamilyAvatars({ verified, total }: { verified: number; total: number }) {
  const names = ['Budi', 'Sri', 'Rini', 'Hadi', 'Joko']
  const initials = names.map(n => n[0])
  return (
    <div className="flex items-center gap-1">
      {initials.slice(0, total).map((initial, i) => (
        <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
          i < verified
            ? 'bg-olive text-white border-olive'
            : 'bg-espresso/10 text-muted border-cream'
        }`}
          style={{ fontFamily: 'var(--font-display)' }}>
          {i < verified ? initial : <LockIcon />}
        </div>
      ))}
      <span className="text-xs text-surface/80 font-semibold ml-1" style={{ fontFamily: 'var(--font-body)' }}>
        {verified}/{total} terverifikasi
      </span>
    </div>
  )
}

// --- MAIN APP ---
export default function App() {
  const [activeNav, setActiveNav] = useState('home')
  const [showBadgeToast, setShowBadgeToast] = useState(false)
  const [xpAnimated, setXpAnimated] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 100)
    const t2 = setTimeout(() => setXpAnimated(true), 600)
    const t3 = setTimeout(() => setShowBadgeToast(true), 2000)
    const t4 = setTimeout(() => setShowBadgeToast(false), 5000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  const xpPct = Math.round((MOCK_USER.xp / MOCK_USER.xpNextLevel) * 100)

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #E8D9C8 0%, #F0EAE0 50%, #EDE4D4 100%)' }}
    >
      {/* Phone shell */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: 390,
          height: 844,
          borderRadius: 44,
          background: '#F0EAE0',
          boxShadow: '0 40px 120px rgba(62,46,34,0.3), 0 0 0 12px #3E2E22, 0 0 0 14px #6B5F52',
        }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-8 pt-4 pb-1 shrink-0">
          <span className="text-xs font-bold text-espresso" style={{ fontFamily: 'var(--font-display)' }}>9:41</span>
          <div className="w-24 h-6 bg-espresso rounded-full flex items-center justify-center gap-1">
            <div className="w-3 h-3 rounded-full bg-surface/30" />
          </div>
          <div className="flex gap-1 items-center">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="#3E2E22">
              <rect x="0" y="4" width="3" height="8" rx="1"/>
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1"/>
              <rect x="9" y="1" width="3" height="11" rx="1"/>
              <rect x="13.5" y="0" width="2.5" height="12" rx="1"/>
            </svg>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">

          {/* ─── HERO HEADER WITH MASCOT ─── */}
          <div
            className="relative mx-4 mt-2 rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #3E2E22 0%, #5A3D28 60%, #7A5230 100%)',
              minHeight: 200,
            }}
          >
            {/* Decorative circles */}
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #E8A33D, transparent)' }} />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #74822F, transparent)' }} />

            {/* Greeting + notification bell */}
            <div className="flex justify-between items-start px-5 pt-5">
              <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-surface/60 text-sm font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                  Selamat pagi 👋
                </p>
                <h1 className="text-white text-2xl font-extrabold leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  Hi, {MOCK_USER.name.split(' ')[0]}!
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 bg-mustard/20 rounded-full px-2 py-0.5">
                    <FireIcon />
                    <span className="text-mustard text-xs font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      {MOCK_USER.streak} hari streak
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="w-10 h-10 rounded-full bg-surface/10 flex items-center justify-center relative"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <BellIcon />
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-terracotta rounded-full border-2 border-espresso" />
                </button>
                <div
                  className="w-10 h-10 rounded-full bg-mustard flex items-center justify-center text-espresso font-extrabold text-sm"
                  style={{ fontFamily: 'var(--font-display)', boxShadow: '0 0 0 3px rgba(232,163,61,0.4)' }}
                >
                  {MOCK_USER.avatar}
                </div>
              </div>
            </div>

            {/* Mascot centered on card */}
            <div className="flex justify-center mt-1 mb-2">
              <VokalMascot size={140} />
            </div>

            {/* XP bar at bottom of hero */}
            <div className="px-5 pb-5">
              <div className="bg-surface/10 rounded-2xl p-3" style={{ backdropFilter: 'blur(8px)' }}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-mustard text-lg font-black" style={{ fontFamily: 'var(--font-display)' }}>
                      Lv.{MOCK_USER.level}
                    </span>
                    <span className="text-surface/80 text-xs font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                      {MOCK_USER.levelName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-mustard font-extrabold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                      {MOCK_USER.xp.toLocaleString()}
                    </span>
                    <span className="text-surface/50 text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                      / {MOCK_USER.xpNextLevel.toLocaleString()} XP
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface/20 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: xpAnimated ? `${xpPct}%` : '0%',
                      background: 'linear-gradient(90deg, #E8A33D 0%, #F5C97A 100%)',
                      transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1)',
                      boxShadow: '0 0 10px rgba(232,163,61,0.7)',
                    }}
                  />
                </div>
                <p className="text-surface/50 text-[10px] mt-1 text-right" style={{ fontFamily: 'var(--font-body)' }}>
                  {MOCK_USER.xpNextLevel - MOCK_USER.xp} XP lagi ke level berikutnya
                </p>
              </div>
            </div>
          </div>

          {/* ─── DAY STRIP ─── */}
          <div
            className={`mx-4 mt-3 bg-surface rounded-2xl p-4 shadow-sm transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ animationDelay: '200ms' }}
          >
            <DayStrip todayIdx={TODAY_IDX} />
          </div>

          {/* ─── CODEWORD HERO CARD ─── */}
          <div className="px-4 mt-3">
            <div
              className={`rounded-3xl overflow-hidden card-hover transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{
                background: 'linear-gradient(135deg, #E8A33D 0%, #F5C97A 60%, #E8A33D 100%)',
                animationDelay: '300ms',
              }}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-espresso/70 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                        🔑 Codeword Hari Ini
                      </span>
                    </div>
                    <h2 className="text-espresso text-3xl font-black tracking-wide" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>
                      {MOCK_CODEWORD.word}
                    </h2>
                  </div>
                  <div className="bg-espresso/15 rounded-2xl p-2 flex flex-col items-center">
                    <span className="text-espresso font-black text-xl leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                      {MOCK_CODEWORD.expiresInHours}
                    </span>
                    <span className="text-espresso/70 text-[9px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>jam lagi</span>
                  </div>
                </div>

                <FamilyAvatars verified={MOCK_CODEWORD.verifiedCount} total={MOCK_CODEWORD.totalCount} />

                <div className="mt-3 flex gap-2">
                  <div className="flex-1 bg-espresso/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-olive"
                      style={{
                        width: `${(MOCK_CODEWORD.verifiedCount / MOCK_CODEWORD.totalCount) * 100}%`,
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheckIcon />
                    <span className="text-olive text-xs font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      {MOCK_CODEWORD.verifiedCount}/{MOCK_CODEWORD.totalCount}
                    </span>
                  </div>
                </div>

                <button className="mt-4 w-full bg-espresso text-cream font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  <span>📲</span> Bagikan ke Keluarga
                </button>
              </div>
            </div>
          </div>

          {/* ─── QUICK ACTIONS ─── */}
          <div className="px-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-espresso text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                Aksi Cepat
              </h3>
              <button className="text-mustard text-xs font-semibold flex items-center gap-0.5" style={{ fontFamily: 'var(--font-body)' }}>
                Lihat semua <ChevronRightIcon />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={action.id}
                  className={`${action.bg} ${action.textColor} rounded-2xl p-4 text-left card-hover`}
                  style={{
                    animationDelay: `${400 + i * 80}ms`,
                    boxShadow: '0 4px 16px rgba(62,46,34,0.12)',
                  }}
                >
                  <div className="text-3xl mb-2">{action.icon}</div>
                  <div className="font-bold text-sm leading-tight mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                    {action.title}
                  </div>
                  <div className="text-[11px] opacity-75 leading-snug" style={{ fontFamily: 'var(--font-body)' }}>
                    {action.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ─── AKADEMI VOKAL CARD ─── */}
          <div className="px-4 mt-4">
            <div
              className="bg-surface rounded-3xl p-5 shadow-sm card-hover"
              style={{ boxShadow: '0 4px 20px rgba(62,46,34,0.08)' }}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-espresso text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                    🎓 Akademi VOKAL
                  </h3>
                  <p className="text-muted text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                    Latih instingmu, lindungi keluargamu
                  </p>
                </div>
                <button className="text-mustard text-xs font-semibold flex items-center gap-0.5" style={{ fontFamily: 'var(--font-body)' }}>
                  Buka <ChevronRightIcon />
                </button>
              </div>

              {/* Big XP stat */}
              <div className="text-center mb-4">
                <div className="shimmer-text text-6xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
                  {MOCK_USER.xp.toLocaleString()}
                </div>
                <p className="text-muted text-xs font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                  Total XP yang kamu kumpulkan
                </p>
              </div>

              <LevelTrack currentLevel={MOCK_USER.level} />

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Practice Call', icon: '📞', xp: '+50 XP', color: 'bg-mustard-light text-espresso' },
                  { label: 'Scam Story', icon: '📖', xp: '+30 XP', color: 'bg-terracotta-light text-terracotta' },
                  { label: 'Quiz', icon: '❓', xp: '+20 XP', color: 'bg-olive-light text-olive' },
                ].map(item => (
                  <button key={item.label} className={`${item.color} rounded-xl p-2.5 text-center card-hover`}>
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="text-[10px] font-bold leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                      {item.label}
                    </div>
                    <div className="text-[9px] font-bold mt-0.5 opacity-70" style={{ fontFamily: 'var(--font-display)' }}>
                      {item.xp}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── BADGES ─── */}
          <div className="px-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-espresso text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                🏅 Lencana Kamu
              </h3>
              <span className="text-muted text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                {BADGES.filter(b => b.earned).length}/{BADGES.length} diraih
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {BADGES.map((badge, i) => (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-1.5 shrink-0 ${badge.earned ? 'badge-pop' : 'opacity-40'}`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                      badge.earned ? 'bg-mustard shadow-md' : 'bg-espresso/10'
                    }`}
                    style={badge.earned ? { boxShadow: '0 4px 12px rgba(232,163,61,0.35)' } : {}}
                  >
                    {badge.earned ? badge.icon : '🔒'}
                  </div>
                  <span className="text-[10px] font-semibold text-center max-w-[56px] leading-tight text-espresso/70"
                    style={{ fontFamily: 'var(--font-body)' }}>
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── FAMILY RISK SUMMARY ─── */}
          <div className="px-4 mt-4 mb-4">
            <div className="bg-surface rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-espresso text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                  🛡️ Status Keamanan Keluarga
                </h3>
                <span className="text-[10px] bg-olive-light text-olive font-bold px-2 py-1 rounded-full"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  AMAN
                </span>
              </div>
              <p className="text-muted text-xs mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                Simulasi — data contoh (tidak ada panggilan berisiko terdeteksi hari ini)
              </p>
              {[
                { name: 'Ayah (Hadi)', risk: 12, lastCheck: '2 jam lalu' },
                { name: 'Ibu (Sri)', risk: 8, lastCheck: '4 jam lalu' },
                { name: 'Kakak (Rini)', risk: 35, lastCheck: '1 jam lalu' },
              ].map(member => (
                <div key={member.name} className="mb-3 last:mb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-espresso" style={{ fontFamily: 'var(--font-body)' }}>
                      {member.name}
                    </span>
                    <span className="text-[10px] text-muted" style={{ fontFamily: 'var(--font-body)' }}>
                      {member.lastCheck}
                    </span>
                  </div>
                  <RiskMeterMini score={member.risk} />
                </div>
              ))}
            </div>
          </div>

          {/* ─── LEADERBOARD TEASER ─── */}
          <div className="px-4 mb-6">
            <div
              className="rounded-3xl p-4 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #74822F 0%, #9AAD3D 100%)' }}
            >
              <div className="absolute right-4 top-4 text-5xl opacity-20">🏆</div>
              <p className="text-olive-light text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Papan Peringkat Keluarga
              </p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-white text-4xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
                  #2
                </span>
                <span className="text-white/80 text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                  dari 847 keluarga minggu ini
                </span>
              </div>
              <div className="flex gap-1">
                {[5, 4, 5, 3, 4, 5, 4].map((stars, i) => (
                  <div key={i} className="flex flex-col items-center">
                    {[...Array(5)].map((_, j) => (
                      <StarIcon key={j} filled={j < stars} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ─── BOTTOM NAV ─── */}
        <div
          className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-2"
          style={{ background: 'linear-gradient(to top, #F0EAE0 70%, transparent)' }}
        >
          <div
            className="flex items-center justify-around bg-espresso rounded-3xl px-2 py-3 relative"
            style={{ boxShadow: '0 8px 32px rgba(62,46,34,0.35)' }}
          >
            {NAV_ITEMS.map((item) => {
              if (item.id === 'fab') {
                return (
                  <div key="fab" className="relative -mt-8">
                    <button
                      className="fab-pulse w-16 h-16 rounded-full bg-mustard flex items-center justify-center relative"
                      style={{
                        boxShadow: '0 8px 24px rgba(232,163,61,0.55)',
                        border: '3px solid #F5C97A',
                      }}
                    >
                      <span className="text-2xl">🎙️</span>
                    </button>
                    <p className="text-[9px] text-mustard font-bold text-center mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                      Cek Suara
                    </p>
                  </div>
                )
              }
              const Icon = item.icon!
              const isActive = activeNav === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className="flex flex-col items-center gap-1 min-w-[52px] min-h-[44px] justify-center"
                >
                  <Icon active={isActive} />
                  <span
                    className={`text-[10px] font-semibold ${isActive ? 'text-mustard' : 'text-surface/40'}`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── BADGE TOAST ─── */}
        <div
          className={`absolute top-16 left-4 right-4 transition-all duration-500 z-50 ${
            showBadgeToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div
            className="bg-espresso rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ boxShadow: '0 8px 24px rgba(62,46,34,0.4)' }}
          >
            <div className="w-10 h-10 bg-mustard rounded-xl flex items-center justify-center text-xl shrink-0 badge-pop">
              🔥
            </div>
            <div>
              <p className="text-mustard text-xs font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Lencana Baru Diraih!
              </p>
              <p className="text-surface/80 text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                "7 Hari Berturut" — kamu luar biasa!
              </p>
            </div>
            <div className="ml-auto flex">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-mustard"
                  style={{ animation: `bounce-dot 0.6s ease infinite ${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Corner branding */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none">
          <span
            className="text-[10px] font-black tracking-[0.2em] text-espresso/20 uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            VOKAL
          </span>
        </div>
      </div>

      {/* Decorative background elements */}
      <div
        className="fixed top-20 left-20 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(232,163,61,0.15), transparent)', filter: 'blur(40px)' }}
      />
      <div
        className="fixed bottom-20 right-20 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(116,130,47,0.12), transparent)', filter: 'blur(60px)' }}
      />
    </div>
  )
}
