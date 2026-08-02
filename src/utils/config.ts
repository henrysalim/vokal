import { Platform } from 'react-native';

// Local Python Flask Backend URL
// For physical devices on local Wi-Fi, replace 'localhost' with your machine's local IP (e.g., http://192.168.1.X:5001)
const DEV_API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5001' 
  : 'http://localhost:5001';

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || DEV_API_URL,
  TIMEOUT_MS: 8000,
};
