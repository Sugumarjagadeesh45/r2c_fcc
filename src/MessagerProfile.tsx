import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './utiliti/config';

const { width } = Dimensions.get('window');
const gradientColors = ['#0f2027', '#203a43', '#2c5364'];

const MessagerProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, user } = route.params || {};

  const [profileData, setProfileData] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0
  });

  // Log component mount and route parameters
  useEffect(() => {
    console.log('=== MessagerProfile Component Mounted ===');
    console.log('Route params:', route.params);
    console.log('UserId from params:', userId);
    console.log('User object from params:', user);
    
    if (user) {
      console.log('User ID from user object:', user._id || user.id);
      console.log('User name:', user.name);
      console.log('User avatar:', user.avatar || user.photoURL || user.profilePicture);
    }
  }, []);

  // Reset image error when profile data changes or we switch users
  useEffect(() => {
    console.log('=== Profile Data or User Changed ===');
    setImageError(false);
  }, [userId, user, profileData]);

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('=== Starting Profile Fetch ===');
      
      // Use passed user object immediately for instant UI
      if (user) {
        console.log('Using passed user object for instant UI');
        setProfileData(user);
      }

      const targetId = userId || user?._id || user?.id;
      console.log('Target ID for API call:', targetId);
      
      if (!targetId) {
        // If we have user data but no ID, we just stay with what we have
        if (!user) {
            console.log('No user ID found and no user data provided');
            // Only alert/go back if we truly have nothing
            // Alert.alert('Error', 'User ID not found');
            // navigation.goBack();
        } else {
            console.log('Using user data without ID');
        }
        return;
      }

      try {
        console.log('Fetching auth token from AsyncStorage');
        const token = await AsyncStorage.getItem('authToken');
        console.log('Auth token retrieved:', token ? 'Token exists' : 'No token found');
        
        const apiUrl = `${API_URL}/api/user/profile/${targetId}`;
        console.log('API URL for profile fetch:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('API Response Status:', response.status);
        
        const data = await response.json();
        console.log('API Response Data:', data);
        
        if (data.success) {
          console.log('Profile fetch successful');
          console.log('Profile Data:', data.data);
          
          setProfileData(data.data);
          
          if (data.data.stats) {
            console.log('User Stats:', data.data.stats);
            setStats({
              postsCount: data.data.stats.postsCount || 0,
              followersCount: data.data.stats.followersCount || 0,
              followingCount: data.data.stats.followingCount || 0
            });
          } else {
            console.log('No stats data found in response');
          }
        } else {
          console.log('Profile fetch failed:', data.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
        console.log('Profile fetch completed, loading set to false');
      }
    };

    fetchProfile();
  }, [userId, user]);

  const getProfileImageUri = () => {
    console.log('=== Getting Profile Image URI ===');
    
    if (imageError) {
      console.log('Image error occurred, using default avatar');
      return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    }
    
    // Check all possible locations for the image, including nested user object
    const possibleUris = [
      profileData?.avatar,
      profileData?.photoURL,
      profileData?.profilePicture,
      profileData?.user?.avatar,
      profileData?.user?.photoURL,
      profileData?.user?.profilePicture
    ];
    
    console.log('Possible image URIs:', possibleUris);

    const uri = possibleUris.find(u => u && typeof u === 'string' && u.length > 0);
    
    console.log('Selected image URI:', uri || 'Using default avatar');
    
    if (!uri) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

    if (uri.startsWith('http') || uri.startsWith('data:') || uri.startsWith('file:')) {
      return uri;
    }

    const cleanPath = uri.startsWith('/') ? uri.substring(1) : uri;
    return `${API_URL}/${cleanPath}`;
  };

  // Log when profile data changes
  useEffect(() => {
    if (profileData) {
      console.log('=== Profile Data Updated ===');
      console.log('Name:', profileData.name);
      console.log('Username/UserId:', profileData.userId || profileData.username);
      console.log('Bio:', profileData.bio);
      console.log('Location:', profileData.location);
      console.log('Is Online:', profileData.isOnline);
      console.log('Avatar:', profileData.avatar || profileData.photoURL || profileData.profilePicture);
    }
  }, [profileData]);

  // Log when stats change
  useEffect(() => {
    console.log('=== Stats Updated ===');
    console.log('Posts Count:', stats.postsCount);
    console.log('Followers Count:', stats.followersCount);
    console.log('Following Count:', stats.followingCount);
  }, [stats]);

  if (loading && !profileData) {
    console.log('Showing loading indicator');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084FF" />
      </View>
    );
  }

  // Log navigation actions
  const handleNavigateToMessage = () => {
    console.log('=== Navigating to Message Screen ===');
    console.log('User data passed:', profileData);
    console.log('User ID passed:', profileData._id);
    
    navigation.navigate('Message', { 
      user: profileData,
      otherUserId: profileData._id 
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f2027" />
      <LinearGradient colors={gradientColors} style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            console.log('Back button pressed');
            navigation.goBack();
          }} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="more-vert" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: getProfileImageUri() }} 
                style={styles.avatar} 
                onError={() => {
                  console.log('Image loading error occurred');
                  setImageError(true);
                }}
              />
              <View style={[
                styles.onlineIndicator, 
                { backgroundColor: profileData?.isOnline ? '#25D366' : '#8696A0' }
              ]} />
            </View>

            <Text style={styles.name}>{profileData?.name || 'Unknown User'}</Text>
            <Text style={styles.userId}>@{profileData?.userId || profileData?.username || 'username'}</Text>
            
            {profileData?.bio && (
              <Text style={styles.bio}>{profileData.bio}</Text>
            )}

            {profileData?.location && (
              <View style={styles.locationContainer}>
                <Icon name="location-on" size={14} color="#8696A0" />
                <Text style={styles.locationText}>
                  {typeof profileData.location === 'string' ? profileData.location : 'Earth'}
                </Text>
              </View>
            )}

            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.postsCount}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleNavigateToMessage}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton}>
                <Ionicons name="call" size={20} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton}>
                <Ionicons name="videocam" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Info / Options */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.optionRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 211, 102, 0.1)' }]}>
                <Icon name="image" size={22} color="#25D366" />
              </View>
              <Text style={styles.optionText}>Media, Links, and Docs</Text>
              <Icon name="chevron-right" size={24} color="#8696A0" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
                <Icon name="star" size={22} color="#FF9500" />
              </View>
              <Text style={styles.optionText}>Starred Messages</Text>
              <Icon name="chevron-right" size={24} color="#8696A0" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(90, 200, 250, 0.1)' }]}>
                <Icon name="notifications" size={22} color="#5AC8FA" />
              </View>
              <Text style={styles.optionText}>Notifications</Text>
              <Icon name="chevron-right" size={24} color="#8696A0" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.optionRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                <Icon name="block" size={22} color="#FF3B30" />
              </View>
              <Text style={[styles.optionText, { color: '#FF3B30' }]}>Block {profileData?.name}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                <Icon name="thumb-down" size={22} color="#FF3B30" />
              </View>
              <Text style={[styles.optionText, { color: '#FF3B30' }]}>Report {profileData?.name}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2027',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f2027',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  menuButton: {
    padding: 8,
  },
  content: {
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0f2027',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: '#8696A0',
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    color: '#E9EDEF',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 16,
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    color: '#8696A0',
    marginLeft: 4,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8696A0',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0084FF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginTop: 16,
    paddingVertical: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
  },
});

