// src/Create/Camera.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
  AppState,
  Image,
  Dimensions,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureScreenWithOverlay } from '../utils/ScreenshotMerger';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEMPLATE_IMAGES: { [key: string]: any } = {
  dog: require('../assets/dog-icon.png'),
  cat: require('../assets/cat-icon.png'),
  bunny: require('../assets/bunny-icon.png'),
  cow: require('../assets/cow-icon.png'),
  parrot: require('../assets/parrot-icon.png'),
};

export default function CameraScreen({ navigation, route }: any) {
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasStoragePermission, setHasStoragePermission] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [templatePosition, setTemplatePosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');

  const cameraRef = useRef<Camera>(null);
  const screenRef = useRef<View>(null);
  const devices = useCameraDevices();
  const device = devices?.find(d => d.position === (isFrontCamera ? 'front' : 'back')) ?? devices?.[0] ?? null;

  // Load selected template from navigation
  useEffect(() => {
    if (route.params?.selectedTemplate) {
      const tmpl = route.params.selectedTemplate;
      const name = tmpl.name.toLowerCase();
      const iconSource = TEMPLATE_IMAGES[name] ?? TEMPLATE_IMAGES.dog;
      const iconUri = Image.resolveAssetSource(iconSource).uri;
      setSelectedTemplate({ ...tmpl, icon: iconUri });
    }
  }, [route.params]);

  const changeTemplatePosition = () => {
    const order: typeof templatePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const idx = order.indexOf(templatePosition);
    setTemplatePosition(order[(idx + 1) % order.length]);
  };

  const getOverlayPosition = () => {
    const size = 120;
    const margin = 30;
    const topOffset = 80;
    const bottomOffset = 140;

    switch (templatePosition) {
      case 'top-left':
        return { left: margin, top: topOffset, width: size, height: size };
      case 'top-right':
        return { right: margin, top: topOffset, width: size, height: size };
      case 'bottom-left':
        return { left: margin, bottom: bottomOffset, width: size, height: size };
      case 'bottom-right':
        return { right: margin, bottom: bottomOffset, width: size, height: size };
      default:
        return { right: margin, top: topOffset, width: size, height: size };
    }
  };

  // PERMISSIONS
  const checkStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;
    const perm = Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
    const granted = await PermissionsAndroid.check(perm);
    setHasStoragePermission(granted);
    return granted;
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;
    const perm = Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
    const result = await PermissionsAndroid.request(perm);
    const granted = result === PermissionsAndroid.RESULTS.GRANTED;
    setHasStoragePermission(granted);
    return granted;
  };

  const checkCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (granted) {
        setHasCameraPermission(true);
        setCameraInitialized(true);
        return true;
      }
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      const ok = res === PermissionsAndroid.RESULTS.GRANTED;
      setHasCameraPermission(ok);
      setCameraInitialized(true);
      return ok;
    } else {
      const status = await Camera.requestCameraPermission();
      const ok = status === 'granted';
      setHasCameraPermission(ok);
      setCameraInitialized(true);
      return ok;
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!mounted) return;
      await checkCameraPermission();
      await checkStoragePermission();
    };
    const t = setTimeout(init, 800);
    const sub = AppState.addEventListener('change', async (s) => {
      if (s === 'active' && mounted) await checkStoragePermission();
    });
    return () => {
      mounted = false;
      clearTimeout(t);
      sub.remove();
    };
  }, []);

  const handleFlipCamera = () => setIsFrontCamera(p => !p);

  const saveImageToGallery = async (path: string) => {
    try {
      await CameraRoll.save(path, { type: 'photo', album: 'Reals2Chat' });
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  };

  // CAPTURE WITH SCREENSHOT (MAIN METHOD)
  const handleCapture = async () => {
    if (!cameraRef.current || !screenRef.current || isTakingPhoto) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    setIsTakingPhoto(true);
    let finalPath: string | null = null;

    try {
      console.log('Taking screenshot with overlay...');
      finalPath = await captureScreenWithOverlay(screenRef);

      if (!finalPath) {
        console.log('Screenshot failed, taking raw photo...');
        const photo = await cameraRef.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'quality',
        });
        finalPath = photo.path;
      }

      if (finalPath) {
        const saved = await saveImageToGallery(finalPath);
        if (saved) {
          Alert.alert(
            'Success!',
            selectedTemplate
              ? `"${selectedTemplate.name}" applied!`
              : 'Photo saved!'
          );
        } else {
          Alert.alert('Saved!', 'Check your gallery');
        }
      }
    } catch (error) {
      console.error('Capture failed:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const handleOpenGallery = async () => {
    const ok = await checkStoragePermission() || (await requestStoragePermission());
    if (!ok) {
      setShowPermissionModal(true);
      return;
    }
    await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
  };

  const handleOpenTemplates = () => navigation.navigate('Templates');
  const handleClearTemplate = () => setSelectedTemplate(null);
  const openAppSettings = () => { Linking.openSettings(); setShowPermissionModal(false); };

  if (!cameraInitialized) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.loadingText}>கேமரா தயாராகிறது...</Text>
      </SafeAreaView>
    );
  }

  if (!hasCameraPermission) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Icon name="camera-off" size={50} color="#fff" />
        <Text style={styles.text}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={checkCameraPermission}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Icon name="error-outline" size={50} color="#fff" />
        <Text style={styles.text}>No camera device</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View ref={screenRef} style={styles.screenshotContainer} collapsable={false}>
        {/* CAMERA WITH BLACK BACKGROUND */}
        <Camera
          ref={cameraRef}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'black' }]}
          device={device}
          isActive={true}
          photo={true}
          resizeMode="cover"
        />

        {/* OVERLAY TEMPLATE */}
        {selectedTemplate && (
          <View style={[styles.templateOverlay, getOverlayPosition()]}>
            <Image source={{ uri: selectedTemplate.icon }} style={styles.templateImage} resizeMode="contain" />
            <View style={styles.templateControls}>
              <Text style={styles.templateName}>{selectedTemplate.name}</Text>
              <View style={styles.templateButtons}>
                <TouchableOpacity onPress={changeTemplatePosition} style={styles.positionButton}>
                  <Icon name="open-with" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClearTemplate} style={styles.clearButton}>
                  <Icon name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* BOTTOM CONTROLS */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.sideButton} onPress={handleOpenGallery}>
            <Icon name="photo-library" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={isTakingPhoto}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButton} onPress={handleOpenTemplates}>
            <Icon name="dashboard" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* FLIP CAMERA */}
        <TouchableOpacity style={styles.flipButton} onPress={handleFlipCamera}>
          <Icon name="flip-camera-ios" size={28} color="#fff" />
        </TouchableOpacity>

        {/* HINT */}
        {!selectedTemplate && (
          <View style={styles.templateHint}>
            <Text style={styles.templateHintText}>Choose a template</Text>
          </View>
        )}
      </View>

      {/* PERMISSION MODAL */}
      {showPermissionModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Icon name="error-outline" size={50} color="#FF3B30" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Permission Denied</Text>
            <Text style={styles.modalText}>Storage needed to save photos</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.settingsButton]} onPress={openAppSettings}>
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowPermissionModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  screenshotContainer: { flex: 1 },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 },
  loadingText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  text: { color: '#FFF', fontSize: 16, marginTop: 12, marginBottom: 20, textAlign: 'center' },
  button: { backgroundColor: '#FF3B30', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, minWidth: 200, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: { opacity: 0.5 },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF3B30' },
  flipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  templateOverlay: { position: 'absolute', alignItems: 'center', zIndex: 10 },
  templateImage: { width: 120, height: 120, opacity: 0.9 },
  templateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  templateName: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginRight: 8 },
  templateButtons: { flexDirection: 'row', alignItems: 'center' },
  positionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },

  templateHint: { position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center' },
  templateHintText: { color: '#FFF', fontSize: 14, textAlign: 'center' },

  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 10, padding: 20, alignItems: 'center' },
  modalIcon: { marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  modalText: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#555', lineHeight: 22 },
  modalButtons: { width: '100%' },
  modalButton: { paddingVertical: 12, borderRadius: 5, alignItems: 'center', marginVertical: 5 },
  settingsButton: { backgroundColor: '#FF3B30' },
  cancelButton: { backgroundColor: '#E0E0E0' },
  settingsButtonText: { color: '#fff', fontWeight: 'bold' },
  cancelButtonText: { color: '#333', fontWeight: 'bold' },
});

