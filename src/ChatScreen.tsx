import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, FlatList,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GiftedChat, Bubble, InputToolbar, Send } from 'react-native-gifted-chat';
import { theme } from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './utiliti/config';
import * as socket from './services/socket';

const ChatScreen = ({ navigation }) => {
  useEffect(() => {
    // Provide a default location to prevent backend validation errors.
    // In a real app, you would get the user's actual location here.
    const defaultLocation = { type: 'Point', coordinates: [0, 0] };
    socket.initSocket(defaultLocation);

    return () => {
      socket.disconnectSocket();
    };
  }, []);

  return <FriendListScreen onSelectChat={(user) => navigation.navigate('Message', { user })} />;
};

const FriendListScreen = ({ onSelectChat }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Human Friends');

  useEffect(() => {
    fetchFriends();
    socket.onUserStatusUpdate(handleUserStatusUpdate);
  }, []);

  const handleUserStatusUpdate = ({ userId, isOnline, lastSeen }) => {
    setFriends(prevFriends =>
      prevFriends.map(friend =>
        friend._id === userId ? { ...friend, isOnline, lastSeen } : friend
      )
    );
  };

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch friends');

      const data = await response.json();
      if (data.success) {
        setFriends(data.friends);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (url) => {
    if (!url) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('file:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `${API_URL}/${cleanPath}`;
  };

  const renderFriendItem = ({ item }) => {
    const avatarUrl = getAvatarUrl(item.photoURL || item.avatar);
    
    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => onSelectChat(item)}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: avatarUrl }} style={styles.chatAvatar} />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.chatPreview} numberOfLines={1}>
          {item.isOnline ? 'Online' : `Last seen ${new Date(item.lastSeen).toLocaleTimeString()}`}
        </Text>
      </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <View style={styles.tabContainer}>
          {['Human Friends', 'AI Friends'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={styles.tabButtonText}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {loading ? (
          <ActivityIndicator size="large" color={theme.accentColor} style={{ marginTop: 20 }}/>
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={item => item._id}
            style={styles.chatList}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#141414' },
    header: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    tabContainer: { flexDirection: 'row', padding: 10, justifyContent: 'center' },
    tabButton: { padding: 10, marginHorizontal: 10 },
    activeTabButton: { borderBottomWidth: 2, borderBottomColor: theme.accentColor },
    tabButtonText: { color: '#888', fontSize: 16 },
    chatList: { flex: 1 },
    chatItem: { flexDirection: 'row', padding: 15, alignItems: 'center' },
    avatarContainer: { marginRight: 15 },
    chatAvatar: { width: 50, height: 50, borderRadius: 25 },
    onlineIndicator: {
      position: 'absolute', bottom: 0, right: 0, width: 15, height: 15,
      borderRadius: 7.5, backgroundColor: 'green', borderWidth: 2, borderColor: '#141414'
    },
    chatInfo: { flex: 1 },
    chatName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    chatPreview: { color: '#888', fontSize: 14 },
});

export default ChatScreen;