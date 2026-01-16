/**
 * @format
 */
import 'react-native-gesture-handler'; // Must be at the top
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging'; // ✅ Import messaging

// 🚨 CRITICAL FIX: Register Background Handler HERE
// This must be outside of any component to prevent crashes when the app is killed.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[index.js] 🌙 Background Notification received:', remoteMessage);
  // You don't need to do anything else here. 
  // The system handles the tray notification automatically.
});

AppRegistry.registerComponent(appName, () => App);





// /**
//  * @format
//  */
// import 'react-native-gesture-handler';

// import { AppRegistry } from 'react-native';
// import App from './App';
// import { name as appName } from './app.json';

// AppRegistry.registerComponent(appName, () => App);
