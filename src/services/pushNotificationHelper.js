// import messaging from '@react-native-firebase/messaging';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Platform } from 'react-native';
// import PushNotification from 'react-native-push-notification';

// const API_URL = 'http://10.136.59.126:5000/api'; 

// // Create notification channel (call this once in your app)
// PushNotification.createChannel(
//   {
//     channelId: 'chat_messages',
//     channelName: 'Chat Messages',
//     channelDescription: 'Notifications for new chat messages',
//     soundName: 'default',
//     importance: 4,
//     vibrate: true,
//   },
//   (created) => console.log(`Channel created: ${created}`)
// );

// export const getFCMToken = async () => {
//   try {
//     // 1. Check if token is already saved in storage
//     let fcmToken = await AsyncStorage.getItem('fcmToken');

//     if (!fcmToken) {
//       // 2. Generate new token
//       try {
//         fcmToken = await messaging().getToken();
//       } catch (error) {
//         console.log('[FCM] ⚠️ Failed to fetch fresh token:', error);
//       }
      
//       if (fcmToken) {
//         console.log('[FCM] 🆕 New Token Generated:', fcmToken);
//         await AsyncStorage.setItem('fcmToken', fcmToken);
//       }
//     } else {
//       console.log('[FCM] 💾 Token found in storage:', fcmToken);
//     }

//     // 3. Send Token to Backend
//     if (fcmToken) {
//       await registerTokenInBackend(fcmToken);
//     }
    
//   } catch (error) {
//     console.error('[FCM] ❌ Error getting token:', error);
//   }
// };

// // Helper function to call your API
// const registerTokenInBackend = async (token) => {
//   try {
//     const userToken = await AsyncStorage.getItem('authToken'); 
    
//     if (!userToken) {
//       console.log('[FCM] ⚠️ No user logged in, skipping backend registration');
//       return;
//     }

//     console.log('[FCM] 📤 Sending token to backend...');

//     await axios.post(
//       `${API_URL}/notifications/register-token`,
//       { token: token },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${userToken}` 
//         }
//       }
//     );
    
//     console.log('[FCM] ✅ Token registered successfully in Backend!');
    
//   } catch (error) {
//     // We suppress the error log to avoid clutter if it's just a duplicate key error
//     console.log('[FCM] ℹ️ Backend registration status:', error.response?.status || error.message);
//   }
// };

// export const setupNotificationListeners = () => {
//   // Handle foreground messages
//   const unsubscribe = messaging().onMessage(async remoteMessage => {
//     console.log('[FCM] 📡 Foreground Notification received:', remoteMessage);
    
//     // Manually show notification with sound and pop-up
//     PushNotification.localNotification({
//       channelId: 'chat_messages',
//       title: remoteMessage.notification.title,
//       message: remoteMessage.notification.body,
//       playSound: true,
//       soundName: 'default',
//       priority: 'high',
//       vibrate: true,
//       // Add these for better notification behavior
//       userInfo: remoteMessage.data,
//       actions: ['Reply', 'Mark as Read'],
//       largeIcon: remoteMessage.data?.otherUserPhotoURL || undefined,
//       bigText: remoteMessage.data?.text || remoteMessage.notification.body,
//       bigPictureUrl: remoteMessage.data?.attachment?.url || undefined,
//     });
//   });

//   // Handle background messages
//   messaging().setBackgroundMessageHandler(async remoteMessage => {
//     console.log('[FCM] 📡 Background Notification received:', remoteMessage);
//   });

//   return unsubscribe;
// };

// // Handle notification tap when app is in background
// export const setupNotificationTapHandler = (navigation) => {
//   // Check if app was opened from notification
//   messaging().getInitialNotification().then(remoteMessage => {
//     if (remoteMessage) {
//       console.log('[FCM] App opened from notification:', remoteMessage);
//       handleNotificationNavigation(remoteMessage.data, navigation);
//     }
//   });

//   // Handle notification when app is in background
//   messaging().onNotificationOpenedApp(remoteMessage => {
//     if (remoteMessage) {
//       console.log('[FCM] Notification opened app:', remoteMessage);
//       handleNotificationNavigation(remoteMessage.data, navigation);
//     }
//   });
// };

// // Navigate based on notification data
// const handleNotificationNavigation = (data, navigation) => {
//   if (!data || !navigation) return;
  
//   if (data.type === 'chat_message' && data.otherUserId) {
//     navigation.navigate('Message', {
//       user: { _id: data.otherUserId }
//     });
//   } else if (data.type === 'FRIEND_REQUEST') {
//     navigation.navigate('FriendRequests');
//   } else if (data.type === 'FRIEND_REQUEST_ACCEPTED') {
//     navigation.navigate('Friends');
//   }
// };






















































