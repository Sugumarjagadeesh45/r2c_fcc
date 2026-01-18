import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  PermissionsAndroid, 
  Platform,
  AppState,
  InteractionManager,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { theme } from '../../styles/theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../utiliti/config';
import Geolocation from '@react-native-community/geolocation';

export default function NearbyFriends() {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [locationUpdateStatus, setLocationUpdateStatus] = useState('Initializing...');
  const [isLocationOff, setIsLocationOff] = useState(false);
  const mapRef = useRef(null);
  const appState = useRef(AppState.currentState);

  // Default location (Bangalore) if location is not available
  const defaultLocation = {
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  useEffect(() => {
    // 1. Wait for navigation animations to finish (Prevents "not attached to Activity" crash)
    const task = InteractionManager.runAfterInteractions(() => {
      checkPermissionAndStart();
    });

    // 2. Set up interval to update location every minute
    const intervalId = setInterval(() => {
      if (appState.current === 'active' && !isLocationOff) {
        updateLocationAndFetchUsers(true); // silent update
      }
    }, 60000); // 1 minute

    // 3. Listen for AppState changes (Foreground/Background)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        checkPermissionAndStart();
      }
      appState.current = nextAppState;
    });

    return () => {
      task.cancel();
      clearInterval(intervalId);
      subscription.remove();
    };
  }, []);

  const checkPermissionAndStart = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show nearby friends.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setIsLocationOff(false);
          updateLocationAndFetchUsers();
        } else {
          console.log('Location permission denied');
          setIsLocationOff(true);
          setLocationUpdateStatus('Permission denied');
        }
      } catch (err) {
        console.warn('Permission Error:', err);
        setIsLocationOff(true);
      }
    } else {
      updateLocationAndFetchUsers();
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      // Try high accuracy first
      Geolocation.getCurrentPosition(
        (position) => {
          resolve(position.coords);
        },
        (error) => {
          console.log(`High accuracy error: ${error.code} - ${error.message}`);
          // Error Code 3 is TIMEOUT. If high accuracy fails, try low accuracy (Network)
          if (error.code === 3 || error.code === 2 || error.code === 1) {
            console.log('Retrying with low accuracy...');
            Geolocation.getCurrentPosition(
              (position) => resolve(position.coords),
              (err) => reject(err),
              { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
            );
          } else {
            reject(error);
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const updateLocationAndFetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Step 1: Get Current Location
      setLocationUpdateStatus('Updating location...');
      const coords = await getLocation();
      
      const newLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      setUserLocation(newLocation);
      setIsLocationOff(false);
      
      // Update map region only on first load or if user moved significantly
      if (!mapRegion) {
        setMapRegion({
          ...newLocation,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }

      console.log("My current location:", newLocation);

      // Step 2: Send Location to Backend
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Authentication token not found');

      await fetch(`${API_URL}/api/nearby/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newLocation),
      });

      // Step 3: Fetch Nearby Users
      setLocationUpdateStatus('Finding friends...');
      
      // Using the correct endpoint from backend notes
      const response = await fetch(`${API_URL}/api/nearby/users?radius=2000&includeSelf=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearby users');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
        console.log("Nearby friends found:", data.users?.length);
      } else {
        console.warn('API returned success: false', data);
      }
      
      setLocationUpdateStatus('Updated just now');

    } catch (err) {
      console.error('Error in update cycle:', err);
      if (!silent) {
        if (err.code === 1 || err.code === 2 || err.code === 3) {
          // Location specific errors
          setIsLocationOff(true);
          setLocationUpdateStatus('Location unavailable');
        } else {
          setError(err.message);
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAddFriend = async (user) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      const toUserId = user._id || user.userId || user.id;
      if (!toUserId) {
        Alert.alert('Error', 'Invalid user data.');
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/send-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: toUserId,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', `Friend request sent to ${user.name}`);
      } else {
        Alert.alert('Error', data.message || 'Failed to send request');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const showLocationOffInfo = () => {
    Alert.alert(
      "Location is turned off",
      "Live location is not available, so nearby friends cannot be found.",
      [{ text: "OK" }]
    );
  };

  const renderMap = () => {
    const region = mapRegion || defaultLocation;
    
    return (
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        region={region}
        showsUserLocation={!isLocationOff}
        showsMyLocationButton={!isLocationOff}
        followsUserLocation={!isLocationOff}
        loadingEnabled={true}
        loadingBackgroundColor={theme.background}
      >
        {/* Search radius circle */}
        {userLocation && !isLocationOff && (
          <Circle
            center={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            radius={2000} // 2km radius
            strokeColor="rgba(255, 0, 80, 0.3)"
            fillColor="rgba(255, 0, 80, 0.1)"
            strokeWidth={2}
          />
        )}
        
        {/* Nearby users markers */}
        {users.map(user => (
          <Marker
            key={user._id || user.userId}
            coordinate={{
              latitude: user.location?.coordinates?.[1] || (userLocation?.latitude + (Math.random() - 0.5) * 0.01),
              longitude: user.location?.coordinates?.[0] || (userLocation?.longitude + (Math.random() - 0.5) * 0.01),
            }}
            title={user.name}
            description={`${(user.distance / 1000).toFixed(1)} km away`}
            pinColor={user.isOnline ? '#4CAF50' : '#FF9800'}
          />
        ))}
      </MapView>
    );
  };

  const renderNearbyUser = (user) => (
    <View key={user._id || user.userId} style={styles.nearbyUserItem}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => navigation.navigate('MessagerProfile', { 
          userId: user._id || user.userId,
          user: user 
        })}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.avatarGradient}
          >
            {user.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            )}
          </LinearGradient>
          <View style={[styles.statusBadge, { backgroundColor: user.isOnline ? '#4CAF50' : '#FF9800' }]}>
            <Text style={styles.statusText}>{user.isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userDistance}>
            {user.distance ? `${(user.distance / 1000).toFixed(1)} km away` : 'Distance unknown'}
          </Text>
          {!user.isOnline && user.lastSeen && (
            <Text style={styles.lastSeenText}>
              Last seen: {new Date(user.lastSeen).toLocaleString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => handleAddFriend(user)}
      >
        <Icon name="person-add" size={20} color={theme.accentColor} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
        <View style={styles.containerInner}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            
            {/* Header Title / Location Off Indicator */}
            <View style={styles.headerTitle}>
              {isLocationOff ? (
                <TouchableOpacity 
                  onPress={showLocationOffInfo} 
                  style={styles.locationOffBadge}
                  activeOpacity={0.7}
                >
                  <Icon name="warning" size={16} color="#FFC107" />
                  <Icon name="location-off" size={16} color="#FF5252" style={{marginLeft: 4}} />
                  <Text style={styles.locationOffText}>Location Off</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Icon name="location-on" size={20} color={theme.accentColor} />
                  <Text style={styles.headerTitleText}>Nearby Friends</Text>
                </>
              )}
            </View>
            
            <View style={styles.headerRight} />
          </View>

          <View style={styles.content}>
            {/* Map Container */}
            <View style={styles.mapContainer}>
              {renderMap()}
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => updateLocationAndFetchUsers(false)}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.searchButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="search" size={18} color="#fff" />
                      <Text style={styles.searchButtonText}>Search Nearby</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Location Status */}
              <View style={styles.locationStatusOverlay}>
                <Icon 
                  name={isLocationOff ? "location-off" : "location-on"} 
                  size={16} 
                  color={isLocationOff ? "#FF5252" : theme.accentColor} 
                />
                <Text style={styles.locationStatusText}>{locationUpdateStatus}</Text>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitle}>
                  <Icon name="people" size={18} color={theme.accentColor} style={styles.sectionTitleIcon} />
                  <Text style={styles.sectionTitleText}>People Nearby ({users.length})</Text>
                </View>
                <TouchableOpacity style={styles.refreshButton} onPress={() => updateLocationAndFetchUsers(false)}>
                  <Icon name="refresh" size={18} color={theme.accentColor} />
                </TouchableOpacity>
              </View>

              {error && !isLocationOff && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              {users.length > 0 ? (
                <ScrollView style={styles.nearbyList} showsVerticalScrollIndicator={false}>
                  {users.map(renderNearbyUser)}
                </ScrollView>
              ) : (
                <View style={styles.emptyContainer}>
                  <Icon name={isLocationOff ? "location-off" : "people-outline"} size={48} color={theme.textSecondary} />
                  <Text style={styles.emptyText}>
                    {isLocationOff 
                      ? "Enable location to find friends" 
                      : loading 
                        ? "Searching for nearby users..." 
                        : "No nearby users found."}
                  </Text>
                </View>
              )}

              <View style={styles.footerInfo}>
                <Icon name="info" size={16} color={theme.textSecondary} />
                <Text style={styles.footerText}>
                  Showing people within 2km. Location updates every minute.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  containerInner: {
    maxWidth: 480,
    width: '100%',
    flex: 1,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(18, 24, 38, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'Poppins',
    marginLeft: 8,
  },
  locationOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  locationOffText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'Poppins',
    marginLeft: 6,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  searchButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  locationStatusOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationStatusText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  sectionContainer: {
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleIcon: {
    marginRight: 8,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'Poppins',
  },
  refreshButton: {
    padding: 8,
  },
  nearbyList: {
    flex: 1,
  },
  nearbyUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
    color: theme.textPrimary,
    fontFamily: 'Poppins',
  },
  userDistance: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 3,
    fontFamily: 'Poppins',
  },
  lastSeenText: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  addButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Poppins',
  },
  errorText: {
    color: '#FF5252',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  }
});

export default NearbyFriends;




// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   StatusBar, 
//   TouchableOpacity, 
//   ScrollView, 
//   ActivityIndicator, 
//   Alert,
//   Platform,
//   PermissionsAndroid
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { theme } from '../../styles/theme';
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import API_URL from '../utiliti/config';
// import Geolocation from '@react-native-community/geolocation';

// export default function NearbyFriends() {
//   const navigation = useNavigation();
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentLocation, setCurrentLocation] = useState(null);

//   // Request location permission (Android specific)
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//           {
//             title: 'Location Permission',
//             message: 'This app needs access to your location to show nearby friends.',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           }
//         );
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       } catch (err) {
//         console.warn(err);
//         return false;
//       }
//     }
//     return true;
//   };

//   // Update location to backend
//   const updateMyLocation = async (latitude: number, longitude: number) => {
//     try {
//       const token = await AsyncStorage.getItem('authToken');
//       if (!token) return;

//       console.log('[Nearby] 📍 Updating my location to backend:', latitude, longitude);
      
//       const response = await fetch(`${API_URL}/api/nearby/location`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ latitude, longitude }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('[Nearby] ❌ Failed to update location:', errorText);
//       } else {
//         console.log('[Nearby] ✅ Location updated successfully');
//       }
//     } catch (err) {
//       console.error('[Nearby] ❌ Error updating location:', err);
//     }
//   };

//   const fetchNearbyUsers = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const token = await AsyncStorage.getItem('authToken');
//       if (!token) {
//         throw new Error('Authentication token not found');
//       }

//       // Request location permission first
//       const hasPermission = await requestLocationPermission();
//       if (!hasPermission) {
//         throw new Error('Location permission denied');
//       }

//       // Get current location first
//       Geolocation.getCurrentPosition(
//         async (position) => {
//           console.log('[Nearby] 📍 Got current position');
//           const { latitude, longitude } = position.coords;
//           setCurrentLocation({ latitude, longitude });
          
//           // Log to console
//           console.log('My current location:', latitude, longitude);
          
//           // Step 1: Update my location to backend
//           await updateMyLocation(latitude, longitude);

//           // Step 2: Fetch nearby users using the CORRECT endpoint
//           console.log('[Nearby] 🔍 Fetching nearby users...');
          
//           // CORRECT ENDPOINT - Use this instead of your current one
//           const response = await fetch(`${API_URL}/api/nearby/users?radius=2000&includeSelf=true`, {
//             method: 'GET',
//             headers: {
//               'Content-Type': 'application/json',
//               Authorization: `Bearer ${token}`,
//             },
//           });

//           if (!response.ok) {
//             const errorText = await response.text();
//             console.error('[Nearby] ❌ API Error:', errorText);
//             throw new Error(`Failed to fetch nearby users: ${errorText}`);
//           }

//           const data = await response.json();
//           console.log('[Nearby] ✅ Nearby users data:', data);
          
//           // Check if data has users array
//           if (data.users) {
//             // Filter out current user if includeSelf is false
//             const filteredUsers = data.users.filter(user => !user.isSelf);
//             setUsers(filteredUsers);
            
//             // Log each nearby user's location
//             filteredUsers.forEach(user => {
//               console.log(`Nearby friend: ${user.name} at distance: ${user.distance}m, location:`, 
//                 user.location || 'No location data');
//             });
//           } else {
//             console.warn('[Nearby] No users array in response:', data);
//             setUsers([]);
//           }
          
//           setLoading(false);
//         },
//         (err) => {
//           console.error('[Nearby] ❌ Geolocation error:', err);
//           setError(`Could not get your location: ${err.message}`);
//           setLoading(false);
//         },
//         { 
//           enableHighAccuracy: true, 
//           timeout: 15000, 
//           maximumAge: 10000,
//           distanceFilter: 10 // Minimum distance in meters to trigger update
//         }
//       );
//     } catch (err) {
//       console.error('[Nearby] ❌ Fetch error:', err);
//       setError(err.message);
//       Alert.alert('Error', err.message);
//       setLoading(false);
//     }
//   };

//   // Refresh when screen comes into focus
//   useFocusEffect(
//     React.useCallback(() => {
//       fetchNearbyUsers();
//     }, [])
//   );

//   // Debug: Log current state
//   useEffect(() => {
//     console.log('[Nearby] Current users:', users.length);
//     console.log('[Nearby] Current location:', currentLocation);
//   }, [users, currentLocation]);

//   const renderNearbyUser = (user: any) => (
//     <View key={user._id || user.userId} style={styles.nearbyUserItem}>
//       <View style={styles.userInfo}>
//         <View style={styles.avatarContainer}>
//           <LinearGradient
//             colors={['#667eea', '#764ba2']}
//             style={styles.avatarGradient}
//           >
//             {user.profilePicture ? (
//               <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
//             ) : (
//               <Text style={styles.avatarText}>
//                 {user.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
//               </Text>
//             )}
//           </LinearGradient>
//           <View style={[
//             styles.statusBadge, 
//             { backgroundColor: user.isOnline ? '#4CAF50' : '#9E9E9E' }
//           ]}>
//             <Text style={styles.statusText}>
//               {user.isOnline ? 'Online' : 'Offline'}
//             </Text>
//           </View>
//           <View style={styles.distanceBadge}>
//             <Text style={styles.distanceText}>
//               {user.distance ? `${(user.distance / 1000).toFixed(1)} km` : 'N/A'}
//             </Text>
//           </View>
//         </View>
//         <View style={styles.userDetails}>
//           <Text style={styles.userName}>{user.name || 'Unknown User'}</Text>
//           <Text style={styles.userDistance}>
//             {user.distance ? `${(user.distance / 1000).toFixed(1)} km away` : 'Distance unknown'}
//           </Text>
//           {user.lastSeen && !user.isOnline && (
//             <Text style={styles.lastSeenText}>
//               Last seen: {new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//             </Text>
//           )}
//         </View>
//       </View>
//       <TouchableOpacity 
//         style={styles.addButton}
//         onPress={() => Alert.alert('Add Friend', `Send friend request to ${user.name}?`)}
//       >
//         <Icon name="person-add" size={20} color={theme.accentColor} />
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
//       <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
//       <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
//         <View style={styles.containerInner}>
//           <View style={styles.header}>
//             <TouchableOpacity 
//               style={styles.backButton}
//               onPress={() => navigation.goBack()}
//             >
//               <Icon name="arrow-back" size={24} color={theme.textPrimary} />
//             </TouchableOpacity>
//             <View style={styles.headerTitle}>
//               <Icon name="location-on" size={20} color={theme.accentColor} />
//               <Text style={styles.headerTitleText}>Nearby Friends</Text>
//             </View>
//             <View style={styles.headerRight}>
//               {currentLocation && (
//                 <TouchableOpacity 
//                   style={styles.locationButton}
//                   onPress={() => Alert.alert(
//                     'Your Location', 
//                     `Lat: ${currentLocation.latitude.toFixed(6)}\nLng: ${currentLocation.longitude.toFixed(6)}`
//                   )}
//                 >
//                   <Icon name="my-location" size={20} color={theme.accentColor} />
//                 </TouchableOpacity>
//               )}
//             </View>
//           </View>

//           <View style={styles.content}>
//             <View style={styles.sectionContainer}>
//               <View style={styles.sectionHeader}>
//                 <View style={styles.sectionTitle}>
//                   <Icon name="people" size={18} color={theme.accentColor} style={styles.sectionTitleIcon} />
//                   <Text style={styles.sectionTitleText}>
//                     People Nearby ({users.length})
//                   </Text>
//                 </View>
//                 <View style={styles.headerButtons}>
//                   <TouchableOpacity 
//                     style={styles.debugButton} 
//                     onPress={() => {
//                       console.log('[DEBUG] Current state:', {
//                         currentLocation,
//                         usersCount: users.length,
//                         users
//                       });
//                       Alert.alert('Debug Info', `Found ${users.length} users nearby`);
//                     }}
//                   >
//                     <Icon name="bug-report" size={18} color={theme.textSecondary} />
//                   </TouchableOpacity>
//                   <TouchableOpacity style={styles.refreshButton} onPress={fetchNearbyUsers}>
//                     <Icon name="refresh" size={18} color={theme.accentColor} />
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               {loading ? (
//                 <View style={styles.loadingContainer}>
//                   <ActivityIndicator size="large" color={theme.accentColor} />
//                   <Text style={styles.loadingText}>Finding people nearby...</Text>
//                 </View>
//               ) : error ? (
//                 <View style={styles.errorContainer}>
//                   <Icon name="error-outline" size={50} color="#ff6b6b" />
//                   <Text style={styles.errorText}>{error}</Text>
//                   <TouchableOpacity 
//                     style={styles.retryButton}
//                     onPress={fetchNearbyUsers}
//                   >
//                     <Text style={styles.retryButtonText}>Retry</Text>
//                   </TouchableOpacity>
//                 </View>
//               ) : users.length === 0 ? (
//                 <View style={styles.emptyContainer}>
//                   <Icon name="location-off" size={60} color={theme.textSecondary} />
//                   <Text style={styles.emptyText}>No one nearby</Text>
//                   <Text style={styles.emptySubtext}>
//                     {currentLocation 
//                       ? `You're the only one at ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
//                       : 'Try moving to a more populated area'}
//                   </Text>
//                   <TouchableOpacity 
//                     style={styles.refreshButtonLarge}
//                     onPress={fetchNearbyUsers}
//                   >
//                     <Text style={styles.refreshButtonText}>Refresh</Text>
//                   </TouchableOpacity>
//                 </View>
//               ) : (
//                 <ScrollView 
//                   style={styles.nearbyList}
//                   showsVerticalScrollIndicator={false}
//                 >
//                   {users.map(renderNearbyUser)}
//                 </ScrollView>
//               )}

//               <View style={styles.footerInfo}>
//                 <Icon name="info" size={16} color={theme.textSecondary} />
//                 <Text style={styles.footerText}>
//                   Showing people within 2km radius. Location updates every minute.
//                 </Text>
//               </View>
//             </View>
//           </View>
//         </View>
//       </LinearGradient>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.background,
//   },
//   containerInner: {
//     maxWidth: 480,
//     width: '100%',
//     flex: 1,
//     alignSelf: 'center',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     backgroundColor: 'rgba(18, 24, 38, 0.95)',
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.08)',
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   headerTitleText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: theme.textPrimary,
//     fontFamily: 'Poppins',
//     marginLeft: 8,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   locationButton: {
//     padding: 8,
//   },
//   content: {
//     padding: 16,
//     flex: 1,
//   },
//   sectionContainer: {
//     backgroundColor: 'rgba(30, 40, 50, 0.7)',
//     borderRadius: 16,
//     padding: 16,
//     flex: 1,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   sectionTitleIcon: {
//     marginRight: 8,
//   },
//   sectionTitleText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: theme.textPrimary,
//     fontFamily: 'Poppins',
//   },
//   headerButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   debugButton: {
//     padding: 8,
//     marginRight: 8,
//   },
//   refreshButton: {
//     padding: 8,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   loadingText: {
//     marginTop: 12,
//     color: theme.textSecondary,
//     fontSize: 14,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   errorText: {
//     color: '#ff6b6b',
//     textAlign: 'center',
//     marginTop: 12,
//     fontSize: 14,
//     marginHorizontal: 20,
//   },
//   retryButton: {
//     marginTop: 20,
//     paddingHorizontal: 24,
//     paddingVertical: 10,
//     backgroundColor: theme.accentColor,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: theme.textPrimary,
//     marginTop: 12,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: theme.textSecondary,
//     textAlign: 'center',
//     marginTop: 8,
//     marginHorizontal: 40,
//   },
//   refreshButtonLarge: {
//     marginTop: 20,
//     paddingHorizontal: 30,
//     paddingVertical: 12,
//     backgroundColor: theme.accentColor,
//     borderRadius: 8,
//   },
//   refreshButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   nearbyList: {
//     flex: 1,
//   },
//   nearbyUserItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 16,
//     paddingHorizontal: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.06)',
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginRight: 15,
//   },
//   avatarGradient: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   avatarImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//   },
//   avatarText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16,
//     fontFamily: 'Poppins',
//   },
//   statusBadge: {
//     position: 'absolute',
//     top: -5,
//     right: -5,
//     borderRadius: 8,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//   },
//   statusText: {
//     color: '#fff',
//     fontSize: 9,
//     fontWeight: '600',
//   },
//   distanceBadge: {
//     position: 'absolute',
//     bottom: -4,
//     right: -4,
//     backgroundColor: theme.accentColor,
//     borderRadius: 10,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//   },
//   distanceText: {
//     color: '#fff',
//     fontSize: 10,
//     fontWeight: '600',
//     fontFamily: 'Poppins',
//   },
//   userDetails: {
//     flex: 1,
//   },
//   userName: {
//     fontWeight: '600',
//     fontSize: 16,
//     color: theme.textPrimary,
//     fontFamily: 'Poppins',
//   },
//   userDistance: {
//     fontSize: 13,
//     color: theme.textSecondary,
//     marginTop: 3,
//     fontFamily: 'Poppins',
//   },
//   lastSeenText: {
//     fontSize: 11,
//     color: '#888',
//     marginTop: 2,
//     fontFamily: 'Poppins',
//   },
//   addButton: {
//     padding: 10,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 20,
//   },
//   footerInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 20,
//     padding: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderRadius: 8,
//   },
//   footerText: {
//     fontSize: 12,
//     color: theme.textSecondary,
//     marginLeft: 8,
//     flex: 1,
//     fontFamily: 'Poppins',
//   },
// });




// src/NearBy_Friends/NearbyFriends.tsx
// src/NearBy_Friends/NearbyFriends.tsx
