import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './utiliti/config';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const SearchScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'name' | 'email' | 'phone' | 'userId'>('all');
  const [sendingIds, setSendingIds] = useState<string[]>([]); // track requests being sent

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query or filter changes
  useEffect(() => {
    if (debouncedQuery.length > 0) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, filter]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const q = encodeURIComponent(debouncedQuery);
      const response = await fetch(
        `${API_URL}/api/user/search?q=${q}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Expecting data.users as array; fallback to empty array
        const users = Array.isArray(data.users) ? data.users : [];
        // Normalize items so UI can rely on consistent fields
        const normalized = users.map((u: any) => {
          const rawAvatar = u.photoURL || u.avatar;
          let avatar = DEFAULT_AVATAR;
          if (rawAvatar) {
             if (rawAvatar.startsWith('http') || rawAvatar.startsWith('data:') || rawAvatar.startsWith('file:')) {
               avatar = rawAvatar;
             } else {
               const cleanPath = rawAvatar.startsWith('/') ? rawAvatar.substring(1) : rawAvatar;
               avatar = `${API_URL}/${cleanPath}`;
             }
          }

          return {
          // possible id fields from backend
          id: u.id || u._id || u.userId,
          _id: u._id || u.id,
          userId: u.userId,
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          photoURL: u.photoURL || u.avatar || null,
          avatar: avatar,
          friendshipStatus: u.friendshipStatus || u.requestStatus || 'add_friend',
          // include raw object for any extra fields
          raw: u,
        }});
        setSearchResults(normalized);
      } else {
        const err = await response.json().catch(() => null);
        Alert.alert('Error', (err && err.message) || 'Failed to fetch search results');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (user: any) => {
    const toUserId = user.id || user._id || user.userId;
    if (!toUserId) {
      Alert.alert('Error', 'Invalid user selected');
      return;
    }

    // Prevent multiple sends for same user
    if (sendingIds.includes(toUserId.toString())) return;

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      // Optimistic UI update
      setSearchResults(prev =>
        prev.map(item =>
          (item.id === user.id || item._id === user._id || item.userId === user.userId)
            ? { ...item, friendshipStatus: 'request_sent' }
            : item
        )
      );
      setSendingIds(prev => [...prev, toUserId.toString()]);

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

      if (response.ok) {
        const data = await response.json().catch(() => null);
        Alert.alert('Success', `Friend request sent to ${user.name || 'user'}`);
        // Optionally update with returned requestId / status if provided
        if (data && data.friendRequest && data.friendRequest._id) {
          const requestId = data.friendRequest._id;
          setSearchResults(prev =>
            prev.map(item =>
              (item.id === user.id || item._id === user._id || item.userId === user.userId)
                ? { ...item, friendshipStatus: 'request_sent', requestId }
                : item
            )
          );
        }
      } else {
        // revert optimistic UI on failure
        setSearchResults(prev =>
          prev.map(item =>
            (item.id === user.id || item._id === user._id || item.userId === user.userId)
              ? { ...item, friendshipStatus: 'add_friend' }
              : item
          )
        );
        const err = await response.json().catch(() => null);
        Alert.alert('Error', (err && err.message) || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      // revert optimistic UI
      setSearchResults(prev =>
        prev.map(item =>
          (item.id === user.id || item._id === user._id || item.userId === user.userId)
            ? { ...item, friendshipStatus: 'add_friend' }
            : item
        )
      );
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSendingIds(prev => prev.filter(id => id !== toUserId.toString()));
    }
  };

  const renderUserItem = ({ item }: { item: any }) => {
    const uid = item.id || item._id || item.userId;
    const isSending = sendingIds.includes(uid?.toString());
    const status = item.friendshipStatus || 'add_friend';

    return (
      <View style={styles.userItem}>
        <Image
          source={{ uri: item.avatar || item.photoURL || DEFAULT_AVATAR }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name || item.userId || 'Unknown'}</Text>
          {item.userId ? <Text style={styles.userDetails}>{item.userId}</Text> : null}
          {item.email ? <Text style={styles.userDetails}>{item.email}</Text> : null}
          {item.phone ? <Text style={styles.userDetails}>{item.phone}</Text> : null}
        </View>

        {status === 'add_friend' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddFriend(item)}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={theme.textPrimary} />
            ) : (
              <Text style={styles.addButtonText}>Add</Text>
            )}
          </TouchableOpacity>
        )}

        {status === 'request_sent' && (
          <View style={styles.requestSentBtn}>
            <Icon name="schedule" size={16} color={theme.textSecondary} />
            <Text style={styles.requestSentText}>Sent</Text>
          </View>
        )}

        {status === 'already_friends' && (
          <View style={styles.alreadyFriendsBtn}>
            <Icon name="check" size={16} color="#fff" />
            <Text style={styles.alreadyFriendsText}>Friends</Text>
          </View>
        )}

        {status === 'request_received' && (
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => navigation.navigate('FriendRequests')} // or navigate to request detail
          >
            <Icon name="mail" size={16} color="#fff" />
            <Text style={styles.viewProfileText}>Requests</Text>
          </TouchableOpacity>
        )}

        {['blocked', 'request_rejected'].includes(status) && (
          <TouchableOpacity
            style={[styles.viewProfileBtn, { backgroundColor: '#757575' }]}
            onPress={() => navigation.navigate('ProfileView', { userId: uid })}
          >
            <Icon name="visibility" size={16} color="#fff" />
            <Text style={styles.viewProfileText}>View</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, phone or user ID..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => setDebouncedQuery(searchQuery.trim())}
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by:</Text>
          <View style={styles.filterOptions}>
            {['all', 'name', 'email', 'phone', 'userId'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.filterOption, filter === option && styles.filterOptionActive]}
                onPress={() => setFilter(option as any)}
              >
                <Text style={[styles.filterOptionText, filter === option && styles.filterOptionTextActive]}>
                  {option === 'all' ? 'All' : option === 'userId' ? 'User ID' : option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.resultsContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.accentColor} style={styles.loader} />
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item, index) => (item._id || item.id || item.userId || index).toString()}
              contentContainerStyle={styles.resultsList}
              keyboardShouldPersistTaps="handled"
            />
          ) : debouncedQuery.length > 0 ? (
            <View style={styles.noResultsContainer}>
              <Icon name="search-off" size={48} color={theme.textSecondary} />
              <Text style={styles.noResultsText}>No users found matching "{debouncedQuery}"</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="search" size={48} color={theme.textSecondary} />
              <Text style={styles.emptyText}>Search for users by name, email, phone or user ID</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(18, 24, 38, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    marginRight: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 16,
    padding: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(18, 24, 38, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginRight: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterOptionActive: {
    backgroundColor: theme.accentColor,
  },
  filterOptionText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  filterOptionTextActive: {
    color: theme.textPrimary,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  resultsList: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  userDetails: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  addButton: {
    backgroundColor: theme.accentColor,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: theme.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  requestSentBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  requestSentText: {
    color: theme.textSecondary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  alreadyFriendsBtn: {
    backgroundColor: theme.accentColor,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  alreadyFriendsText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  viewProfileBtn: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewProfileText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 40,
  },
});

export default SearchScreen;



// // D:\re_ap-main\re_ap-main\src\SearchScreen.tsx
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   StatusBar,
//   TouchableOpacity,
//   FlatList,
//   TextInput,
//   ActivityIndicator,
//   Alert,
//   Image, // Added this import
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { theme } from '../styles/theme';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Added this import
// import API_URL from './utiliti/config';

// const SearchScreen = ({ navigation }) => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [filter, setFilter] = useState('all');
//   const [debouncedQuery, setDebouncedQuery] = useState('');

//   // Debounce search input
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedQuery(searchQuery);
//     }, 300);
//     return () => clearTimeout(timer);
//   }, [searchQuery]);

//   // Perform search when debounced query changes
//   useEffect(() => {
//     if (debouncedQuery.length > 0) {
//       performSearch();
//     } else {
//       setSearchResults([]);
//     }
//   }, [debouncedQuery, filter]);

//   const performSearch = async () => {
//     setLoading(true);
//     try {
//       const token = await AsyncStorage.getItem('authToken');
//       // Fixed: Changed from /api/users/search to /api/user/search
//       const response = await fetch(
//         `${API_URL}/api/user/search?q=${encodeURIComponent(debouncedQuery)}&filter=${filter}`,
//         {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (response.ok) {
//         const data = await response.json();
//         setSearchResults(data.users || []);
//       } else {
//         Alert.alert('Error', 'Failed to fetch search results');
//       }
//     } catch (error) {
//       console.error('Search error:', error);
//       Alert.alert('Error', 'Network error. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderUserItem = ({ item }) => (
//     <View style={styles.userItem}>
//       <Image source={{ uri: item.photoURL || 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.userAvatar} />
//       <View style={styles.userInfo}>
//         <Text style={styles.userName}>{item.name}</Text>
//         <Text style={styles.userDetails}>{item.userId}</Text>
//         <Text style={styles.userDetails}>{item.email}</Text>
//         {item.phone && <Text style={styles.userDetails}>{item.phone}</Text>}
//       </View>
//       <TouchableOpacity style={styles.addButton}>
//         <Text style={styles.addButtonText}>Add</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
//       <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
//       <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//             <Icon name="arrow-back" size={24} color={theme.textPrimary} />
//           </TouchableOpacity>
//           <View style={styles.searchContainer}>
//             <Icon name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Search by name, email, phone or user ID..."
//               placeholderTextColor={theme.textSecondary}
//               value={searchQuery}
//               onChangeText={setSearchQuery}
//               autoFocus
//             />
//           </View>
//         </View>

//         <View style={styles.filterContainer}>
//           <Text style={styles.filterLabel}>Filter by:</Text>
//           <View style={styles.filterOptions}>
//             {['all', 'name', 'email', 'phone', 'userId'].map((option) => (
//               <TouchableOpacity
//                 key={option}
//                 style={[styles.filterOption, filter === option && styles.filterOptionActive]}
//                 onPress={() => setFilter(option)}
//               >
//                 <Text style={[styles.filterOptionText, filter === option && styles.filterOptionTextActive]}>
//                   {option === 'all' ? 'All' : option === 'userId' ? 'User ID' : option}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>

//         <View style={styles.resultsContainer}>
//           {loading ? (
//             <ActivityIndicator size="large" color={theme.accentColor} style={styles.loader} />
//           ) : searchResults.length > 0 ? (
//             <FlatList
//               data={searchResults}
//               renderItem={renderUserItem}
//               keyExtractor={(item) => item._id}
//               contentContainerStyle={styles.resultsList}
//             />
//           ) : searchQuery.length > 0 ? (
//             <View style={styles.noResultsContainer}>
//               <Icon name="search-off" size={48} color={theme.textSecondary} />
//               <Text style={styles.noResultsText}>No users found matching "{searchQuery}"</Text>
//             </View>
//           ) : (
//             <View style={styles.emptyContainer}>
//               <Icon name="search" size={48} color={theme.textSecondary} />
//               <Text style={styles.emptyText}>Search for users by name, email, phone or user ID</Text>
//             </View>
//           )}
//         </View>
//       </LinearGradient>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({

//   container: {
//     flex: 1,
//     backgroundColor: theme.background,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     backgroundColor: 'rgba(18, 24, 38, 0.95)',
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.08)',
//   },
//   backButton: {
//     marginRight: 16,
//   },
//   searchContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     color: theme.textPrimary,
//     fontSize: 16,
//   },
//   filterContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     backgroundColor: 'rgba(18, 24, 38, 0.95)',
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.08)',
//   },
//   filterLabel: {
//     fontSize: 14,
//     color: theme.textSecondary,
//     marginRight: 12,
//   },
//   filterOptions: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   filterOption: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     marginRight: 8,
//     marginBottom: 8,
//     borderRadius: 16,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//   },
//   filterOptionActive: {
//     backgroundColor: theme.accentColor,
//   },
//   filterOptionText: {
//     fontSize: 12,
//     color: theme.textSecondary,
//   },
//   filterOptionTextActive: {
//     color: theme.textPrimary,
//     fontWeight: '600',
//   },
//   resultsContainer: {
//     flex: 1,
//     padding: 16,
//   },
//   loader: {
//     marginTop: 40,
//   },
//   resultsList: {
//     paddingBottom: 20,
//   },
//   userItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     backgroundColor: 'rgba(30, 40, 50, 0.7)',
//     borderRadius: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   userAvatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     marginRight: 16,
//   },
//   userInfo: {
//     flex: 1,
//   },
//   userName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: theme.textPrimary,
//     marginBottom: 4,
//   },
//   userDetails: {
//     fontSize: 13,
//     color: theme.textSecondary,
//     marginBottom: 2,
//   },
//   addButton: {
//     backgroundColor: theme.accentColor,
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//   },
//   addButtonText: {
//     color: theme.textPrimary,
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   noResultsContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   noResultsText: {
//     fontSize: 16,
//     color: theme.textSecondary,
//     textAlign: 'center',
//     marginTop: 16,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: theme.textSecondary,
//     textAlign: 'center',
//     marginTop: 16,
//     paddingHorizontal: 40,
//   },
// });

// export default SearchScreen;