// // src/Create/Camera.tsx
// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Platform,
//   PermissionsAndroid,
//   Alert,
//   Linking,
//   AppState,
//   Image,
// } from 'react-native';
// import { Camera, useCameraDevices } from 'react-native-vision-camera';
// import { launchImageLibrary } from 'react-native-image-picker';
// import { CameraRoll } from '@react-native-camera-roll/camera-roll';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { captureScreenWithTemplate } from '../utils/ScreenshotMerger';

// const TEMPLATE_IMAGES = {
//   dog: require('../assets/dog-icon.png'),
//   cat: require('../assets/cat-icon.png'),
//   cow: require('../assets/cow-icon.png'),
//   parrot: require('../assets/parrot-icon.png'),
//   bunny: require('../assets/bunny-icon.png'),
// };

// export default function CameraScreen({ navigation, route }: any) {
//   const [hasCameraPermission, setHasCameraPermission] = useState(false);
//   const [hasStoragePermission, setHasStoragePermission] = useState(false);
//   const [isFrontCamera, setIsFrontCamera] = useState(true);
//   const [showPermissionModal, setShowPermissionModal] = useState(false);
//   const [isTakingPhoto, setIsTakingPhoto] = useState(false);
//   const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
//   const [cameraInitialized, setCameraInitialized] = useState(false);
//   const [templatePosition, setTemplatePosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');

