import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './utiliti/config';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Modern theme with professional colors
const theme = {
  background: '#0F0F23',
  surface: '#1A1A2E',
  surfaceLight: '#252547',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#0EA5E9',
  accent: '#8B5CF6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { width, height } = Dimensions.get('window');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const alertSlideAnim = useRef(new Animated.Value(-100)).current;
  const buttonAnim = useRef(new Animated.Value(1)).current;
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [gender, setGender] = useState('male');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Enhanced User ID state
  const [userId, setUserId] = useState('');
  const [userIdMode, setUserIdMode] = useState<'auto' | 'custom'>('auto');
  const [userIdVerified, setUserIdVerified] = useState(false);
  const [checkingUserId, setCheckingUserId] = useState(false);
  const [userIdError, setUserIdError] = useState('');
  const [userIdTouched, setUserIdTouched] = useState(false);
  
  // Verification states
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showPhoneOTPModal, setShowPhoneOTPModal] = useState(false);
  const [showEmailOTPModal, setShowEmailOTPModal] = useState(false);
  const [phoneOTP, setPhoneOTP] = useState(['', '', '', '', '', '']);
  const [emailOTP, setEmailOTP] = useState(['', '', '', '', '', '']);
  const phoneOTPFRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));
  const emailOTPFRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));
  const [phoneConfirmation, setPhoneConfirmation] = useState<any>(null);
  const [emailOTPGenerated, setEmailOTPGenerated] = useState('');
  const [sendingOTP, setSendingOTP] = useState({ phone: false, email: false });

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');

  // Animation for screen entry
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.elastic(0.8),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  // Clean up registration flag when component unmounts
  useEffect(() => {
    return () => {
      AsyncStorage.removeItem('isRegistering');
    };
  }, []);

  // Auto-generate user ID on mount
  useEffect(() => {
    if (userIdMode === 'auto') {
      handleGenerateUserId();
    }
  }, [userIdMode]);

  // Enhanced User ID functions
  const handleGenerateUserId = async () => {
    try {
      setCheckingUserId(true);
      setUserIdError('');
      const response = await fetch(`${API_URL}/api/auth/generate-user-id`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setUserId(data.userId);
        setUserIdVerified(true);
        setUserIdError('');
        showQuickAlert('Auto-generated User ID created!', 'success');
      } else {
        throw new Error(data.message || 'Failed to generate User ID');
      }
    } catch (error: any) {
      console.error('Generate user ID error:', error);
      showQuickAlert('Failed to generate User ID. Please try again.', 'error');
      setUserIdVerified(false);
    } finally {
      setCheckingUserId(false);
    }
  };

  const handleVerifyUserId = async () => {
    if (!userId) {
      setUserIdError('Please enter a User ID');
      return;
    }
    
    try {
      setCheckingUserId(true);
      setUserIdError('');
      const response = await fetch(`${API_URL}/api/auth/check-user-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setUserIdVerified(true);
        setUserIdError('');
        showQuickAlert('User ID is available!', 'success');
      } else {
        setUserIdVerified(false);
        setUserIdError(data.message || 'User ID verification failed');
        showQuickAlert(data.message || 'User ID verification failed', 'error');
      }
    } catch (error: any) {
      console.error('Verify user ID error:', error);
      setUserIdVerified(false);
      setUserIdError('Failed to verify User ID');
      showQuickAlert('Failed to verify User ID. Please try again.', 'error');
    } finally {
      setCheckingUserId(false);
    }
  };

  const handleUserIdModeChange = (mode: 'auto' | 'custom') => {
    setUserIdMode(mode);
    setUserIdVerified(false);
    setUserIdError('');
    setUserIdTouched(false);
    
    if (mode === 'auto') {
      handleGenerateUserId();
    } else {
      setUserId('');
    }
  };

  const validateUserId = (text: string) => {
    if (text.length < 6) return 'Must be at least 6 characters';
    if (!/\d/.test(text)) return 'Must contain at least one number';
    if (!/^[a-zA-Z0-9]+$/.test(text)) return 'No special characters allowed';
    return null;
  };

  const handleUserIdChange = (text: string) => {
    const cleanedText = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setUserId(cleanedText);
    setUserIdTouched(true);
    
    if (userIdMode === 'custom') {
      setUserIdVerified(false);
      const validationError = validateUserId(cleanedText);
      setUserIdError(validationError || '');
    }
  };

  // Toast alert animation (slide from top)
  const showQuickAlert = (message: string, type: string = 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
    Animated.sequence([
      Animated.timing(alertSlideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(alertSlideAnim, {
        toValue: -100,
        duration: 300,
        delay: 2500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAlertVisible(false);
      setAlertMessage('');
    });
  };

  // Button highlight animation
  const triggerButtonHighlight = () => {
    Animated.sequence([
      Animated.timing(buttonAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const validateIndianPhoneNumber = (number: string) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(number);
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
    return regex.test(password);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dateOfBirth;
    setShowDatePicker(Platform.OS === 'ios');
    setDateOfBirth(currentDate);
  };

  // Phone verification functions
  const handleSendPhoneOTP = async () => {
    if (!phone) {
      showQuickAlert('Please enter a phone number', 'error');
      return;
    }
    if (!validateIndianPhoneNumber(phone)) {
      showQuickAlert('Please enter a valid Indian phone number', 'error');
      return;
    }
    triggerButtonHighlight();
    showQuickAlert('Sending OTP to phone...', 'success');
    try {
      setSendingOTP({ ...sendingOTP, phone: true });
      await AsyncStorage.setItem('isRegistering', 'true');
      const confirmation = await auth().signInWithPhoneNumber(`+91${phone}`);
      setPhoneConfirmation(confirmation);
      setShowPhoneOTPModal(true);
    } catch (error: any) {
      console.error('Phone OTP error:', error.code, error.message);
      showQuickAlert('Failed to send OTP. Please try again.', 'error');
      await AsyncStorage.removeItem('isRegistering');
    } finally {
      setSendingOTP({ ...sendingOTP, phone: false });
    }
  };

  const handlePhoneOTPChange = async (text: string, index: number) => {
    const newOTP = [...phoneOTP];
    newOTP[index] = text;
    setPhoneOTP(newOTP);
    if (text && index < 5) {
      phoneOTPFRefs.current[index + 1]?.focus();
    }
    if (index === 5 && text) {
      const otp = newOTP.join('');
      if (otp.length === 6) {
        try {
          setLoading(true);
          await phoneConfirmation.confirm(otp);
          await auth().signOut();
          setPhoneVerified(true);
          setShowPhoneOTPModal(false);
          setPhoneOTP(['', '', '', '', '', '']);
          showQuickAlert('Phone number verified successfully', 'success');
        } catch (error: any) {
          console.error('Phone OTP verification error:', error.code, error.message);
          showQuickAlert('Invalid OTP', 'error');
          setPhoneOTP(['', '', '', '', '', '']);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handlePhoneOTPKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !phoneOTP[index] && index > 0) {
      phoneOTPFRefs.current[index - 1]?.focus();
    }
  };

  const getPhoneOTPValue = () => {
    return phoneOTP.join('');
  };

  const handleVerifyPhoneOTP = async () => {
    const otp = getPhoneOTPValue();
    if (otp.length !== 6) {
      showQuickAlert('Please enter a 6-digit OTP', 'error');
      return;
    }
    triggerButtonHighlight();
    try {
      setLoading(true);
      await phoneConfirmation.confirm(otp);
      await auth().signOut();
      setPhoneVerified(true);
      setShowPhoneOTPModal(false);
      setPhoneOTP(['', '', '', '', '', '']);
      showQuickAlert('Phone number verified successfully', 'success');
    } catch (error: any) {
      console.error('Phone OTP verification error:', error.code, error.message);
      showQuickAlert('Invalid OTP', 'error');
      setPhoneOTP(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };


// In your RegisterScreen.js, update the handleSendEmailOTP function:

const handleSendEmailOTP = async () => {
  if (!email) {
    showQuickAlert('Please enter an email address', 'error');
    return;
  }
  if (!validateEmail(email)) {
    showQuickAlert('Please enter a valid email address', 'error');
    return;
  }

  triggerButtonHighlight();
  
  try {
    setSendingOTP({ ...sendingOTP, email: true });
    
    // Show sending status
    showQuickAlert('Sending OTP via dual provider system...', 'success');
    
    // Call the backend endpoint with dual provider system
    const response = await fetch(`${API_URL}/api/auth/send-otp-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name: name || 'User',
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      setEmailOTPGenerated(data.otp); // Store OTP from response
      setShowEmailOTPModal(true);
      
      if (data.emailSent) {
        // Show provider info
        const provider = data.deliveryProvider || 'unknown';
        const time = data.deliveryTime ? `${data.deliveryTime}ms` : 'quickly';
        showQuickAlert(`✅ OTP sent via ${provider} in ${time}!`, 'success');
      } else {
        // Development mode or emergency fallback
        if (data.otp) {
          showQuickAlert(`🛠️ Development mode: Use OTP: ${data.otp}`, 'warning');
        } else {
          showQuickAlert('OTP sent! Please check your email.', 'success');
        }
      }
    } else {
      showQuickAlert(data.message || 'Failed to send OTP', 'error');
    }
    
  } catch (error: any) {
    console.error('Email OTP error:', error);
    showQuickAlert('Failed to process OTP request. Please try again.', 'error');
  } finally {
    setSendingOTP({ ...sendingOTP, email: false });
  }
};
// Also update the handleVerifyEmailOTP function:
const handleVerifyEmailOTP = async () => {
  const otp = getEmailOTPValue();
  if (otp.length !== 6) {
    showQuickAlert('Please enter a 6-digit OTP', 'error');
    return;
  }
  
  triggerButtonHighlight();
  
  try {
    setLoading(true);
    
    // Verify OTP with backend
    const response = await fetch(`${API_URL}/api/auth/verify-email-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      setEmailVerified(true);
      setShowEmailOTPModal(false);
      setEmailOTP(['', '', '', '', '', '']);
      showQuickAlert('Email verified successfully', 'success');
    } else {
      showQuickAlert(data.message || 'Invalid OTP', 'error');
      setEmailOTP(['', '', '', '', '', '']);
    }
  } catch (error: any) {
    console.error('Verify email OTP error:', error);
    showQuickAlert('Failed to verify OTP. Please try again.', 'error');
  } finally {
    setLoading(false);
  }
};

  const handleEmailOTPChange = (text: string, index: number) => {
    const newOTP = [...emailOTP];
    newOTP[index] = text;
    setEmailOTP(newOTP);
    if (text && index < 5) {
      emailOTPFRefs.current[index + 1]?.focus();
    }
    if (index === 5 && text) {
      const otp = newOTP.join('');
      if (otp.length === 6) {
        try {
          setLoading(true);
          if (otp === emailOTPGenerated) {
            setEmailVerified(true);
            setShowEmailOTPModal(false);
            setEmailOTP(['', '', '', '', '', '']);
            showQuickAlert('Email verified successfully', 'success');
          } else {
            showQuickAlert('Invalid OTP', 'error');
            setEmailOTP(['', '', '', '', '', '']);
          }
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleEmailOTPKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !emailOTP[index] && index > 0) {
      emailOTPFRefs.current[index - 1]?.focus();
    }
  };

  const getEmailOTPValue = () => {
    return emailOTP.join('');
  };



  const handleSubmit = async () => {
    if (!userId || !userIdVerified) {
      showQuickAlert('Please set up your User ID', 'error');
      return;
    }

    if (!name || !phone || !email || !password || !confirmPassword) {
      showQuickAlert('Please fill all fields', 'error');
      return;
    }
    if (!validateIndianPhoneNumber(phone)) {
      showQuickAlert('Please enter a valid Indian phone number', 'error');
      return;
    }
    if (!validateEmail(email)) {
      showQuickAlert('Please enter a valid email address', 'error');
      return;
    }
    if (!validatePassword(password)) {
      showQuickAlert(
        'Password must contain at least 1 uppercase, 1 lowercase, 1 special character, 1 number, and be 8-15 characters long',
        'error'
      );
      return;
    }
    if (password !== confirmPassword) {
      showQuickAlert('Passwords do not match', 'error');
      return;
    }
    if (!phoneVerified && !emailVerified) {
      showQuickAlert('Please verify either your phone number or email address', 'error');
      return;
    }
    setLoading(true);
    try {
      const formattedDateOfBirth = dateOfBirth.toISOString().split('T')[0];
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          userId,
          dateOfBirth: formattedDateOfBirth,
          gender,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.removeItem('isRegistering');
        showQuickAlert('Registration successful!', 'success');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        showQuickAlert(data.message || 'Registration failed', 'error');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      showQuickAlert(`Network error: ${error.message}. Please check your connection and try again.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isPhoneValid = validateIndianPhoneNumber(phone);
  const isEmailValid = validateEmail(email);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      
      {/* Background with gradient circles */}
      <View style={styles.background}>
        <View style={[styles.gradientCircle, styles.circle1]} />
        <View style={[styles.gradientCircle, styles.circle2]} />
        <View style={[styles.gradientCircle, styles.circle3]} />
        <View style={[styles.gradientCircle, styles.circle4]} />
      </View>
      
      {/* Quick Alert */}
      {alertVisible && (
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ translateY: alertSlideAnim }],
              backgroundColor: alertType === 'success' ? theme.success : theme.error,
            },
          ]}
        >
          <Icon
            name={alertType === 'success' ? 'check-circle' : 'error'}
            size={20}
            color="#FFF"
            style={styles.alertIcon}
          />
          <Text style={styles.alertText}>{alertMessage}</Text>
        </Animated.View>
      )}

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Animated Logo */}
        <Animated.View
          style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2504/2504957.png' }}
              style={styles.logo}
            />
          </View>
          <Text style={styles.appName}>Reals TO Chat</Text>
          <Text style={styles.tagline}>Create. Connect. Chat.</Text>
        </Animated.View>
        
        {/* Registration Form */}
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            alwaysBounceVertical={false}
            overScrollMode="never"
          >
            <Text style={styles.sectionTitle}>Create Account</Text>
            
            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Icon name="person" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Phone Field - COMPACT DESIGN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.compactInputContainer}>
                <View style={styles.phoneInputContent}>
                  <Icon name="phone" size={18} color={theme.textSecondary} style={styles.compactInputIcon} />
                  <View style={styles.compactPhoneInputWrapper}>
                    <Text style={styles.compactCountryCode}>+91</Text>
                    <TextInput
                      style={styles.compactPhoneInput}
                      placeholder="Enter your number"
                      placeholderTextColor={theme.textTertiary}
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      maxLength={10}
                    />
                  </View>
                </View>
                <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.compactVerifyButton,
                      phoneVerified ? styles.compactVerifiedButton : isPhoneValid ? styles.compactValidButton : styles.compactUnverifiedButton,
                      (sendingOTP.phone || loading) && styles.disabledButton,
                    ]}
                    onPress={handleSendPhoneOTP}
                    disabled={phoneVerified || sendingOTP.phone || loading || !isPhoneValid}
                  >
                    {sendingOTP.phone ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : phoneVerified ? (
                      <Icon name="check-circle" size={14} color="#FFF" />
                    ) : (
                      <Text style={styles.compactVerifyButtonText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {/* Email Field - COMPACT DESIGN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.compactInputContainer}>
                <View style={styles.emailInputContent}>
                  <Icon name="email" size={18} color={theme.textSecondary} style={styles.compactInputIcon} />
                  <TextInput
                    style={styles.compactEmailInput}
                    placeholder="Enter your email address"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                </View>
                <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.compactVerifyButton,
                      emailVerified ? styles.compactVerifiedButton : isEmailValid ? styles.compactValidButton : styles.compactUnverifiedButton,
                      (sendingOTP.email || loading) && styles.disabledButton,
                    ]}
                    onPress={handleSendEmailOTP}
                    disabled={emailVerified || sendingOTP.email || loading || !isEmailValid}
                  >
                    {sendingOTP.email ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : emailVerified ? (
                      <Icon name="check-circle" size={14} color="#FFF" />
                    ) : (
                      <Text style={styles.compactVerifyButtonText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {/* Enhanced User ID Field - PERFECT DESIGN (Keep as is) */}
            <View style={styles.inputGroup}>
              <View style={styles.userIdHeader}>
                <Text style={styles.inputLabel}>User ID</Text>
                <View style={styles.userIdModeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.userIdModeOption,
                      userIdMode === 'auto' && styles.userIdModeOptionActive,
                    ]}
                    onPress={() => handleUserIdModeChange('auto')}
                  >
                    <Text style={[
                      styles.userIdModeText,
                      userIdMode === 'auto' && styles.userIdModeTextActive
                    ]}>
                      Auto-generate
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.userIdModeOption,
                      userIdMode === 'custom' && styles.userIdModeOptionActive,
                    ]}
                    onPress={() => handleUserIdModeChange('custom')}
                  >
                    <Text style={[
                      styles.userIdModeText,
                      userIdMode === 'custom' && styles.userIdModeTextActive
                    ]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.userIdInputContainer}>
                <View style={[
                  styles.userIdInputWrapper,
                  userIdMode === 'auto' && styles.userIdInputDisabled,
                  userIdError && styles.userIdInputError
                ]}>
                  <Icon name="badge" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.userIdInput}
                    placeholder={userIdMode === 'auto' ? 'Auto-generating...' : 'Enter your User ID'}
                    placeholderTextColor={theme.textTertiary}
                    value={userId}
                    onChangeText={handleUserIdChange}
                    editable={userIdMode === 'custom'}
                    autoCapitalize="characters"
                    maxLength={20}
                  />
                  
                  {userIdMode === 'custom' && userId && !userIdVerified && (
                    <TouchableOpacity
                      style={[
                        styles.verifyUserIdButton,
                        (checkingUserId || loading || !!userIdError) && styles.disabledButton,
                      ]}
                      onPress={handleVerifyUserId}
                      disabled={checkingUserId || loading || !!userIdError}
                    >
                      {checkingUserId ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.verifyUserIdText}>Verify</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  
                  {userIdVerified && (
                    <View style={styles.verifiedIndicator}>
                      <Icon name="check-circle" size={20} color={theme.success} />
                    </View>
                  )}
                </View>
                
                {/* User ID Status */}
                <View style={styles.userIdStatus}>
                  {userIdError ? (
                    <Text style={styles.userIdErrorText}>{userIdError}</Text>
                  ) : userIdVerified ? (
                    <Text style={styles.userIdSuccessText}>User ID is available and valid</Text>
                  ) : userIdMode === 'auto' ? (
                    <Text style={styles.userIdHelperText}>We'll automatically create a unique ID for you</Text>
                  ) : (
                    <Text style={styles.userIdHelperText}>
                      Must be 6+ characters, include a number, no special characters
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Password Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a strong password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity 
                style={styles.datePickerContainer} 
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="event" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <Text style={styles.datePickerText}>{formatDate(dateOfBirth)}</Text>
                <Icon name="calendar-today" size={18} color={theme.textTertiary} style={styles.calendarIcon} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderContainer}>
                {['male', 'female', 'other'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderOption,
                      gender === option && styles.selectedGender,
                    ]}
                    onPress={() => setGender(option)}
                  >
                    <Text style={[
                      styles.genderText,
                      gender === option && styles.selectedGenderText
                    ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Create Account</Text>
                  <Icon name="arrow-forward" size={20} color="#FFF" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
            
            {/* Login Link with proper bottom spacing */}
            <View style={styles.bottomSpacing}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => navigation.goBack()} 
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>
                  Already have an account? <Text style={styles.cancelButtonLink}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Phone OTP Modal */}
      <Modal
        visible={showPhoneOTPModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhoneOTPModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Phone Number</Text>
              <Text style={styles.modalSubtitle}>
                We've sent a 6-digit code to +91{phone}
              </Text>
            </View>
            <View style={styles.otpContainer}>
              {phoneOTP.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (phoneOTPFRefs.current[index] = ref)}
                  style={styles.otpDigitInput}
                  value={digit}
                  onChangeText={(text) => handlePhoneOTPChange(text, index)}
                  onKeyPress={(e) => handlePhoneOTPKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={index === 0}
                  textAlign="center"
                />
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowPhoneOTPModal(false);
                  setPhoneOTP(['', '', '', '', '', '']);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleVerifyPhoneOTP}
                >
                  <Text style={styles.modalButtonPrimaryText}>Verify</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email OTP Modal */}
      <Modal
        visible={showEmailOTPModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmailOTPModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Email Address</Text>
              <Text style={styles.modalSubtitle}>
                Enter the 6-digit code sent to {email}
              </Text>
            </View>
            <View style={styles.otpContainer}>
              {emailOTP.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (emailOTPFRefs.current[index] = ref)}
                  style={styles.otpDigitInput}
                  value={digit}
                  onChangeText={(text) => handleEmailOTPChange(text, index)}
                  onKeyPress={(e) => handleEmailOTPKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={index === 0}
                  textAlign="center"
                />
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowEmailOTPModal(false);
                  setEmailOTP(['', '', '', '', '', '']);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleVerifyEmailOTP}
                >
                  <Text style={styles.modalButtonPrimaryText}>Verify</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.15,
  },
  circle1: {
    width: Dimensions.get('window').width * 1.5,
    height: Dimensions.get('window').width * 1.5,
    backgroundColor: theme.primary,
    top: -Dimensions.get('window').width * 0.7,
    left: -Dimensions.get('window').width * 0.3,
  },
  circle2: {
    width: Dimensions.get('window').width * 1.2,
    height: Dimensions.get('window').width * 1.2,
    backgroundColor: theme.secondary,
    bottom: -Dimensions.get('window').width * 0.5,
    right: -Dimensions.get('window').width * 0.4,
  },
  circle3: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').width * 0.8,
    backgroundColor: theme.accent,
    bottom: Dimensions.get('window').height * 0.2,
    left: -Dimensions.get('window').width * 0.2,
  },
  circle4: {
    width: Dimensions.get('window').width * 0.6,
    height: Dimensions.get('window').width * 0.6,
    backgroundColor: theme.surfaceLight,
    top: Dimensions.get('window').height * 0.3,
    right: -Dimensions.get('window').width * 0.1,
  },
  alertContainer: {
    position: 'absolute',
    top: Dimensions.get('window').height * 0.12,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Dimensions.get('window').height * 0.02,
    marginBottom: 20,
  },
  logoWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: 'white',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 14,
    color: theme.textSecondary,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  formContainer: {
    width: '90%',
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    marginTop: 10,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  scrollContent: {
    paddingBottom: 40, // Increased bottom padding for safe area
  },
  bottomSpacing: {
    paddingTop: 10,
    paddingBottom: 20, // Extra padding for safe area
  },
  sectionTitle: {
    color: 'white',
    fontSize: 24,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surfaceLight,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // COMPACT INPUT STYLES FOR PHONE AND EMAIL
  compactInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48, // Reduced height for compact look
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  phoneInputContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailInputContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInputIcon: {
    marginRight: 10,
    width: 18,
  },
  compactPhoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactCountryCode: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    backgroundColor: theme.primaryDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactPhoneInput: {
    flex: 1,
    color: theme.text,
    fontSize: 14, // Slightly smaller font
    fontWeight: '500',
    paddingVertical: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  compactEmailInput: {
    flex: 1,
    color: theme.text,
    fontSize: 14, // Slightly smaller font
    fontWeight: '500',
    paddingVertical: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  compactVerifyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  compactUnverifiedButton: {
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
  },
  compactValidButton: {
    backgroundColor: theme.primary,
  },
  compactVerifiedButton: {
    backgroundColor: theme.success,
  },
  compactVerifyButtonText: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
  },

  // Enhanced User ID Styles (PERFECT - Keep as is)
  userIdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userIdModeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceLight,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  userIdModeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  userIdModeOptionActive: {
    backgroundColor: theme.primary,
  },
  userIdModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  userIdModeTextActive: {
    color: theme.text,
  },
  userIdInputContainer: {
    marginBottom: 4,
  },
  userIdInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surfaceLight,
    paddingHorizontal: 16,
  },
  userIdInputDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: theme.borderLight,
  },
  userIdInputError: {
    borderColor: theme.error,
  },
  userIdInput: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
    letterSpacing: 0.5,
  },
  verifyUserIdButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  verifyUserIdText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedIndicator: {
    marginLeft: 8,
  },
  userIdStatus: {
    marginTop: 6,
    marginLeft: 4,
  },
  userIdErrorText: {
    color: theme.error,
    fontSize: 12,
    fontWeight: '500',
  },
  userIdSuccessText: {
    color: theme.success,
    fontSize: 12,
    fontWeight: '500',
  },
  userIdHelperText: {
    color: theme.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },

  disabledButton: {
    opacity: 0.6,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surfaceLight,
    paddingHorizontal: 16,
  },
  datePickerText: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  calendarIcon: {
    marginLeft: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    backgroundColor: theme.surfaceLight,
  },
  selectedGender: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  genderText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedGenderText: {
    color: theme.text,
    fontWeight: '700',
  },
  submitButton: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
    flexDirection: 'row',
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  cancelButtonLink: {
    color: theme.primaryLight,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 28,
  },
  otpDigitInput: {
    width: 44,
    height: 52,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surfaceLight,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: theme.primary,
  },
  modalButtonSecondary: {
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalButtonPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalButtonSecondaryText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default React.memo(RegisterScreen);

// import React, { useEffect, useRef, useState } from 'react';
// import {
//   Animated,
//   Dimensions,
//   Easing,
//   Image,
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   Modal,
//   Platform,
//   ActivityIndicator,
//   KeyboardAvoidingView,
// } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import auth from '@react-native-firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import API_URL from './utiliti/config';
// import Icon from 'react-native-vector-icons/MaterialIcons';

// // Modern theme with professional colors
// const theme = {
//   background: '#0F0F23',
//   surface: '#1A1A2E',
//   surfaceLight: '#252547',
//   text: '#FFFFFF',
//   textSecondary: 'rgba(255, 255, 255, 0.7)',
//   textTertiary: 'rgba(255, 255, 255, 0.5)',
//   primary: '#6366F1',
//   primaryLight: '#818CF8',
//   primaryDark: '#4F46E5',
//   secondary: '#0EA5E9',
//   accent: '#8B5CF6',
//   success: '#10B981',
//   error: '#EF4444',
//   warning: '#F59E0B',
//   border: 'rgba(255, 255, 255, 0.1)',
//   borderLight: 'rgba(255, 255, 255, 0.05)',
// };

// const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
//   const { width, height } = Dimensions.get('window');
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(30)).current;
//   const scaleAnim = useRef(new Animated.Value(0.9)).current;
//   const alertSlideAnim = useRef(new Animated.Value(-100)).current;
//   const buttonAnim = useRef(new Animated.Value(1)).current;
  
//   // Form state
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [dateOfBirth, setDateOfBirth] = useState(new Date());
//   const [gender, setGender] = useState('male');
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [loading, setLoading] = useState(false);
  
//   // Enhanced User ID state
//   const [userId, setUserId] = useState('');
//   const [userIdMode, setUserIdMode] = useState<'auto' | 'custom'>('auto');
//   const [userIdVerified, setUserIdVerified] = useState(false);
//   const [checkingUserId, setCheckingUserId] = useState(false);
//   const [userIdError, setUserIdError] = useState('');
//   const [userIdTouched, setUserIdTouched] = useState(false);
  
//   // Verification states
//   const [phoneVerified, setPhoneVerified] = useState(false);
//   const [emailVerified, setEmailVerified] = useState(false);
//   const [showPhoneOTPModal, setShowPhoneOTPModal] = useState(false);
//   const [showEmailOTPModal, setShowEmailOTPModal] = useState(false);
//   const [phoneOTP, setPhoneOTP] = useState(['', '', '', '', '', '']);
//   const [emailOTP, setEmailOTP] = useState(['', '', '', '', '', '']);
//   const phoneOTPFRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));
//   const emailOTPFRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));
//   const [phoneConfirmation, setPhoneConfirmation] = useState<any>(null);
//   const [emailOTPGenerated, setEmailOTPGenerated] = useState('');
//   const [sendingOTP, setSendingOTP] = useState({ phone: false, email: false });

//   // Alert state
//   const [alertVisible, setAlertVisible] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertType, setAlertType] = useState('error');

//   // Animation for screen entry
//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 700,
//         easing: Easing.out(Easing.back(1)),
//         useNativeDriver: true,
//       }),
//       Animated.timing(scaleAnim, {
//         toValue: 1,
//         duration: 900,
//         easing: Easing.elastic(0.8),
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, [fadeAnim, slideAnim, scaleAnim]);

//   // Clean up registration flag when component unmounts
//   useEffect(() => {
//     return () => {
//       AsyncStorage.removeItem('isRegistering');
//     };
//   }, []);

//   // Auto-generate user ID on mount
//   useEffect(() => {
//     if (userIdMode === 'auto') {
//       handleGenerateUserId();
//     }
//   }, [userIdMode]);

//   // Enhanced User ID functions
//   const handleGenerateUserId = async () => {
//     try {
//       setCheckingUserId(true);
//       setUserIdError('');
//       const response = await fetch(`${API_URL}/api/auth/generate-user-id`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
      
//       const data = await response.json();
//       if (response.ok && data.success) {
//         setUserId(data.userId);
//         setUserIdVerified(true);
//         setUserIdError('');
//         showQuickAlert('Auto-generated User ID created!', 'success');
//       } else {
//         throw new Error(data.message || 'Failed to generate User ID');
//       }
//     } catch (error: any) {
//       console.error('Generate user ID error:', error);
//       showQuickAlert('Failed to generate User ID. Please try again.', 'error');
//       setUserIdVerified(false);
//     } finally {
//       setCheckingUserId(false);
//     }
//   };

//   const handleVerifyUserId = async () => {
//     if (!userId) {
//       setUserIdError('Please enter a User ID');
//       return;
//     }
    
//     try {
//       setCheckingUserId(true);
//       setUserIdError('');
//       const response = await fetch(`${API_URL}/api/auth/check-user-id`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ userId }),
//       });
      
//       const data = await response.json();
//       if (response.ok && data.success) {
//         setUserIdVerified(true);
//         setUserIdError('');
//         showQuickAlert('User ID is available!', 'success');
//       } else {
//         setUserIdVerified(false);
//         setUserIdError(data.message || 'User ID verification failed');
//         showQuickAlert(data.message || 'User ID verification failed', 'error');
//       }
//     } catch (error: any) {
//       console.error('Verify user ID error:', error);
//       setUserIdVerified(false);
//       setUserIdError('Failed to verify User ID');
//       showQuickAlert('Failed to verify User ID. Please try again.', 'error');
//     } finally {
//       setCheckingUserId(false);
//     }
//   };

//   const handleUserIdModeChange = (mode: 'auto' | 'custom') => {
//     setUserIdMode(mode);
//     setUserIdVerified(false);
//     setUserIdError('');
//     setUserIdTouched(false);
    
//     if (mode === 'auto') {
//       handleGenerateUserId();
//     } else {
//       setUserId('');
//     }
//   };

//   const validateUserId = (text: string) => {
//     if (text.length < 6) return 'Must be at least 6 characters';
//     if (!/\d/.test(text)) return 'Must contain at least one number';
//     if (!/^[a-zA-Z0-9]+$/.test(text)) return 'No special characters allowed';
//     return null;
//   };

//   const handleUserIdChange = (text: string) => {
//     const cleanedText = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
//     setUserId(cleanedText);
//     setUserIdTouched(true);
    
//     if (userIdMode === 'custom') {
//       setUserIdVerified(false);
//       const validationError = validateUserId(cleanedText);
//       setUserIdError(validationError || '');
//     }
//   };

//   // Toast alert animation (slide from top)
//   const showQuickAlert = (message: string, type: string = 'error') => {
//     setAlertMessage(message);
//     setAlertType(type);
//     setAlertVisible(true);
//     Animated.sequence([
//       Animated.timing(alertSlideAnim, {
//         toValue: 0,
//         duration: 300,
//         easing: Easing.out(Easing.ease),
//         useNativeDriver: true,
//       }),
//       Animated.timing(alertSlideAnim, {
//         toValue: -100,
//         duration: 300,
//         delay: 2500,
//         easing: Easing.in(Easing.ease),
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       setAlertVisible(false);
//       setAlertMessage('');
//     });
//   };

//   // Button highlight animation
//   const triggerButtonHighlight = () => {
//     Animated.sequence([
//       Animated.timing(buttonAnim, {
//         toValue: 1.05,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//       Animated.timing(buttonAnim, {
//         toValue: 1,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const validateIndianPhoneNumber = (number: string) => {
//     const regex = /^[6-9]\d{9}$/;
//     return regex.test(number);
//   };

//   const validateEmail = (email: string) => {
//     const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return regex.test(email);
//   };

//   const validatePassword = (password: string) => {
//     const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
//     return regex.test(password);
//   };

//   const handleDateChange = (event: any, selectedDate?: Date) => {
//     const currentDate = selectedDate || dateOfBirth;
//     setShowDatePicker(Platform.OS === 'ios');
//     setDateOfBirth(currentDate);
//   };

//   // Phone verification functions
//   const handleSendPhoneOTP = async () => {
//     if (!phone) {
//       showQuickAlert('Please enter a phone number', 'error');
//       return;
//     }
//     if (!validateIndianPhoneNumber(phone)) {
//       showQuickAlert('Please enter a valid Indian phone number', 'error');
//       return;
//     }
//     triggerButtonHighlight();
//     showQuickAlert('Sending OTP to phone...', 'success');
//     try {
//       setSendingOTP({ ...sendingOTP, phone: true });
//       await AsyncStorage.setItem('isRegistering', 'true');
//       const confirmation = await auth().signInWithPhoneNumber(`+91${phone}`);
//       setPhoneConfirmation(confirmation);
//       setShowPhoneOTPModal(true);
//     } catch (error: any) {
//       console.error('Phone OTP error:', error.code, error.message);
//       showQuickAlert('Failed to send OTP. Please try again.', 'error');
//       await AsyncStorage.removeItem('isRegistering');
//     } finally {
//       setSendingOTP({ ...sendingOTP, phone: false });
//     }
//   };

//   const handlePhoneOTPChange = async (text: string, index: number) => {
//     const newOTP = [...phoneOTP];
//     newOTP[index] = text;
//     setPhoneOTP(newOTP);
//     if (text && index < 5) {
//       phoneOTPFRefs.current[index + 1]?.focus();
//     }
//     if (index === 5 && text) {
//       const otp = newOTP.join('');
//       if (otp.length === 6) {
//         try {
//           setLoading(true);
//           await phoneConfirmation.confirm(otp);
//           await auth().signOut();
//           setPhoneVerified(true);
//           setShowPhoneOTPModal(false);
//           setPhoneOTP(['', '', '', '', '', '']);
//           showQuickAlert('Phone number verified successfully', 'success');
//         } catch (error: any) {
//           console.error('Phone OTP verification error:', error.code, error.message);
//           showQuickAlert('Invalid OTP', 'error');
//           setPhoneOTP(['', '', '', '', '', '']);
//         } finally {
//           setLoading(false);
//         }
//       }
//     }
//   };

//   const handlePhoneOTPKeyPress = (e: any, index: number) => {
//     if (e.nativeEvent.key === 'Backspace' && !phoneOTP[index] && index > 0) {
//       phoneOTPFRefs.current[index - 1]?.focus();
//     }
//   };

//   const getPhoneOTPValue = () => {
//     return phoneOTP.join('');
//   };

//   const handleVerifyPhoneOTP = async () => {
//     const otp = getPhoneOTPValue();
//     if (otp.length !== 6) {
//       showQuickAlert('Please enter a 6-digit OTP', 'error');
//       return;
//     }
//     triggerButtonHighlight();
//     try {
//       setLoading(true);
//       await phoneConfirmation.confirm(otp);
//       await auth().signOut();
//       setPhoneVerified(true);
//       setShowPhoneOTPModal(false);
//       setPhoneOTP(['', '', '', '', '', '']);
//       showQuickAlert('Phone number verified successfully', 'success');
//     } catch (error: any) {
//       console.error('Phone OTP verification error:', error.code, error.message);
//       showQuickAlert('Invalid OTP', 'error');
//       setPhoneOTP(['', '', '', '', '', '']);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSendEmailOTP = async () => {
//     if (!email) {
//       showQuickAlert('Please enter an email address', 'error');
//       return;
//     }
//     if (!validateEmail(email)) {
//       showQuickAlert('Please enter a valid email address', 'error');
//       return;
//     }

//     triggerButtonHighlight();
    
//     try {
//       setSendingOTP({ ...sendingOTP, email: true });
      
//       // Generate OTP
//       const otp = Math.floor(100000 + Math.random() * 900000).toString();
//       setEmailOTPGenerated(otp);
      
//       console.log('Generated OTP:', otp);
      
//       // Try to send via backend first
//       try {
//         const response = await fetch(`${API_URL}/api/auth/send-otp-email`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             email,
//             name: name || 'User',
//             otp,
//           }),
//         });
        
//         const data = await response.json();
        
//         if (response.ok) {
//           setShowEmailOTPModal(true);
//           showQuickAlert('OTP sent to your email!', 'success');
//         } else {
//           setShowEmailOTPModal(true);
//           showQuickAlert(`Backend email service unavailable. Use OTP: ${otp}`, 'warning');
//         }
//       } catch (backendError) {
//         console.log('Backend email service failed, showing OTP directly:', otp);
//         setShowEmailOTPModal(true);
//         showQuickAlert(`Email service temporary unavailable. Use OTP: ${otp}`, 'warning');
//       }
      
//     } catch (error: any) {
//       console.error('Email OTP error:', error);
//       showQuickAlert('Failed to process OTP request. Please try again.', 'error');
//     } finally {
//       setSendingOTP({ ...sendingOTP, email: false });
//     }
//   };

//   const handleEmailOTPChange = (text: string, index: number) => {
//     const newOTP = [...emailOTP];
//     newOTP[index] = text;
//     setEmailOTP(newOTP);
//     if (text && index < 5) {
//       emailOTPFRefs.current[index + 1]?.focus();
//     }
//     if (index === 5 && text) {
//       const otp = newOTP.join('');
//       if (otp.length === 6) {
//         try {
//           setLoading(true);
//           if (otp === emailOTPGenerated) {
//             setEmailVerified(true);
//             setShowEmailOTPModal(false);
//             setEmailOTP(['', '', '', '', '', '']);
//             showQuickAlert('Email verified successfully', 'success');
//           } else {
//             showQuickAlert('Invalid OTP', 'error');
//             setEmailOTP(['', '', '', '', '', '']);
//           }
//         } finally {
//           setLoading(false);
//         }
//       }
//     }
//   };

//   const handleEmailOTPKeyPress = (e: any, index: number) => {
//     if (e.nativeEvent.key === 'Backspace' && !emailOTP[index] && index > 0) {
//       emailOTPFRefs.current[index - 1]?.focus();
//     }
//   };

//   const getEmailOTPValue = () => {
//     return emailOTP.join('');
//   };

//   const handleVerifyEmailOTP = () => {
//     const otp = getEmailOTPValue();
//     if (otp.length !== 6) {
//       showQuickAlert('Please enter a 6-digit OTP', 'error');
//       return;
//     }
//     triggerButtonHighlight();
//     try {
//       setLoading(true);
//       if (otp === emailOTPGenerated) {
//         setEmailVerified(true);
//         setShowEmailOTPModal(false);
//         setEmailOTP(['', '', '', '', '', '']);
//         showQuickAlert('Email verified successfully', 'success');
//       } else {
//         showQuickAlert('Invalid OTP', 'error');
//         setEmailOTP(['', '', '', '', '', '']);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async () => {
//     if (!userId || !userIdVerified) {
//       showQuickAlert('Please set up your User ID', 'error');
//       return;
//     }

//     if (!name || !phone || !email || !password || !confirmPassword) {
//       showQuickAlert('Please fill all fields', 'error');
//       return;
//     }
//     if (!validateIndianPhoneNumber(phone)) {
//       showQuickAlert('Please enter a valid Indian phone number', 'error');
//       return;
//     }
//     if (!validateEmail(email)) {
//       showQuickAlert('Please enter a valid email address', 'error');
//       return;
//     }
//     if (!validatePassword(password)) {
//       showQuickAlert(
//         'Password must contain at least 1 uppercase, 1 lowercase, 1 special character, 1 number, and be 8-15 characters long',
//         'error'
//       );
//       return;
//     }
//     if (password !== confirmPassword) {
//       showQuickAlert('Passwords do not match', 'error');
//       return;
//     }
//     if (!phoneVerified && !emailVerified) {
//       showQuickAlert('Please verify either your phone number or email address', 'error');
//       return;
//     }
//     setLoading(true);
//     try {
//       const formattedDateOfBirth = dateOfBirth.toISOString().split('T')[0];
//       const response = await fetch(`${API_URL}/api/auth/register`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           name,
//           phone,
//           email,
//           password,
//           userId,
//           dateOfBirth: formattedDateOfBirth,
//           gender,
//           isPhoneVerified: phoneVerified,
//           isEmailVerified: emailVerified,
//         }),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         await AsyncStorage.removeItem('isRegistering');
//         showQuickAlert('Registration successful!', 'success');
//         navigation.reset({
//           index: 0,
//           routes: [{ name: 'Main' }],
//         });
//       } else {
//         showQuickAlert(data.message || 'Registration failed', 'error');
//       }
//     } catch (error: any) {
//       console.error('Registration error:', error);
//       showQuickAlert(`Network error: ${error.message}. Please check your connection and try again.`, 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (date: Date) => {
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//     });
//   };

//   const isPhoneValid = validateIndianPhoneNumber(phone);
//   const isEmailValid = validateEmail(email);

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      
//       {/* Background with gradient circles */}
//       <View style={styles.background}>
//         <View style={[styles.gradientCircle, styles.circle1]} />
//         <View style={[styles.gradientCircle, styles.circle2]} />
//         <View style={[styles.gradientCircle, styles.circle3]} />
//         <View style={[styles.gradientCircle, styles.circle4]} />
//       </View>
      
//       {/* Quick Alert */}
//       {alertVisible && (
//         <Animated.View
//           style={[
//             styles.alertContainer,
//             {
//               transform: [{ translateY: alertSlideAnim }],
//               backgroundColor: alertType === 'success' ? theme.success : theme.error,
//             },
//           ]}
//         >
//           <Icon
//             name={alertType === 'success' ? 'check-circle' : 'error'}
//             size={20}
//             color="#FFF"
//             style={styles.alertIcon}
//           />
//           <Text style={styles.alertText}>{alertMessage}</Text>
//         </Animated.View>
//       )}

//       {/* Content */}
//       <KeyboardAvoidingView
//         style={styles.content}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
//       >
//         {/* Animated Logo */}
//         <Animated.View
//           style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}
//         >
//           <View style={styles.logoWrapper}>
//             <Image
//               source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2504/2504957.png' }}
//               style={styles.logo}
//             />
//           </View>
//           <Text style={styles.appName}>Reals TO Chat</Text>
//           <Text style={styles.tagline}>Create. Connect. Chat.</Text>
//         </Animated.View>
        
//         {/* Registration Form */}
//         <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
//           <ScrollView
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             <Text style={styles.sectionTitle}>Create Account</Text>
            
//             {/* Name Field */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>Full Name</Text>
//               <View style={styles.inputContainer}>
//                 <Icon name="person" size={20} color={theme.textSecondary} style={styles.inputIcon} />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter your full name"
//                   placeholderTextColor={theme.textTertiary}
//                   value={name}
//                   onChangeText={setName}
//                   autoCapitalize="words"
//                   autoCorrect={false}
//                 />
//               </View>
//             </View>

//             {/* Phone Field - COMPACT DESIGN */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>Mobile Number</Text>
//               <View style={styles.compactInputContainer}>
//                 <View style={styles.phoneInputContent}>
//                   <Icon name="phone" size={18} color={theme.textSecondary} style={styles.compactInputIcon} />
//                   <View style={styles.compactPhoneInputWrapper}>
//                     <Text style={styles.compactCountryCode}>+91</Text>
//                     <TextInput
//                       style={styles.compactPhoneInput}
//                       placeholder="Enter your phone number"
//                       placeholderTextColor={theme.textTertiary}
//                       keyboardType="phone-pad"
//                       value={phone}
//                       onChangeText={setPhone}
//                       maxLength={10}
//                     />
//                   </View>
//                 </View>
//                 <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
//                   <TouchableOpacity
//                     style={[
//                       styles.compactVerifyButton,
//                       phoneVerified ? styles.compactVerifiedButton : isPhoneValid ? styles.compactValidButton : styles.compactUnverifiedButton,
//                       (sendingOTP.phone || loading) && styles.disabledButton,
//                     ]}
//                     onPress={handleSendPhoneOTP}
//                     disabled={phoneVerified || sendingOTP.phone || loading || !isPhoneValid}
//                   >
//                     {sendingOTP.phone ? (
//                       <ActivityIndicator size="small" color="#FFF" />
//                     ) : phoneVerified ? (
//                       <Icon name="check-circle" size={14} color="#FFF" />
//                     ) : (
//                       <Text style={styles.compactVerifyButtonText}>Verify</Text>
//                     )}
//                   </TouchableOpacity>
//                 </Animated.View>
//               </View>
//             </View>

//             {/* Email Field - COMPACT DESIGN */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>Email Address</Text>
//               <View style={styles.compactInputContainer}>
//                 <View style={styles.emailInputContent}>
//                   <Icon name="email" size={18} color={theme.textSecondary} style={styles.compactInputIcon} />
//                   <TextInput
//                     style={styles.compactEmailInput}
//                     placeholder="Enter your email address"
//                     placeholderTextColor={theme.textTertiary}
//                     keyboardType="email-address"
//                     value={email}
//                     onChangeText={setEmail}
//                     autoCapitalize="none"
//                   />
//                 </View>
//                 <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
//                   <TouchableOpacity
//                     style={[
//                       styles.compactVerifyButton,
//                       emailVerified ? styles.compactVerifiedButton : isEmailValid ? styles.compactValidButton : styles.compactUnverifiedButton,
//                       (sendingOTP.email || loading) && styles.disabledButton,
//                     ]}
//                     onPress={handleSendEmailOTP}
//                     disabled={emailVerified || sendingOTP.email || loading || !isEmailValid}
//                   >
//                     {sendingOTP.email ? (
//                       <ActivityIndicator size="small" color="#FFF" />
//                     ) : emailVerified ? (
//                       <Icon name="check-circle" size={14} color="#FFF" />
//                     ) : (
//                       <Text style={styles.compactVerifyButtonText}>Verify</Text>
//                     )}
//                   </TouchableOpacity>
//                 </Animated.View>
//               </View>
//             </View>

//             {/* Enhanced User ID Field - PERFECT DESIGN (Keep as is) */}
//             <View style={styles.inputGroup}>
//               <View style={styles.userIdHeader}>
//                 <Text style={styles.inputLabel}>User ID</Text>
//                 <View style={styles.userIdModeSelector}>
//                   <TouchableOpacity
//                     style={[
//                       styles.userIdModeOption,
//                       userIdMode === 'auto' && styles.userIdModeOptionActive,
//                     ]}
//                     onPress={() => handleUserIdModeChange('auto')}
//                   >
//                     <Text style={[
//                       styles.userIdModeText,
//                       userIdMode === 'auto' && styles.userIdModeTextActive
//                     ]}>
//                       Auto-generate
//                     </Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity
//                     style={[
//                       styles.userIdModeOption,
//                       userIdMode === 'custom' && styles.userIdModeOptionActive,
//                     ]}
//                     onPress={() => handleUserIdModeChange('custom')}
//                   >
//                     <Text style={[
//                       styles.userIdModeText,
//                       userIdMode === 'custom' && styles.userIdModeTextActive
//                     ]}>
//                       Custom
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
              
//               <View style={styles.userIdInputContainer}>
//                 <View style={[
//                   styles.userIdInputWrapper,
//                   userIdMode === 'auto' && styles.userIdInputDisabled,
//                   userIdError && styles.userIdInputError
//                 ]}>
//                   <Icon name="badge" size={20} color={theme.textSecondary} style={styles.inputIcon} />
//                   <TextInput
//                     style={styles.userIdInput}
//                     placeholder={userIdMode === 'auto' ? 'Auto-generating...' : 'Enter your User ID'}
//                     placeholderTextColor={theme.textTertiary}
//                     value={userId}
//                     onChangeText={handleUserIdChange}
//                     editable={userIdMode === 'custom'}
//                     autoCapitalize="characters"
//                     maxLength={20}
//                   />
                  
//                   {userIdMode === 'custom' && userId && !userIdVerified && (
//                     <TouchableOpacity
//                       style={[
//                         styles.verifyUserIdButton,
//                         (checkingUserId || loading || !!userIdError) && styles.disabledButton,
//                       ]}
//                       onPress={handleVerifyUserId}
//                       disabled={checkingUserId || loading || !!userIdError}
//                     >
//                       {checkingUserId ? (
//                         <ActivityIndicator size="small" color="#FFF" />
//                       ) : (
//                         <Text style={styles.verifyUserIdText}>Verify</Text>
//                       )}
//                     </TouchableOpacity>
//                   )}
                  
//                   {userIdVerified && (
//                     <View style={styles.verifiedIndicator}>
//                       <Icon name="check-circle" size={20} color={theme.success} />
//                     </View>
//                   )}
//                 </View>
                
//                 {/* User ID Status */}
//                 <View style={styles.userIdStatus}>
//                   {userIdError ? (
//                     <Text style={styles.userIdErrorText}>{userIdError}</Text>
//                   ) : userIdVerified ? (
//                     <Text style={styles.userIdSuccessText}>User ID is available and valid</Text>
//                   ) : userIdMode === 'auto' ? (
//                     <Text style={styles.userIdHelperText}>We'll automatically create a unique ID for you</Text>
//                   ) : (
//                     <Text style={styles.userIdHelperText}>
//                       Must be 6+ characters, include a number, no special characters
//                     </Text>
//                   )}
//                 </View>
//               </View>
//             </View>

//             {/* Password Fields */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>Password</Text>
//               <View style={styles.inputContainer}>
//                 <Icon name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Create a strong password"
//                   placeholderTextColor={theme.textTertiary}
//                   secureTextEntry
//                   value={password}
//                   onChangeText={setPassword}
//                   autoCapitalize="none"
//                 />
//               </View>
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>Confirm Password</Text>
//               <View style={styles.inputContainer}>
//                 <Icon name="lock-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Confirm your password"
//                   placeholderTextColor={theme.textTertiary}
//                   secureTextEntry
//                   value={confirmPassword}
//                   onChangeText={setConfirmPassword}
//                   autoCapitalize="none"
//                 />
//               </View>
//             </View>

//             {/* Date of Birth */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>Date of Birth</Text>
//               <TouchableOpacity 
//                 style={styles.datePickerContainer} 
//                 onPress={() => setShowDatePicker(true)}
//               >
//                 <Icon name="event" size={20} color={theme.textSecondary} style={styles.inputIcon} />
//                 <Text style={styles.datePickerText}>{formatDate(dateOfBirth)}</Text>
//                 <Icon name="calendar-today" size={18} color={theme.textTertiary} style={styles.calendarIcon} />
//               </TouchableOpacity>
//               {showDatePicker && (
//                 <DateTimePicker
//                   value={dateOfBirth}
//                   mode="date"
//                   display="default"
//                   onChange={handleDateChange}
//                   maximumDate={new Date()}
//                 />
//               )}
//             </View>

//             {/* Gender */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>Gender</Text>
//               <View style={styles.genderContainer}>
//                 {['male', 'female', 'other'].map((option) => (
//                   <TouchableOpacity
//                     key={option}
//                     style={[
//                       styles.genderOption,
//                       gender === option && styles.selectedGender,
//                     ]}
//                     onPress={() => setGender(option)}
//                   >
//                     <Text style={[
//                       styles.genderText,
//                       gender === option && styles.selectedGenderText
//                     ]}>
//                       {option.charAt(0).toUpperCase() + option.slice(1)}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </View>

//             {/* Submit Button */}
//             <TouchableOpacity
//               style={[styles.submitButton, loading && styles.disabledButton]}
//               onPress={handleSubmit}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator size="small" color="#FFFFFF" />
//               ) : (
//                 <>
//                   <Text style={styles.submitButtonText}>Create Account</Text>
//                   <Icon name="arrow-forward" size={20} color="#FFF" style={styles.buttonIcon} />
//                 </>
//               )}
//             </TouchableOpacity>
            
//             {/* Login Link */}
//             <TouchableOpacity 
//               style={styles.cancelButton} 
//               onPress={() => navigation.goBack()} 
//               disabled={loading}
//             >
//               <Text style={styles.cancelButtonText}>
//                 Already have an account? <Text style={styles.cancelButtonLink}>Sign In</Text>
//               </Text>
//             </TouchableOpacity>
//           </ScrollView>
//         </Animated.View>
//       </KeyboardAvoidingView>

//       {/* Phone OTP Modal */}
//       <Modal
//         visible={showPhoneOTPModal}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setShowPhoneOTPModal(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Verify Phone Number</Text>
//               <Text style={styles.modalSubtitle}>
//                 We've sent a 6-digit code to +91{phone}
//               </Text>
//             </View>
//             <View style={styles.otpContainer}>
//               {phoneOTP.map((digit, index) => (
//                 <TextInput
//                   key={index}
//                   ref={(ref) => (phoneOTPFRefs.current[index] = ref)}
//                   style={styles.otpDigitInput}
//                   value={digit}
//                   onChangeText={(text) => handlePhoneOTPChange(text, index)}
//                   onKeyPress={(e) => handlePhoneOTPKeyPress(e, index)}
//                   keyboardType="number-pad"
//                   maxLength={1}
//                   autoFocus={index === 0}
//                   textAlign="center"
//                 />
//               ))}
//             </View>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalButtonSecondary]}
//                 onPress={() => {
//                   setShowPhoneOTPModal(false);
//                   setPhoneOTP(['', '', '', '', '', '']);
//                 }}
//               >
//                 <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
//               </TouchableOpacity>
//               <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
//                 <TouchableOpacity
//                   style={[styles.modalButton, styles.modalButtonPrimary]}
//                   onPress={handleVerifyPhoneOTP}
//                 >
//                   <Text style={styles.modalButtonPrimaryText}>Verify</Text>
//                 </TouchableOpacity>
//               </Animated.View>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Email OTP Modal */}
//       <Modal
//         visible={showEmailOTPModal}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setShowEmailOTPModal(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Verify Email Address</Text>
//               <Text style={styles.modalSubtitle}>
//                 Enter the 6-digit code sent to {email}
//               </Text>
//             </View>
//             <View style={styles.otpContainer}>
//               {emailOTP.map((digit, index) => (
//                 <TextInput
//                   key={index}
//                   ref={(ref) => (emailOTPFRefs.current[index] = ref)}
//                   style={styles.otpDigitInput}
//                   value={digit}
//                   onChangeText={(text) => handleEmailOTPChange(text, index)}
//                   onKeyPress={(e) => handleEmailOTPKeyPress(e, index)}
//                   keyboardType="number-pad"
//                   maxLength={1}
//                   autoFocus={index === 0}
//                   textAlign="center"
//                 />
//               ))}
//             </View>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalButtonSecondary]}
//                 onPress={() => {
//                   setShowEmailOTPModal(false);
//                   setEmailOTP(['', '', '', '', '', '']);
//                 }}
//               >
//                 <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
//               </TouchableOpacity>
//               <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
//                 <TouchableOpacity
//                   style={[styles.modalButton, styles.modalButtonPrimary]}
//                   onPress={handleVerifyEmailOTP}
//                 >
//                   <Text style={styles.modalButtonPrimaryText}>Verify</Text>
//                 </TouchableOpacity>
//               </Animated.View>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.background,
//   },
//   background: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   gradientCircle: {
//     position: 'absolute',
//     borderRadius: 500,
//     opacity: 0.15,
//   },
//   circle1: {
//     width: Dimensions.get('window').width * 1.5,
//     height: Dimensions.get('window').width * 1.5,
//     backgroundColor: theme.primary,
//     top: -Dimensions.get('window').width * 0.7,
//     left: -Dimensions.get('window').width * 0.3,
//   },
//   circle2: {
//     width: Dimensions.get('window').width * 1.2,
//     height: Dimensions.get('window').width * 1.2,
//     backgroundColor: theme.secondary,
//     bottom: -Dimensions.get('window').width * 0.5,
//     right: -Dimensions.get('window').width * 0.4,
//   },
//   circle3: {
//     width: Dimensions.get('window').width * 0.8,
//     height: Dimensions.get('window').width * 0.8,
//     backgroundColor: theme.accent,
//     bottom: Dimensions.get('window').height * 0.2,
//     left: -Dimensions.get('window').width * 0.2,
//   },
//   circle4: {
//     width: Dimensions.get('window').width * 0.6,
//     height: Dimensions.get('window').width * 0.6,
//     backgroundColor: theme.surfaceLight,
//     top: Dimensions.get('window').height * 0.3,
//     right: -Dimensions.get('window').width * 0.1,
//   },
//   alertContainer: {
//     position: 'absolute',
//     top: Dimensions.get('window').height * 0.12,
//     left: 20,
//     right: 20,
//     padding: 16,
//     borderRadius: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     zIndex: 1000,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   alertIcon: {
//     marginRight: 12,
//   },
//   alertText: {
//     color: '#FFF',
//     fontSize: 14,
//     fontWeight: '600',
//     flex: 1,
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'flex-start',
//     alignItems: 'center',
//     paddingVertical: 10,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginTop: Dimensions.get('window').height * 0.02,
//     marginBottom: 20,
//   },
//   logoWrapper: {
//     backgroundColor: 'rgba(255, 255, 255, 0.08)',
//     padding: 16,
//     borderRadius: 20,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   logo: {
//     width: 60,
//     height: 60,
//     tintColor: 'white',
//   },
//   appName: {
//     fontSize: 28,
//     fontWeight: '800',
//     color: 'white',
//     marginBottom: 6,
//     letterSpacing: 0.8,
//     textShadowColor: 'rgba(255, 255, 255, 0.3)',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 10,
//   },
//   tagline: {
//     fontSize: 14,
//     color: theme.textSecondary,
//     letterSpacing: 0.5,
//     fontWeight: '500',
//   },
//   formContainer: {
//     width: '90%',
//     backgroundColor: theme.surface,
//     borderRadius: 20,
//     padding: 24,
//     marginTop: 10,
//     maxHeight: '80%',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.4,
//     shadowRadius: 16,
//     elevation: 16,
//     borderWidth: 1,
//     borderColor: theme.borderLight,
//   },
//   scrollContent: {
//     paddingBottom: 10,
//   },
//   sectionTitle: {
//     color: 'white',
//     fontSize: 24,
//     marginBottom: 30,
//     textAlign: 'center',
//     fontWeight: '700',
//     letterSpacing: 0.5,
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   inputLabel: {
//     color: theme.text,
//     fontSize: 14,
//     fontWeight: '600',
//     marginBottom: 8,
//     marginLeft: 4,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: '100%',
//     height: 52,
//     borderWidth: 1,
//     borderColor: theme.border,
//     borderRadius: 12,
//     backgroundColor: theme.surfaceLight,
//     paddingHorizontal: 16,
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     color: theme.text,
//     fontSize: 16,
//     fontWeight: '500',
//     paddingVertical: 8,
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//   },

//   // COMPACT INPUT STYLES FOR PHONE AND EMAIL
//   compactInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: '100%',
//     height: 48, // Reduced height for compact look
//     borderWidth: 1,
//     borderColor: theme.border,
//     borderRadius: 12,
//     backgroundColor: theme.surfaceLight,
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//   },
//   phoneInputContent: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   emailInputContent: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   compactInputIcon: {
//     marginRight: 10,
//     width: 18,
//   },
//   compactPhoneInputWrapper: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   compactCountryCode: {
//     color: theme.text,
//     fontSize: 14,
//     fontWeight: '600',
//     marginRight: 8,
//     backgroundColor: theme.primaryDark,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   compactPhoneInput: {
//     flex: 1,
//     color: theme.text,
//     fontSize: 14, // Slightly smaller font
//     fontWeight: '500',
//     paddingVertical: 4,
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//   },
//   compactEmailInput: {
//     flex: 1,
//     color: theme.text,
//     fontSize: 14, // Slightly smaller font
//     fontWeight: '500',
//     paddingVertical: 4,
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//   },
//   compactVerifyButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//     minWidth: 60,
//     height: 32,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginLeft: 8,
//   },
//   compactUnverifiedButton: {
//     backgroundColor: theme.surfaceLight,
//     borderWidth: 1,
//     borderColor: theme.border,
//   },
//   compactValidButton: {
//     backgroundColor: theme.primary,
//   },
//   compactVerifiedButton: {
//     backgroundColor: theme.success,
//   },
//   compactVerifyButtonText: {
//     color: theme.text,
//     fontSize: 11,
//     fontWeight: '700',
//   },

//   // Enhanced User ID Styles (PERFECT - Keep as is)
//   userIdHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   userIdModeSelector: {
//     flexDirection: 'row',
//     backgroundColor: theme.surfaceLight,
//     borderRadius: 8,
//     padding: 2,
//     borderWidth: 1,
//     borderColor: theme.border,
//   },
//   userIdModeOption: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },
//   userIdModeOptionActive: {
//     backgroundColor: theme.primary,
//   },
//   userIdModeText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: theme.textSecondary,
//   },
//   userIdModeTextActive: {
//     color: theme.text,
//   },
//   userIdInputContainer: {
//     marginBottom: 4,
//   },
//   userIdInputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: '100%',
//     height: 52,
//     borderWidth: 1,
//     borderColor: theme.border,
//     borderRadius: 12,
//     backgroundColor: theme.surfaceLight,
//     paddingHorizontal: 16,
//   },
//   userIdInputDisabled: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderColor: theme.borderLight,
//   },
//   userIdInputError: {
//     borderColor: theme.error,
//   },
//   userIdInput: {
//     flex: 1,
//     color: theme.text,
//     fontSize: 16,
//     fontWeight: '600',
//     paddingVertical: 8,
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//     letterSpacing: 0.5,
//   },
//   verifyUserIdButton: {
//     backgroundColor: theme.primary,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//     marginLeft: 8,
//   },
//   verifyUserIdText: {
//     color: theme.text,
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   verifiedIndicator: {
//     marginLeft: 8,
//   },
//   userIdStatus: {
//     marginTop: 6,
//     marginLeft: 4,
//   },
//   userIdErrorText: {
//     color: theme.error,
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   userIdSuccessText: {
//     color: theme.success,
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   userIdHelperText: {
//     color: theme.textTertiary,
//     fontSize: 12,
//     fontWeight: '500',
//   },

//   disabledButton: {
//     opacity: 0.6,
//   },
//   datePickerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: '100%',
//     height: 52,
//     borderWidth: 1,
//     borderColor: theme.border,
//     borderRadius: 12,
//     backgroundColor: theme.surfaceLight,
//     paddingHorizontal: 16,
//   },
//   datePickerText: {
//     flex: 1,
//     color: theme.text,
//     fontSize: 16,
//     fontWeight: '500',
//     marginLeft: 12,
//   },
//   calendarIcon: {
//     marginLeft: 8,
//   },
//   genderContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     gap: 10,
//   },
//   genderOption: {
//     flex: 1,
//     height: 44,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: theme.border,
//     borderRadius: 10,
//     backgroundColor: theme.surfaceLight,
//   },
//   selectedGender: {
//     backgroundColor: theme.primary,
//     borderColor: theme.primary,
//   },
//   genderText: {
//     color: theme.textSecondary,
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   selectedGenderText: {
//     color: theme.text,
//     fontWeight: '700',
//   },
//   submitButton: {
//     width: '100%',
//     height: 56,
//     borderRadius: 14,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 10,
//     marginBottom: 16,
//     flexDirection: 'row',
//     backgroundColor: theme.primary,
//     shadowColor: theme.primary,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.4,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   submitButtonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: '700',
//     letterSpacing: 0.5,
//   },
//   buttonIcon: {
//     marginLeft: 8,
//   },
//   cancelButton: {
//     padding: 12,
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     color: theme.textSecondary,
//     fontSize: 14,
//     textAlign: 'center',
//   },
//   cancelButtonLink: {
//     color: theme.primaryLight,
//     fontWeight: '700',
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     padding: 20,
//   },
//   modalContent: {
//     width: '90%',
//     backgroundColor: theme.surface,
//     borderRadius: 20,
//     padding: 24,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.4,
//     shadowRadius: 16,
//     elevation: 16,
//     borderWidth: 1,
//     borderColor: theme.borderLight,
//   },
//   modalHeader: {
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   modalTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: 'white',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   modalSubtitle: {
//     fontSize: 14,
//     color: theme.textSecondary,
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   otpContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginBottom: 28,
//   },
//   otpDigitInput: {
//     width: 44,
//     height: 52,
//     borderWidth: 2,
//     borderColor: theme.border,
//     borderRadius: 12,
//     backgroundColor: theme.surfaceLight,
//     color: '#FFFFFF',
//     fontSize: 20,
//     fontWeight: '700',
//     textAlign: 'center',
//     marginHorizontal: 4,
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     gap: 12,
//   },
//   modalButton: {
//     flex: 1,
//     height: 48,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalButtonPrimary: {
//     backgroundColor: theme.primary,
//   },
//   modalButtonSecondary: {
//     backgroundColor: theme.surfaceLight,
//     borderWidth: 1,
//     borderColor: theme.border,
//   },
//   modalButtonPrimaryText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   modalButtonSecondaryText: {
//     color: theme.textSecondary,
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default React.memo(RegisterScreen);