export default MessagerProfile;


// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   StatusBar,
//   Image,
//   TouchableOpacity,
//   ScrollView,
//   ActivityIndicator,
//   Dimensions,
//   Alert
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import API_URL from './utiliti/config';

// const { width } = Dimensions.get('window');
// const gradientColors = ['#0f2027', '#203a43', '#2c5364'];

// const MessagerProfile = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { userId, user } = route.params || {};

//   const [profileData, setProfileData] = useState(null);
//   const [imageError, setImageError] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({
//     postsCount: 0,
//     followersCount: 0,
//     followingCount: 0
//   });

//   // Reset image error when profile data changes or we switch users
//   useEffect(() => {
//     setImageError(false);
//   }, [userId, user, profileData]);

//   useEffect(() => {
//     const fetchProfile = async () => {
//       // Use passed user object immediately for instant UI
//       if (user) {
//         setProfileData(user);
//       }

//       const targetId = userId || user?._id || user?.id;
//       if (!targetId) {
//         // If we have user data but no ID, we just stay with what we have
//         if (!user) {
//             // Only alert/go back if we truly have nothing
//             // Alert.alert('Error', 'User ID not found');
//             // navigation.goBack();
//         }
//         return;
//       }

//       try {
//         const token = await AsyncStorage.getItem('authToken');
//         const response = await fetch(`${API_URL}/api/user/profile/${targetId}`, {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         const data = await response.json();
//         if (data.success) {
//           setProfileData(data.data);
//           if (data.data.stats) {
//             setStats({
//               postsCount: data.data.stats.postsCount || 0,
//               followersCount: data.data.stats.followersCount || 0,
//               followingCount: data.data.stats.followingCount || 0
//             });
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching profile:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, [userId, user]);

