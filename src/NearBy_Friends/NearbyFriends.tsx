import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../styles/theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../utiliti/config';

export default function NearbyFriends() {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNearbyUsers();
  }, []);

  const fetchNearbyUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // --- MOCKED LOCATION DATA ---
      // Replace these with actual location data from a geolocation library
      const latitude = 12.9716; // Example: Bangalore
      const longitude = 77.5946; // Example: Bangalore
      // --------------------------

      const response = await fetch(`${API_URL}/api/user/nearby?latitude=${latitude}&longitude=${longitude}`, {
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
      setUsers(data);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderNearbyUser = (user: any) => (
    <View key={user._id} style={styles.nearbyUserItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {user.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </LinearGradient>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{`${(user.distance / 1000).toFixed(1)} km`}</Text>
          </View>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userDistance}>{`${(user.distance / 1000).toFixed(1)} km`} away</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.addButton}>
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
            <View style={styles.headerTitle}>
              <Icon name="location-on" size={20} color={theme.accentColor} />
              <Text style={styles.headerTitleText}>Nearby Friends</Text>
            </View>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.content}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitle}>
                  <Icon name="people" size={18} color={theme.accentColor} style={styles.sectionTitleIcon} />
                  <Text style={styles.sectionTitleText}>People Nearby</Text>
                </View>
                <TouchableOpacity style={styles.refreshButton} onPress={fetchNearbyUsers}>
                  <Icon name="refresh" size={18} color={theme.accentColor} />
                </TouchableOpacity>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color={theme.accentColor} />
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <ScrollView style={styles.nearbyList}>
                  {users.map(renderNearbyUser)}
                </ScrollView>
              )}

              <View style={styles.footerInfo}>
                <Icon name="info" size={16} color={theme.textSecondary} />
                <Text style={styles.footerText}>
                  Showing people near your location.
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
  headerRight: {
    width: 40,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    padding: 16,
    flex: 1,
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
  avatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: theme.accentColor,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  distanceText: {
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
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  }
});