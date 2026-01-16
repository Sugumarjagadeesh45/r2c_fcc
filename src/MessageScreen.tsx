
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
  Keyboard,
  ActivityIndicator,
  Animated,
  PanResponder
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

import API_URL from './utiliti/config';
import { useUser } from './context/UserContext';
import * as socket from './services/socket';

const { width, height } = Dimensions.get('window');

// Premium WhatsApp/Telegram Style Palette
const COLORS = {
  // Primary Colors
  primary: '#0084FF', // WhatsApp green
  primaryDark: '#005BB5',
  secondary: '#25D366',
  
  // Background Colors
  background: '#0B141A',
  chatBackground: '#0B141A',
  headerBg: '#202C33',
  inputBg: '#202C33',
  
  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#8696A0',
  textTime: '#667781',
  
  // Message Bubbles
  outgoingBubble: '#005C4B', // Green for sender (YOU - RIGHT SIDE)
  outgoingText: '#E7FFDB',
  incomingBubble: '#202C33', // Dark for receiver (OTHER - LEFT SIDE)
  incomingText: '#E9EDEF',
  
  // UI Elements
  border: '#263238',
  danger: '#FF3B30',
  success: '#25D366',
  warning: '#FF9500',
  info: '#5AC8FA',
  
  // Status
  online: '#25D366',
  offline: '#8696A0',
  
  // Reactions
  reactionBg: '#233138',
  reactionText: '#FFFFFF',
  
  // Menu
  menuBg: '#233138',
  menuItem: '#FFFFFF'
};

const EMOJI_REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' }
];

