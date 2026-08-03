import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type LansiaContextType = {
  isLansiaMode: boolean;
  toggleLansiaMode: () => void;
};

const LansiaContext = createContext<LansiaContextType | undefined>(undefined);
const LANSIA_STORAGE_KEY = "@vokal_lansia_mode";

export function LansiaProvider({ children }: { children: ReactNode }) {
  const [isLansiaMode, setIsLansiaMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANSIA_STORAGE_KEY)
      .then((val) => {
        if (val !== null) {
          setIsLansiaMode(JSON.parse(val));
        }
      })
      .catch((err) => console.error("Gagal memuat status Mode Lansia: ", err));
  }, []);

  const toggleLansiaMode = async () => {
    try {
      const nextState = !isLansiaMode;
      setIsLansiaMode(nextState);
      await AsyncStorage.setItem(LANSIA_STORAGE_KEY, JSON.stringify(nextState));
    } catch (err) {
      console.error("Gagal menyimpan status Mode Lansia:", err);
    }
  };

  return (
    <LansiaContext.Provider value={{ isLansiaMode, toggleLansiaMode }}>
      {children}
    </LansiaContext.Provider>
  );
}

export function useLansia() {
  const context = useContext(LansiaContext);
  if (context === undefined) {
    throw new Error("useLansia harus digunakan dalam LansiaProvider");
  }
  return context;
}
