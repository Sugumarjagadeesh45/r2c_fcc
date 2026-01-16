import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../styles/theme';

const UploadScreen = ({ navigation }) => {
  const handleUpload = () => {
    const options = {
      mediaType: 'video',
      quality: 1,
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const videoUri = response.assets?.[0]?.uri;
        if (videoUri) {
          console.log('Video URI:', videoUri);
          // Handle the selected video, e.g., navigate to an editor screen
        }
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
        <View style={styles.containerInner}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
              <Icon name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Upload Video</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionDescription}>
              Select a video from your gallery to create a new reel.
            </Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
              <Icon name="cloud-upload" size={60} color={theme.accentColor} />
              <Text style={styles.uploadButtonText}>Tap to Upload</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerInner: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sectionDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  uploadButton: {
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    aspectRatio: 1,
  },
  uploadButtonText: {
    marginTop: 15,
    fontSize: 18,
    color: theme.textPrimary,
    fontWeight: '600',
  },
});

export default UploadScreen;



// import React, { useState } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   StatusBar, 
//   TouchableOpacity, 
//   FlatList,
//   Image,
//   Alert
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { theme } from '../../styles/theme';
// import ImagePicker from 'react-native-image-picker';

// const UploadScreen = ({ navigation }) => {
//   const [selectedMedia, setSelectedMedia] = useState([]);
//   const [isSelecting, setIsSelecting] = useState(false);

//   const mediaLibrary = [
//     { id: '1', type: 'image', uri: 'https://picsum.photos/200/300?1' },
//     { id: '2', type: 'video', uri: 'https://picsum.photos/200/300?2' },
//     { id: '3', type: 'image', uri: 'https://picsum.photos/200/300?3' },
//     { id: '4', type: 'video', uri: 'https://picsum.photos/200/300?4' },
//     { id: '5', type: 'image', uri: 'https://picsum.photos/200/300?5' },
//     { id: '6', type: 'video', uri: 'https://picsum.photos/200/300?6' },
//     { id: '7', type: 'image', uri: 'https://picsum.photos/200/300?7' },
//     { id: '8', type: 'video', uri: 'https://picsum.photos/200/300?8' },
//     { id: '9', type: 'image', uri: 'https://picsum.photos/200/300?9' },
//   ];

//   const openGallery = () => {
//     const options = {
//       mediaType: 'mixed',
//       maxWidth: 300,
//       maxHeight: 300,
//       quality: 1,
//       selectionLimit: 0,
//     };

//     ImagePicker.launchImageLibrary(options, (response) => {
//       if (response.didCancel) {
//         console.log('User cancelled image picker');
//       } else if (response.error) {
//         console.log('ImagePicker Error: ', response.error);
//         Alert.alert('Error', 'Failed to access gallery');
//       } else {
//         setSelectedMedia(response.assets || []);
//       }
//     });
//   };

//   const toggleSelectMedia = (item) => {
//     if (selectedMedia.includes(item.id)) {
//       setSelectedMedia(selectedMedia.filter(id => id !== item.id));
//     } else {
//       setSelectedMedia([...selectedMedia, item.id]);
//     }
//   };

//   const renderMediaItem = ({ item }) => (
//     <TouchableOpacity 
//       style={styles.mediaItem}
//       onPress={() => toggleSelectMedia(item)}
//     >
//       <Image source={{ uri: item.uri }} style={styles.mediaImage} />
//       {item.type === 'video' && (
//         <View style={styles.videoIndicator}>
//           <Icon name="play-circle" size={24} color={theme.textPrimary} />
//         </View>
//       )}
//       {selectedMedia.includes(item.id) && (
//         <View style={styles.selectedOverlay}>
//           <Icon name="check-circle" size={24} color={theme.accentColor} />
//         </View>
//       )}
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
//       <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
//       <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
//         <View style={styles.containerInner}>
//           {/* Header */}
//           <View style={styles.header}>
//             <View style={styles.logoContainer}>
//               <Icon name="add-circle" size={22} color={theme.accentColor} />
//               <Text style={styles.logo}>REELS2CHAT</Text>
//             </View>
//             <View style={styles.headerIcons}>
//               <TouchableOpacity 
//                 style={styles.headerIcon}
//                 onPress={() => navigation.goBack()}
//               >
//                 <Icon name="arrow-back" size={18} color={theme.textPrimary} />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Content */}
//           <View style={styles.content}>
//             <View style={styles.sectionTitle}>
//               <Icon name="upload-file" size={18} color={theme.accentColor} style={styles.sectionTitleIcon} />
//               <Text style={styles.sectionTitleText}>Upload from Gallery</Text>
//             </View>
//             <Text style={styles.sectionDescription}>Select photos or videos to create your reel</Text>
            
//             <TouchableOpacity style={styles.uploadButton} onPress={openGallery}>
//               <Icon name="add-photo-alternate" size={24} color={theme.textPrimary} />
//               <Text style={styles.uploadButtonText}>Browse Gallery</Text>
//             </TouchableOpacity>

//             <View style={styles.mediaGrid}>
//               <FlatList
//                 data={mediaLibrary}
//                 renderItem={renderMediaItem}
//                 keyExtractor={(item) => item.id}
//                 numColumns={3}
//                 scrollEnabled={false}
//               />
//             </View>

//             {selectedMedia.length > 0 && (
//               <View style={styles.selectedBar}>
//                 <Text style={styles.selectedText}>{selectedMedia.length} items selected</Text>
//                 <TouchableOpacity style={styles.nextButton}>
//                   <Text style={styles.nextButtonText}>Next</Text>
//                   <Icon name="arrow-forward" size={18} color={theme.textPrimary} />
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>
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
//   headerIcons: {
//     flexDirection: 'row',
//     gap: 16,
//   },
//   headerIcon: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: 'rgba(255, 255, 255, 0.08)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     flex: 1,
//     padding: 15,
//   },
//   sectionTitle: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//     marginTop: 10,
//   },
//   sectionTitleIcon: {
//     marginRight: 8,
//   },
//   sectionTitleText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: theme.textPrimary,
//   },
//   sectionDescription: {
//     fontSize: 14,
//     color: theme.textSecondary,
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   uploadButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: 'rgba(30, 40, 50, 0.7)',
//     borderRadius: 15,
//     paddingVertical: 15,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   uploadButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: theme.textPrimary,
//     marginLeft: 10,
//   },
//   mediaGrid: {
//     flex: 1,
//   },
//   mediaItem: {
//     flex: 1/3,
//     aspectRatio: 1,
//     margin: 2,
//     position: 'relative',
//   },
//   mediaImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   videoIndicator: {
//     position: 'absolute',
//     bottom: 5,
//     right: 5,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     borderRadius: 12,
//     padding: 2,
//   },
//   selectedOverlay: {
//     position: 'absolute',
//     top: 5,
//     right: 5,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     borderRadius: 12,
//     padding: 2,
//   },
//   selectedBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: 'rgba(18, 24, 38, 0.95)',
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(255, 255, 255, 0.08)',
//   },
//   selectedText: {
//     fontSize: 16,
//     color: theme.textPrimary,
//   },
//   nextButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: theme.accentColor,
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
//   nextButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: theme.textPrimary,
//     marginRight: 5,
//   },
// });

// export default UploadScreen;