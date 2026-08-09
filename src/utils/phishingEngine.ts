/**
 * phishingEngine.ts — Pure-JS engine untuk mendeteksi pola phishing di email dan pesan teks.
 * Tidak butuh API eksternal, berjalan 100% on-device.
 */

export type PhishingFlag = {
  id: string;
  level: 'danger' | 'warning' | 'info';
  label: string;
  description: string;
};

export type PhishingAnalysisResult = {
  score: number; // 0 (aman) - 100 (sangat berbahaya)
  verdict: 'AMAN' | 'WASPADA' | 'BERBAHAYA';
  flags: PhishingFlag[];
  summary: string;
};

// ──────────────────────────────────────────────
// Pola-pola berbahaya berdasarkan modus penipuan di Indonesia
// ──────────────────────────────────────────────

const URGENCY_PATTERNS = [
  'segera', 'urgent', 'darurat', 'sekarang juga', 'hari ini',
  'batas waktu', 'jangan sampai terlewat', 'segera konfirmasi',
  'rekening akan diblokir', 'akun akan ditangguhkan', 'dalam 24 jam',
  'dalam 1 jam', 'jangan tunda', 'langsung transfer',
];

const FINANCIAL_BAIT_PATTERNS = [
  'transfer', 'kirim uang', 'bca', 'bri', 'mandiri', 'bni', 'rekening',
  'no rek', 'nomor rekening', 'ewallet', 'gopay', 'ovo', 'dana', 'shopeepay',
  'virtual account', 'kode otp', 'otp anda', 'pin atm', 'cvv',
];

const PRIZE_SCAM_PATTERNS = [
  'selamat anda menang', 'selamat kamu menang', 'anda terpilih',
  'hadiah senilai', 'hadiah uang tunai', 'pemenang beruntung',
  'klaim hadiah', 'hadiah mobil', 'hadiah hp', 'undian berhadiah',
  'bonus cashback', 'bonus langsung', 'voucher gratis',
];

const IMPERSONATION_PATTERNS = [
  'pihak bank', 'tim keamanan', 'customer service', 'cs resmi',
  'petugas ojk', 'badan pengawas', 'kementerian', 'pemerintah',
  'kepolisian', 'aparat', 'dari shopee', 'dari tokopedia', 'dari gojek',
  'admin resmi', 'official', 'verifikasi akun anda',
];

const SUSPICIOUS_LINK_PATTERNS = [
  'bit.ly', 'tinyurl', 'rb.gy', 's.id', 'cutt.ly', 'shorturl',
  'rebrand.ly', 't.co', 'ow.ly', 'goo.gl',
];

const OFFICIAL_DOMAIN_SPOOFS = [
  { real: 'bca.co.id', fakes: ['bca-', '-bca', 'mybca', 'bcabank', 'bca.id'] },
  { real: 'mandiri.co.id', fakes: ['mandiri-', '-mandiri', 'bankmandiri'] },
  { real: 'bri.co.id', fakes: ['bri-', '-bri', 'bankbri'] },
  { real: 'ojk.go.id', fakes: ['ojk-', '-ojk', 'ojkindonesia'] },
  { real: 'shopee.co.id', fakes: ['shopee-', '-shopee', 'shopeeindo'] },
  { real: 'tokopedia.com', fakes: ['tokopedia-', '-tokopedia'] },
];

const SOCIAL_PRESSURE_PATTERNS = [
  'jangan beritahu', 'rahasia', 'jangan ceritakan ke orang lain',
  'hanya untuk anda', 'khusus anda', 'eksklusif', 'jangan sampai ketahuan',
  'ini rahasia', 'tolong dijaga',
];

const INVESTMENT_SCAM_PATTERNS = [
  'investasi menguntungkan', 'profit tinggi', 'return tinggi',
  'cuan besar', 'passive income', 'penghasilan tanpa kerja',
  'trading robot', 'binary option', 'forex bonus', 'kripto dijamin',
  'modal kecil untung besar', 'dijamin profit',
];

// ──────────────────────────────────────────────
// URL Extraction
// ──────────────────────────────────────────────
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  return text.match(urlRegex) || [];
}