//   const getProfileImageUri = () => {
//     if (imageError) {
//       return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
//     }
    
//     // Check all possible locations for the image, including nested user object
//     const possibleUris = [
//       profileData?.avatar,
//       profileData?.photoURL,
//       profileData?.profilePicture,
//       profileData?.user?.avatar,
//       profileData?.user?.photoURL,
//       profileData?.user?.profilePicture
//     ];

//     const uri = possibleUris.find(u => u && typeof u === 'string' && (u.startsWith('http') || u.startsWith('data:') || u.startsWith('file:')));

//     return uri || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
//   };

//   if (loading && !profileData) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#0084FF" />
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <StatusBar barStyle="light-content" backgroundColor="#0f2027" />
//       <LinearGradient colors={gradientColors} style={styles.container}>
        
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//             <Icon name="arrow-back" size={24} color="#FFF" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Profile</Text>
//           <TouchableOpacity style={styles.menuButton}>
//             <Icon name="more-vert" size={24} color="#FFF" />
//           </TouchableOpacity>
//         </View>

//         <ScrollView contentContainerStyle={styles.content}>
//           {/* Profile Card */}
//           <View style={styles.profileCard}>
//             <View style={styles.avatarContainer}>
//               <Image 
//                 source={{ uri: getProfileImageUri() }} 
//                 style={styles.avatar} 
//                 onError={() => setImageError(true)}
//               />
//               <View style={[
//                 styles.onlineIndicator, 
//                 { backgroundColor: profileData?.isOnline ? '#25D366' : '#8696A0' }
//               ]} />
//             </View>

//             <Text style={styles.name}>{profileData?.name || 'Unknown User'}</Text>
//             <Text style={styles.userId}>@{profileData?.userId || profileData?.username || 'username'}</Text>
            
//             {profileData?.bio && (
//               <Text style={styles.bio}>{profileData.bio}</Text>
//             )}

//             {profileData?.location && (
//               <View style={styles.locationContainer}>
//                 <Icon name="location-on" size={14} color="#8696A0" />
//                 <Text style={styles.locationText}>
//                   {typeof profileData.location === 'string' ? profileData.location : 'Earth'}
//                 </Text>
//               </View>
//             )}

//             {/* Stats Row */}
//             <View style={styles.statsContainer}>
//               <View style={styles.statItem}>
//                 <Text style={styles.statNumber}>{stats.postsCount}</Text>
//                 <Text style={styles.statLabel}>Posts</Text>
//               </View>
//               <View style={styles.statDivider} />
//               <View style={styles.statItem}>
//                 <Text style={styles.statNumber}>{stats.followersCount}</Text>
//                 <Text style={styles.statLabel}>Followers</Text>
//               </View>
//               <View style={styles.statDivider} />
//               <View style={styles.statItem}>
//                 <Text style={styles.statNumber}>{stats.followingCount}</Text>
//                 <Text style={styles.statLabel}>Following</Text>
//               </View>
//             </View>

