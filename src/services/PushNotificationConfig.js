import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';

const configureNotifications = (navigation) => {
  PushNotification.configure({
    // (optional) Called when Token is generated (iOS and Android)
    onRegister: function (token) {
      console.log('NOTIFICATION TOKEN:', token);
      // You might want to register this token with your backend here if not handled by FCM token refresh
    },

    // (required) Called when a remote is received or opened, or local notification is served
    onNotification: function (notification) {
      console.log('NOTIFICATION received (local/remote):', notification);

      // Process the notification
      if (notification.userInteraction) {
        // Handle notification tap
        console.log('User interacted with notification:', notification);
        // This is where you'd navigate based on notification.data
        // We will handle navigation in pushNotificationHelper.js directly from FCM listeners
        // For local notifications, you might also want to call handleNotificationNavigation if they contain relevant data
        if (notification.data && navigation) {
          // Assuming local notifications might also carry data for navigation
          // This call might need adjustment based on how local notifications are triggered and what data they carry
          // handleNotificationNavigation(notification.data, navigation);
        }
      }

      // (required) Called when a remote is received or opened, or local notification is served
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    },

    // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS only)
    onRegistrationError: function (err) {
      console.error('NOTIFICATION REGISTRATION ERROR:', err.message, err);
    },

    // IOS ONLY (optional): default: all - Permissions to register.
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    popInitialNotification: true, // (optional) default: true
    requestPermissions: Platform.OS === 'ios', // (optional) default: true
  });

  // Create Android channels
  if (Platform.OS === 'android') {
    // Channel for chat messages
    PushNotification.createChannel(
      {
        channelId: 'chat_messages', // (required)
        channelName: 'Chat Messages', // (required)
        channelDescription: 'Notifications for new chat messages', // (optional) default: undefined.
        soundName: 'default', // (optional) See `soundName` parameter of `PushNotification.localNotification`
        importance: 4, // (optional) default: 4. Int value of the Android notification importance:
        vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
      },
      (created) => console.log(`createChannel 'chat_messages' returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
    );

    // Default channel
    PushNotification.createChannel(
      {
        channelId: 'default', // (required)
        channelName: 'Default Notifications', // (required)
        channelDescription: 'General application notifications', // (optional) default: undefined.
        soundName: 'default', // (optional)
        importance: 4, // (optional)
        vibrate: true, // (optional)
      },
      (created) => console.log(`createChannel 'default' returned '${created}'`),
    );
  }
};

export default configureNotifications;