function extractDomains(urls: string[]): string[] {
  return urls.map(url => {
    try {
      const match = url.match(/https?:\/\/([^/\s?#]+)/i);
      return match ? match[1].toLowerCase() : '';
    } catch { return ''; }
  }).filter(Boolean);
}

// ──────────────────────────────────────────────
// Pattern checker (case-insensitive)
// ──────────────────────────────────────────────
function countMatches(text: string, patterns: string[]): string[] {
  const lower = text.toLowerCase();
  return patterns.filter(p => lower.includes(p.toLowerCase()));
}

// ──────────────────────────────────────────────
// Main analysis engine
// ──────────────────────────────────────────────
export function analyzeForPhishing(text: string): PhishingAnalysisResult {
  const flags: PhishingFlag[] = [];
  let score = 0;

  // 1. Urgency check
  const urgencyMatches = countMatches(text, URGENCY_PATTERNS);
  if (urgencyMatches.length >= 2) {
    flags.push({
      id: 'urgency_high',
      level: 'danger',
      label: '⚠️ Tekanan Mendesak Tinggi',
      description: `Teks menggunakan ${urgencyMatches.length} kata-kata yang menciptakan kepanikan: "${urgencyMatches.slice(0, 3).join('", "')}"`,
    });
    score += 30;
  } else if (urgencyMatches.length === 1) {
    flags.push({
      id: 'urgency_low',
      level: 'warning',
      label: '⏱️ Ada Tekanan Waktu',
      description: `Ditemukan kata mendesak: "${urgencyMatches[0]}"`,
    });
    score += 12;
  }

  // 2. Prize/lottery scam
  const prizeMatches = countMatches(text, PRIZE_SCAM_PATTERNS);
  if (prizeMatches.length > 0) {
    flags.push({
      id: 'prize_scam',
      level: 'danger',
      label: '🎁 Modus Hadiah Palsu',
      description: `Pola penipuan berhadiah terdeteksi: "${prizeMatches.slice(0, 2).join('", "')}"`,
    });
    score += 35;
  }

  // 3. Financial bait
  const financeMatches = countMatches(text, FINANCIAL_BAIT_PATTERNS);
  if (financeMatches.length >= 2) {
    flags.push({
      id: 'financial_bait',
      level: 'danger',
      label: '💸 Permintaan Finansial',
      description: `Ada ${financeMatches.length} kata terkait uang/rekening/OTP yang mencurigakan`,
    });
    score += 25;
  } else if (financeMatches.length === 1 && countMatches(text, URGENCY_PATTERNS).length > 0) {
    flags.push({
      id: 'financial_warn',
      level: 'warning',
      label: '💳 Menyebut Data Finansial',
      description: `Kombinasi permintaan finansial + urgensi perlu diwaspadai`,
    });
    score += 15;
  }

  // 4. Impersonation
  const impersonationMatches = countMatches(text, IMPERSONATION_PATTERNS);
  if (impersonationMatches.length > 0) {
    flags.push({
      id: 'impersonation',
      level: 'danger',
      label: '🎭 Penyamaran Pihak Resmi',
      description: `Teks mengaku sebagai pihak resmi: "${impersonationMatches.slice(0, 2).join('", "')}"`,
    });
    score += 20;
  }

  // 5. Suspicious links
  const urls = extractUrls(text);
  const domains = extractDomains(urls);
  
  const shortLinks = domains.filter(d => SUSPICIOUS_LINK_PATTERNS.some(p => d.includes(p)));
  if (shortLinks.length > 0) {
    flags.push({
      id: 'short_link',
      level: 'danger',
      label: '🔗 Link Penyingkat Mencurigakan',
      description: `Ditemukan ${shortLinks.length} link penyingkat yang sering dipakai penipu: ${shortLinks.join(', ')}`,
    });
    score += 25;
  }

  // 6. Domain spoofing
  const spoofedDomains: string[] = [];
  for (const domain of domains) {
    for (const spoofDef of OFFICIAL_DOMAIN_SPOOFS) {
      if (!domain.endsWith(spoofDef.real) && spoofDef.fakes.some(fake => domain.includes(fake))) {
        spoofedDomains.push(domain);
      }
    }
  }
  if (spoofedDomains.length > 0) {
    flags.push({
      id: 'domain_spoof',
      level: 'danger',
      label: '🚨 Domain Palsu Terdeteksi',
      description: `Domain mirip tapi bukan resmi: ${spoofedDomains.join(', ')}`,
    });
    score += 40;
  }

  // 7. Social pressure / secrecy
  const socialMatches = countMatches(text, SOCIAL_PRESSURE_PATTERNS);
  if (socialMatches.length > 0) {
    flags.push({
      id: 'social_pressure',
      level: 'warning',
      label: '🤫 Diminta Tutup Mulut',
      description: `Teks meminta kerahasiaan: ciri khas manipulasi sosial`,
    });
    score += 15;
  }

  // 8. Investment scam
  const investMatches = countMatches(text, INVESTMENT_SCAM_PATTERNS);
  if (investMatches.length >= 2) {
    flags.push({
      id: 'investment_scam',
      level: 'danger',
      label: '📈 Penipuan Investasi',
      description: `Pola investasi bodong: "${investMatches.slice(0, 2).join('", "')}"`,
    });
    score += 30;
  }

  // 9. Very short with link (suspicious combo)
  if (text.length < 120 && urls.length > 0 && domains.length > 0) {
    const hasUrgency = urgencyMatches.length > 0 || prizeMatches.length > 0;
    if (hasUrgency) {
      flags.push({
        id: 'short_link_bait',
        level: 'warning',
        label: '📩 Pesan Singkat + Link',
        description: 'Pesan pendek berisi link dan kata mendesak adalah pola phishing umum',
      });
      score += 10;
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Verdict
  let verdict: PhishingAnalysisResult['verdict'];
  let summary: string;

  if (score >= 50) {
    verdict = 'BERBAHAYA';
    summary = 'Teks ini sangat berisiko! Ditemukan beberapa ciri khas penipuan. Jangan ikuti instruksinya dan segera laporkan.';
  } else if (score >= 20) {
    verdict = 'WASPADA';
    summary = 'Ada beberapa tanda mencurigakan. Verifikasi langsung ke pihak resmi sebelum mengambil tindakan apapun.';
  } else {
    verdict = 'AMAN';
    summary = 'Tidak ditemukan pola penipuan yang signifikan. Tetap waspada dan jangan bagikan data pribadi.';
    if (flags.length === 0) {
      flags.push({
        id: 'clean',
        level: 'info',
        label: '✅ Teks Bersih',
        description: 'Tidak ditemukan pola phishing, domain palsu, maupun kata manipulatif.',
      });
    }
  }

  return { score, verdict, flags, summary };
}