import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform, Alert, Linking } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { getApp } from '@react-native-firebase/app';
import getApiUrl from '../utiliti/config';

const API_URL = `${getApiUrl}/api`;
console.log('[FCM] 🔗 Configured API URL:', API_URL);

// Create notification channel (call once)
PushNotification.createChannel(
  {
    channelId: 'chat_messages',
    channelName: 'Chat Messages',
    channelDescription: 'Notifications for new chat messages',
    soundName: 'default',
    importance: 4,
    vibrate: true,
  },
  (created) => console.log(`Channel created: ${created}`)
);

// Force refresh FCM token
export const forceRefreshFCMToken = async () => {
  try {
    await AsyncStorage.removeItem('fcmToken');
    await AsyncStorage.removeItem('pendingFcmToken');
    const token = await messaging().getToken();
    console.log('[FCM] 🆕 New token:', token.substring(0, 30) + '...');
    await AsyncStorage.setItem('fcmToken', token);

    const userToken = await AsyncStorage.getItem('authToken');
    if (userToken) await registerTokenInBackend(token);
    else await AsyncStorage.setItem('pendingFcmToken', token);

    return token;
  } catch (error) {
    console.error('[FCM] ❌ Error refreshing token:', error);
    return null;
  }
};

// Get FCM token
export const getFCMToken = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    if (authStatus === AuthorizationStatus.DENIED) {
      Alert.alert(
        'Enable Notifications',
        'Please enable notifications in Settings.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return null;
    }

    let fcmToken = await AsyncStorage.getItem('fcmToken');
    if (!fcmToken) {
      fcmToken = await messaging().getToken();
      if (fcmToken) await AsyncStorage.setItem('fcmToken', fcmToken);
    }

    const userToken = await AsyncStorage.getItem('authToken');
    if (fcmToken && userToken) await registerTokenInBackend(fcmToken);
    else if (fcmToken) await AsyncStorage.setItem('pendingFcmToken', fcmToken);

    return fcmToken;
  } catch (error) {
    console.error('[FCM] ❌ Critical error in getFCMToken:', error);
    return null;
  }
};

// Register token in backend
const registerTokenInBackend = async (token) => {
  try {
    const userToken = await AsyncStorage.getItem('authToken'); 
    if (!userToken) return;

    await axios.post(`${API_URL}/notifications/register-token`, { token }, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      timeout: 5000
    });

    console.log('[FCM] ✅ Token registered in backend!');
  } catch (error) {
    console.log('[FCM] ⚠️ Registration error:', error?.response?.data || error.message);
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.setItem('pendingFcmToken', token);
    }
  }
};

// Register pending FCM token after login
export const registerPendingFcmToken = async () => {
  try {
    const pendingToken = await AsyncStorage.getItem('pendingFcmToken');
    if (pendingToken) {
      await registerTokenInBackend(pendingToken);
      await AsyncStorage.removeItem('pendingFcmToken');
    }
  } catch (error) {
    console.error('[FCM] ❌ Error registering pending token:', error);
  }
};

// Foreground & background listeners
export const setupNotificationListeners = () => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    PushNotification.localNotification({
      channelId: 'chat_messages',
      title: remoteMessage.notification.title,
      message: remoteMessage.notification.body,
      playSound: true,
      soundName: 'default',
      priority: 'high',
      vibrate: true,
      userInfo: remoteMessage.data,
      actions: ['Reply', 'Mark as Read'],
      bigText: remoteMessage.data?.text || remoteMessage.notification.body,
      bigPictureUrl: remoteMessage.data?.attachment?.url,
    });
  });

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('[FCM] Background Notification:', remoteMessage);
  });

  return unsubscribe;
};

// Handle notification tap
export const setupNotificationTapHandler = (navigation) => {
  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) handleNotificationNavigation(remoteMessage.data, navigation);
  });

  const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
    if (remoteMessage) handleNotificationNavigation(remoteMessage.data, navigation);
  });

  return unsubscribe;
};

const handleNotificationNavigation = (data, navigation) => {
  if (!data || !navigation) return;
  if (data.type === 'chat_message' && data.otherUserId) navigation.navigate('Message', { user: { _id: data.otherUserId } });
  else if (data.type === 'FRIEND_REQUEST') navigation.navigate('FriendRequests');
  else if (data.type === 'FRIEND_REQUEST_ACCEPTED') navigation.navigate('Friends');
};
// import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';
// import auth from '@react-native-firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Platform } from 'react-native';
// import PushNotification from 'react-native-push-notification';
// import { getApp } from '@react-native-firebase/app';
// import getApiUrl from '../utiliti/config';