//   const cameraRef = useRef<Camera>(null);
//   const screenRef = useRef<View>(null);
//   const devices = useCameraDevices();
//   const device = devices?.find(d => d.position === (isFrontCamera ? 'front' : 'back')) ?? devices?.[0] ?? null;

//   useEffect(() => {
//     if (route.params?.selectedTemplate) {
//       const tmpl = route.params.selectedTemplate;
//       const name = tmpl.name.toLowerCase();
//       const icon = TEMPLATE_IMAGES[name as keyof typeof TEMPLATE_IMAGES] ?? TEMPLATE_IMAGES.dog;
//       setSelectedTemplate({ ...tmpl, icon });
//     }
//   }, [route.params]);

//   const changeTemplatePosition = () => {
//     const order = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
//     const idx = order.indexOf(templatePosition);
//     setTemplatePosition(order[(idx + 1) % order.length]);
//   };

//   const getTemplatePositionStyle = () => {
//     switch (templatePosition) {
//       case 'top-left': return styles.templateTopLeft;
//       case 'top-right': return styles.templateTopRight;
//       case 'bottom-left': return styles.templateBottomLeft;
//       case 'bottom-right': return styles.templateBottomRight;
//       default: return styles.templateTopRight;
//     }
//   };

//   const checkStoragePermission = async () => {
//     if (Platform.OS !== 'android') return true;
//     const perm = Platform.Version >= 33
//       ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
//       : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
//     const granted = await PermissionsAndroid.check(perm);
//     setHasStoragePermission(granted);
//     return granted;
//   };

//   const requestStoragePermission = async () => {
//     if (Platform.OS !== 'android') return true;
//     const perm = Platform.Version >= 33
//       ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
//       : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
//     const result = await PermissionsAndroid.request(perm);
//     const granted = result === PermissionsAndroid.RESULTS.GRANTED;
//     setHasStoragePermission(granted);
//     return granted;
//   };

//   const checkCameraPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
//       if (granted) {
//         setHasCameraPermission(true);
//         setCameraInitialized(true);
//         return true;
//       }
//       const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
//       const ok = res === PermissionsAndroid.RESULTS.GRANTED;
//       setHasCameraPermission(ok);
//       setCameraInitialized(true);
//       return ok;
//     } else {
//       const status = await Camera.requestCameraPermission();
//       const ok = status === 'granted';
//       setHasCameraPermission(ok);
//       setCameraInitialized(true);
//       return ok;
//     }
//   };

