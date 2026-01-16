// import React from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   SafeAreaView, 
//   StatusBar, 
//   FlatList, 
//   Image,
//   Dimensions 
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { theme } from '../../styles/theme';

// const { width } = Dimensions.get('window');

// export default function Notification({ navigation }) {
//   // Sample notification data
//   const notifications = [
//     {
//       id: '1',
//       type: 'friend_request',
//       user: {
//         name: 'Alex Johnson',
//         avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
//         userId: '@alexj'
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
//         userId: '@sarahm'
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
//         userId: '@miket'
//       },
//       message: 'Sent you a friend request',
//       time: '1 day ago',
//     },
//   ];

//   const renderNotification = ({ item }) => (
//     <View style={styles.notificationItem}>
//       <Image source={{ uri: item.user.avatar }} style={styles.userAvatar} />
//       <View style={styles.notificationInfo}>
//         <Text style={styles.userName}>{item.user.name}</Text>
//         <Text style={styles.userId}>{item.user.userId}</Text>
//         <Text style={styles.notificationText}>{item.message}</Text>
//         <Text style={styles.notificationTime}>{item.time}</Text>
//       </View>
//       {item.type === 'friend_request' && (
//         <View style={styles.actionButtons}>
//           <TouchableOpacity style={styles.acceptButton}>
//             <Text style={styles.acceptButtonText}>Accept</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.rejectButton}>
//             <Text style={styles.rejectButtonText}>Reject</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
//       <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
//       <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
//         <View style={styles.containerInner}>
//           {/* Header */}
//           <View style={styles.header}>
//             <View style={styles.headerLeft}>
//               <TouchableOpacity 
//                 style={styles.backButton}
//                 onPress={() => navigation.goBack()}
//               >
//                 <Icon name="arrow-back" size={24} color={theme.textPrimary} />
//               </TouchableOpacity>
//               <View style={styles.logoContainer}>
//                 <Icon name="notifications" size={22} color={theme.accentColor} />
//                 <Text style={styles.logo}>REELS2CHAT</Text>
//               </View>
//             </View>
//             <TouchableOpacity 
//               style={styles.searchButton}
//               onPress={() => navigation.navigate('SearchScreen')}
//             >
//               <Icon name="search" size={20} color={theme.textPrimary} />
//             </TouchableOpacity>
//           </View>

//           {/* Tab Navigation - Medium Size & Centered */}
//           <View style={styles.tabContainer}>
//             <TouchableOpacity 
//               style={[styles.tab, styles.activeTab]}
//               onPress={() => {}} // Already on this screen
//             >
//               <Icon name="person" size={18} color={theme.accentColor} />
//               <Text style={[styles.tabText, styles.activeTabText]}>MY PERSONAL</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.tab}
//               onPress={() => navigation.navigate('Admin')}
//             >
//               <Icon name="admin-panel-settings" size={18} color={theme.textSecondary} />
//               <Text style={styles.tabText}>MY ADMIN</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Notifications Content */}
//           <View style={styles.content}>
//             <View style={styles.notificationsContainer}>
//               <View style={styles.notificationsHeader}>
//                 <Text style={styles.notificationsTitle}>Recent Notifications</Text>
//                 <TouchableOpacity>
//                   <Text style={styles.markAllReadText}>Mark all as read</Text>
//                 </TouchableOpacity>
//               </View>

