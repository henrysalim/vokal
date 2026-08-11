import * as Crypto from 'expo-crypto';

const NOUNS = [
  'PINTU', 'MEJA', 'KURSI', 'LEMARI', 'KASUR', 'KULKAS', 'BANTAL', 'PIRING',
  'SENDOK', 'GARPU', 'MANGKUK', 'GELAS', 'SAPU', 'EMBER', 'GAYUNG', 'HANDUK',
  'SABUN', 'SIKAT', 'BUKU', 'PENSIL', 'TAS', 'SEPATU', 'TOPI', 'BAJU',
  'CELANA', 'KACAMATA', 'PAYUNG', 'KIPAS', 'LAMPU', 'KUNCI', 'RUMAH', 'MOBIL',
  'MOTOR', 'SEPEDA', 'KERETA', 'KAPAL', 'PESAWAT', 'GUNUNG', 'LAUT', 'SUNGAI',
  'DANAU', 'POHON', 'BUNGA', 'DAUN', 'BATU', 'PASIR', 'TANAH', 'LANGIT',
  'AWAN', 'BINTANG', 'BULAN', 'MATAHARI', 'ANGIN', 'API', 'AIR', 'HUJAN',
  'PETIR', 'PELANGI', 'SALJU', 'KUCING', 'ANJING', 'AYAM', 'BURUNG', 'IKAN'
];

const ADJECTIVES = [
  'MERAH', 'KUNING', 'HIJAU', 'BIRU', 'PUTIH', 'HITAM', 'ABU', 'COKLAT',
  'PANAS', 'DINGIN', 'HANGAT', 'SEJUK', 'KERING', 'BASAH', 'BESAR', 'KECIL',
  'PANJANG', 'PENDEK', 'TINGGI', 'RENDAH', 'BERAT', 'RINGAN', 'CEPAT', 'LAMBAT',
  'KUAT', 'LEMAH', 'KERAS', 'LUNAK', 'TAJAM', 'TUMPUL', 'KASAR', 'HALUS',
  'TERANG', 'GELAP', 'BERSIH', 'KOTOR', 'WANGI', 'BAU', 'MANIS', 'ASAM',
  'ASIN', 'PAHIT', 'PEDAS', 'GURIH', 'LEZAT', 'SEGAR', 'LAYU', 'MUDA',
  'TUA', 'BARU', 'LAMA', 'MAHAL', 'MURAH', 'KAYA', 'MISKIN', 'PINTAR',
  'BODOH', 'RAJIN', 'MALAS', 'BERANI', 'TAKUT', 'SENANG', 'SEDIH', 'MARAH'
];

export async function generateCodeword(secretKey: string, hoursWindow: number = 6) {
  const windowMs = hoursWindow * 60 * 60 * 1000;
  const now = Date.now();
  const currentWindow = Math.floor(now / windowMs);

  const nextWindowTime = (currentWindow + 1) * windowMs;
  const expiresInHours = Math.max(1, Math.ceil((nextWindowTime - now) / (1000 * 60 * 60)));

  const payload = `${secretKey}-${currentWindow}`;

  const hashHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload
  );

  const nounHex = hashHex.substring(0, 4);
  const adjHex = hashHex.substring(4, 8);

  const nounIndex = parseInt(nounHex, 16) % NOUNS.length;
  const adjIndex = parseInt(adjHex, 16) % ADJECTIVES.length;

  const codeword = `${NOUNS[nounIndex]} ${ADJECTIVES[adjIndex]}`;

  return { codeword, expiresInHours, hashHex };
}

export function generateRandomSecret(): string {
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  return `${noun} ${adj}`;
}