//             {/* Action Buttons */}
//             <View style={styles.actionButtons}>
//               <TouchableOpacity 
//                 style={styles.primaryButton}
//                 onPress={() => navigation.navigate('Message', { 
//                   user: profileData,
//                   otherUserId: profileData._id 
//                 })}
//               >
//                 <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
//                 <Text style={styles.primaryButtonText}>Message</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity style={styles.secondaryButton}>
//                 <Ionicons name="call" size={20} color="#FFF" />
//               </TouchableOpacity>
              
//               <TouchableOpacity style={styles.secondaryButton}>
//                 <Ionicons name="videocam" size={20} color="#FFF" />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Additional Info / Options */}
//           <View style={styles.section}>
//             <TouchableOpacity style={styles.optionRow}>
//               <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 211, 102, 0.1)' }]}>
//                 <Icon name="image" size={22} color="#25D366" />
//               </View>
//               <Text style={styles.optionText}>Media, Links, and Docs</Text>
//               <Icon name="chevron-right" size={24} color="#8696A0" />
//             </TouchableOpacity>
            
//             <TouchableOpacity style={styles.optionRow}>
//               <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
//                 <Icon name="star" size={22} color="#FF9500" />
//               </View>
//               <Text style={styles.optionText}>Starred Messages</Text>
//               <Icon name="chevron-right" size={24} color="#8696A0" />
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.optionRow}>
//               <View style={[styles.iconBox, { backgroundColor: 'rgba(90, 200, 250, 0.1)' }]}>
//                 <Icon name="notifications" size={22} color="#5AC8FA" />
//               </View>
//               <Text style={styles.optionText}>Notifications</Text>
//               <Icon name="chevron-right" size={24} color="#8696A0" />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.section}>
//             <TouchableOpacity style={styles.optionRow}>
//               <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
//                 <Icon name="block" size={22} color="#FF3B30" />
//               </View>
//               <Text style={[styles.optionText, { color: '#FF3B30' }]}>Block {profileData?.name}</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity style={styles.optionRow}>
//               <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
//                 <Icon name="thumb-down" size={22} color="#FF3B30" />
//               </View>
//               <Text style={[styles.optionText, { color: '#FF3B30' }]}>Report {profileData?.name}</Text>
//             </TouchableOpacity>
//           </View>

//         </ScrollView>
//       </LinearGradient>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#0f2027',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#0f2027',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#FFF',
//   },
//   menuButton: {
//     padding: 8,
//   },
//   content: {
//     paddingBottom: 40,
//   },
//   profileCard: {
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginBottom: 16,
//   },
//   avatar: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.1)',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 5,
//     right: 5,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     borderWidth: 2,
//     borderColor: '#0f2027',
//   },
//   name: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#FFF',
//     marginBottom: 4,
//   },
//   userId: {
//     fontSize: 14,
//     color: '#8696A0',
//     marginBottom: 12,
//   },
//   bio: {
//     fontSize: 15,
//     color: '#E9EDEF',
//     textAlign: 'center',
//     paddingHorizontal: 40,
//     marginBottom: 16,
//     lineHeight: 22,
//   },
//   locationContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   locationText: {
//     color: '#8696A0',
//     marginLeft: 4,
//     fontSize: 14,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255,255,255,0.05)',
//     borderRadius: 16,
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     marginBottom: 24,
//   },
//   statItem: {
//     alignItems: 'center',
//     paddingHorizontal: 16,
//   },
//   statNumber: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#FFF',
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#8696A0',
//     marginTop: 2,
//   },
//   statDivider: {
//     width: 1,
//     height: 24,
//     backgroundColor: 'rgba(255,255,255,0.1)',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 10,
//   },
//   primaryButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#0084FF',
//     paddingVertical: 10,
//     paddingHorizontal: 24,
//     borderRadius: 24,
//     gap: 8,
//   },
//   primaryButtonText: {
//     color: '#FFF',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   secondaryButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(255,255,255,0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   section: {
//     backgroundColor: 'rgba(255,255,255,0.03)',
//     marginTop: 16,
//     paddingVertical: 8,
//   },
//   optionRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//   },
//   iconBox: {
//     width: 36,
//     height: 36,
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 16,
//   },
//   optionText: {
//     flex: 1,
//     fontSize: 16,
//     color: '#FFF',
//   },
// });

// export default MessagerProfile;