// src/Create/Templates.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TEMP_ICONS = {
  dog: require('../assets/dog-icon.png'),
  cat: require('../assets/cat-icon.png'),
};

export default function TemplatesScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState('Animals');

  const categories = [
    'Animals', 'Beauty', 'Classic', 'Daily', 'Dreamy', 'Effects',
    'Fantasy', 'Fashion', 'Fitness', 'Food', 'Funny', 'Gaming',
    'Halloween', 'Love', 'Music', 'Nature', 'Party', 'Sports',
    'Travel', 'Vintage', 'Wedding', 'Work', 'Art', 'Kids', 'Men',
    'Women',
  ];

  const animalTemplates = [
    { id: 1, name: 'Dog', icon: TEMP_ICONS.dog },
    { id: 2, name: 'Cat', icon: TEMP_ICONS.cat },
    { id: 3, name: 'Cow', icon: TEMP_ICONS.dog },
    { id: 4, name: 'Parrot', icon: TEMP_ICONS.cat },
    { id: 5, name: 'Bunny', icon: TEMP_ICONS.dog },
  ];

  const beautyTemplates = [
    { id: 1, name: 'Glamour', icon: TEMP_ICONS.cat },
    { id: 2, name: 'Natural', icon: TEMP_ICONS.dog },
  ];

  const getCurrentTemplates = () => {
    switch (selectedCategory) {
      case 'Animals': return animalTemplates;
      case 'Beauty': return beautyTemplates;
      default: return animalTemplates;
    }
  };

  const handleTemplateSelect = (template: any) => {
    navigation.navigate('Camera', { selectedTemplate: template });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Templates</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={styles.categoriesContent}>
        {categories.map((c, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.categoryButton, selectedCategory === c && styles.selectedCategoryButton]}
            onPress={() => setSelectedCategory(c)}
          >
            <Text style={[styles.categoryText, selectedCategory === c && styles.selectedCategoryText]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.templatesContainer}>
        <View style={styles.templatesGrid}>
          {getCurrentTemplates().map(t => (
            <TouchableOpacity key={t.id} style={styles.templateItem} onPress={() => handleTemplateSelect(t)}>
              <Image source={t.icon} style={styles.templateIcon} />
              <Text style={styles.templateName}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  backButton: { padding: 5 },
  backButtonText: { color: '#FFF', fontSize: 16 },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  placeholder: { width: 60 },

  categoriesContainer: { maxHeight: 60 },
  categoriesContent: { paddingHorizontal: 10 },
  categoryButton: { paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  selectedCategoryButton: { backgroundColor: '#FF3B30' },
  categoryText: { color: '#FFF', fontSize: 14 },
  selectedCategoryText: { fontWeight: 'bold' },

  templatesContainer: { flex: 1, padding: 10 },
  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  templateItem: { width: '30%', aspectRatio: 1, marginBottom: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10 },
  templateIcon: { width: 50, height: 50, marginBottom: 5 },
  templateName: { color: '#FFF', fontSize: 12, textAlign: 'center' },
});