//   useEffect(() => {
//     let mounted = true;
//     const init = async () => {
//       if (!mounted) return;
//       await checkCameraPermission();
//       await checkStoragePermission();
//     };
//     const t = setTimeout(init, 800);
//     const sub = AppState.addEventListener('change', async (s) => {
//       if (s === 'active' && mounted) await checkStoragePermission();
//     });
//     return () => {
//       mounted = false;
//       clearTimeout(t);
//       sub.remove();
//     };
//   }, []);

//   const handleFlipCamera = () => setIsFrontCamera(p => !p);

//   const saveImageToGallery = async (path: string) => {
//     try {
//       await CameraRoll.save(path, { type: 'photo', album: 'Reals2Chat' });
//       return true;
//     } catch (e) {
//       console.error('Save failed:', e);
//       return false;
//     }
//   };

//   const handleCapture = async () => {
//     if (!cameraRef.current || !screenRef.current || isTakingPhoto) {
//       Alert.alert('Error', 'Camera not ready');
//       return;
//     }

//     setIsTakingPhoto(true);
//     let finalPath: string | null = null;

//     try {
//       console.log('Trying ViewShot...');
//       const shot = await captureScreenWithTemplate(screenRef);
//       if (shot) {
//         finalPath = shot;
//         console.log('ViewShot captured:', finalPath);
//       } else {
//         throw new Error('ViewShot returned null');
//       }
//     } catch (viewShotError) {
//       console.warn('ViewShot failed → fallback', viewShotError);
//       try {
//         const photo = await cameraRef.current.takePhoto({
//           flash: 'off',
//           qualityPrioritization: 'quality',
//         });
//         finalPath = photo.path;
//         console.log('Fallback raw photo:', finalPath);
//       } catch (rawError) {
//         console.error('Raw photo failed', rawError);
//         Alert.alert('Error', 'Capture failed');
//         setIsTakingPhoto(false);
//         return;
//       }
//     }

//     if (finalPath) {
//       const saved = await saveImageToGallery(finalPath);
//       if (saved) {
//         Alert.alert(
//           'Success!',
//           selectedTemplate
//             ? `"${selectedTemplate.name}" applied!`
//             : 'Photo saved!'
//         );
//       } else {
//         Alert.alert('Info', 'Captured but not saved');
//       }
//     }

//     setIsTakingPhoto(false);
//   };

//   const handleOpenGallery = async () => {
//     const ok = await checkStoragePermission() || (await requestStoragePermission());
//     if (!ok) {
//       setShowPermissionModal(true);
//       return;
//     }
//     await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
//   };

//   const handleOpenTemplates = () => navigation.navigate('Templates');
//   const handleClearTemplate = () => setSelectedTemplate(null);
//   const openAppSettings = () => { Linking.openSettings(); setShowPermissionModal(false); };

//   if (!cameraInitialized) {
//     return (
//       <SafeAreaView style={styles.centeredContainer}>
//         <Text style={styles.loadingText}>கேமரா தயாராகிறது...</Text>
//       </SafeAreaView>
//     );
//   }

//   if (!hasCameraPermission) {
//     return (
//       <SafeAreaView style={styles.centeredContainer}>
//         <Icon name="camera-off" size={50} color="#fff" />
//         <Text style={styles.text}>Camera permission required</Text>
//         <TouchableOpacity style={styles.button} onPress={checkCameraPermission}>
//           <Text style={styles.buttonText}>Retry</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   if (!device) {
//     return (
//       <SafeAreaView style={styles.centeredContainer}>
//         <Icon name="error-outline" size={50} color="#fff" />
//         <Text style={styles.text}>No camera device</Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <View ref={screenRef} style={styles.screenshotContainer} collapsable={false}>
//         <Camera
//           ref={cameraRef}
//           style={StyleSheet.absoluteFill}
//           device={device}
//           isActive={true}
//           photo={true}
//         />

//         {selectedTemplate && (
//           <View style={[styles.templateOverlay, getTemplatePositionStyle()]}>
//             <Image source={selectedTemplate.icon} style={styles.templateImage} resizeMode="contain" />
//             <View style={styles.templateControls}>
//               <Text style={styles.templateName}>{selectedTemplate.name}</Text>
//               <View style={styles.templateButtons}>
//                 <TouchableOpacity onPress={changeTemplatePosition} style={styles.positionButton}>
//                   <Icon name="open-with" size={16} color="#fff" />
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={handleClearTemplate} style={styles.clearButton}>
//                   <Icon name="close" size={16} color="#fff" />
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         )}

