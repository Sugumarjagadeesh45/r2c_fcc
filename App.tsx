import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { View, ActivityIndicator, AppState, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation'; // Ensure this is installed

// Screens
import HomeScreen from './src/homescreen';
import FriendsScreen from './src/FriendsScreen';
import CreateScreen from './src/CreateScreen';
import ChatScreen from './src/ChatScreen';
import ProfileScreen from './src/ProfileScreen';
import LoginScreen from './src/login';
import RegisterScreen from './src/register';
import CameraScreen from './src/Create/Camera';
import UploadScreen from './src/Create/Upload';
import AIGenerateScreen from './src/Create/AIGenerate';
import TemplatesScreen from './src/Create/Templates';
import NearbyFriends from './src/NearBy_Friends/NearbyFriends';
import MessageScreen from './src/MessageScreen';
import MessagerProfile from './src/MessagerProfile';

// Notification screens
import Notification from './src/notifycation/notifycation';
import Admin from './src/notifycation/Admin';
import PersonalNotifications from './src/notifycation/PersonalNotifications';

// Search screen
import SearchScreen from './src/SearchScreen';

// Context
import { UserProvider, useUser } from './src/context/UserContext';

// Theme
import { theme } from './styles/theme';

// FCM Services
import { 
  getFCMToken, 
  setupNotificationListeners, 
  setupNotificationTapHandler
} from './src/services/pushNotificationHelper';

// Import socket service
import { initSocket, emitLocationUpdate } from './src/services/socket';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const CreateStack = createStackNavigator();

// Nested Create stack
const CreateStackScreen = () => (
  <CreateStack.Navigator screenOptions={{ headerShown: false }}>
    <CreateStack.Screen name="CreateMain" component={CreateScreen} />
    <CreateStack.Screen name="Camera" component={CameraScreen} />
    <CreateStack.Screen name="Upload" component={UploadScreen} />
    <CreateStack.Screen name="AIGenerate" component={AIGenerateScreen} />
    <CreateStack.Screen name="Templates" component={TemplatesScreen} />
  </CreateStack.Navigator>
);

// Friends Stack for nested navigation
const FriendsStack = createStackNavigator();

const FriendsStackScreen = () => (
  <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
    <FriendsStack.Screen name="FriendsMain" component={FriendsScreen} />
    <FriendsStack.Screen name="FriendRequests" component={PersonalNotifications} />
    <FriendsStack.Screen name="AllFriends" component={FriendsScreen} initialParams={{ showAll: true }} />
  </FriendsStack.Navigator>
);

// Profile Stack for nested navigation
const ProfileStack = createStackNavigator();

const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="ProfileView" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

// Bottom tab navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Friends') iconName = 'user-friends';
        else if (route.name === 'Create') iconName = 'plus-square';
        else if (route.name === 'Chat') iconName = 'comment';
        else if (route.name === 'Profile') iconName = 'user';

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.accentColor,
      tabBarInactiveTintColor: theme.textSecondary,
      tabBarStyle: {
        backgroundColor: theme.headerBg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 12,
      },
      tabBarLabelStyle: { fontSize: 12 },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Friends" component={FriendsStackScreen} />
    <Tab.Screen name="Create" component={CreateStackScreen} />
    <Tab.Screen name="Chat" component={ChatScreen} />
    <Tab.Screen name="Profile" component={ProfileStackScreen} />
  </Tab.Navigator>
);