// const API_URL = `${getApiUrl}/api`;
// console.log('[FCM] 🔗 Configured API URL:', API_URL);

// // Create notification channel (call this once in your app)
// PushNotification.createChannel(
//   {
//     channelId: 'chat_messages',
//     channelName: 'Chat Messages',
//     channelDescription: 'Notifications for new chat messages',
//     soundName: 'default',
//     importance: 4,
//     vibrate: true,
//   },
//   (created) => console.log(`Channel created: ${created}`)
// );



// // Add to pushNotificationHelper.js
// export const forceRefreshFCMToken = async () => {
//   try {
//     console.log('[FCM] 🔄 Force refreshing FCM token...');
    
//     // Delete old token
//     await AsyncStorage.removeItem('fcmToken');
//     await AsyncStorage.removeItem('pendingFcmToken');
    
//     // Get new token
//     const token = await messaging().getToken();
//     console.log('[FCM] 🆕 New token:', token.substring(0, 30) + '...');
    
//     // Save to storage
//     await AsyncStorage.setItem('fcmToken', token);
    
//     // Send to backend if user is logged in
//     const userToken = await AsyncStorage.getItem('authToken');
//     if (userToken) {
//       await registerTokenInBackend(token);
//     } else {
//       await AsyncStorage.setItem('pendingFcmToken', token);
//     }
    
//     console.log('[FCM] ✅ Token refreshed successfully');
//     return token;
//   } catch (error) {
//     console.error('[FCM] ❌ Error refreshing token:', error);
//     return null;
//   }
// };




// // D:\fcn_R2C\src\services\pushNotificationHelper.js
// export const getFCMToken = async () => {
//   try {
//     console.log('[FCM-DEBUG] 🔍 Starting FCM token retrieval for REAL DEVICE');
    
//     // 1. CHECK PERMISSIONS
//     const authStatus = await messaging().requestPermission();
//     console.log('[FCM-DEBUG] 📋 Authorization status:', authStatus);
    
//     if (authStatus === AuthorizationStatus.DENIED) {
//       console.log('[FCM-DEBUG] ❌ Push notifications permission denied');
//       // Request permission again with better explanation
//       Alert.alert(
//         'Enable Notifications',
//         'To receive messages, please enable notifications in Settings.',
//         [
//           { text: 'Later', style: 'cancel' },
//           { text: 'Settings', onPress: () => Linking.openSettings() }
//         ]
//       );
//       return null;
//     }
    
//     // 2. CHECK FOR GOOGLE PLAY SERVICES (ANDROID ONLY)
//     if (Platform.OS === 'android') {
//       const hasPlayServices = await messaging().hasPermission();
//       console.log('[FCM-DEBUG] 🤖 Google Play Services available:', hasPlayServices);
      
//       if (!hasPlayServices) {
//         console.log('[FCM-DEBUG] ❌ Google Play Services not available');
//         return null;
//       }
//     }
    
//     // 3. GET TOKEN (with fallback for real devices)
//     let fcmToken = await AsyncStorage.getItem('fcmToken');
    
//     if (!fcmToken) {
//       console.log('[FCM-DEBUG] 🆕 Generating new token...');
//       try {
//         // For real devices, we need to ensure Firebase is properly initialized
//         fcmToken = await messaging().getToken();
        
//         if (!fcmToken) {
//           console.log('[FCM-DEBUG] ❌ Failed to get FCM token');
//           // Try alternative method for Android
//           if (Platform.OS === 'android') {
//             console.log('[FCM-DEBUG] 🔄 Trying Android-specific token generation');
//             const app = getApp();
//             fcmToken = await messaging(app).getToken();
//           }
//         }
        
//         if (fcmToken) {
//           console.log('[FCM-DEBUG] 🆕 New token generated:', fcmToken);
//           console.log('[FCM-DEBUG] 🔑 Token length:', fcmToken.length);
//           console.log('[FCM-DEBUG] 🔑 Token format check:', fcmToken.includes(':APA91b') ? 'Valid FCM format' : 'Unusual format');
          
//           await AsyncStorage.setItem('fcmToken', fcmToken);
//           await AsyncStorage.setItem('lastTokenFetch', new Date().toISOString());
//         }
//       } catch (tokenError) {
//         console.error('[FCM-DEBUG] ❌ Token generation error:', tokenError);
//         return null;
//       }
//     } else {
//       console.log('[FCM-DEBUG] 💾 Using stored token:', fcmToken.substring(0, 30) + '...');
//     }
    