const QUICK_EMOJIS = [
  ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇'],
  ['🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
  ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔'],
  ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞'],
];

// Helper functions for avatar fallback
const getUserInitials = (name) => {
  if (!name) return 'U';
  const nameParts = name.split(' ');
  if (nameParts.length >= 2) {
    return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
  if (!name) return '#6C63FF';
  const colors = [
    '#6C63FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FECA57', '#FF9FF3', '#54A0FF', '#48DBFB', '#00D2D3'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const MessageScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user: contextUser, userData } = useUser();
  const { user: initialUser, otherUserId: paramOtherUserId, senderId: paramSenderId } = route.params || {};

  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageMenuVisible, setMessageMenuVisible] = useState(false);
  const [messageMenuPosition, setMessageMenuPosition] = useState({ x: 0, y: 0 });
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionPickerPosition, setReactionPickerPosition] = useState({ x: 0, y: 0 });
  const [pinnedMessages, setPinnedMessages] = useState([]);
  
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const reactionAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;

  // --- HELPER: Get Avatar URL ---
  const getAvatarUrl = (userObj) => {
    if (!userObj) return null;
    
    // Check all possible fields
    const uri = userObj.avatar || 
                userObj.profilePicture || 
                userObj.photoURL || 
                userObj.avatarUrl ||
                (userObj.user && (userObj.user.avatar || userObj.user.profilePicture));
    
    if (!uri || typeof uri !== 'string' || uri.length === 0) return null;
    
    // Return absolute URLs as is
    if (uri.startsWith('http') || uri.startsWith('data:') || uri.startsWith('file:')) {
      return uri;
    }
    
    // Handle relative paths (prepend API_URL)
    // Remove leading slash if present to avoid double slashes if API_URL has one
    const cleanPath = uri.startsWith('/') ? uri.substring(1) : uri;
    return `${API_URL}/${cleanPath}`;
  };

  // --- SOCKET CONNECTION ---
  useEffect(() => {
    console.log('[MessageScreen] 🚀 Setting up socket listeners');
    let isMounted = true;

    const initializeSocket = async () => {
      try {
        await socket.initSocket();
        if (!isMounted) return;

        socket.onReceiveMessage((newMessage) => {
          if (!isMounted) return;
          const messageUserId = newMessage?.sender?._id || newMessage?.sender?.id;
          const otherUserId = otherUser?._id || otherUser?.id;
          
          if (messageUserId !== otherUserId) return;
          
          // Mark as read immediately since user is on screen
          socket.emit('messageRead', { 
            messageId: newMessage._id, 
            senderId: messageUserId 
          });

          setMessages(prev => {
            const exists = prev.find(msg => msg._id === newMessage._id);
            if (exists) return prev;
            
            const formattedMessage = {
              _id: newMessage._id,
              text: newMessage.text,
              createdAt: new Date(newMessage.createdAt),
              user: {
                _id: newMessage.sender._id,
                name: newMessage.sender.name,
                avatar: newMessage.sender.avatar || newMessage.sender.profilePicture || newMessage.sender.photoURL,
              },
              status: newMessage.status,
              attachment: newMessage.attachment,
              reactions: [],
              isPinned: false,
            };
            return [...prev, formattedMessage];
          });
        });
        
        socket.on('messageStatusUpdate', (updatedMessage) => {
          setMessages(prev =>
            prev.map(msg =>
              msg._id === updatedMessage._id ? { 
                ...msg, 
                status: updatedMessage.status 
              } : msg
            )
          );
        });

        socket.on('typing', (data) => {
          if (data.userId === otherUser?._id) {
            setIsTyping(true);
          }
        });

        socket.on('stopTyping', (data) => {
          if (data.userId === otherUser?._id) {
            setIsTyping(false);
          }
        });

      } catch (error) {
        console.error('Socket error:', error);
      }
    };

    initializeSocket();

    return () => {
      isMounted = false;
      if (typeof socket.disconnectSocket === 'function') {
        socket.disconnectSocket();
      }
    };
  }, [otherUser?._id]);

  // --- DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
      // 1. Load Current User
      if (contextUser) {
        setCurrentUser({
          ...contextUser,
          _id: contextUser._id || contextUser.id,
          // Use userData from context which has the profile picture
          avatar: userData?.profilePicture || userData?.avatar || contextUser.photoURL
        });
      } else {
        // Fallback to AsyncStorage if context is not ready (rare)
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (userInfoStr) {
          const user = JSON.parse(userInfoStr);
          setCurrentUser({ ...user, _id: user._id || user.id });
        }
      }

      // 2. Load Other User
      let targetId = paramOtherUserId || paramSenderId || (initialUser?._id || initialUser?.id);
      
      if (initialUser && (initialUser._id || initialUser.id)) {
        setOtherUser({
          ...initialUser,
          _id: initialUser._id || initialUser.id,
          avatar: initialUser.avatar || initialUser.profilePicture || initialUser.photoURL,
        });
        setFetchingUser(false);
      }

      // Always fetch fresh profile data to ensure we have the correct avatar/info
      if (targetId) {
        try {
          const token = await AsyncStorage.getItem('authToken');
          const response = await fetch(`${API_URL}/api/user/profile/${targetId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
            setOtherUser(prev => ({
              ...(prev || {}),
              ...data.data,
              avatar: data.data.avatar || data.data.profilePicture || data.data.photoURL,
            }));
          }
        } catch (e) {
          console.error(e);
        } finally {
          setFetchingUser(false);
        }
      }
    };
    loadData();
  }, [initialUser, paramOtherUserId, paramSenderId, contextUser, userData]);

  // --- LOAD MESSAGES ---
  useEffect(() => {
    if (!otherUser) return;
    const loadMessages = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const otherId = otherUser._id || otherUser.id;
        const response = await fetch(`${API_URL}/api/messages/${otherId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success && data.data) {
          const formatted = data.data.map(msg => ({
            _id: msg._id,
            text: msg.text,
            createdAt: new Date(msg.createdAt),
            user: {
              _id: msg.sender._id || msg.sender.id,
              name: msg.sender.name,
              avatar: msg.sender.avatar || msg.sender.profilePicture || msg.sender.photoURL
            },
            status: msg.status,
            attachment: msg.attachment,
            reactions: msg.reactions || [],
            isPinned: msg.isPinned || false
          }));
          setMessages(formatted);
          
          // Mark unread messages as read
          formatted.forEach(msg => {
            if (msg.user._id === otherId && msg.status !== 'read') {
              socket.emit('messageRead', { messageId: msg._id, senderId: otherId });
            }
          });

          setPinnedMessages(formatted.filter(msg => msg.isPinned));
        }
      } catch (e) { 
        console.error(e); 
      } finally { 
        setLoading(false); 
      }
    };
    loadMessages();
  }, [otherUser]);

  // --- KEYBOARD HANDLING ---
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setShowEmojiPicker(false);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // --- HANDLERS ---
  const handleInputTextChanged = (text) => {
    setInputText(text);
    const otherId = otherUser?._id || otherUser?.id;
    if (otherId) {
      socket.emit('typing', { userId: otherId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { userId: otherId });
      }, 3000);
    }
  };

  const handleSend = async () => {
    const otherId = otherUser?._id || otherUser?.id;
    const currentId = currentUser?._id || currentUser?.id;
    
    if (!otherId || !currentId || (!inputText.trim() && !selectedAttachment)) return;

    const tempId = `temp_${Date.now()}`;
    const newMessage = {
      _id: tempId,
      text: inputText.trim(),
      createdAt: new Date(),
      user: { 
        _id: currentId, 
        name: currentUser.name,
        avatar: currentUser.avatar 
      },
      status: 'pending',
      attachment: selectedAttachment,
      reactions: [],
      isPinned: false,
    };

    setMessages(prev => [...prev, newMessage]);
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: otherId,
          text: inputText.trim(),
          attachment: selectedAttachment
        })
      });
      
      const data = await response.json();
      if (data.success && data.message) {
        // Use server ID if available, otherwise keep tempId to prevent crash
        const serverMsgId = data.message._id || tempId;
        
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? { ...msg, _id: serverMsgId, status: 'sent' } : msg
        ));
        socket.sendMessage(otherId, inputText.trim(), selectedAttachment);
      }
    } catch (error) {
      console.error('Send error:', error);
    }
    
    setInputText('');
    setSelectedAttachment(null);
    setShowEmojiPicker(false);
    
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleEmojiSelect = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  const handleMessageLongPress = (message, event) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedMessage(message);
    setMessageMenuPosition({ x: pageX, y: pageY });
    setMessageMenuVisible(true);
    
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  const handleMessagePress = (message, event) => {
    if (showReactionPicker) {
      setShowReactionPicker(false);
      return;
    }
    
    // Show reaction picker on double tap
    const { pageX, pageY } = event.nativeEvent;
    setSelectedMessage(message);
    setReactionPickerPosition({ x: pageX, y: pageY });
    setShowReactionPicker(true);
    
    Animated.spring(reactionAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
    
    setTimeout(() => {
      Animated.spring(reactionAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }).start(() => setShowReactionPicker(false));
    }, 2000);
  };

  const handleReactionSelect = (reaction) => {
    if (!selectedMessage) return;
    
    setMessages(prev => prev.map(msg => 
      msg._id === selectedMessage._id 
        ? { 
            ...msg, 
            reactions: [...(msg.reactions || []), { 
              emoji: reaction.emoji, 
              userId: currentUser._id,
              userName: currentUser.name 
            }] 
          }
        : msg
    ));
    
    setShowReactionPicker(false);
  };

  const handleDeleteMessage = () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setMessages(prev => prev.filter(msg => msg._id !== selectedMessage._id));
            setMessageMenuVisible(false);
            // Call API to delete message from server
          }
        }
      ]
    );
  };

  const handlePinMessage = () => {
    setMessages(prev => prev.map(msg => 
      msg._id === selectedMessage._id 
        ? { ...msg, isPinned: !msg.isPinned }
        : msg
    ));
    setMessageMenuVisible(false);
  };

  const handleSaveMessage = () => {
    Alert.alert('Message Saved', 'Message has been saved to your device.');
    setMessageMenuVisible(false);
  };

  const handleReplyMessage = () => {
    setInputText(`Replying to ${selectedMessage.user.name}: ${selectedMessage.text}`);
    setMessageMenuVisible(false);
    inputRef.current?.focus();
  };

  const selectImage = (type) => {
    const options = { 
      mediaType: 'photo', 
      quality: 0.8,
      maxWidth: 1080,
      maxHeight: 1080,
    };
    const callback = (res) => {
      if (res.assets?.[0]) {
        setSelectedAttachment({ 
          type: 'image', 
          uri: res.assets[0].uri, 
          name: res.assets[0].fileName,
          size: res.assets[0].fileSize
        });
        setAttachmentModalVisible(false);
      }
    };
    type === 'camera' 
      ? launchCamera(options, callback) 
      : launchImageLibrary(options, callback);
  };

  // --- RENDER HELPERS ---
  const renderTicks = (status, isOutgoing) => {
    if (!isOutgoing) return null;
    
    if (status === 'pending') 
      return <Icon name="access-time" size={14} color="rgba(255,255,255,0.7)" style={{marginLeft: 4}} />;
    if (status === 'sent') 
      return <Icon name="check" size={14} color="rgba(255,255,255,0.7)" style={{marginLeft: 4}} />;
    if (status === 'delivered') 
      return <Icon name="done-all" size={14} color="rgba(255,255,255,0.7)" style={{marginLeft: 4}} />;
    if (status === 'read') 
      return <Icon name="done-all" size={14} color="#34B7F1" style={{marginLeft: 4}} />;
    
    return <Icon name="check" size={14} color="rgba(255,255,255,0.7)" style={{marginLeft: 4}} />;
  };

  const renderReactions = (message) => {
    if (!message.reactions || message.reactions.length === 0) return null;
    
    const reactions = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = 1;
      } else {
        acc[reaction.emoji]++;
      }
      return acc;
    }, {});
    
    return (
      <View style={[
        styles.reactionContainer,
        message.user._id === currentUser?._id ? styles.reactionContainerRight : styles.reactionContainerLeft
      ]}>
        {Object.entries(reactions).map(([emoji, count], index) => (
          <View key={index} style={styles.reactionBadge}>
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
          </View>
        ))}
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    const isOutgoing = item.user._id === currentUser?._id;
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={(e) => handleMessagePress(item, e)}
        onLongPress={(e) => handleMessageLongPress(item, e)}
        delayLongPress={500}
      >
        <View style={[
          styles.messageContainer,
          isOutgoing ? styles.messageContainerLeft : styles.messageContainerRight
        ]}>
          
          {/* Profile picture - Always displayed next to message (Tiny) */}
          {(() => {
            const userForAvatar = isOutgoing ? currentUser : item.user;
            const avatarUrl = getAvatarUrl(userForAvatar);
            
            if (avatarUrl) {
              return (
                <Image 
                  source={{ uri: avatarUrl }}
                  style={styles.profilePic}
                />
              );
            } else {
              const initials = getUserInitials(userForAvatar?.name);
              const color = getAvatarColor(userForAvatar?.name);
              return (
                <View style={[styles.profilePic, { backgroundColor: color, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{initials}</Text>
                </View>
              );
            }
          })()}
          
          <View style={[
            styles.messageBubble,
            isOutgoing ? styles.outgoingBubble : styles.incomingBubble
          ]}>
            {/* Pinned indicator */}
            {item.isPinned && (
              <View style={styles.pinnedIndicator}>
                <Icon name="push-pin" size={12} color={COLORS.textSecondary} />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
            
            {/* Attachment */}
            {item.attachment && (
              <View style={styles.attachmentContainer}>
                {item.attachment.type === 'image' ? (
                  <Image 
                    source={{ uri: item.attachment.uri }} 
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.fileAttachment}>
                    <MaterialCommunityIcons 
                      name="file-document-outline" 
                      size={30} 
                      color={isOutgoing ? COLORS.outgoingText : COLORS.incomingText} 
                    />
                    <Text style={[
                      styles.fileName,
                      { color: isOutgoing ? COLORS.outgoingText : COLORS.incomingText }
                    ]}>
                      {item.attachment.name || 'Document'}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Message text */}
            {item.text ? (
              <Text style={[
                styles.messageText,
                isOutgoing ? styles.outgoingText : styles.incomingText
              ]}>
                {item.text}
              </Text>
            ) : null}
            
            {/* Reactions */}
            {renderReactions(item)}
            
            {/* Time and status */}
            <View style={styles.messageFooter}>
              <Text style={[
                styles.timeText,
                isOutgoing ? styles.outgoingTime : styles.incomingTime
              ]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isOutgoing && renderTicks(item.status, isOutgoing)}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderInputArea = () => (
    <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {/* Attachment preview */}
      {selectedAttachment && (
        <View style={styles.attachmentPreview}>
          <View style={styles.attachmentPreviewContent}>
            <MaterialCommunityIcons name="image" size={20} color={COLORS.primary} />
            <Text style={styles.attachmentPreviewText} numberOfLines={1}>
              {selectedAttachment.name || 'Image'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => setSelectedAttachment(null)}
            style={styles.attachmentRemoveButton}
          >
            <Icon name="close" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputRow}>
        {/* Emoji button */}
        <TouchableOpacity 
          onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          style={styles.inputIconButton}
        >
          <Ionicons 
            name={showEmojiPicker ? "close-circle" : "happy-outline"} 
            size={24} 
            color={COLORS.textSecondary} 
          />
        </TouchableOpacity>
        
        {/* Text input */}
        <View style={styles.textInputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={handleInputTextChanged}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            maxLength={500}
          />
        </View>
        
        {/* Attachment button */}
        <TouchableOpacity 
          onPress={() => setAttachmentModalVisible(true)}
          style={styles.inputIconButton}
        >
          <Ionicons name="attach-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        
        {/* Camera button */}
        <TouchableOpacity 
          onPress={() => selectImage('camera')}
          style={styles.inputIconButton}
        >
          <Ionicons name="camera-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        
        {/* Send button */}
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!inputText.trim() && !selectedAttachment) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() && !selectedAttachment}
        >
          {inputText.trim() || selectedAttachment ? (
            <Ionicons name="send" size={20} color={COLORS.textPrimary} />
          ) : (
            <Ionicons name="mic-outline" size={20} color={COLORS.textPrimary} />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Emoji picker */}
      {showEmojiPicker && (
        <Animated.View style={[
          styles.emojiPicker,
          { 
            transform: [{ 
              translateY: showEmojiPicker ? 
                keyboardHeight > 0 ? -keyboardHeight : 0 : 250 
            }] 
          }
        ]}>
          <ScrollView contentContainerStyle={styles.emojiGrid}>
            {QUICK_EMOJIS.flat().map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.emojiItem}
                onPress={() => handleEmojiSelect(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );

  if (fetchingUser || !otherUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerUserInfo}
          onPress={() => navigation.navigate('MessagerProfile', { userId: otherUser._id || otherUser.id, user: otherUser })}
        >
          {(() => {
            const avatarUrl = getAvatarUrl(otherUser);
            if (avatarUrl) {
              return (
                <Image 
                  source={{ uri: avatarUrl }}
                  style={styles.headerAvatar}
                />
              );
            } else {
              const initials = getUserInitials(otherUser?.name);
              const color = getAvatarColor(otherUser?.name);
              return (
                <View style={[styles.headerAvatar, { backgroundColor: color, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>{initials}</Text>
                </View>
              );
            }
          })()}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{otherUser.name}</Text>
            <View style={styles.headerStatusContainer}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: otherUser.isOnline ? COLORS.online : COLORS.offline }
              ]} />
              <Text style={styles.headerStatus}>
                {isTyping ? 'Typing...' : otherUser.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="videocam-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="call-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => setMoreMenuVisible(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Chat messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => (item._id ? item._id.toString() : `temp_${Math.random()}`)}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Send your first message</Text>
            </View>
          }
        />
        
        {/* Reaction Picker */}
        {showReactionPicker && selectedMessage && (
          <Animated.View 
            style={[
              styles.reactionPicker,
              {
                left: reactionPickerPosition.x - 100,
                top: reactionPickerPosition.y - 80,
                opacity: reactionAnim,
                transform: [
                  { scale: reactionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1]
                  })}
                ]
              }
            ]}
          >
            <View style={styles.reactionPickerContent}>
              {EMOJI_REACTIONS.map((reaction, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.reactionPickerItem}
                  onPress={() => handleReactionSelect(reaction)}
                >
                  <Text style={styles.reactionPickerEmoji}>{reaction.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
        
        {/* Message Context Menu */}
        {messageMenuVisible && selectedMessage && (
          <Animated.View 
            style={[
              styles.messageMenu,
              {
                left: messageMenuPosition.x - 150,
                top: messageMenuPosition.y - 100,
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity style={styles.menuItem} onPress={handleReplyMessage}>
              <Icon name="reply" size={20} color={COLORS.menuItem} />
              <Text style={styles.menuItemText}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handlePinMessage}>
              <Icon name="push-pin" size={20} color={COLORS.menuItem} />
              <Text style={styles.menuItemText}>
                {selectedMessage.isPinned ? 'Unpin' : 'Pin'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleSaveMessage}>
              <Icon name="save-alt" size={20} color={COLORS.menuItem} />
              <Text style={styles.menuItemText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteMessage}>
              <Icon name="delete-outline" size={20} color={COLORS.danger} />
              <Text style={[styles.menuItemText, { color: COLORS.danger }]}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Input Area */}
        {renderInputArea()}
      </KeyboardAvoidingView>
      
      {/* Attachment Modal */}
      <Modal
        transparent
        visible={attachmentModalVisible}
        animationType="slide"
        onRequestClose={() => setAttachmentModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAttachmentModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Share Content</Text>
              <View style={styles.modalOptions}>
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={() => selectImage('camera')}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: '#1E3A5F' }]}>
                    <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.modalOptionText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={() => selectImage('gallery')}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: '#1E3A5F' }]}>
                    <Ionicons name="image-outline" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.modalOptionText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalOption}>
                  <View style={[styles.modalOptionIcon, { backgroundColor: '#1E3A5F' }]}>
                    <Ionicons name="document-outline" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.modalOptionText}>Document</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalOption}>
                  <View style={[styles.modalOptionIcon, { backgroundColor: '#1E3A5F' }]}>
                    <Ionicons name="location-outline" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.modalOptionText}>Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* More Menu Modal */}
      <Modal
        transparent
        visible={moreMenuVisible}
        animationType="fade"
        onRequestClose={() => setMoreMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMoreMenuVisible(false)}
        >
          <View style={styles.moreMenuContainer}>
            <TouchableOpacity style={styles.moreMenuItem}>
              <Ionicons name="person-outline" size={22} color={COLORS.menuItem} />
              <Text style={styles.moreMenuItemText}>View Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreMenuItem}>
              <Ionicons name="search-outline" size={22} color={COLORS.menuItem} />
              <Text style={styles.moreMenuItemText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreMenuItem}>
              <Ionicons name="image-outline" size={22} color={COLORS.menuItem} />
              <Text style={styles.moreMenuItemText}>Wallpaper</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.moreMenuItem}>
              <Ionicons name="notifications-off-outline" size={22} color={COLORS.warning} />
              <Text style={[styles.moreMenuItemText, { color: COLORS.warning }]}>Mute</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreMenuItem}>
              <Ionicons name="alert-circle-outline" size={22} color={COLORS.danger} />
              <Text style={[styles.moreMenuItemText, { color: COLORS.danger }]}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreMenuItem}>
              <Ionicons name="ban-outline" size={22} color={COLORS.danger} />
              <Text style={[styles.moreMenuItemText, { color: COLORS.danger }]}>Block</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1,
  },
  headerBackButton: {
    padding: 8,
    marginRight: 8,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerStatus: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  
  // Chat Container
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.chatBackground,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.3,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  
  // Messages
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  messageContainerLeft: {
    alignSelf: 'flex-start',
  },
  messageContainerRight: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  profilePic: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 4,
    alignSelf: 'flex-end',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    maxWidth: '100%',
    elevation: 1,
  },
  outgoingBubble: {
    backgroundColor: COLORS.outgoingBubble,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginRight: 2,
  },
  incomingBubble: {
    backgroundColor: COLORS.incomingBubble,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 12,
    marginLeft: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  outgoingText: {
    color: COLORS.outgoingText,
  },
  incomingText: {
    color: COLORS.incomingText,
  },
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pinnedText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
  },
  outgoingTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  incomingTime: {
    color: COLORS.textTime,
  },
  
  // Attachments
  attachmentContainer: {
    marginBottom: 8,
  },
  messageImage: {
    width: 240,
    height: 160,
    borderRadius: 12,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  fileName: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  
  // Reactions
  reactionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 2,
  },
  reactionContainerLeft: {
    justifyContent: 'flex-start',
  },
  reactionContainerRight: {
    justifyContent: 'flex-end',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.reactionBg,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 10,
    color: COLORS.reactionText,
    marginLeft: 2,
  },
  
  // Input Area
  inputContainer: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  attachmentPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachmentPreviewText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  attachmentRemoveButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputIconButton: {
    padding: 8,
    marginRight: 4,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#2A3942',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginRight: 8,
    maxHeight: 100,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  textInput: {
    color: COLORS.textPrimary,
    fontSize: 16,
    maxHeight: 80,
    padding: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  emojiPicker: {
    height: 250,
    backgroundColor: COLORS.inputBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  emojiItem: {
    padding: 8,
  },
  emojiText: {
    fontSize: 28,
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalContent: {
    paddingHorizontal: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  modalOption: {
    alignItems: 'center',
    marginBottom: 24,
    width: '25%',
  },
  modalOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
  },
  
  // Reaction Picker
  reactionPicker: {
    position: 'absolute',
    backgroundColor: COLORS.menuBg,
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  reactionPickerContent: {
    flexDirection: 'row',
  },
  reactionPickerItem: {
    padding: 8,
  },
  reactionPickerEmoji: {
    fontSize: 24,
  },
  
  // Message Context Menu
  messageMenu: {
    position: 'absolute',
    backgroundColor: COLORS.menuBg,
    borderRadius: 12,
    padding: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    color: COLORS.menuItem,
    fontSize: 16,
    marginLeft: 12,
  },
  
  // More Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  moreMenuContainer: {
    backgroundColor: COLORS.menuBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  moreMenuItemText: {
    color: COLORS.menuItem,
    fontSize: 16,
    marginLeft: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
});

export default MessageScreen;
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   StatusBar,
//   Image,
//   TouchableOpacity,
//   Alert,
//   Modal,
//   Platform,
//   KeyboardAvoidingView,
//   ScrollView,
//   TextInput,
//   FlatList,
//   Dimensions,
//   Keyboard,
//   ActivityIndicator,
//   Animated,
//   PanResponder,
//   Vibration
// } from 'react-native';
// import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import Feather from 'react-native-vector-icons/Feather';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

// import API_URL from './utiliti/config';
// import * as socket from './services/socket';

// const { width, height } = Dimensions.get('window');

// // Professional WhatsApp/Telegram Style Palette
// const COLORS = {
//   // Primary Colors
//   primary: '#0084FF', // Messenger blue
//   primaryDark: '#005BB5',
//   secondary: '#25D366',
  
//   // Background Colors
//   background: '#0B141F', // Darker, more professional
//   chatBackground: '#0D1823',
//   headerBg: '#192734', // More refined header
//   inputBg: '#1A2732',
  
//   // Text Colors
//   textPrimary: '#FFFFFF',
//   textSecondary: '#8696A0',
//   textTime: '#667781',
  
//   // Message Bubbles
//   outgoingBubble: '#0084FF', // Blue for sender (YOU - RIGHT SIDE)
//   outgoingText: '#FFFFFF',
//   incomingBubble: '#2A3944', // Refined dark for receiver (OTHER - LEFT SIDE)
//   incomingText: '#E9EDEF',
  
//   // UI Elements
//   border: '#263238',
//   danger: '#FF3B30',
//   success: '#25D366',
//   warning: '#FF9500',
//   info: '#5AC8FA',
  
//   // Status
//   online: '#25D366',
//   offline: '#8696A0',
  
//   // Reactions
//   reactionBg: '#233138',
//   reactionText: '#FFFFFF',
  
//   // Menu
//   menuBg: '#233138',
//   menuItem: '#FFFFFF'
// };

// const EMOJI_REACTIONS = [
//   { emoji: '👍', label: 'Like' },
//   { emoji: '❤️', label: 'Love' },
//   { emoji: '😂', label: 'Laugh' },
//   { emoji: '😮', label: 'Wow' },
//   { emoji: '😢', label: 'Sad' },
//   { emoji: '😡', label: 'Angry' }
// ];

// const QUICK_EMOJIS = [
//   ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇'],
//   ['🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
//   ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔'],
//   ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞'],
// ];

// const MessageScreen = () => {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();
//   const { user: initialUser, otherUserId: paramOtherUserId, senderId: paramSenderId } = route.params || {};

//   // --- STATE MANAGEMENT ---
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [fetchingUser, setFetchingUser] = useState(true);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [otherUser, setOtherUser] = useState(null);
//   const [moreMenuVisible, setMoreMenuVisible] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [inputText, setInputText] = useState('');
//   const [keyboardHeight, setKeyboardHeight] = useState(0);
//   const [selectedAttachment, setSelectedAttachment] = useState(null);
//   const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
//   const [selectedMessage, setSelectedMessage] = useState(null);
//   const [messageMenuVisible, setMessageMenuVisible] = useState(false);
//   const [messageMenuPosition, setMessageMenuPosition] = useState({ x: 0, y: 0 });
//   const [showReactionPicker, setShowReactionPicker] = useState(false);
//   const [reactionPickerPosition, setReactionPickerPosition] = useState({ x: 0, y: 0 });
//   const [pinnedMessages, setPinnedMessages] = useState([]);
//   const [recording, setRecording] = useState(false);
//   const [recordingTime, setRecordingTime] = useState(0);
//   const [showDateSeparator, setShowDateSeparator] = useState(false);
//   const [searchVisible, setSearchVisible] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
  
//   const typingTimeoutRef = useRef(null);
//   const flatListRef = useRef(null);
//   const inputRef = useRef(null);
//   const reactionAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(width)).current;
//   const recordingAnim = useRef(new Animated.Value(1)).current;
//   const recordingInterval = useRef(null);

//   // --- SOCKET CONNECTION ---
//   useEffect(() => {
//     console.log('[MessageScreen] 🚀 Setting up socket listeners');
//     let isMounted = true;

//     const initializeSocket = async () => {
//       try {
//         await socket.initSocket();
//         if (!isMounted) return;

//         socket.onReceiveMessage((newMessage) => {
//           if (!isMounted) return;
//           const messageUserId = newMessage?.sender?._id || newMessage?.sender?.id;
//           const otherUserId = otherUser?._id || otherUser?.id;
          
//           if (messageUserId !== otherUserId) return;
          
//           setMessages(prev => {
//             const exists = prev.find(msg => msg._id === newMessage._id);
//             if (exists) return prev;
            
//             const formattedMessage = {
//               _id: newMessage._id,
//               text: newMessage.text,
//               createdAt: new Date(newMessage.createdAt),
//               user: {
//                 _id: newMessage.sender._id,
//                 name: newMessage.sender.name,
//                 avatar: newMessage.sender.avatar,
//               },
//               status: newMessage.status,
//               attachment: newMessage.attachment,
//               reactions: [],
//               isPinned: false,
//             };
//             return [...prev, formattedMessage];
//           });
//         });
        
//         socket.on('messageStatusUpdate', (updatedMessage) => {
//           setMessages(prev =>
//             prev.map(msg =>
//               msg._id === updatedMessage._id ? { 
//                 ...msg, 
//                 status: updatedMessage.status 
//               } : msg
//             )
//           );
//         });

//         socket.on('typing', (data) => {
//           if (data.userId === otherUser?._id) {
//             setIsTyping(true);
//           }
//         });

//         socket.on('stopTyping', (data) => {
//           if (data.userId === otherUser?._id) {
//             setIsTyping(false);
//           }
//         });

//       } catch (error) {
//         console.error('Socket error:', error);
//       }
//     };

//     initializeSocket();

//     return () => {
//       isMounted = false;
//       if (typeof socket.disconnectSocket === 'function') {
//         socket.disconnectSocket();
//       }
//     };
//   }, [otherUser?._id]);

//   // --- DATA LOADING ---
//   useEffect(() => {
//     const loadData = async () => {
//       // 1. Load Current User
//       const userInfoStr = await AsyncStorage.getItem('userInfo');
//       if (userInfoStr) {
//         const user = JSON.parse(userInfoStr);
//         setCurrentUser({
//           ...user,
//           _id: user._id || user.id
//         });
//       }

//       // 2. Load Other User
//       let targetId = paramOtherUserId || paramSenderId || (initialUser?._id || initialUser?.id);
      
//       if (initialUser && (initialUser._id || initialUser.id)) {
//         setOtherUser({
//           ...initialUser,
//           _id: initialUser._id || initialUser.id,
//           avatar: initialUser.avatar || initialUser.photoURL,
//         });
//         setFetchingUser(false);
//       } else if (targetId) {
//         try {
//           const token = await AsyncStorage.getItem('authToken');
//           const response = await fetch(`${API_URL}/api/user/profile/${targetId}`, {
//             headers: { 'Authorization': `Bearer ${token}` }
//           });
//           const data = await response.json();
//           if (data.success) {
//             setOtherUser({
//               ...data.data,
//               avatar: data.data.avatar || data.data.photoURL,
//             });
//           }
//         } catch (e) {
//           console.error(e);
//         } finally {
//           setFetchingUser(false);
//         }
//       }
//     };
//     loadData();
//   }, [initialUser, paramOtherUserId, paramSenderId]);

//   // --- LOAD MESSAGES ---
//   useEffect(() => {
//     if (!otherUser) return;
//     const loadMessages = async () => {
//       try {
//         const token = await AsyncStorage.getItem('authToken');
//         const otherId = otherUser._id || otherUser.id;
//         const response = await fetch(`${API_URL}/api/messages/${otherId}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await response.json();
//         if (data.success && data.data) {
//           const formatted = data.data.map(msg => ({
//             _id: msg._id,
//             text: msg.text,
//             createdAt: new Date(msg.createdAt),
//             user: {
//               _id: msg.sender._id || msg.sender.id,
//               name: msg.sender.name,
//               avatar: msg.sender.avatar || msg.sender.photoURL
//             },
//             status: msg.status,
//             attachment: msg.attachment,
//             reactions: msg.reactions || [],
//             isPinned: msg.isPinned || false
//           }));
//           setMessages(formatted);
//           setPinnedMessages(formatted.filter(msg => msg.isPinned));
//         }
//       } catch (e) { 
//         console.error(e); 
//       } finally { 
//         setLoading(false); 
//       }
//     };
//     loadMessages();
//   }, [otherUser]);

//   // --- KEYBOARD HANDLING ---
//   useEffect(() => {
//     const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
//       setKeyboardHeight(e.endCoordinates.height);
//       setShowEmojiPicker(false);
//     });
//     const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
//     return () => { showSub.remove(); hideSub.remove(); };
//   }, []);

//   // --- HANDLERS ---
//   const handleInputTextChanged = (text) => {
//     setInputText(text);
//     const otherId = otherUser?._id || otherUser?.id;
//     if (otherId) {
//       socket.emit('typing', { userId: otherId });
//       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//       typingTimeoutRef.current = setTimeout(() => {
//         socket.emit('stopTyping', { userId: otherId });
//       }, 3000);
//     }
//   };

//   const handleSend = async () => {
//     const otherId = otherUser?._id || otherUser?.id;
//     const currentId = currentUser?._id || currentUser?.id;
    
//     if (!otherId || !currentId || (!inputText.trim() && !selectedAttachment)) return;

//     const tempId = `temp_${Date.now()}`;
//     const newMessage = {
//       _id: tempId,
//       text: inputText.trim(),
//       createdAt: new Date(),
//       user: { 
//         _id: currentId, 
//         name: currentUser.name,
//         avatar: currentUser.avatar || currentUser.photoURL 
//       },
//       status: 'pending',
//       attachment: selectedAttachment,
//       reactions: [],
//       isPinned: false,
//     };

//     setMessages(prev => [...prev, newMessage]);
    
//     try {
//       const token = await AsyncStorage.getItem('authToken');
//       const response = await fetch(`${API_URL}/api/messages/send`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           recipientId: otherId,
//           text: inputText.trim(),
//           attachment: selectedAttachment
//         })
//       });
      
//       const data = await response.json();
//       if (data.success && data.message) {
//         // Use server ID if available, otherwise keep tempId to prevent crash
//         const serverMsgId = data.message._id || tempId;
        
//         setMessages(prev => prev.map(msg => 
//           msg._id === tempId ? { ...msg, _id: serverMsgId, status: 'sent' } : msg
//         ));
//         socket.sendMessage(otherId, inputText.trim(), selectedAttachment);
//       }
//     } catch (error) {
//       console.error('Send error:', error);
//     }
    
//     setInputText('');
//     setSelectedAttachment(null);
//     setShowEmojiPicker(false);
    
//     setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
//   };

//   const handleEmojiSelect = (emoji) => {
//     setInputText(prev => prev + emoji);
//   };

//   const handleMessageLongPress = (message, event) => {
//     Vibration.vibrate(50);
//     const { pageX, pageY } = event.nativeEvent;
//     setSelectedMessage(message);
//     setMessageMenuPosition({ x: pageX, y: pageY });
//     setMessageMenuVisible(true);
    
//     Animated.spring(slideAnim, {
//       toValue: 0,
//       useNativeDriver: true,
//       tension: 50,
//       friction: 7
//     }).start();
//   };

//   const handleMessagePress = (message, event) => {
//     if (showReactionPicker) {
//       setShowReactionPicker(false);
//       return;
//     }
    
//     // Show reaction picker on double tap
//     const { pageX, pageY } = event.nativeEvent;
//     setSelectedMessage(message);
//     setReactionPickerPosition({ x: pageX, y: pageY });
//     setShowReactionPicker(true);
    
//     Animated.spring(reactionAnim, {
//       toValue: 1,
//       useNativeDriver: true,
//       tension: 50,
//       friction: 7
//     }).start();
    
//     setTimeout(() => {
//       Animated.spring(reactionAnim, {
//         toValue: 0,
//         useNativeDriver: true,
//         tension: 50,
//         friction: 7
//       }).start(() => setShowReactionPicker(false));
//     }, 2000);
//   };

//   const handleReactionSelect = (reaction) => {
//     if (!selectedMessage) return;
    
//     setMessages(prev => prev.map(msg => 
//       msg._id === selectedMessage._id 
//         ? { 
//             ...msg, 
//             reactions: [...(msg.reactions || []), { 
//               emoji: reaction.emoji, 
//               userId: currentUser._id,
//               userName: currentUser.name 
//             }] 
//           }
//         : msg
//     ));
    
//     setShowReactionPicker(false);
//   };

//   const handleDeleteMessage = () => {
//     Alert.alert(
//       'Delete Message',
//       'Are you sure you want to delete this message?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Delete', 
//           style: 'destructive',
//           onPress: () => {
//             setMessages(prev => prev.filter(msg => msg._id !== selectedMessage._id));
//             setMessageMenuVisible(false);
//             // Call API to delete message from server
//           }
//         }
//       ]
//     );
//   };

//   const handlePinMessage = () => {
//     setMessages(prev => prev.map(msg => 
//       msg._id === selectedMessage._id 
//         ? { ...msg, isPinned: !msg.isPinned }
//         : msg
//     ));
//     setMessageMenuVisible(false);
//   };

//   const handleSaveMessage = () => {
//     Alert.alert('Message Saved', 'Message has been saved to your device.');
//     setMessageMenuVisible(false);
//   };

//   const handleReplyMessage = () => {
//     setInputText(`Replying to ${selectedMessage.user.name}: ${selectedMessage.text}`);
//     setMessageMenuVisible(false);
//     inputRef.current?.focus();
//   };

//   const selectImage = (type) => {
//     const options = { 
//       mediaType: 'photo', 
//       quality: 0.8,
//       maxWidth: 1080,
//       maxHeight: 1080,
//     };
//     const callback = (res) => {
//       if (res.assets?.[0]) {
//         setSelectedAttachment({ 
//           type: 'image', 
//           uri: res.assets[0].uri, 
//           name: res.assets[0].fileName,
//           size: res.assets[0].fileSize
//         });
//         setAttachmentModalVisible(false);
//       }
//     };
//     type === 'camera' 
//       ? launchCamera(options, callback) 
//       : launchImageLibrary(options, callback);
//   };

//   const handleRecordStart = () => {
//     setRecording(true);
//     setRecordingTime(0);
//     Vibration.vibrate(100);
    
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(recordingAnim, {
//           toValue: 0.8,
//           duration: 800,
//           useNativeDriver: true
//         }),
//         Animated.timing(recordingAnim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true
//         })
//       ])
//     ).start();
    
//     recordingInterval.current = setInterval(() => {
//       setRecordingTime(prev => prev + 1);
//     }, 1000);
//   };

//   const handleRecordEnd = () => {
//     setRecording(false);
//     clearInterval(recordingInterval.current);
//     recordingAnim.setValue(1);
    
//     // Here you would handle the recorded audio
//     Alert.alert('Voice Message', `Recording stopped after ${recordingTime} seconds`);
//   };

//   // --- RENDER HELPERS ---
//   const renderTicks = (status, isOutgoing) => {
//     if (!isOutgoing) return null;
    
//     if (status === 'pending') 
//       return <Icon name="access-time" size={14} color="rgba(255,255,255,0.7)" style={{marginLeft: 4}} />;
//     if (status === 'sent') 
//       return <Icon name="check" size={14} color="rgba(255,255,255,0.7)" style={{marginLeft: 4}} />;
//     if (status === 'delivered') 
//       return <Icon name="done-all" size={14} color="rgba(255,255,255,0.7)" style={{marginLeft: 4}} />;
//     if (status === 'read') 
//       return <Icon name="done-all" size={14} color="#34B7F1" style={{marginLeft: 4}} />;
    
//     return <Icon name="check" size={14} color="rgba(255,255,255,0.7)" style={{marginLeft: 4}} />;
//   };

//   const renderReactions = (message) => {
//     if (!message.reactions || message.reactions.length === 0) return null;
    
//     const reactions = message.reactions.reduce((acc, reaction) => {
//       if (!acc[reaction.emoji]) {
//         acc[reaction.emoji] = 1;
//       } else {
//         acc[reaction.emoji]++;
//       }
//       return acc;
//     }, {});
    
//     return (
//       <View style={[
//         styles.reactionContainer,
//         message.user._id === currentUser?._id ? styles.reactionContainerRight : styles.reactionContainerLeft
//       ]}>
//         {Object.entries(reactions).map(([emoji, count], index) => (
//           <View key={index} style={styles.reactionBadge}>
//             <Text style={styles.reactionEmoji}>{emoji}</Text>
//             {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
//           </View>
//         ))}
//       </View>
//     );
//   };

//   const renderDateSeparator = (date) => {
//     return (
//       <View style={styles.dateSeparatorContainer}>
//         <View style={styles.dateSeparatorLine} />
//         <Text style={styles.dateSeparatorText}>{date}</Text>
//         <View style={styles.dateSeparatorLine} />
//       </View>
//     );
//   };

//   const renderMessage = ({ item, index }) => {
//     const isOutgoing = item.user._id === currentUser?._id;
    
//     // Check if we need to show date separator
//     const showDate = index === 0 || 
//       new Date(item.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();
    
//     return (
//       <View>
//         {showDate && renderDateSeparator(new Date(item.createdAt).toLocaleDateString())}
//         <TouchableOpacity
//           activeOpacity={0.9}
//           onPress={(e) => handleMessagePress(item, e)}
//           onLongPress={(e) => handleMessageLongPress(item, e)}
//           delayLongPress={500}
//         >
//           <View style={[
//             styles.messageContainer,
//             isOutgoing ? styles.messageContainerRight : styles.messageContainerLeft
//           ]}>
            
//             {/* Profile picture - Only for incoming messages */}
//             {!isOutgoing && (
//               <Image 
//                 source={{ 
//                   uri: item.user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' 
//                 }}
//                 style={styles.profilePic}
//               />
//             )}
            
//             <View style={[
//               styles.messageBubble,
//               isOutgoing ? styles.outgoingBubble : styles.incomingBubble
//             ]}>
//               {/* Pinned indicator */}
//               {item.isPinned && (
//                 <View style={styles.pinnedIndicator}>
//                   <Icon name="push-pin" size={12} color={COLORS.textSecondary} />
//                   <Text style={styles.pinnedText}>Pinned</Text>
//                 </View>
//               )}
              
//               {/* Attachment */}
//               {item.attachment && (
//                 <View style={styles.attachmentContainer}>
//                   {item.attachment.type === 'image' ? (
//                     <Image 
//                       source={{ uri: item.attachment.uri }} 
//                       style={styles.messageImage}
//                       resizeMode="cover"
//                     />
//                   ) : (
//                     <View style={styles.fileAttachment}>
//                       <MaterialCommunityIcons 
//                         name="file-document-outline" 
//                         size={30} 
//                         color={isOutgoing ? COLORS.outgoingText : COLORS.incomingText} 
//                       />
//                       <Text style={[
//                         styles.fileName,
//                         { color: isOutgoing ? COLORS.outgoingText : COLORS.incomingText }
//                       ]}>
//                         {item.attachment.name || 'Document'}
//                       </Text>
//                     </View>
//                   )}
//                 </View>
//               )}
              
//               {/* Message text */}
//               {item.text ? (
//                 <Text style={[
//                   styles.messageText,
//                   isOutgoing ? styles.outgoingText : styles.incomingText
//                 ]}>
//                   {item.text}
//                 </Text>
//               ) : null}
              
//               {/* Reactions */}
//               {renderReactions(item)}
              
//               {/* Time and status */}
//               <View style={styles.messageFooter}>
//                 <Text style={[
//                   styles.timeText,
//                   isOutgoing ? styles.outgoingTime : styles.incomingTime
//                 ]}>
//                   {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                 </Text>
//                 {isOutgoing && renderTicks(item.status, isOutgoing)}
//               </View>
//             </View>
//           </View>
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   const renderInputArea = () => (
//     <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
//       {/* Attachment preview */}
//       {selectedAttachment && (
//         <View style={styles.attachmentPreview}>
//           <View style={styles.attachmentPreviewContent}>
//             <MaterialCommunityIcons name="image" size={20} color={COLORS.primary} />
//             <Text style={styles.attachmentPreviewText} numberOfLines={1}>
//               {selectedAttachment.name || 'Image'}
//             </Text>
//           </View>
//           <TouchableOpacity 
//             onPress={() => setSelectedAttachment(null)}
//             style={styles.attachmentRemoveButton}
//           >
//             <Icon name="close" size={18} color={COLORS.textSecondary} />
//           </TouchableOpacity>
//         </View>
//       )}
      
//       <View style={styles.inputRow}>
//         {/* Emoji button */}
//         <TouchableOpacity 
//           onPress={() => setShowEmojiPicker(!showEmojiPicker)}
//           style={styles.inputIconButton}
//         >
//           <Ionicons 
//             name={showEmojiPicker ? "close-circle" : "happy-outline"} 
//             size={24} 
//             color={COLORS.textSecondary} 
//           />
//         </TouchableOpacity>
        
//         {/* Text input */}
//         <View style={styles.textInputContainer}>
//           <TextInput
//             ref={inputRef}
//             style={styles.textInput}
//             value={inputText}
//             onChangeText={handleInputTextChanged}
//             placeholder="Type a message..."
//             placeholderTextColor={COLORS.textSecondary}
//             multiline
//             maxLength={500}
//           />
//         </View>
        
//         {/* Attachment button */}
//         <TouchableOpacity 
//           onPress={() => setAttachmentModalVisible(true)}
//           style={styles.inputIconButton}
//         >
//           <Ionicons name="attach-outline" size={24} color={COLORS.textSecondary} />
//         </TouchableOpacity>
        
//         {/* Camera button */}
//         <TouchableOpacity 
//           onPress={() => selectImage('camera')}
//           style={styles.inputIconButton}
//         >
//           <Ionicons name="camera-outline" size={24} color={COLORS.textSecondary} />
//         </TouchableOpacity>
        
//         {/* Send/Mic button */}
//         <TouchableOpacity 
//           style={[
//             styles.sendButton,
//             (!inputText.trim() && !selectedAttachment) && styles.micButton
//           ]}
//           onPress={inputText.trim() || selectedAttachment ? handleSend : null}
//           onLongPress={!inputText.trim() && !selectedAttachment ? handleRecordStart : null}
//           onPressOut={recording ? handleRecordEnd : null}
//           disabled={!inputText.trim() && !selectedAttachment && !recording}
//         >
//           {recording ? (
//             <Animated.View style={{ transform: [{ scale: recordingAnim }] }}>
//               <Ionicons name="mic" size={20} color={COLORS.danger} />
//             </Animated.View>
//           ) : inputText.trim() || selectedAttachment ? (
//             <Ionicons name="send" size={20} color={COLORS.textPrimary} />
//           ) : (
//             <Ionicons name="mic-outline" size={20} color={COLORS.textPrimary} />
//           )}
//         </TouchableOpacity>
//       </View>
      
//       {/* Recording indicator */}
//       {recording && (
//         <View style={styles.recordingIndicator}>
//           <View style={styles.recordingDot} />
//           <Text style={styles.recordingText}>Recording {recordingTime}s</Text>
//           <Text style={styles.recordingHint}>Slide to cancel</Text>
//         </View>
//       )}
      
//       {/* Emoji picker */}
//       {showEmojiPicker && (
//         <Animated.View style={[
//           styles.emojiPicker,
//           { 
//             transform: [{ 
//               translateY: showEmojiPicker ? 
//                 keyboardHeight > 0 ? -keyboardHeight : 0 : 250 
//             }] 
//           }
//         ]}>
//           <ScrollView contentContainerStyle={styles.emojiGrid}>
//             {QUICK_EMOJIS.flat().map((emoji, index) => (
//               <TouchableOpacity
//                 key={index}
//                 style={styles.emojiItem}
//                 onPress={() => handleEmojiSelect(emoji)}
//               >
//                 <Text style={styles.emojiText}>{emoji}</Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </Animated.View>
//       )}
//     </View>
//   );

//   if (fetchingUser || !otherUser) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity 
//           style={styles.headerBackButton}
//           onPress={() => navigation.goBack()}
//         >
//           <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={styles.headerUserInfo}
//           onPress={() => setMoreMenuVisible(true)}
//         >
//           <View style={styles.avatarContainer}>
//             <Image 
//               source={{ uri: otherUser.avatar || 'https://via.placeholder.com/150' }}
//               style={styles.headerAvatar}
//             />
//             <View style={[
//               styles.onlineIndicator,
//               { backgroundColor: otherUser.isOnline ? COLORS.online : 'transparent' }
//             ]} />
//           </View>
//           <View style={styles.headerTextContainer}>
//             <Text style={styles.headerName}>{otherUser.name}</Text>
//             <Text style={styles.headerStatus}>
//               {isTyping ? 'Typing...' : otherUser.isOnline ? 'Online' : 'Offline'}
//             </Text>
//           </View>
//         </TouchableOpacity>
        
//         <View style={styles.headerActions}>
//           <TouchableOpacity style={styles.headerActionButton}>
//             <Ionicons name="videocam-outline" size={24} color={COLORS.textPrimary} />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.headerActionButton}>
//             <Ionicons name="call-outline" size={22} color={COLORS.textPrimary} />
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.headerActionButton}
//             onPress={() => setSearchVisible(!searchVisible)}
//           >
//             <Ionicons name="search-outline" size={20} color={COLORS.textPrimary} />
//           </TouchableOpacity>
//         </View>
//       </View>
      
//       {/* Search Bar */}
//       {searchVisible && (
//         <View style={styles.searchBar}>
//           <View style={styles.searchInputContainer}>
//             <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Search in conversation"
//               placeholderTextColor={COLORS.textSecondary}
//               value={searchQuery}
//               onChangeText={setSearchQuery}
//             />
//             <TouchableOpacity onPress={() => setSearchVisible(false)}>
//               <Icon name="close" size={20} color={COLORS.textSecondary} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
      
//       {/* Chat messages */}
//       <KeyboardAvoidingView 
//         style={styles.chatContainer}
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
//       >
//         <FlatList
//           ref={flatListRef}
//           data={messages}
//           renderItem={renderMessage}
//           keyExtractor={item => (item._id ? item._id.toString() : `temp_${Math.random()}`)}
//           contentContainerStyle={styles.messagesList}
//           showsVerticalScrollIndicator={false}
//           onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
//           ListEmptyComponent={
//             <View style={styles.emptyContainer}>
//               <Ionicons name="chatbubbles-outline" size={60} color={COLORS.textSecondary} />
//               <Text style={styles.emptyText}>No messages yet</Text>
//               <Text style={styles.emptySubtext}>Send your first message</Text>
//             </View>
//           }
//         />
        
//         {/* Reaction Picker */}
//         {showReactionPicker && selectedMessage && (
//           <Animated.View 
//             style={[
//               styles.reactionPicker,
//               {
//                 left: reactionPickerPosition.x - 100,
//                 top: reactionPickerPosition.y - 80,
//                 opacity: reactionAnim,
//                 transform: [
//                   { scale: reactionAnim.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [0.5, 1]
//                   })}
//                 ]
//               }
//             ]}
//           >
//             <View style={styles.reactionPickerContent}>
//               {EMOJI_REACTIONS.map((reaction, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   style={styles.reactionPickerItem}
//                   onPress={() => handleReactionSelect(reaction)}
//                 >
//                   <Text style={styles.reactionPickerEmoji}>{reaction.emoji}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </Animated.View>
//         )}
        
//         {/* Message Context Menu */}
//         {messageMenuVisible && selectedMessage && (
//           <Animated.View 
//             style={[
//               styles.messageMenu,
//               {
//                 left: messageMenuPosition.x - 150,
//                 top: messageMenuPosition.y - 100,
//                 transform: [{ translateX: slideAnim }]
//               }
//             ]}
//           >
//             <TouchableOpacity style={styles.menuItem} onPress={handleReplyMessage}>
//               <Icon name="reply" size={20} color={COLORS.menuItem} />
//               <Text style={styles.menuItemText}>Reply</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.menuItem} onPress={handlePinMessage}>
//               <Icon name="push-pin" size={20} color={COLORS.menuItem} />
//               <Text style={styles.menuItemText}>
//                 {selectedMessage.isPinned ? 'Unpin' : 'Pin'}
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.menuItem} onPress={handleSaveMessage}>
//               <Icon name="save-alt" size={20} color={COLORS.menuItem} />
//               <Text style={styles.menuItemText}>Save</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.menuItem} onPress={handleDeleteMessage}>
//               <Icon name="delete-outline" size={20} color={COLORS.danger} />
//               <Text style={[styles.menuItemText, { color: COLORS.danger }]}>Delete</Text>
//             </TouchableOpacity>
//           </Animated.View>
//         )}
        
//         {/* Input Area */}
//         {renderInputArea()}
//       </KeyboardAvoidingView>
      
//       {/* Attachment Modal */}
//       <Modal
//         transparent
//         visible={attachmentModalVisible}
//         animationType="slide"
//         onRequestClose={() => setAttachmentModalVisible(false)}
//       >
//         <TouchableOpacity 
//           style={styles.modalOverlay}
//           activeOpacity={1}
//           onPress={() => setAttachmentModalVisible(false)}
//         >
//           <View style={styles.modalContainer}>
//             <View style={styles.modalContent}>
//               <Text style={styles.modalTitle}>Share Content</Text>
//               <View style={styles.modalOptions}>
//                 <TouchableOpacity 
//                   style={styles.modalOption}
//                   onPress={() => selectImage('camera')}
//                 >
//                   <View style={[styles.modalOptionIcon, { backgroundColor: '#1E3A5F' }]}>
//                     <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
//                   </View>
//                   <Text style={styles.modalOptionText}>Camera</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity 
//                   style={styles.modalOption}
//                   onPress={() => selectImage('gallery')}
//                 >
//                   <View style={[styles.modalOptionIcon, { backgroundColor: '#1E3A5F' }]}>
//                     <Ionicons name="image-outline" size={28} color={COLORS.primary} />
//                   </View>
//                   <Text style={styles.modalOptionText}>Gallery</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.modalOption}>
//                   <View style={[styles.modalOptionIcon, { backgroundColor: '#1E3A5F' }]}>
//                     <Ionicons name="document-outline" size={28} color={COLORS.primary} />
//                   </View>
//                   <Text style={styles.modalOptionText}>Document</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.modalOption}>
//                   <View style={[styles.modalOptionIcon, { backgroundColor: '#1E3A5F' }]}>
//                     <Ionicons name="location-outline" size={28} color={COLORS.primary} />
//                   </View>
//                   <Text style={styles.modalOptionText}>Location</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </TouchableOpacity>
//       </Modal>
      
//       {/* More Menu Modal */}
//       <Modal
//         transparent
//         visible={moreMenuVisible}
//         animationType="fade"
//         onRequestClose={() => setMoreMenuVisible(false)}
//       >
//         <TouchableOpacity 
//           style={styles.menuOverlay}
//           activeOpacity={1}
//           onPress={() => setMoreMenuVisible(false)}
//         >
//           <View style={styles.moreMenuContainer}>
//             <TouchableOpacity style={styles.moreMenuItem}>
//               <Ionicons name="person-outline" size={22} color={COLORS.menuItem} />
//               <Text style={styles.moreMenuItemText}>View Contact</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.moreMenuItem}>
//               <Ionicons name="search-outline" size={22} color={COLORS.menuItem} />
//               <Text style={styles.moreMenuItemText}>Search</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.moreMenuItem}>
//               <Ionicons name="image-outline" size={22} color={COLORS.menuItem} />
//               <Text style={styles.moreMenuItemText}>Wallpaper</Text>
//             </TouchableOpacity>
//             <View style={styles.menuDivider} />
//             <TouchableOpacity style={styles.moreMenuItem}>
//               <Ionicons name="notifications-off-outline" size={22} color={COLORS.warning} />
//               <Text style={[styles.moreMenuItemText, { color: COLORS.warning }]}>Mute</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.moreMenuItem}>
//               <Ionicons name="alert-circle-outline" size={22} color={COLORS.danger} />
//               <Text style={[styles.moreMenuItemText, { color: COLORS.danger }]}>Report</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.moreMenuItem}>
//               <Ionicons name="ban-outline" size={22} color={COLORS.danger} />
//               <Text style={[styles.moreMenuItemText, { color: COLORS.danger }]}>Block</Text>
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: COLORS.background,
//   },
  
//   // Header
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.headerBg,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderBottomWidth: 0.5,
//     borderBottomColor: COLORS.border,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   headerBackButton: {
//     padding: 8,
//     marginRight: 8,
//   },
//   headerUserInfo: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginRight: 12,
//   },
//   headerAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     width: 14,
//     height: 14,
//     borderRadius: 7,
//     borderWidth: 2,
//     borderColor: COLORS.headerBg,
//   },
//   headerTextContainer: {
//     flex: 1,
//   },
//   headerName: {
//     fontSize: 17,
//     fontWeight: '600',
//     color: COLORS.textPrimary,
//     marginBottom: 2,
//   },
//   headerStatus: {
//     fontSize: 13,
//     color: COLORS.textSecondary,
//     fontStyle: 'italic',
//   },
//   headerActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   headerActionButton: {
//     padding: 8,
//     marginLeft: 4,
//   },
  
//   // Search Bar
//   searchBar: {
//     backgroundColor: COLORS.headerBg,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderBottomWidth: 0.5,
//     borderBottomColor: COLORS.border,
//   },
//   searchInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.inputBg,
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     color: COLORS.textPrimary,
//     fontSize: 16,
//   },
  
//   // Chat Container
//   chatContainer: {
//     flex: 1,
//     backgroundColor: COLORS.chatBackground,
//   },
//   messagesList: {
//     paddingHorizontal: 12,
//     paddingVertical: 16,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: height * 0.3,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: COLORS.textSecondary,
//     marginTop: 12,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: COLORS.textSecondary,
//     marginTop: 4,
//   },
  
//   // Date Separator
//   dateSeparatorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 12,
//   },
//   dateSeparatorLine: {
//     flex: 1,
//     height: 0.5,
//     backgroundColor: COLORS.border,
//   },
//   dateSeparatorText: {
//     color: COLORS.textSecondary,
//     fontSize: 12,
//     paddingHorizontal: 12,
//     fontWeight: '500',
//   },
  
//   // Messages
//   messageContainer: {
//     flexDirection: 'row',
//     marginVertical: 4,
//     maxWidth: '85%',
//   },
//   messageContainerLeft: {
//     alignSelf: 'flex-start',
//   },
//   messageContainerRight: {
//     alignSelf: 'flex-end',
//     flexDirection: 'row-reverse',
//   },
//   profilePic: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     marginHorizontal: 8,
//     alignSelf: 'flex-end',
//     marginBottom: 4,
//   },
//   messageBubble: {
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 20,
//     minWidth: 80,
//     maxWidth: '100%',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   outgoingBubble: {
//     backgroundColor: COLORS.outgoingBubble,
//     borderTopRightRadius: 4,
//   },
//   incomingBubble: {
//     backgroundColor: COLORS.incomingBubble,
//     borderTopLeftRadius: 4,
//   },
//   messageText: {
//     fontSize: 16,
//     lineHeight: 22,
//   },
//   outgoingText: {
//     color: COLORS.outgoingText,
//   },
//   incomingText: {
//     color: COLORS.incomingText,
//   },
//   pinnedIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   pinnedText: {
//     fontSize: 11,
//     color: COLORS.textSecondary,
//     marginLeft: 4,
//   },
//   messageFooter: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-end',
//     marginTop: 4,
//   },
//   timeText: {
//     fontSize: 11,
//   },
//   outgoingTime: {
//     color: 'rgba(255,255,255,0.7)',
//   },
//   incomingTime: {
//     color: COLORS.textTime,
//   },
  
//   // Attachments
//   attachmentContainer: {
//     marginBottom: 8,
//   },
//   messageImage: {
//     width: 240,
//     height: 160,
//     borderRadius: 12,
//   },
//   fileAttachment: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     backgroundColor: 'rgba(255,255,255,0.1)',
//     borderRadius: 12,
//   },
//   fileName: {
//     fontSize: 14,
//     marginLeft: 12,
//     flex: 1,
//   },
  
//   // Reactions
//   reactionContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginTop: 6,
//     marginBottom: 2,
//   },
//   reactionContainerLeft: {
//     justifyContent: 'flex-start',
//   },
//   reactionContainerRight: {
//     justifyContent: 'flex-end',
//   },
//   reactionBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.reactionBg,
//     borderRadius: 12,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     marginRight: 4,
//     marginBottom: 4,
//   },
//   reactionEmoji: {
//     fontSize: 14,
//   },
//   reactionCount: {
//     fontSize: 10,
//     color: COLORS.reactionText,
//     marginLeft: 2,
//   },
  
//   // Input Area
//   inputContainer: {
//     backgroundColor: COLORS.inputBg,
//     paddingHorizontal: 12,
//     paddingTop: 12,
//     borderTopWidth: 0.5,
//     borderTopColor: COLORS.border,
//   },
//   attachmentPreview: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: 'rgba(255,255,255,0.1)',
//     borderRadius: 12,
//     padding: 8,
//     marginBottom: 8,
//   },
//   attachmentPreviewContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   attachmentPreviewText: {
//     color: COLORS.textPrimary,
//     fontSize: 14,
//     marginLeft: 8,
//     flex: 1,
//   },
//   attachmentRemoveButton: {
//     padding: 4,
//   },
//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//   },
//   inputIconButton: {
//     padding: 8,
//     marginRight: 4,
//   },
//   textInputContainer: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//     borderRadius: 24,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     marginRight: 8,
//     maxHeight: 100,
//   },
//   textInput: {
//     color: COLORS.textPrimary,
//     fontSize: 16,
//     maxHeight: 80,
//   },
//   sendButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: COLORS.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   micButton: {
//     backgroundColor: 'transparent',
//     borderWidth: 1,
//     borderColor: COLORS.textSecondary,
//   },
//   recordingIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//   },
//   recordingDot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: COLORS.danger,
//     marginRight: 8,
//   },
//   recordingText: {
//     color: COLORS.textPrimary,
//     fontSize: 14,
//     fontWeight: '500',
//     flex: 1,
//   },
//   recordingHint: {
//     color: COLORS.textSecondary,
//     fontSize: 12,
//     fontStyle: 'italic',
//   },
//   emojiPicker: {
//     height: 250,
//     backgroundColor: COLORS.inputBg,
//     borderTopWidth: 0.5,
//     borderTopColor: COLORS.border,
//   },
//   emojiGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     padding: 12,
//   },
//   emojiItem: {
//     padding: 8,
//   },
//   emojiText: {
//     fontSize: 28,
//   },
  
//   // Modals
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalContainer: {
//     backgroundColor: 'rgba(255,255,255,0.95)',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     paddingTop: 24,
//     paddingBottom: 40,
//   },
//   modalContent: {
//     paddingHorizontal: 24,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#000',
//     marginBottom: 24,
//     textAlign: 'center',
//   },
//   modalOptions: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     flexWrap: 'wrap',
//   },
//   modalOption: {
//     alignItems: 'center',
//     marginBottom: 24,
//     width: '25%',
//   },
//   modalOptionIcon: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   modalOptionText: {
//     fontSize: 14,
//     color: '#000',
//     textAlign: 'center',
//   },
  
//   // Reaction Picker
//   reactionPicker: {
//     position: 'absolute',
//     backgroundColor: COLORS.menuBg,
//     borderRadius: 24,
//     padding: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 8,
//     elevation: 10,
//   },
//   reactionPickerContent: {
//     flexDirection: 'row',
//   },
//   reactionPickerItem: {
//     padding: 8,
//   },
//   reactionPickerEmoji: {
//     fontSize: 24,
//   },
  
//   // Message Context Menu
//   messageMenu: {
//     position: 'absolute',
//     backgroundColor: COLORS.menuBg,
//     borderRadius: 12,
//     padding: 8,
//     minWidth: 160,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 8,
//     elevation: 10,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//   },
//   menuItemText: {
//     color: COLORS.menuItem,
//     fontSize: 16,
//     marginLeft: 12,
//   },
  
//   // More Menu
//   menuOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'flex-end',
//   },
//   moreMenuContainer: {
//     backgroundColor: COLORS.menuBg,
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     paddingVertical: 16,
//     paddingHorizontal: 24,
//     marginBottom: 40,
//   },
//   moreMenuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//   },
//   moreMenuItemText: {
//     color: COLORS.menuItem,
//     fontSize: 16,
//     marginLeft: 16,
//   },
//   menuDivider: {
//     height: 0.5,
//     backgroundColor: COLORS.border,
//     marginVertical: 8,
//   },
// });

// export default MessageScreen;