// Main App Navigator
const AppNavigator = () => {
  const { user, loading } = useUser();
  const navigationRef = useRef(null);
  const [fcmInitialized, setFcmInitialized] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(true);
  const appState = useRef(AppState.currentState);

  // Initialize FCM and Socket when user logs in
  useEffect(() => {
    if (user && !fcmInitialized) {
      console.log('[APP] 🚀 User logged in, initializing FCM and Socket...');
      
      const initializeRealTimeServices = async () => {
        try {
          // 1. Initialize FCM FIRST
          console.log('[APP] 🔑 Step 1: Getting FCM token...');
          await getFCMToken();
          
          // 2. Setup FCM listeners
          console.log('[APP] 🎧 Step 2: Setting up FCM listeners...');
          const unsubscribeFCM = setupNotificationListeners();
          
          // 3. Setup notification tap handler
          console.log('[APP] 👆 Step 3: Setting up notification tap handler...');
          const unsubscribeTap = setupNotificationTapHandler(navigationRef.current);
          
          // 4. Initialize Socket.io
          console.log('[APP] 🔌 Step 4: Initializing Socket.io...');
          const socket = await initSocket();
          
          if (socket) {
            console.log('[APP] ✅ Socket initialized successfully');
          }
          
          // 5. TEST: Run diagnostics (optional, remove in production)
          console.log('[APP] 🧪 Step 5: Running FCM diagnostics...');
          // setTimeout(() => {
          //   runComprehensiveDiagnostics();
          //   // Test notification system
          //   setTimeout(() => {
          //     testNotificationSystem();
          //   }, 2000);
          // }, 3000);
          
          setFcmInitialized(true);
          
          // Cleanup on unmount
          return () => {
            console.log('[APP] 🧹 Cleaning up real-time services...');
            if (unsubscribeFCM) unsubscribeFCM();
            if (unsubscribeTap) unsubscribeTap();
          };
          
        } catch (error) {
          console.error('[APP] ❌ Error initializing real-time services:', error);
        }
      };
      
      initializeRealTimeServices();
    }
  }, [user, fcmInitialized]);

  // Reset FCM initialized state when user logs out
  useEffect(() => {
    if (!user) {
      setFcmInitialized(false);
    }
  }, [user]);

  // --- LOCATION TRACKING LOGIC ---
  useEffect(() => {
    console.log('[APP] 📍 Initializing Location Tracking...');
    let locationInterval;

    const checkLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (!granted) {
            console.log('[APP] 🚫 Location permission not granted.');
            setLocationPermissionGranted(false);
            return false;
          }
          setLocationPermissionGranted(true);
          return true;
        } catch (err) {
          console.warn('[APP] Error checking location permission:', err);
          setLocationPermissionGranted(false);
          return false;
        }
      }
      return true; // For iOS, we'll handle permissions in the component
    };

    const sendLocation = async () => {
      if (!user || !locationPermissionGranted) return;

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("My current location:", latitude, longitude);
          
          // Emit via Socket
          emitLocationUpdate(latitude, longitude);
        },
        (error) => {
          if (error.code === 1) {
            console.log('[APP] 🚫 Location permission denied (Error 1).');
            setLocationPermissionGranted(false);
          } else {
            console.log('Location error:', error.code, error.message);
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

    if (user) {
      // Check permission first
      checkLocationPermission().then(hasPermission => {
        if (hasPermission) {
          // 1. Send immediately on open/login
          sendLocation();

          // 2. Send every 60 seconds
          locationInterval = setInterval(sendLocation, 60000);
        }
      });

      // 3. Handle App State Changes (Foreground/Background)
      const subscription = AppState.addEventListener('change', nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          console.log('App has come to the foreground! Checking location permission...');
          checkLocationPermission().then(hasPermission => {
            if (hasPermission) {
              sendLocation();
            }
          });
        }
        appState.current = nextAppState;
      });

      return () => {
        if (locationInterval) clearInterval(locationInterval);
        subscription.remove();
      };
    }
  }, [user, locationPermissionGranted]);

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: theme.background 
      }}>
        <ActivityIndicator size="large" color={theme.accentColor} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: theme.background }
        }}
      >
        {user ? (
          // Authenticated screens
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            
            {/* Modal/Overlay screens */}
            <Stack.Screen 
              name="Search" 
              component={SearchScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom'
              }}
            />
            
            <Stack.Screen 
              name="Notifications" 
              component={Notification}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom'
              }}
            />
            
            <Stack.Screen 
              name="AdminNotifications" 
              component={Admin}
              options={{
                presentation: 'modal',
                animation: 'slide_from_right'
              }}
            />
            
            <Stack.Screen 
              name="NearbyFriends" 
              component={NearbyFriends}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom'
              }}
            />
            
            {/* Standalone screens */}
            <Stack.Screen name="PersonalNotifications" component={PersonalNotifications} />
            <Stack.Screen name="Message" component={MessageScreen} />
            <Stack.Screen name="MessagerProfile" component={MessagerProfile} />
          </>
        ) : (
          // Authentication screens
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{
                animationTypeForReplace: 'pop'
              }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{
                animation: 'slide_from_right'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <UserProvider>
      <AppNavigator />
    </UserProvider>
  );
};