//     // 4. VERIFY TOKEN FOR REAL DEVICE PATTERNS
//     if (fcmToken) {
//       // Real device tokens often look different than emulator tokens
//       const isValidToken = fcmToken && fcmToken.length > 30;
//       console.log('[FCM-DEBUG] ✅ Token validity check:', isValidToken);
      
//       // Common patterns for real device tokens:
//       // - Contains ':APA91b' (standard FCM format)
//       // - Starts with 'f' (some newer formats)
//       // - Contains alphanumeric characters with colons
      
//       if (!fcmToken.includes(':') && fcmToken.length < 100) {
//         console.log('[FCM-DEBUG] ⚠️ Token format looks unusual for real device');
//       }
//     }
    
//     // 5. REGISTER WITH BACKEND
//     const userToken = await AsyncStorage.getItem('authToken');
//     if (fcmToken && userToken) {
//       console.log('[FCM-DEBUG] 📤 Sending token to backend...');
//       await registerTokenInBackend(fcmToken);
//     } else if (fcmToken && !userToken) {
//       console.log('[FCM-DEBUG] 💾 Saving token for later registration');
//       await AsyncStorage.setItem('pendingFcmToken', fcmToken);
//     }
    
//     return fcmToken;
//   } catch (error) {
//     console.error('[FCM-DEBUG] ❌ Critical error in getFCMToken:', error);
//     return null;
//   }
// };

// // Helper function to call your API
// const registerTokenInBackend = async (token) => {
//   try {
//     const userToken = await AsyncStorage.getItem('authToken'); 
    
//     if (!userToken) {
//       console.log('[FCM] ⚠️ No user logged in, skipping backend registration');
//       return;
//     }

//     console.log('[FCM] 📤 Sending token to backend...');

//     const response = await axios.post(
//       `${API_URL}/notifications/register-token`,
//       { token: token },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${userToken}` 
//         },
//         timeout: 5000, // Add timeout to prevent hanging
//       }
//     );
    
//     console.log('[FCM] ✅ Token registered successfully in Backend!');
    
//   } catch (error) {
//     // Handle specific error cases
//     if (error.response) {
//       // The request was made and the server responded with a status code
//       // that falls out of the range of 2xx
//       console.log('[FCM] ⚠️ Backend registration error:', error.response.status, error.response.data);
      
//       // If it's a 401 (unauthorized), clear the auth token
//       if (error.response.status === 401) {
//         await AsyncStorage.removeItem('authToken');
//         await AsyncStorage.removeItem('userInfo');
        
//         // FIX: Save token as pending so it is registered when user logs in again
//         console.log('[FCM] 🔄 Auth token expired. Saving FCM token for retry after login.');
//         await AsyncStorage.setItem('pendingFcmToken', token);
//       }
//     } else if (error.request) {
//       // The request was made but no response was received
//       console.log('[FCM] ⚠️ No response from server:', error.message);
//     } else {
//       // Something happened in setting up the request that triggered an Error
//       console.log('[FCM] ⚠️ Request setup error:', error.message);
//     }
//   }
// };

// // Function to register pending FCM token after login
// export const registerPendingFcmToken = async () => {
//   try {
//     const pendingToken = await AsyncStorage.getItem('pendingFcmToken');
//     if (pendingToken) {
//       console.log('[FCM] 🔄 Registering pending FCM token after login');
//       await registerTokenInBackend(pendingToken);
//       await AsyncStorage.removeItem('pendingFcmToken');
//     }
//   } catch (error) {
//     console.error('[FCM] ❌ Error registering pending token:', error);
//   }
// };

// export const setupNotificationListeners = () => {
//   // Handle foreground messages
//   const unsubscribe = messaging().onMessage(async remoteMessage => {
//     console.log('[FCM] 📡 Foreground Notification received:', remoteMessage);
    
//     // Manually show notification with sound and pop-up
//     PushNotification.localNotification({
//       channelId: 'chat_messages',
//       title: remoteMessage.notification.title,
//       message: remoteMessage.notification.body,
//       playSound: true,
//       soundName: 'default',
//       priority: 'high',
//       vibrate: true,
//       // Add these for better notification behavior
//       userInfo: remoteMessage.data,
//       actions: ['Reply', 'Mark as Read'],
//       largeIcon: remoteMessage.data?.otherUserPhotoURL || undefined,
//       bigText: remoteMessage.data?.text || remoteMessage.notification.body,
//       bigPictureUrl: remoteMessage.data?.attachment?.url || undefined,
//     });
//   });

