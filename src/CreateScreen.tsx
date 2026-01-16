import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  TouchableOpacity, 
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCameraDevices } from 'react-native-vision-camera';
import { theme } from '../styles/theme';

const createOptions = [
  { id: '1', title: 'Camera', description: 'Record a new video', icon: 'camera-alt' },
  { id: '2', title: 'Upload', description: 'From your gallery', icon: 'upload-file' },
  { id: '3', title: 'AI Generate', description: 'Create with AI', icon: 'smart-toy' },
  { id: '4', title: 'Templates', description: 'Use a template', icon: 'dashboard' },
];

const templates = [
  { id: '1', name: 'NEW', image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  { id: '2', name: 'TRENDING', image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  { id: '3', name: 'POPULAR', image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  { id: '4', name: 'Sports Car', image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  { id: '5', name: 'Nature', image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  { id: '6', name: 'NEW', image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  { id: '7', name: 'Fashion', image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  { id: '8', name: 'Food', image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  { id: '9', name: 'Home', image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
];

const CreateScreen = ({ navigation }) => {
  const devices = useCameraDevices();
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    if (devices && devices.length > 0) {
      setIsCameraReady(true);
    }
  }, [devices]);

  const renderCreateOption = ({ item }) => (
    <TouchableOpacity 
      style={[styles.createOption, item.title === 'Camera' && !isCameraReady ? styles.disabledOption : {}]}
    onPress={() => {
  if (item.title === 'Camera') {
    if (isCameraReady && devices) {
      setTimeout(() => navigation.navigate('Camera', { devices }), 100);
    } else {
      alert('Camera is still initializing. Please try again in a moment.');
    }
  } else {
    navigation.navigate(item.title);
  }
}}
      disabled={item.title === 'Camera' && !isCameraReady}
    >
      <Icon name={item.icon} size={40} color={theme.accentColor} style={styles.createOptionIcon} />
      <Text style={styles.createOptionTitle}>{item.title}</Text>
      <Text style={styles.createOptionDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderTemplate = ({ item }) => (
    <TouchableOpacity style={styles.templateItem}>
      <Image source={{ uri: item.image }} style={styles.templateImage} />
      <View style={styles.templateBadge}>
        <Text style={styles.templateBadgeText}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
        <View style={styles.containerInner}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="add-circle" size={22} color={theme.accentColor} />
              <Text style={styles.logo}>REELS2CHAT</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerIcon}>
                <Icon name="search" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIcon}>
                <Icon name="mail" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.sectionTitle}>
              <Icon name="add-circle" size={18} color={theme.accentColor} style={styles.sectionTitleIcon} />
              <Text style={styles.sectionTitleText}>Create Amazing Content</Text>
            </View>
            <Text style={styles.sectionDescription}>Choose how you want to create your next reel</Text>
            <FlatList
              data={createOptions}
              renderItem={renderCreateOption}
              keyExtractor={(item) => item.id}
              numColumns={2}
              style={styles.createOptions}
            />
            <View style={styles.sectionTitle}>
              <Icon name="auto-awesome" size={18} color={theme.accentColor} style={styles.sectionTitleIcon} />
              <Text style={styles.sectionTitleText}>AI Templates</Text>
            </View>
            <FlatList
              data={templates}
              renderItem={renderTemplate}
              keyExtractor={(item) => item.id}
              numColumns={3}
              style={styles.templateGrid}
            />
          </View>
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
    padding: 15,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitleIcon: {
    marginRight: 8,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  createOptions: {
    marginBottom: 20,
  },
  createOption: {
    flex: 1,
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 15,
    padding: 20,
    margin: 7.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledOption: {
    opacity: 0.5,
  },
  createOptionIcon: {
    marginBottom: 10,
  },
  createOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 5,
  },
  createOptionDescription: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  templateGrid: {
    marginTop: 15,
  },
  templateItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    margin: 5,
  },
  templateImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  templateBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: theme.accentColor,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  templateBadgeText: {
    fontSize: 10,
    color: theme.textPrimary,
  },
});

export default CreateScreen;