export default App;


// import React, { useEffect } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import Icon from 'react-native-vector-icons/FontAwesome5';
// import { View, ActivityIndicator } from 'react-native';

// // Screens
// import HomeScreen from './src/homescreen';
// import FriendsScreen from './src/FriendsScreen';
// import CreateScreen from './src/CreateScreen';
// import ChatScreen from './src/ChatScreen';
// import ProfileScreen from './src/ProfileScreen';
// import LoginScreen from './src/login';
// import RegisterScreen from './src/register';
// import CameraScreen from './src/Create/Camera';
// import UploadScreen from './src/Create/Upload';
// import AIGenerateScreen from './src/Create/AIGenerate';
// import TemplatesScreen from './src/Create/Templates';
// import NearbyFriends from './src/NearBy_Friends/NearbyFriends';
// import MessageScreen from './src/MessageScreen';

// // Notification screens
// import Notification from './src/notifycation/notifycation';
// import Admin from './src/notifycation/Admin';
// import PersonalNotifications from './src/notifycation/PersonalNotifications';

// // Search screen
// import SearchScreen from './src/SearchScreen';

// // Context
// import { UserProvider, useUser } from './src/context/UserContext';

// // Theme
// import { theme } from './styles/theme';
// import { getFCMToken, setupNotificationListeners, setupNotificationTapHandler } from './src/services/pushNotificationHelper';

// // ❌ REMOVED: configureNotifications import (It was causing issues)
// // ❌ REMOVED: PushNotification import

// const Stack = createStackNavigator();
// const Tab = createBottomTabNavigator();
// const CreateStack = createStackNavigator();

// // Nested Create stack
// const CreateStackScreen = () => (
//   <CreateStack.Navigator screenOptions={{ headerShown: false }}>
//     <CreateStack.Screen name="CreateMain" component={CreateScreen} />
//     <CreateStack.Screen name="Camera" component={CameraScreen} />
//     <CreateStack.Screen name="Upload" component={UploadScreen} />
//     <CreateStack.Screen name="AIGenerate" component={AIGenerateScreen} />
//     <CreateStack.Screen name="Templates" component={TemplatesScreen} />
//   </CreateStack.Navigator>
// );

// // Friends Stack for nested navigation
// const FriendsStack = createStackNavigator();

// const FriendsStackScreen = () => (
//   <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
//     <FriendsStack.Screen name="FriendsMain" component={FriendsScreen} />
//     <FriendsStack.Screen name="FriendRequests" component={PersonalNotifications} />
//     <FriendsStack.Screen name="AllFriends" component={FriendsScreen} initialParams={{ showAll: true }} />
//   </FriendsStack.Navigator>
// );

// // Profile Stack for nested navigation
// const ProfileStack = createStackNavigator();

// const ProfileStackScreen = () => (
//   <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
//     <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
//     <ProfileStack.Screen name="ProfileView" component={ProfileScreen} />
//   </ProfileStack.Navigator>
// );

// // Bottom tab navigator
// const MainTabs = () => (
//   <Tab.Navigator
//     screenOptions={({ route }) => ({
//       tabBarIcon: ({ color, size }) => {
//         let iconName;
//         if (route.name === 'Home') iconName = 'home';
//         else if (route.name === 'Friends') iconName = 'user-friends';
//         else if (route.name === 'Create') iconName = 'plus-square';
//         else if (route.name === 'Chat') iconName = 'comment';
//         else if (route.name === 'Profile') iconName = 'user';

