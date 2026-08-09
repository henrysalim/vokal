/**
 * simScamData.ts — Data skenario Simulasi Telepon Scam interaktif.
 * User diposisikan sebagai korban, harus memilih respons yang tepat di setiap giliran.
 */

export type SimStep = {
  id: string;
  speaker: 'scammer' | 'you';
  scammerLine: string; // Apa yang "penipu" katakan
  options: Array<{
    id: string;
    text: string; // Respons pilihan user
    isCorrect: boolean;
    feedback: string;
    xpDelta: number; // positif = dapat XP, negatif = kehilangan nyawa
  }>;
};

export type SimScenario = {
  id: string;
  title: string;
  difficulty: 'mudah' | 'sedang' | 'sulit';
  description: string;
  context: string; // Konteks situasi sebelum telepon masuk
  steps: SimStep[];
  totalXP: number;
};

export const SIM_SCENARIOS: SimScenario[] = [
  // ─── SKENARIO 1: Kecelakaan Anak (Mudah) ──────────────────────
  {
    id: 'sim_1',
    title: 'Telepon Kecelakaan Darurat',
    difficulty: 'mudah',
    description: 'Kamu berperan sebagai orang tua yang menerima telepon mencurigakan tentang kecelakaan anak.',
    context: 'Hari Sabtu siang. Kamu sedang di rumah. Tiba-tiba HP berdering dari nomor yang tidak kamu kenal.',
    totalXP: 60,
    steps: [
      {
        id: 's1_1',
        speaker: 'scammer',
        scammerLine: '"Halo, ini dengan Ibu Sari? Saya dokter dari RS Harapan. Anak Ibu, Dinda, baru saja masuk UGD karena kecelakaan. Kondisinya kritis dan butuh operasi segera!"',
        options: [
          {
            id: 'a',
            text: 'Langsung tanya biaya operasinya berapa',
            isCorrect: false,
            feedback: 'Jangan terburu-buru! Penipu sengaja ciptakan panik agar kamu tidak berpikir jernih.',
            xpDelta: -1,
          },
          {
            id: 'b',
            text: 'Minta nama dokter dan nomor telepon RS resmi untuk konfirmasi',
            isCorrect: true,
            feedback: 'Tepat! Rumah sakit resmi selalu siap dikonfirmasi. Ini langkah pertama yang benar.',
            xpDelta: 20,
          },
          {
            id: 'c',
            text: '"Tolong jaga anak saya, saya langsung ke sana!"',
            isCorrect: false,
            feedback: 'Meski terasa benar, ini membuatmu panik dan mudah dimanipulasi selanjutnya.',
            xpDelta: 0,
          },
        ],
      },
      {
        id: 's1_2',
        speaker: 'scammer',
        scammerLine: '"Nomornya nanti saya kasih Ibu, tapi sekarang yang penting bayar DP operasi dulu Rp 5 juta via transfer. Waktunya tidak banyak, kondisi anak Ibu tidak stabil!"',
        options: [
          {
            id: 'a',
            text: 'Transfer sekarang karena tidak mau ambil risiko',
            isCorrect: false,
            feedback: 'Rumah sakit resmi tidak pernah meminta DP operasi via transfer sebelum keluarga datang!',
            xpDelta: -1,
          },
          {
            id: 'b',
            text: '"Saya tidak akan transfer sebelum bisa berbicara langsung dengan anak saya"',
            isCorrect: true,
            feedback: 'Benar! Permintaan transfer dadakan adalah tanda merah terbesar. Ini jelas penipuan.',
            xpDelta: 25,
          },
          {
            id: 'c',
            text: 'Tanya nomor rekening untuk bisa dipertimbangkan',
            isCorrect: false,
            feedback: 'Kamu hampir terjerat. Menanyakan rekening menunjukkan kamu mulai percaya penipunya.',
            xpDelta: 0,
          },
        ],
      },
      {
        id: 's1_3',
        speaker: 'scammer',
        scammerLine: '"Ibu tidak peduli sama anak sendiri? Tiap menit menentukan! Kalau terlambat operasi, anak Ibu bisa cacat seumur hidup!"',
        options: [
          {
            id: 'a',
            text: 'Terpengaruh dan mulai buka aplikasi m-banking',
            isCorrect: false,
            feedback: 'Inilah manipulasi emosional. Penipu menyerang rasa bersalah dan rasa cintamu.',
            xpDelta: -1,
          },
          {
            id: 'b',
            text: 'Tutup telepon, langsung hubungi nomor HP anak yang sudah tersimpan',
            isCorrect: true,
            feedback: 'Luar biasa! Ini respons terbaik. Memutus komunikasi dan verifikasi langsung adalah kunci.',
            xpDelta: 15,
          },
          {
            id: 'c',
            text: '"Saya harus tanya suami dulu"',
            isCorrect: false,
            feedback: 'Meski tidak langsung transfer, kamu masih terlibat dalam percakapan yang membahayakanmu.',
            xpDelta: 5,
          },
        ],
      },
    ],
  },

  // ─── SKENARIO 2: Penipuan OJK/Pinjol (Sedang) ─────────────────
  {
    id: 'sim_2',
    title: 'Telepon Palsu Petugas OJK',
    difficulty: 'sedang',
    description: 'Seseorang mengaku dari OJK meneleponmu tentang pinjaman online atas namamu.',
    context: 'Kamu sedang bekerja. HP berdering dari nomor 021-xxxxxxx (terlihat seperti nomor kantor Jakarta).',
    totalXP: 75,
    steps: [
      {
        id: 's2_1',
        speaker: 'scammer',
        scammerLine: '"Selamat siang, ini dengan tim investigasi OJK. Kami mendeteksi ada pinjaman online senilai Rp 50 juta yang didaftarkan menggunakan data KTP Bapak/Ibu tanpa izin. Apakah Bapak/Ibu yang melakukan?"',
        options: [
          {
            id: 'a',
            text: '"Bukan saya! Tolong bantu saya tutup pinjaman itu!"',
            isCorrect: false,
            feedback: 'Responsmu menunjukkan kepanikan yang dimanfaatkan penipu untuk langkah selanjutnya.',
            xpDelta: -1,
          },
          {
            id: 'b',
            text: 'Tanya nomor surat tugas dan kode petugas untuk bisa diverifikasi ke website OJK',
            isCorrect: true,
            feedback: 'Sangat tepat! Petugas resmi selalu punya identitas yang bisa diverifikasi secara independen.',
            xpDelta: 25,
          },
          {
            id: 'c',
            text: 'Jawab "iya" saja untuk mendengar informasi lebih lanjut',
            isCorrect: false,
            feedback: 'Mengiyakan memberi mereka kesempatan untuk melanjutkan manipulasi.',
            xpDelta: 0,
          },
        ],
      },
      {
        id: 's2_2',
        speaker: 'scammer',
        scammerLine: '"Untuk membekukan proses pinjaman tersebut, Bapak/Ibu harus segera verifikasi identitas dengan mengirimkan kode OTP yang baru saja dikirim ke nomor ini."',
        options: [
          {
            id: 'a',
            text: 'Berikan kode OTP karena ini untuk keamanan',
            isCorrect: false,
            feedback: 'JANGAN! OTP adalah kunci masuk ke akun keuanganmu. Tidak ada lembaga resmi yang memintanya.',
            xpDelta: -1,
          },
          {
            id: 'b',
            text: '"OTP itu rahasia dan tidak boleh diberikan ke siapapun. Saya akan lapor ke OJK langsung di 157."',
            isCorrect: true,
            feedback: 'Sempurna! OJK 157 adalah jalur resmi. Tidak ada petugas resmi yang meminta OTP via telepon.',
            xpDelta: 25,
          },
          {
            id: 'c',
            text: 'Tanya dulu OTP ini untuk apa',
            isCorrect: false,
            feedback: 'Kamu masih dalam percakapan berbahaya. Segera akhiri, jangan tanya apapun.',
            xpDelta: 0,
          },
        ],
      },
      {
        id: 's2_3',
        speaker: 'scammer',
        scammerLine: '"Kalau Bapak/Ibu tidak kerjasama, rekening bank Bapak/Ibu akan ikut kami bekukan sebagai bagian dari penyelidikan. Keputusan ada di tangan Bapak/Ibu sekarang."',
        options: [
          {
            id: 'a',
            text: 'Panik dan berikan OTP agar rekening tidak dibekukan',
            isCorrect: false,
            feedback: 'OJK tidak berwenang membekukan rekening via telepon. Ini ancaman kosong!',
            xpDelta: -1,
          },
          {
            id: 'b',
            text: 'Tutup telepon. Langsung hubungi bankmu dan OJK 157 untuk laporan.',
            isCorrect: true,
            feedback: 'Benar sekali. Ancaman seperti ini adalah senjata terakhir penipu. Tidak perlu ditakuti.',
            xpDelta: 25,
          },
          {
            id: 'c',
            text: 'Minta waktu 1 jam untuk berpikir',
            isCorrect: false,
            feedback: 'Penipu tidak akan memberi waktu — mereka akan terus menekan. Langsung tutup.',
            xpDelta: 5,
          },
        ],
      },
    ],
  },

  // ─── SKENARIO 3: Kloning Suara Anak (Sulit) ───────────────────
  {
    id: 'sim_3',
    title: 'Kloning Suara — Level Expert',
    difficulty: 'sulit',
    description: 'Skenario paling realistis: suara yang terdengar seperti anakmu meminta bantuan darurat.',
    context: 'Malam hari. Anakmu (Reza, 22 tahun, kuliah di luar kota) biasanya tidak hubungi di jam ini. HP berdering.',
    totalXP: 90,
    steps: [
      {
        id: 's3_1',
        speaker: 'scammer',
        scammerLine: '"Pa... ini Reza. Pa tolong, Reza dalam masalah besar. Reza kecelakaan dan sudah ditahan polisi karena nabrak orang. Butuh uang jaminan Rp 15 juta malam ini juga..."',
        options: [
          {
            id: 'a',
            text: '"Reza! Kamu baik-baik saja? Butuh berapa?" (langsung buka m-banking)',
            isCorrect: false,
            feedback: 'Suara yang terdengar seperti anakmu bisa jadi kloning AI. Jangan langsung percaya!',
            xpDelta: -1,
          },
          {
            id: 'b',
            text: 'Minta ia sebutkan Codeword keluarga yang sudah disepakati',
            isCorrect: true,
            feedback: 'Cara terbaik! Codeword yang berubah setiap hari tidak bisa diketahui AI yang mengkloning suara.',
            xpDelta: 30,
          },
          {
            id: 'c',
            text: 'Tanya nama lengkap dan tanggal lahir untuk verifikasi',
            isCorrect: false,
            feedback: 'Data ini bisa diketahui penipu dari media sosial. Codeword jauh lebih aman.',
            xpDelta: 5,
          },
        ],
      },
      {
        id: 's3_2',
        speaker: 'scammer',
        scammerLine: '"Pa, Reza tidak ingat codeword-nya sekarang, Reza panik! Polisi di sini marah-marah. Tolong Pa, nanti Reza dikirim ke tahanan kalau tidak ada uang jaminan..."',
        options: [
          {
            id: 'a',
            text: 'Percaya dan langsung transfer karena suaranya persis Reza',
            isCorrect: false,
            feedback: 'Teknologi AI mampu meniru suara dengan sangat realistis. Tidak ingat codeword adalah tanda peringatan!',
            xpDelta: -1,
          },
          {
            id: 'b',
            text: '"Kalau ini benar-benar Reza, kamu pasti ingat codeword kita. Saya tutup dulu dan hubungi kamu balik."',
            isCorrect: true,
            feedback: 'Benar! Anggota keluarga asli selalu bisa kamu hubungi kembali melalui nomor yang sudah tersimpan.',
            xpDelta: 30,
          },
          {
            id: 'c',
            text: 'Hubungi istri/suami untuk minta pendapat',
            isCorrect: false,
            feedback: 'Bagus untuk konsultasi, tapi jangan biarkan telepon penipunya tetap terhubung.',
            xpDelta: 10,
          },
        ],
      },
      {
        id: 's3_3',
        speaker: 'scammer',
        scammerLine: '"Pa jangan tutup! Sebentar lagi Reza dipindah ke sel dan HP disita polisi, Pa tidak bisa hubungi Reza lagi! Ini kesempatan terakhir!"',
        options: [
          {
            id: 'a',
            text: 'Tergerak dan langsung transfer takut kehilangan kontak dengan anak',
            isCorrect: false,
            feedback: 'Inilah puncak manipulasi emosional. "Kesempatan terakhir" adalah kata kunci manipulasi!',
            xpDelta: -1,
          },
          {
            id: 'b',
            text: 'Tutup telepon. Hubungi langsung nomor HP Reza yang tersimpan di kontak.',
            isCorrect: true,
            feedback: 'Sempurna. Jika Reza benar-benar dalam masalah, kamu tetap bisa menghubunginya melalui nomornya sendiri.',
            xpDelta: 30,
          },
          {
            id: 'c',
            text: 'Minta nomor telepon kantor polisi yang menahan Reza',
            isCorrect: false,
            feedback: 'Penipu akan memberikan nomor palsu. Cara terbaik tetap hubungi anakmu langsung.',
            xpDelta: 5,
          },
        ],
      },
    ],
  },
];
