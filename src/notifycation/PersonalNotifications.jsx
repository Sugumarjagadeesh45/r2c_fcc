import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, 
  FlatList, Image, Alert, ActivityIndicator 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../utiliti/config';

export default function PersonalNotifications({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No authentication token found.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/requests/pending`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.requests || []);
      } else {
        console.error('Failed to fetch friend requests:', response.status);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId, userName) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert('Success', `Accepted friend request from ${userName}`);
        // Remove from list
        setNotifications(prev => prev.filter(req => req.id !== requestId));
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId, userName) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert('Success', `Rejected friend request from ${userName}`);
        // Remove from list
        setNotifications(prev => prev.filter(req => req.id !== requestId));
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to reject friend request');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleViewProfile = (user) => {
    navigation.navigate('ProfileView', { 
      userId: user.id,
      userName: user.name 
    });
  };

  const renderNotification = ({ item }) => (
    <View style={styles.notificationItem}>
      <TouchableOpacity onPress={() => handleViewProfile(item.fromUser)}>
        <Image source={{ uri: item.fromUser.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.userAvatar} />
      </TouchableOpacity>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          <Text style={styles.userName}>{item.fromUser.name}</Text> sent you a friend request
        </Text>
        {item.message && (
          <Text style={styles.requestMessage}>"{item.message}"</Text>
        )}
        <Text style={styles.notificationTime}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item.id, item.fromUser.name)}
        >
          <Text style={styles.actionButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => handleRejectRequest(item.id, item.fromUser.name)}
        >
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
        <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accentColor} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Friend Requests</Text>
          <View style={styles.placeholder} />
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="mail-outline" size={64} color={theme.textSecondary} />
            <Text style={styles.emptyText}>No pending friend requests</Text>
            <Text style={styles.emptySubtext}>
              When someone sends you a friend request, it will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.notificationsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
  },
  requestMessage: {
    fontSize: 14,
    color: theme.accentColor,
    fontStyle: 'italic',
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: '#FF4757',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.textPrimary,
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});



// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, FlatList, Image } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { theme } from '../../styles/theme';

// export default function PersonalNotifications({ navigation }) {
//   const [notifications, setNotifications] = useState([
//     {
//       id: '1',
//       type: 'friend_request',
//       user: {
//         name: 'Alex Johnson',
//         avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
//         userId: 'R2C20230815001',
//       },
//       message: 'Sent you a friend request',
//       time: '2 hours ago',
//     },
//     {
//       id: '2',
//       type: 'message',
//       user: {
//         name: 'Sarah Miller',
//         avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
//         userId: 'R2C20230815015',
//       },
//       message: 'Sent you a message',
//       time: '5 hours ago',
//     },
//     {
//       id: '3',
//       type: 'friend_request',
//       user: {
//         name: 'Mike Thompson',
//         avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
//         userId: 'R2C20230816023',
//       },
//       message: 'Sent you a friend request',
//       time: '1 day ago',
//     },
//   ]);

//   const renderNotification = ({ item }) => (
//     <View style={styles.notificationItem}>
//       <Image source={{ uri: item.user.avatar }} style={styles.userAvatar} />
//       <View style={styles.notificationContent}>
//         <Text style={styles.notificationText}>
//           <Text style={styles.userName}>{item.user.name}</Text> {item.message}
//         </Text>
//         <Text style={styles.notificationTime}>{item.time}</Text>
//       </View>
//       {item.type === 'friend_request' && (
//         <View style={styles.actionButtons}>
//           <TouchableOpacity style={styles.acceptButton}>
//             <Text style={styles.actionButtonText}>Accept</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.rejectButton}>
//             <Text style={styles.actionButtonText}>Reject</Text>
//           </TouchableOpacity>
//         </View>
//       )}
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
//           <Text style={styles.headerTitle}>Personal Notifications</Text>
//           <View style={styles.placeholder} />
//         </View>

//         <FlatList
//           data={notifications}
//           renderItem={renderNotification}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.notificationsList}
//           showsVerticalScrollIndicator={false}
//         />
//       </LinearGradient>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.background,
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
//     fontSize: 18,
//     fontWeight: '700',
//     color: theme.textPrimary,
//     fontFamily: 'Poppins',
//   },
//   placeholder: {
//     width: 40,
//   },
//   notificationsList: {
//     padding: 16,
//   },
//   notificationItem: {
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
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 16,
//   },
//   notificationContent: {
//     flex: 1,
//   },
//   notificationText: {
//     fontSize: 16,
//     color: theme.textPrimary,
//     marginBottom: 4,
//   },
//   userName: {
//     fontWeight: '600',
//   },
//   notificationTime: {
//     fontSize: 13,
//     color: theme.textSecondary,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//   },
//   acceptButton: {
//     backgroundColor: theme.accentColor,
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 16,
//     marginRight: 8,
//   },
//   rejectButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 16,
//   },
//   actionButtonText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: theme.textPrimary,
//   },
// });