//         return <Icon name={iconName} size={size} color={color} />;
//       },
//       tabBarActiveTintColor: theme.accentColor,
//       tabBarInactiveTintColor: theme.textSecondary,
//       tabBarStyle: {
//         backgroundColor: theme.headerBg,
//         borderTopWidth: 1,
//         borderTopColor: 'rgba(255, 255, 255, 0.1)',
//         paddingVertical: 12,
//       },
//       tabBarLabelStyle: { fontSize: 12 },
//       headerShown: false,
//     })}
//   >
//     <Tab.Screen name="Home" component={HomeScreen} />
//     <Tab.Screen name="Friends" component={FriendsStackScreen} />
//     <Tab.Screen name="Create" component={CreateStackScreen} />
//     <Tab.Screen name="Chat" component={ChatScreen} />
//     <Tab.Screen name="Profile" component={ProfileStackScreen} />
//   </Tab.Navigator>
// );

// // Main App Navigator
// const AppNavigator = () => {
//   const { user, loading } = useUser();
//   const navigationRef = React.useRef(null);

//   useEffect(() => {
//     let unsubscribeListeners;
//     let unsubscribeTap;

//     if (user && navigationRef.current) {
//       // 1. Get Token & Register with Backend
//       getFCMToken();
      
//       // 2. Setup Foreground Listeners
//       unsubscribeListeners = setupNotificationListeners();
      
//       // 3. Setup Tap Handler (Background/Quit state)
//       unsubscribeTap = setupNotificationTapHandler(navigationRef.current);

//       // 4. Cleanup on unmount
//       return () => {
//         if (unsubscribeListeners) unsubscribeListeners();
//         if (unsubscribeTap) unsubscribeTap();
//       };
//     }
//   }, [user]);

//   if (loading) {
//     return (
//       <View style={{ 
//         flex: 1, 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         backgroundColor: theme.background 
//       }}>
//         <ActivityIndicator size="large" color={theme.accentColor} />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer ref={navigationRef}>
//       <Stack.Navigator 
//         screenOptions={{ 
//           headerShown: false,
//           cardStyle: { backgroundColor: theme.background }
//         }}
//       >
//         {user ? (
//           // Authenticated screens
//           <>
//             <Stack.Screen name="Main" component={MainTabs} />
            
//             {/* Modal/Overlay screens */}
//             <Stack.Screen 
//               name="Search" 
//               component={SearchScreen}
//               options={{
//                 presentation: 'modal',
//                 animation: 'slide_from_bottom'
//               }}
//             />
            
//             <Stack.Screen 
//               name="Notifications" 
//               component={Notification}
//               options={{
//                 presentation: 'modal',
//                 animation: 'slide_from_bottom'
//               }}
//             />
            
//             <Stack.Screen 
//               name="AdminNotifications" 
//               component={Admin}
//               options={{
//                 presentation: 'modal',
//                 animation: 'slide_from_right'
//               }}
//             />
            
//             <Stack.Screen 
//               name="NearbyFriends" 
//               component={NearbyFriends}
//               options={{
//                 presentation: 'modal',
//                 animation: 'slide_from_bottom'
//               }}
//             />
            
//             {/* Standalone screens */}
//             <Stack.Screen name="PersonalNotifications" component={PersonalNotifications} />
//             <Stack.Screen name="Message" component={MessageScreen} />
//           </>
//         ) : (
//           // Authentication screens
//           <>
//             <Stack.Screen 
//               name="Login" 
//               component={LoginScreen}
//               options={{
//                 animationTypeForReplace: 'pop'
//               }}
//             />
//             <Stack.Screen 
//               name="Register" 
//               component={RegisterScreen}
//               options={{
//                 animation: 'slide_from_right'
//               }}
//             />
//           </>
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// const App = () => {
//   return (
//     <UserProvider>
//       <AppNavigator />
//     </UserProvider>
//   );
// };

// export default App;