//         <View style={styles.controlsContainer}>
//           <TouchableOpacity style={styles.sideButton} onPress={handleOpenGallery}>
//             <Icon name="photo-library" size={28} color="#fff" />
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
//             onPress={handleCapture}
//             disabled={isTakingPhoto}
//           >
//             <View style={styles.captureInner} />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.sideButton} onPress={handleOpenTemplates}>
//             <Icon name="dashboard" size={28} color="#fff" />
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity style={styles.flipButton} onPress={handleFlipCamera}>
//           <Icon name="flip-camera-ios" size={28} color="#fff" />
//         </TouchableOpacity>

//         {!selectedTemplate && (
//           <View style={styles.templateHint}>
//             <Text style={styles.templateHintText}>Choose a template</Text>
//           </View>
//         )}

//         {selectedTemplate && (
//           <View style={styles.positionIndicator}>
//             <Text style={styles.positionText}>Pos: {templatePosition}</Text>
//           </View>
//         )}
//       </View>

//       {showPermissionModal && (
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Icon name="error-outline" size={50} color="#FF3B30" style={styles.modalIcon} />
//             <Text style={styles.modalTitle}>Permission Denied</Text>
//             <Text style={styles.modalText}>Storage needed to save photos</Text>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity style={[styles.modalButton, styles.settingsButton]} onPress={openAppSettings}>
//                 <Text style={styles.settingsButtonText}>Open Settings</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowPermissionModal(false)}>
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#000' },
//   screenshotContainer: { flex: 1 },
//   centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 },
//   loadingText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
//   text: { color: '#FFF', fontSize: 16, marginTop: 12, marginBottom: 20, textAlign: 'center' },
//   button: { backgroundColor: '#FF3B30', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, minWidth: 200, alignItems: 'center' },
//   buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

//   controlsContainer: {
//     position: 'absolute',
//     bottom: 40,
//     width: '100%',
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     paddingHorizontal: 30,
//   },
//   sideButton: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   captureButton: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     borderWidth: 4,
//     borderColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   captureButtonDisabled: { opacity: 0.5 },
//   captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF3B30' },
//   flipButton: {
//     position: 'absolute',
//     top: 50,
//     right: 20,
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   templateOverlay: { position: 'absolute', alignItems: 'center', zIndex: 10 },
//   templateTopLeft: { top: 80, left: 20 },
//   templateTopRight: { top: 80, right: 20 },
//   templateBottomLeft: { bottom: 120, left: 20 },
//   templateBottomRight: { bottom: 120, right: 20 },
//   templateImage: { width: 100, height: 100, opacity: 0.9 },
//   templateControls: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 5,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 15,
//   },
//   templateName: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginRight: 8 },
//   templateButtons: { flexDirection: 'row', alignItems: 'center' },
//   positionButton: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: '#4CAF50',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 5,
//   },
//   clearButton: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: '#FF3B30',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   templateHint: { position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center' },
//   templateHintText: { color: '#FFF', fontSize: 14, textAlign: 'center' },
//   positionIndicator: {
//     position: 'absolute',
//     top: 50,
//     left: 20,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 10,
//   },
//   positionText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

//   modalContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.7)',
//   },
//   modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 10, padding: 20, alignItems: 'center' },
//   modalIcon: { marginBottom: 15 },
//   modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
//   modalText: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#555', lineHeight: 22 },
//   modalButtons: { width: '100%' },
//   modalButton: { paddingVertical: 12, borderRadius: 5, alignItems: 'center', marginVertical: 5 },
//   settingsButton: { backgroundColor: '#FF3B30' },
//   cancelButton: { backgroundColor: '#E0E0E0' },
//   settingsButtonText: { color: '#fff', fontWeight: 'bold' },
//   cancelButtonText: { color: '#333', fontWeight: 'bold' },
// });