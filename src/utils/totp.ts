import * as Crypto from 'expo-crypto';

const NOUNS = [
  'SINGA', 'ELANG', 'HARIMAU', 'GARUDA', 'GAJAH', 
  'KUDA', 'NAGA', 'BERUANG', 'SERIGALA', 'HIU'
];

const ADJECTIVES = [
  'EMAS', 'BIRU', 'MERAH', 'PUTIH', 'HITAM', 
  'CEPAT', 'KUAT', 'BERANI', 'HEBAT', 'API'
];

/**
 * Menghasilkan Codeword berbasis waktu (TOTP) yang aman secara kriptografi
 * menggunakan algoritma SHA-256.
 * 
 * @param secretKey Seed atau kunci privat keluarga
 * @param hoursWindow Jendela rotasi dalam jam (default: 6 jam)
 * @returns Object berisi codeword dan sisa waktu sebelum expired
 */
export async function generateCodeword(secretKey: string, hoursWindow: number = 6) {
  const windowMs = hoursWindow * 60 * 60 * 1000;
  const now = Date.now();
  const currentWindow = Math.floor(now / windowMs);
  
  // Waktu kadaluarsa dalam jam
  const nextWindowTime = (currentWindow + 1) * windowMs;
  const expiresInHours = Math.max(1, Math.ceil((nextWindowTime - now) / (1000 * 60 * 60)));

  // Payload deterministik berdasarkan seed dan waktu
  const payload = `${secretKey}-${currentWindow}`;
  
  // Hashing menggunakan SHA-256 dari expo-crypto (pengganti crypto-js)
  const hashHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256, 
    payload
  );

  // Mengambil sebagian hash untuk diubah menjadi indeks numerik
  // (mirip mekanisme BIP-39 mnemonic phrase wallet kripto)
  const nounHex = hashHex.substring(0, 4);
  const adjHex = hashHex.substring(4, 8);
  
  const nounIndex = parseInt(nounHex, 16) % NOUNS.length;
  const adjIndex = parseInt(adjHex, 16) % ADJECTIVES.length;

  const codeword = `${NOUNS[nounIndex]} ${ADJECTIVES[adjIndex]}`;

  return { codeword, expiresInHours };
}