//   // Handle background messages
//   messaging().setBackgroundMessageHandler(async remoteMessage => {
//     console.log('[FCM] 📡 Background Notification received:', remoteMessage);
//   });

//   return unsubscribe;
// };

// // Handle notification tap when app is in background
// export const setupNotificationTapHandler = (navigation) => {
//   // Check if app was opened from notification
//   messaging().getInitialNotification().then(remoteMessage => {
//     if (remoteMessage) {
//       console.log('[FCM] App opened from notification:', remoteMessage);
//       handleNotificationNavigation(remoteMessage.data, navigation);
//     }
//   });

//   // Handle notification when app is in background
//   const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
//     if (remoteMessage) {
//       console.log('[FCM] Notification opened app:', remoteMessage);
//       handleNotificationNavigation(remoteMessage.data, navigation);
//     }
//   });

//   return unsubscribe;
// };

// // Navigate based on notification data
// const handleNotificationNavigation = (data, navigation) => {
//   if (!data || !navigation) return;
  
//   if (data.type === 'chat_message' && data.otherUserId) {
//     navigation.navigate('Message', {
//       user: { _id: data.otherUserId }
//     });
//   } else if (data.type === 'FRIEND_REQUEST') {
//     navigation.navigate('FriendRequests');
//   } else if (data.type === 'FRIEND_REQUEST_ACCEPTED') {
//     navigation.navigate('Friends');
//   }
// };

















































// import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Platform, AppState } from 'react-native';
// import PushNotification from 'react-native-push-notification';
// import getApiUrl from '../utiliti/config';

// const API_URL = `${getApiUrl}/api`;
// console.log('[FCM] 🔗 Configured API URL:', API_URL);

// // ===============================
// // 1. NOTIFICATION CHANNEL SETUP
// // ===============================
// const initializeNotificationChannel = () => {
//   console.log('[FCM] 🛠️ Initializing notification channel...');
  
//   PushNotification.createChannel(
//     {
//       channelId: 'chat_messages',
//       channelName: 'Chat Messages',
//       channelDescription: 'Notifications for new chat messages',
//       soundName: 'default',
//       importance: 4,
//       vibrate: true,
//     },
//     (created) => {
//       console.log(`[FCM] ${created ? '✅ Channel created' : '✅ Channel already exists'}`);
//     }
//   );

//   // Configure PushNotification globally
//   PushNotification.configure({
//     // (optional) Called when Token is generated (iOS and Android)
//     onRegister: function (token) {
//       console.log('[FCM] 📱 PushNotification token:', token);
//     },

//     // (required) Called when a remote or local notification is opened or received
//     onNotification: function (notification) {
//       console.log('[FCM] 📨 PushNotification received:', notification);
//       // Process the notification
//       notification.finish(PushNotificationIOS.FetchResult.NoData);
//     },

//     // (optional) Called when Registered Action is pressed and invokeApp is false (Android)
//     onAction: function (notification) {
//       console.log('[FCM] 🔘 Action pressed:', notification.action);
//     },

//     // (optional) Called when the user fails to register for remote notifications
//     onRegistrationError: function (err) {
//       console.error('[FCM] ❌ PushNotification registration error:', err.message);
//     },

//     // IOS ONLY (optional): default: all - Permissions to register.
//     permissions: {
//       alert: true,
//       badge: true,
//       sound: true,
//     },

//     // Should the initial notification be popped automatically
//     // default: true
//     popInitialNotification: true,

//     /**
//      * (optional) default: true
//      * - Specified if permissions (ios) and token (android and ios) will requested or not,
//      * - if not, you must call PushNotificationsHandler.requestPermissions() later
//      */
//     requestPermissions: true,
//   });
// };

// // Call initialization
// initializeNotificationChannel();

// // ===============================
// // 2. FCM TOKEN MANAGEMENT
// // ===============================
// export const getFCMToken = async () => {
//   try {
//     console.log('[FCM] 🔍 Getting FCM token...');
    
//     // Request permission if needed
//     const authStatus = await messaging().requestPermission();
//     const enabled = authStatus === AuthorizationStatus.AUTHORIZED || 
//                     authStatus === AuthorizationStatus.PROVISIONAL;
    
//     console.log('[FCM] 🔐 Notification permission:', enabled ? '✅ Granted' : '❌ Denied');
    
//     if (!enabled) {
//       console.log('[FCM] ⚠️ User has not granted notification permission');
//       return null;
//     }

//     // Get token from storage first
//     let fcmToken = await AsyncStorage.getItem('fcmToken');
    
//     if (!fcmToken) {
//       // Generate new token
//       fcmToken = await messaging().getToken();
//       console.log('[FCM] 🆕 New FCM token generated:', fcmToken.substring(0, 30) + '...');
      
