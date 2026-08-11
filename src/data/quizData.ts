

export type QuizOption = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  category: 'deteksi_ai' | 'kenali_modus' | 'tindakan_tepat';
  categoryLabel: string;
  question: string;
  options: QuizOption[];
  correctId: string;
  explanation: string;
  xpReward: number;
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [

  {
    id: 'q1',
    category: 'deteksi_ai',
    categoryLabel: 'Deteksi Suara AI',
    question: 'Ciri paling khas dari suara yang dihasilkan AI cloning adalah...',
    options: [
      { id: 'a', text: 'Suaranya terdengar lebih dalam dari biasanya' },
      { id: 'b', text: 'Tidak ada jeda napas alami dan nadanya terlalu rata' },
      { id: 'c', text: 'Berbicara dengan dialek yang berbeda' },
      { id: 'd', text: 'Volume suara yang terlalu keras' },
    ],
    correctId: 'b',
    explanation: 'AI voice cloning saat ini masih kesulitan meniru pola napas manusia secara alami. Suaranya cenderung terdengar terlalu mulus dan rata tanpa jeda napas.',
    xpReward: 20,
  },
  {
    id: 'q2',
    category: 'deteksi_ai',
    categoryLabel: 'Deteksi Suara AI',
    question: 'Penipu merekam suara targetnya dari mana biasanya?',
    options: [
      { id: 'a', text: 'Rekaman panggilan telepon yang dicuri dari operator' },
      { id: 'b', text: 'Video publik di TikTok, Instagram Stories, atau WhatsApp Status' },
      { id: 'c', text: 'Microphone tersembunyi di dalam rumah' },
      { id: 'd', text: 'Data dari aplikasi belanja online' },
    ],
    correctId: 'b',
    explanation: 'Hanya 3–5 detik audio sudah cukup untuk model AI membuat kloning suara. Video publik di media sosial adalah sumber paling mudah diakses oleh penipu.',
    xpReward: 20,
  },
  {
    id: 'q3',
    category: 'deteksi_ai',
    categoryLabel: 'Deteksi Suara AI',
    question: 'Jika kamu menerima telepon dari "anak" yang menangis minta transfer darurat, langkah pertama yang paling efektif adalah...',
    options: [
      { id: 'a', text: 'Langsung transfer karena khawatir anaknya dalam bahaya' },
      { id: 'b', text: 'Menutup telepon dan menghubungi anak melalui nomor yang sudah tersimpan' },
      { id: 'c', text: 'Minta foto diri sebagai bukti' },
      { id: 'd', text: 'Tanyakan nama anakmu untuk konfirmasi' },
    ],
    correctId: 'b',
    explanation: 'Menutup telepon dan menghubungi kembali melalui nomor yang sudah kamu simpan adalah cara paling pasti. Nama bisa diketahui penipu dari media sosial.',
    xpReward: 25,
  },
  {
    id: 'q4',
    category: 'deteksi_ai',
    categoryLabel: 'Deteksi Suara AI',
    question: 'Berapa detik audio minimum yang cukup untuk AI membuat kloning suara yang realistis?',
    options: [
      { id: 'a', text: 'Minimal 5 menit audio' },
      { id: 'b', text: 'Minimal 1 menit audio' },
      { id: 'c', text: 'Hanya 3–10 detik audio sudah cukup' },
      { id: 'd', text: 'Minimal 30 menit audio' },
    ],
    correctId: 'c',
    explanation: 'Model AI modern seperti ElevenLabs hanya membutuhkan 3–10 detik audio untuk menghasilkan kloning suara yang cukup realistis untuk menipu anggota keluarga.',
    xpReward: 20,
  },
  {
    id: 'q5',
    category: 'deteksi_ai',
    categoryLabel: 'Deteksi Suara AI',
    question: 'Apa itu "Codeword Keluarga" dalam konteks keamanan VOKAL?',
    options: [
      { id: 'a', text: 'Password untuk membuka aplikasi VOKAL' },
      { id: 'b', text: 'Kata rahasia yang berubah setiap hari dan hanya diketahui anggota keluarga asli' },
      { id: 'c', text: 'Nomor PIN rekening bank' },
      { id: 'd', text: 'Kode QR untuk berbagi kontak' },
    ],
    correctId: 'b',
    explanation: 'Codeword VOKAL menggunakan sistem TOTP (Time-based One-Time Password) yang berubah setiap hari. AI yang mengkloning suara tidak bisa mengetahui kata ini.',
    xpReward: 25,
  },

  {
    id: 'q6',
    category: 'kenali_modus',
    categoryLabel: 'Kenali Modus',
    question: 'Kamu dapat SMS: "Selamat! Nomor HP Anda terpilih memenangkan hadiah Rp 50 juta. Klik bit.ly/claim-rp50jt untuk klaim." Ini adalah modus...',
    options: [
      { id: 'a', text: 'Penawaran kerja sama bisnis yang sah' },
      { id: 'b', text: 'Phishing dengan iming-iming hadiah palsu' },
      { id: 'c', text: 'Promo resmi dari operator seluler' },
      { id: 'd', text: 'Notifikasi pengiriman paket belanja online' },
    ],
    correctId: 'b',
    explanation: 'Ciri-cirinya jelas: hadiah tak terduga, link penyingkat (bit.ly), dan tidak ada konteks sebelumnya. Penipu menggunakan link pendek agar URL berbahaya tidak terlihat.',
    xpReward: 20,
  },
  {
    id: 'q7',
    category: 'kenali_modus',
    categoryLabel: 'Kenali Modus',
    question: 'Email masuk dari "cs-bca@mybca-banking.id" meminta kamu verifikasi rekening. Bank BCA asli menggunakan domain...',
    options: [
      { id: 'a', text: 'mybca-banking.id' },
      { id: 'b', text: 'bca.id' },
      { id: 'c', text: 'bca.co.id' },
      { id: 'd', text: 'online-bca.com' },
    ],
    correctId: 'c',
    explanation: 'BCA resmi menggunakan domain bca.co.id. Domain "mybca-banking.id" adalah domain palsu yang dibuat mirip untuk menipu. Selalu cek URL secara teliti sebelum klik.',
    xpReward: 25,
  },
  {
    id: 'q8',
    category: 'kenali_modus',
    categoryLabel: 'Kenali Modus',
    question: 'Modus "Social Engineering" dalam penipuan siber adalah...',
    options: [
      { id: 'a', text: 'Meretas sistem komputer perusahaan' },
      { id: 'b', text: 'Memanipulasi psikologi korban agar mau memberikan informasi sensitif' },
      { id: 'c', text: 'Membuat aplikasi palsu yang mirip bank' },
      { id: 'd', text: 'Menyadap komunikasi online' },
    ],
    correctId: 'b',
    explanation: 'Social engineering memanfaatkan emosi manusia — rasa takut, terburu-buru, atau kepercayaan — bukan kecanggihan teknis. Inilah kenapa edukasi adalah pertahanan terbaik.',
    xpReward: 20,
  },
  {
    id: 'q9',
    category: 'kenali_modus',
    categoryLabel: 'Kenali Modus',
    question: 'Penipu yang berkedok "OJK" menelepon dan meminta nomor OTP karena "akun pinjol atas namamu telah dibuat." Apa yang harus kamu lakukan?',
    options: [
      { id: 'a', text: 'Berikan OTP agar akun pinjol bisa segera ditutup' },
      { id: 'b', text: 'Minta waktu lalu hubungi OJK langsung di 157' },
      { id: 'c', text: 'Tanyakan nama lengkap petugasnya dulu' },
      { id: 'd', text: 'Berikan data KTP saja, bukan OTP' },
    ],
    correctId: 'b',
    explanation: 'OJK tidak pernah meminta OTP melalui telepon. Selalu verifikasi dengan menghubungi langsung ke 157. Ini adalah modus klasik yang memangsa rasa panik korban.',
    xpReward: 25,
  },
  {
    id: 'q10',
    category: 'kenali_modus',
    categoryLabel: 'Kenali Modus',
    question: 'Investasi bodong biasanya menjanjikan...',
    options: [
      { id: 'a', text: 'Return 5–8% per tahun dengan risiko jelas' },
      { id: 'b', text: 'Return 30–100% per bulan dengan "jaminan profit"' },
      { id: 'c', text: 'Cicilan 0% tanpa DP untuk pembelian aset' },
      { id: 'd', text: 'Bunga tabungan lebih tinggi dari bank' },
    ],
    correctId: 'b',
    explanation: 'Return yang tidak masuk akal (30–100%/bulan) dengan "garansi profit" adalah tanda merah terbesar. Tidak ada investasi yang bisa menjamin keuntungan sebesar itu secara konsisten.',
    xpReward: 20,
  },

  {
    id: 'q11',
    category: 'tindakan_tepat',
    categoryLabel: 'Tindakan Tepat',
    question: 'Orang tua kamu sudah terlanjur mentransfer uang ke rekening penipu. Apa langkah pertama yang paling penting?',
    options: [
      { id: 'a', text: 'Langsung hubungi bank dan minta blokir rekening tujuan transfer' },
      { id: 'b', text: 'Lapor ke polisi dulu baru ke bank' },
      { id: 'c', text: 'Post di media sosial agar orang lain waspada' },
      { id: 'd', text: 'Hubungi penipu dan minta uang dikembalikan' },
    ],
    correctId: 'a',
    explanation: 'Waktu adalah segalanya. Hubungi bank SEGERA — semakin cepat rekening tujuan diblokir, semakin besar kemungkinan uang bisa diselamatkan. Lapor polisi bisa dilakukan setelahnya.',
    xpReward: 25,
  },
  {
    id: 'q12',
    category: 'tindakan_tepat',
    categoryLabel: 'Tindakan Tepat',
    question: 'Cara paling efektif melindungi orang tua lansia dari scam telepon adalah...',
    options: [
      { id: 'a', text: 'Ambil HP mereka agar tidak bisa dihubungi' },
      { id: 'b', text: 'Latih mereka mengenali ciri penipuan dan buat kata kode keluarga' },
      { id: 'c', text: 'Install antivirus di HP mereka' },
      { id: 'd', text: 'Ganti nomor HP mereka secara berkala' },
    ],
    correctId: 'b',
    explanation: 'Edukasi dan kata kode keluarga adalah kombinasi terkuat. Antivirus tidak bisa mendeteksi penipuan telepon, dan membatasi akses HP justru membuat mereka lebih rentan saat butuh bantuan.',
    xpReward: 25,
  },
  {
    id: 'q13',
    category: 'tindakan_tepat',
    categoryLabel: 'Tindakan Tepat',
    question: 'Sebelum mengunggah video ulang tahun keluarga ke media sosial, apa yang sebaiknya kamu pertimbangkan?',
    options: [
      { id: 'a', text: 'Pastikan kualitas video cukup bagus' },
      { id: 'b', text: 'Durasi video termasuk cukup panjang' },
      { id: 'c', text: 'Pertimbangkan privasi akun dan seberapa jelas suara anggota keluarga terekspos' },
      { id: 'd', text: 'Tambahkan caption yang menarik' },
    ],
    correctId: 'c',
    explanation: 'Setiap video yang menampilkan suara anggota keluarga secara jelas meningkatkan "Voice Exposure Score" mereka. Set akun ke privat atau trim bagian yang menampilkan suara panjang.',
    xpReward: 20,
  },
  {
    id: 'q14',
    category: 'tindakan_tepat',
    categoryLabel: 'Tindakan Tepat',
    question: 'Nomor tidak dikenal menelepon dan mengaku sebagai polisi yang menahan anakmu. Mereka meminta biaya jaminan. Kamu harus...',
    options: [
      { id: 'a', text: 'Transfer dulu agar anak cepat bebas, lalu urus legalitasnya nanti' },
      { id: 'b', text: 'Tanya nama lengkap dan nomor badge polisinya' },
      { id: 'c', text: 'Tutup telepon, hubungi anak langsung, lalu hubungi kantor polisi setempat' },
      { id: 'd', text: 'Minta foto anak sebagai bukti ia ditahan' },
    ],
    correctId: 'c',
    explanation: 'Polisi tidak pernah meminta uang jaminan lewat telepon. Langkah paling aman adalah memutus sambungan dan memverifikasi secara langsung ke orang yang bersangkutan.',
    xpReward: 25,
  },
  {
    id: 'q15',
    category: 'tindakan_tepat',
    categoryLabel: 'Tindakan Tepat',
    question: 'Kamu curiga menerima link phishing di WhatsApp. Cara melaporkannya ke pihak yang tepat adalah...',
    options: [
      { id: 'a', text: 'Klik link-nya dulu untuk memastikan berbahaya atau tidak' },
      { id: 'b', text: 'Forward ke grup keluarga agar semua waspada' },
      { id: 'c', text: 'Screenshot dan laporkan ke aduan.kominfo.go.id atau hubungi 159' },
      { id: 'd', text: 'Hapus pesan dan abaikan' },
    ],
    correctId: 'c',
    explanation: 'Jangan klik link yang mencurigakan! Laporkan screenshot ke Kominfo melalui aduan.kominfo.go.id atau hubungi 159. Ini membantu memblokir konten berbahaya untuk semua orang.',
    xpReward: 20,
  },
];

export const QUIZ_CATEGORIES = [
  {
    id: 'deteksi_ai',
    label: 'Deteksi Suara AI',
    description: 'Kenali tanda-tanda suara yang dihasilkan kecerdasan buatan',
    icon: 'mic',
    color: 'bg-terracotta',
    count: 5,
  },
  {
    id: 'kenali_modus',
    label: 'Kenali Modus',
    description: 'Identifikasi jenis-jenis penipuan digital yang umum',
    icon: 'search',
    color: 'bg-olive',
    count: 5,
  },
  {
    id: 'tindakan_tepat',
    label: 'Tindakan Tepat',
    description: 'Pilih respons yang benar saat menghadapi situasi scam',
    icon: 'shield',
    color: 'bg-espresso',
    count: 5,
  },
] as const;