//               <FlatList
//                 data={notifications}
//                 renderItem={renderNotification}
//                 keyExtractor={(item) => item.id}
//                 showsVerticalScrollIndicator={false}
//                 contentContainerStyle={styles.notificationsList}
//               />
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
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   backButton: {
//     padding: 8,
//     marginRight: 12,
//   },
//   logoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   logo: {
//     fontSize: 22,
//     fontWeight: '700',
//     fontFamily: 'Poppins',
//     color: theme.textPrimary,
//     marginLeft: 8,
//   },
//   searchButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255, 255, 255, 0.08)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   // Tab Navigation - Medium Size & Centered
//   tabContainer: {
//     flexDirection: 'row',
//     backgroundColor: 'rgba(18, 24, 38, 0.95)',
//     marginHorizontal: 20,
//     marginTop: 16,
//     borderRadius: 12,
//     padding: 6,
//     alignSelf: 'center',
//     width: width * 0.7,
//   },
//   tab: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     gap: 6,
//   },
//   activeTab: {
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   tabText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: theme.textSecondary,
//     fontFamily: 'Poppins',
//   },
//   activeTabText: {
//     color: theme.accentColor,
//   },
//   content: {
//     flex: 1,
//     padding: 16,
//   },
//   notificationsContainer: {
//     flex: 1,
//     backgroundColor: 'rgba(30, 40, 50, 0.7)',
//     borderRadius: 20,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   notificationsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   notificationsTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: theme.textPrimary,
//     fontFamily: 'Poppins',
//   },
//   markAllReadText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: theme.accentColor,
//     fontFamily: 'Poppins',
//   },
//   notificationsList: {
//     paddingBottom: 8,
//   },
//   notificationItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(40, 50, 60, 0.8)',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   userAvatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 16,
//     borderWidth: 2,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   notificationInfo: {
//     flex: 1,
//   },
//   userName: {
//     fontWeight: '600',
//     fontSize: 16,
//     color: theme.textPrimary,
//     fontFamily: 'Poppins',
//     marginBottom: 2,
//   },
//   userId: {
//     fontSize: 13,
//     color: theme.accentColor,
//     fontFamily: 'Poppins',
//     marginBottom: 4,
//   },
//   notificationText: {
//     fontSize: 14,
//     color: theme.textPrimary,
//     fontFamily: 'Poppins',
//     marginBottom: 4,
//   },
//   notificationTime: {
//     fontSize: 12,
//     color: theme.textSecondary,
//     fontFamily: 'Poppins',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   acceptButton: {
//     backgroundColor: '#28a745',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 16,
//   },
//   acceptButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 12,
//     fontFamily: 'Poppins',
//   },
//   rejectButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   rejectButtonText: {
//     color: theme.textPrimary,
//     fontWeight: '600',
//     fontSize: 12,
//     fontFamily: 'Poppins',
//   },
// });









import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, FlatList, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../styles/theme';

export default function Notification({ navigation }) {
  // Sample notification data
  const notifications = [
    {
      id: '1',
      type: 'friend_request',
      user: {
        name: 'Alex Johnson',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      },
      message: 'Sent you a friend request',
      time: '2 hours ago',
    },
    {
      id: '2',
      type: 'message',
      user: {
        name: 'Sarah Miller',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
      message: 'Sent you a message',
      time: '5 hours ago',
    },
    {
      id: '3',
      type: 'friend_request',
      user: {
        name: 'Mike Thompson',
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      },
      message: 'Sent you a friend request',
      time: '1 day ago',
    },
  ];

  const renderNotification = ({ item }) => (
    <View style={styles.notificationItem}>
      <Image source={{ uri: item.user.avatar }} style={styles.userAvatar} />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          <Text style={styles.userName}>{item.user.name}</Text> {item.message}
        </Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
      {item.type === 'friend_request' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.acceptButton}>
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton}>
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
        <View style={styles.containerInner}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="mail" size={22} color={theme.accentColor} />
              <Text style={styles.logo}>REELS2CHAT</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Search')}>
                <Icon name="search" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.tabsContainer}>
              <View style={styles.notificationTabs}>
                <TouchableOpacity 
                  style={[styles.notificationTab, styles.activeTab]}
                  onPress={() => navigation.navigate('PersonalNotifications')}
                >
                  <Icon name="person" size={18} color={theme.accentColor} />
                  <Text style={[styles.notificationTabText, styles.activeTabText]}>MY PERSONAL</Text>
                </TouchableOpacity>
                
                <View style={styles.tabSeparator} />
                
                <TouchableOpacity 
                  style={styles.notificationTab}
                  onPress={() => navigation.navigate('AdminNotifications')}
                >
                  <Icon name="admin-panel-settings" size={18} color={theme.textSecondary} />
                  <Text style={styles.notificationTabText}>MY ADMIN</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.notificationContent}>
              <View style={styles.notificationsHeader}>
                <Text style={styles.notificationsTitle}>Recent Notifications</Text>
                <TouchableOpacity>
                  <Text style={styles.markAllReadText}>Mark all as read</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.notificationsList}
              />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Poppins',
    color: theme.textPrimary,
    marginLeft: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 12,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: theme.accentColor,
  },
  notificationTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginLeft: 6,
    fontFamily: 'Poppins',
  },
  activeTabText: {
    color: theme.accentColor,
  },
  tabSeparator: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationContent: {
    flex: 1,
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'Poppins',
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accentColor,
    fontFamily: 'Poppins',
  },
  notificationsList: {
    paddingBottom: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(40, 50, 60, 0.5)',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    color: theme.textPrimary,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  userName: {
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: 12,
    color: theme.textSecondary,
    fontFamily: 'Poppins',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: theme.accentColor,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'Poppins',
  },
});