//       // Store token
//       await AsyncStorage.setItem('fcmToken', fcmToken);
//     } else {
//       console.log('[FCM] 💾 Using stored FCM token:', fcmToken.substring(0, 30) + '...');
//     }

//     // Check if user is authenticated
//     const userToken = await AsyncStorage.getItem('authToken');
//     console.log('[FCM] 👤 User authentication:', userToken ? '✅ Logged in' : '❌ Not logged in');
    
//     // Send token to backend if user is logged in
//     if (fcmToken && userToken) {
//       await registerTokenInBackend(fcmToken);
//     } else if (fcmToken) {
//       // Store for later when user logs in
//       await AsyncStorage.setItem('pendingFcmToken', fcmToken);
//       console.log('[FCM] 💾 Token saved for later registration');
//     }

//     return fcmToken;
//   } catch (error) {
//     console.error('[FCM] ❌ Error getting FCM token:', error.message);
//     return null;
//   }
// };

// // Helper function to register token in backend
// const registerTokenInBackend = async (token) => {
//   try {
//     const userToken = await AsyncStorage.getItem('authToken');
    
//     if (!userToken) {
//       console.log('[FCM] ⚠️ Skipping backend registration - no user token');
//       return;
//     }

//     console.log('[FCM] 📤 Registering token in backend...');
    
//     const response = await axios.post(
//       `${API_URL}/notifications/register-token`,
//       { token: token },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${userToken}` 
//         },
//         timeout: 10000,
//       }
//     );
    
//     console.log('[FCM] ✅ Token registered successfully in backend');
//     console.log('[FCM] 📋 Backend response:', response.data);
    
//   } catch (error) {
//     console.error('[FCM] ❌ Backend registration error:', error.message);
    
//     if (error.response?.status === 401) {
//       // Token expired, save for later
//       await AsyncStorage.setItem('pendingFcmToken', token);
//       console.log('[FCM] 🔄 Token saved for retry after login');
//     }
//   }
// };

// // ===============================
// // 3. FORCE REFRESH TOKEN
// // ===============================
// export const forceRefreshFCMToken = async () => {
//   try {
//     console.log('[FCM] 🔄 Force refreshing FCM token...');
    
//     // Remove old tokens
//     await AsyncStorage.removeItem('fcmToken');
//     await AsyncStorage.removeItem('pendingFcmToken');
    
//     // Get new token
//     const token = await messaging().getToken();
//     console.log('[FCM] 🆕 New token generated:', token.substring(0, 30) + '...');
    
//     // Save token
//     await AsyncStorage.setItem('fcmToken', token);
    
//     // Register with backend if user is logged in
//     const userToken = await AsyncStorage.getItem('authToken');
//     if (userToken) {
//       await registerTokenInBackend(token);
//     } else {
//       await AsyncStorage.setItem('pendingFcmToken', token);
//     }
    
//     console.log('[FCM] ✅ Token refreshed successfully');
//     return token;
    
//   } catch (error) {
//     console.error('[FCM] ❌ Error refreshing token:', error);
//     return null;
//   }
// };

// // ===============================
// // 4. NOTIFICATION LISTENERS
// // ===============================
// export const setupNotificationListeners = () => {
//   console.log('[FCM] 🎧 Setting up notification listeners...');
  
//   // Handle foreground messages (app is open)
//   const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
//     console.log('\n[FCM] ==========================================');
//     console.log('[FCM] 📡 FOREGROUND NOTIFICATION RECEIVED');
//     console.log('[FCM] 📱 App state:', AppState.currentState);
//     console.log('[FCM] 📝 Title:', remoteMessage.notification?.title);
//     console.log('[FCM] 📝 Body:', remoteMessage.notification?.body);
//     console.log('[FCM] 📝 Data:', remoteMessage.data);
//     console.log('[FCM] ==========================================\n');
    
//     // Show local notification
//     showLocalNotification(remoteMessage);
//   });

//   // Handle background messages (app is in background/quit)
//   messaging().setBackgroundMessageHandler(async remoteMessage => {
//     console.log('[FCM] 📡 BACKGROUND NOTIFICATION RECEIVED');
//     console.log('[FCM] 📝 Data:', remoteMessage.data);
    
//     // Return a promise to keep the background service alive
//     return Promise.resolve();
//   });

//   return unsubscribeForeground;
// };

// // ===============================
// // 5. SHOW LOCAL NOTIFICATION
// // ===============================
// const showLocalNotification = (remoteMessage) => {
//   console.log('[FCM] 🚀 Creating local notification...');
  
