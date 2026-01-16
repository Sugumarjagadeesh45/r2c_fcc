import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  TextInput, 
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../utiliti/config';

const { width } = Dimensions.get('window');

export default function Admin({ navigation }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [notificationType, setNotificationType] = useState('broadcast'); // 'broadcast' or 'direct'
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message');
      return;
    }

    if (notificationType === 'direct' && !userId.trim()) {
      Alert.alert('Error', 'Please enter a User ID for direct notification');
      return;
    }
    
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const endpoint = notificationType === 'broadcast' ? '/api/admin/broadcast' : '/api/admin/notify';
      const body = notificationType === 'broadcast' 
        ? { title: subject, body: message }
        : { userId, title: subject, body: message };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to send notification');
      }

      Alert.alert(
        'Success', 
        `Notification sent successfully!`,
        [{ text: 'OK', onPress: () => {
          setSubject('');
          setMessage('');
          setUserId('');
        }}]
      );

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.content}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitleText}>Send Notification</Text>
                </View>

                <View style={styles.toggleContainer}>
                  <TouchableOpacity 
                    style={[styles.toggleButton, notificationType === 'broadcast' && styles.activeToggleButton]}
                    onPress={() => setNotificationType('broadcast')}
                  >
                    <Text style={styles.toggleButtonText}>Broadcast</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toggleButton, notificationType === 'direct' && styles.activeToggleButton]}
                    onPress={() => setNotificationType('direct')}
                  >
                    <Text style={styles.toggleButtonText}>Direct</Text>
                  </TouchableOpacity>
                </View>

                {notificationType === 'direct' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>User ID</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter User ID"
                      placeholderTextColor={theme.textSecondary}
                      value={userId}
                      onChangeText={setUserId}
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Subject</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter message subject..."
                    placeholderTextColor={theme.textSecondary}
                    value={subject}
                    onChangeText={setSubject}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Message</Text>
                  <TextInput
                    style={[styles.input, styles.messageInput]}
                    placeholder="Type your message here..."
                    placeholderTextColor={theme.textSecondary}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                  />
                </View>

                <TouchableOpacity 
                  style={[
                    styles.sendButton,
                    loading && styles.sendButtonDisabled
                  ]}
                  onPress={handleSend}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send Notification</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(18, 24, 38, 0.95)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  sectionContainer: {
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 5,
  },
  activeToggleButton: {
    backgroundColor: theme.accentColor,
  },
  toggleButtonText: {
    color: theme.textPrimary,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    color: theme.textPrimary,
    fontSize: 16,
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: theme.accentColor,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.textSecondary,
  },
  sendButtonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
