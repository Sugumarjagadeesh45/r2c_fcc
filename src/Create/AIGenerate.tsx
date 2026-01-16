import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../styles/theme';

const AIGenerateScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
        <View style={styles.containerInner}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
              <Icon name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>AI Generate</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.content}>
            <Icon name="smart-toy" size={80} color={theme.accentColor} style={styles.icon} />
            <Text style={styles.sectionTitleText}>Create with AI</Text>
            <Text style={styles.sectionDescription}>
              Describe your idea and let our AI generate a stunning video for you.
            </Text>
            <TouchableOpacity style={styles.generateButton}>
              <Text style={styles.generateButtonText}>Generate Video</Text>
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
  icon: {
    marginBottom: 20,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  generateButton: {
    backgroundColor: theme.accentColor,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  generateButtonText: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '600',
  },
});

export default AIGenerateScreen;



// import React, { useState } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   StatusBar, 
//   TouchableOpacity, 
//   TextInput,
//   ScrollView,
//   Alert
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { theme } from '../../styles/theme';

// const AIGenerateScreen = ({ navigation }) => {
//   const [prompt, setPrompt] = useState('');
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [generatedContent, setGeneratedContent] = useState(null);

//   const aiStyles = [
//     { id: '1', name: 'Cinematic', icon: 'movie' },
//     { id: '2', name: 'Cartoon', icon: 'brush' },
//     { id: '3', name: 'Anime', icon: 'auto-awesome' },
//     { id: '4', name: 'Realistic', icon: 'hd' },
//     { id: '5', name: 'Vintage', icon: 'filter-vintage' },
//     { id: '6', name: 'Futuristic', icon: 'rocket' },
//   ];

//   const generateContent = () => {
//     if (!prompt.trim()) {
//       Alert.alert('Input Required', 'Please enter a prompt for AI generation');
//       return;
//     }

//     setIsGenerating(true);
    
//     // Simulate AI generation process
//     setTimeout(() => {
//       setIsGenerating(false);
//       setGeneratedContent({
//         id: '1',
//         title: 'AI Generated Content',
//         thumbnail: 'https://picsum.photos/400/600?ai',
//         duration: '0:30'
//       });
//     }, 3000);
//   };

//   const renderAIStyle = ({ item }) => (
//     <TouchableOpacity style={styles.aiStyleItem}>
//       <View style={styles.aiStyleIconContainer}>
//         <Icon name={item.icon} size={28} color={theme.accentColor} />
//       </View>
//       <Text style={styles.aiStyleName}>{item.name}</Text>
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
//           <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//             <View style={styles.sectionTitle}>
//               <Icon name="smart-toy" size={18} color={theme.accentColor} style={styles.sectionTitleIcon} />
//               <Text style={styles.sectionTitleText}>AI Content Generator</Text>
//             </View>
//             <Text style={styles.sectionDescription}>Describe what you want to create and let AI do the magic</Text>
            
//             <View style={styles.promptContainer}>
//               <TextInput
//                 style={styles.promptInput}
//                 placeholder="Describe your video idea..."
//                 placeholderTextColor={theme.textSecondary}
//                 value={prompt}
//                 onChangeText={setPrompt}
//                 multiline
//               />
//               <TouchableOpacity 
//                 style={[styles.generateButton, isGenerating && styles.generatingButton]}
//                 onPress={generateContent}
//                 disabled={isGenerating}
//               >
//                 {isGenerating ? (
//                   <>
//                     <Icon name="hourglass-empty" size={18} color={theme.textPrimary} />
//                     <Text style={styles.generateButtonText}>Generating...</Text>
//                   </>
//                 ) : (
//                   <>
//                     <Icon name="auto-awesome" size={18} color={theme.textPrimary} />
//                     <Text style={styles.generateButtonText}>Generate</Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             </View>

//             <View style={styles.sectionTitle}>
//               <Icon name="style" size={18} color={theme.accentColor} style={styles.sectionTitleIcon} />
//               <Text style={styles.sectionTitleText}>AI Styles</Text>
//             </View>
            
//             <FlatList
//               data={aiStyles}
//               renderItem={renderAIStyle}
//               keyExtractor={(item) => item.id}
//               numColumns={3}
//               scrollEnabled={false}
//               style={styles.aiStylesGrid}
//             />

//             {generatedContent && (
//               <View style={styles.generatedContentContainer}>
//                 <Text style={styles.generatedTitle}>Generated Content</Text>
//                 <View style={styles.generatedPreview}>
//                   <Image 
//                     source={{ uri: generatedContent.thumbnail }} 
//                     style={styles.generatedThumbnail} 
//                   />
//                   <View style={styles.generatedInfo}>
//                     <Text style={styles.generatedName}>{generatedContent.title}</Text>
//                     <Text style={styles.generatedDuration}>{generatedContent.duration}</Text>
//                   </View>
//                   <TouchableOpacity style={styles.useButton}>
//                     <Text style={styles.useButtonText}>Use This</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             )}
//           </ScrollView>
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
//   promptContainer: {
//     marginBottom: 25,
//   },
//   promptInput: {
//     backgroundColor: 'rgba(30, 40, 50, 0.7)',
//     borderRadius: 15,
//     padding: 15,
//     fontSize: 16,
//     color: theme.textPrimary,
//     minHeight: 100,
//     textAlignVertical: 'top',
//     marginBottom: 15,
//   },
//   generateButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: theme.accentColor,
//     paddingVertical: 15,
//     borderRadius: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   generatingButton: {
//     backgroundColor: 'rgba(100, 100, 100, 0.7)',
//   },
//   generateButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: theme.textPrimary,
//     marginLeft: 8,
//   },
//   aiStylesGrid: {
//     marginBottom: 25,
//   },
//   aiStyleItem: {
//     flex: 1/3,
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   aiStyleIconContainer: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(30, 40, 50, 0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   aiStyleName: {
//     fontSize: 14,
//     color: theme.textPrimary,
//   },
//   generatedContentContainer: {
//     marginTop: 20,
//     marginBottom: 30,
//   },
//   generatedTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: theme.textPrimary,
//     marginBottom: 15,
//   },
//   generatedPreview: {
//     flexDirection: 'row',
//     backgroundColor: 'rgba(30, 40, 50, 0.7)',
//     borderRadius: 15,
//     padding: 15,
//     alignItems: 'center',
//   },
//   generatedThumbnail: {
//     width: 80,
//     height: 80,
//     borderRadius: 10,
//     resizeMode: 'cover',
//   },
//   generatedInfo: {
//     flex: 1,
//     marginLeft: 15,
//   },
//   generatedName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: theme.textPrimary,
//     marginBottom: 5,
//   },
//   generatedDuration: {
//     fontSize: 14,
//     color: theme.textSecondary,
//   },
//   useButton: {
//     backgroundColor: theme.accentColor,
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
//   useButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: theme.textPrimary,
//   },
// });

// export default AIGenerateScreen;