//   try {
//     // Prepare notification data
//     const title = remoteMessage.notification?.title || remoteMessage.data?.otherUserName || 'New Message';
//     const body = remoteMessage.notification?.body || remoteMessage.data?.text || 'You have a new message';
//     const notificationId = Date.now(); // Unique ID
    
//     console.log('[FCM] 📋 Notification details:');
//     console.log('[FCM] 🆔 ID:', notificationId);
//     console.log('[FCM] 📌 Title:', title);
//     console.log('[FCM] 📌 Body:', body);
//     console.log('[FCM] 📌 Channel ID:', 'chat_messages');
    
//     // Create notification configuration
//     const notificationConfig = {
//       // REQUIRED: Channel and ID
//       channelId: 'chat_messages',
//       id: notificationId,
      
//       // REQUIRED: Content
//       title: title,
//       message: body,
      
//       // REQUIRED: Sound and vibration
//       playSound: true,
//       soundName: 'default',
//       vibrate: true,
//       vibration: 300,
      
//       // REQUIRED: Priority
//       priority: 'high',
//       importance: 'high',
      
//       // Optional: Visual
//       autoCancel: true,
//       color: '#FF0000',
//       smallIcon: 'ic_notification',
//       largeIcon: 'ic_launcher',
      
//       // Data for navigation
//       userInfo: remoteMessage.data || {},
//       tag: 'chat_message',
      
//       // Android specific
//       group: 'chat_messages_group',
//       groupSummary: false,
      
//       // iOS specific
//       alertAction: 'view',
//       category: 'chat_message',
//     };
    
//     // Show the notification
//     console.log('[FCM] 🎯 Showing notification...');
//     PushNotification.localNotification(notificationConfig);
    
//     console.log('[FCM] ✅ Notification shown successfully!');
    
//   } catch (error) {
//     console.error('[FCM] ❌ Error showing notification:', error);
//     console.error('[FCM] ❌ Error details:', error.message);
//   }
// };

// // ===============================
// // 6. NOTIFICATION TAP HANDLER
// // ===============================
// export const setupNotificationTapHandler = (navigation) => {
//   console.log('[FCM] 👆 Setting up notification tap handler...');
  
//   // Check if app was opened from notification
//   messaging().getInitialNotification().then(remoteMessage => {
//     if (remoteMessage) {
//       console.log('[FCM] 📱 App opened from notification');
//       handleNotificationNavigation(remoteMessage.data, navigation);
//     }
//   });

//   // Handle notification when app is in background
//   const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
//     if (remoteMessage) {
//       console.log('[FCM] 📱 Notification opened app');
//       handleNotificationNavigation(remoteMessage.data, navigation);
//     }
//   });

//   return unsubscribe;
// };

// // Navigate based on notification data
// const handleNotificationNavigation = (data, navigation) => {
//   if (!data || !navigation) return;
  
//   console.log('[FCM] 🧭 Navigating from notification:', data);
  
//   if (data.type === 'chat_message' && data.otherUserId) {
//     navigation.navigate('Message', {
//       user: { 
//         _id: data.otherUserId,
//         name: data.otherUserName || 'User',
//         photoURL: data.otherUserPhotoURL || ''
//       }
//     });
//   } else if (data.type === 'FRIEND_REQUEST') {
//     navigation.navigate('FriendRequests');
//   } else if (data.type === 'FRIEND_REQUEST_ACCEPTED') {
//     navigation.navigate('Friends');
//   }
// };

// // ===============================
// // 7. PENDING TOKEN REGISTRATION
// // ===============================
// export const registerPendingFcmToken = async () => {
//   try {
//     const pendingToken = await AsyncStorage.getItem('pendingFcmToken');
//     if (pendingToken) {
//       console.log('[FCM] 🔄 Registering pending FCM token');
//       await registerTokenInBackend(pendingToken);
//       await AsyncStorage.removeItem('pendingFcmToken');
//       console.log('[FCM] ✅ Pending token registered');
//     }
//   } catch (error) {
//     console.error('[FCM] ❌ Error registering pending token:', error);
//   }
// };

// // ===============================
// // 8. TEST FUNCTIONS
// // ===============================
// export const testNotificationSystem = async () => {
//   console.log('\n[FCM-TEST] ==========================================');
//   console.log('[FCM-TEST] 🧪 STARTING COMPREHENSIVE TEST');
//   console.log('[FCM-TEST] ==========================================\n');
  
