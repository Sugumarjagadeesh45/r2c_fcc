// In src/utiliti/config.js
import { Platform } from 'react-native';

// Determine API URL based on environment and platform
const getApiUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Replace with your production backend URL
    return 'https://your-production-backend.com';
  }
  
  // For development:
  // - Android Emulator: use 'http://10.0.2.2:5000' (special alias for host loopback)
  // - Android Physical Device: use your PC's Wi-Fi IP address.
  // - iOS Simulator/Device: 'http://localhost:5000' or 'http://127.0.0.1:5000' works for simulator, PC's IP for physical device.
  
  if (Platform.OS === 'android') {
    // For Android Emulator
    if (__DEV__ && !isRunningOnDevice()) {
      return 'http://10.0.2.2:5000';
    }
    // For Android Physical Device
    return 'http://192.168.104.126:5000'; 
  }
  
  // For iOS (simulator or device)
  // For iOS Simulator: Usually 'http://localhost:5000' or 'http://127.0.0.1:5000' works.
  // For iOS Physical Device: Replace with your PC's actual local IP address.
  return 'http://localhost:5000';
};

// Helper function to detect if running on device
const isRunningOnDevice = () => {
  return Platform.OS === 'android' && !Platform.isPad && !Platform.isTVOS;
};

export default getApiUrl();









// // src/utiliti/config.js
// import { Platform } from 'react-native';

// // Determine API URL based on environment and platform
// const getApiUrl = () => {
//   return 'https://r2c-bcc.onrender.com';
// };

// export default getApiUrl();