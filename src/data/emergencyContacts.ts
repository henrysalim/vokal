export type EmergencyContact = {
  id: string;
  name: string;
  shortName: string;
  phone: string;
  description: string;
  category: "kepolisian" | "keuangan" | "siber" | "umum";
  icon: string;
  color: string;
  available: string;
};

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "polisi",
    name: "Kepolisian Republik Indonesia",
    shortName: "Polisi",
    phone: "110",
    description: "Laporan kejahatan, penipuan, dan kedaruratan umum.",
    category: "kepolisian",
    icon: "Shield",
    color: "bg-terracotta",
    available: "24 Jam",
  },
  {
    id: "ojk",
    name: "Kontak OJK, Otoritas Jasa Keuangan",
    shortName: "OJK 157",
    phone: "157",
    description: "Aduan penipuan investasi, pinjol ilegal, dan masalah perbankan.",
    category: "keuangan",
    icon: "Landmark",
    color: "bg-olive",
    available: "Senin s.d. Jumat, 08.00 s.d. 17.00 WIB",
  },
  {
    id: "kominfo_aduan",
    name: "Kominfo: Aduan Konten & Penipuan",
    shortName: "Kominfo",
    phone: "159",
    description: "Laporkan SMS penipuan, konten berbahaya, dan phishing digital.",
    category: "siber",
    icon: "Radio",
    color: "bg-espresso",
    available: "Senin s.d. Jumat, 08.00 s.d. 16.00 WIB",
  },
  {
    id: "bpjt",
    name: "Layanan Darurat Terpadu",
    shortName: "Darurat 112",
    phone: "112",
    description: "Nomor tunggal darurat nasional: kebakaran, medis, kepolisian.",
    category: "umum",
    icon: "AlertTriangle",
    color: "bg-terracotta",
    available: "24 Jam",
  },
  {
    id: "bssn",
    name: "BSSN: Badan Siber & Sandi Negara",
    shortName: "BSSN",
    phone: "08001787799",
    description: "Adukan insiden siber, kebocoran data, dan ancaman digital nasional.",
    category: "siber",
    icon: "Shield",
    color: "bg-olive",
    available: "Senin s.d. Jumat, 08.00 s.d. 17.00 WIB",
  },
  {
    id: "cekrekening",
    name: "BI: Bank Indonesia (SLIK)",
    shortName: "BI 131",
    phone: "131",
    description: "Cek rekening terduga penipu, informasi perbankan resmi.",
    category: "keuangan",
    icon: "CreditCard",
    color: "bg-mustard",
    available: "Senin s.d. Jumat, 08.00 s.d. 17.00 WIB",
  },
];