//   try {
//     // 1. Test FCM token
//     console.log('[FCM-TEST] 1️⃣ Testing FCM token...');
//     const token = await getFCMToken();
//     console.log('[FCM-TEST] ✅ FCM Token:', token ? '✅ EXISTS' : '❌ MISSING');
    
//     // 2. Test notification channel
//     console.log('[FCM-TEST] 2️⃣ Testing notification channel...');
//     PushNotification.channelExists('chat_messages', async (exists) => {
//       console.log('[FCM-TEST] ✅ Channel exists:', exists);
      
//       if (!exists) {
//         console.log('[FCM-TEST] 🛠️ Creating channel...');
//         PushNotification.createChannel({
//           channelId: 'chat_messages',
//           channelName: 'Test Channel',
//           soundName: 'default',
//           importance: 4,
//           vibrate: true,
//         }, (created) => {
//           console.log('[FCM-TEST] ✅ Channel creation result:', created);
//           testLocalNotificationDirectly();
//         });
//       } else {
//         testLocalNotificationDirectly();
//       }
//     });
    
//   } catch (error) {
//     console.error('[FCM-TEST] ❌ Test failed:', error);
//   }
// };

// // Direct notification test
// const testLocalNotificationDirectly = () => {
//   console.log('[FCM-TEST] 3️⃣ Testing direct local notification...');
  
//   setTimeout(() => {
//     try {
//       const testId = Date.now();
      
//       PushNotification.localNotification({
//         channelId: 'chat_messages',
//         id: testId,
//         title: '🎯 TEST NOTIFICATION',
//         message: 'This is a test notification with SOUND! 🔊',
//         playSound: true,
//         soundName: 'default',
//         vibrate: true,
//         vibration: 500,
//         priority: 'max',
//         importance: 'max',
//         autoCancel: true,
//         color: '#00FF00', // Green color for visibility
//         smallIcon: 'ic_notification',
//         largeIcon: 'ic_launcher',
//       });
      
//       console.log('[FCM-TEST] ✅ TEST NOTIFICATION SENT!');
//       console.log('[FCM-TEST] ✅ ID:', testId);
//       console.log('[FCM-TEST] ✅ You should see a GREEN notification with SOUND!');
      
//     } catch (error) {
//       console.error('[FCM-TEST] ❌ Test notification failed:', error);
//     }
//   }, 1500);
// };

// // ===============================
// // 9. COMPREHENSIVE DIAGNOSTICS
// // ===============================
// export const runComprehensiveDiagnostics = async () => {
//   console.log('\n🔍 COMPREHENSIVE FCM DIAGNOSTICS');
//   console.log('================================\n');
  
//   try {
//     // 1. FCM Token
//     const token = await messaging().getToken();
//     console.log('1️⃣ FCM Token:', token ? `✅ ${token.substring(0, 30)}...` : '❌ NO TOKEN');
    
//     // 2. Permissions
//     const hasPermission = await messaging().hasPermission();
//     console.log('2️⃣ Permissions:', hasPermission ? '✅ GRANTED' : '❌ NOT GRANTED');
    
//     // 3. Stored tokens
//     const storedToken = await AsyncStorage.getItem('fcmToken');
//     console.log('3️⃣ Stored token:', storedToken ? '✅ EXISTS' : '❌ MISSING');
    
//     // 4. User auth
//     const authToken = await AsyncStorage.getItem('authToken');
//     console.log('4️⃣ User auth:', authToken ? '✅ LOGGED IN' : '❌ NOT LOGGED IN');
    
//     // 5. Channels
//     PushNotification.getChannels((channels) => {
//       console.log('5️⃣ Available channels:', channels.length > 0 ? channels : '❌ NO CHANNELS');
//     });
    
//     // 6. Platform info
//     console.log('6️⃣ Platform:', Platform.OS);
//     console.log('7️⃣ App state:', AppState.currentState);
    
//   } catch (error) {
//     console.error('❌ Diagnostics failed:', error);
//   }
// };

// // ===============================
// // 10. CLEANUP
// // ===============================
// export const cleanupFCM = async () => {
//   console.log('[FCM] 🧹 Cleaning up FCM data...');
  
//   try {
//     await AsyncStorage.multiRemove(['fcmToken', 'pendingFcmToken']);
//     console.log('[FCM] ✅ FCM data cleaned up');
//   } catch (error) {
//     console.error('[FCM] ❌ Cleanup error:', error);
//   }
// };

// // Export everything
// export default {
//   getFCMToken,
//   forceRefreshFCMToken,
//   setupNotificationListeners,
//   setupNotificationTapHandler,
//   registerPendingFcmToken,
//   testNotificationSystem,
//   runComprehensiveDiagnostics,
//   cleanupFCM,
// };