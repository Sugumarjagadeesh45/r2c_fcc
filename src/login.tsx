import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, signInWithPhoneNumber, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';



import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './utiliti/config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useUser } from './context/UserContext';
import { getApp } from '@react-native-firebase/app';

const theme = {
  background: '#121212',
  text: '#FFFFFF',
  primary: '#FF0050',
  secondary: '#00F0FF',
  accent: '#8A2BE2',
};

const LoginScreen = ({ navigation }) => {
  const { width, height } = Dimensions.get('window');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [otp, setOtp] = useState('');
  const [authMethod, setAuthMethod] = useState('email');
  
  const { login } = useUser();

 
  const validateIndianPhoneNumber = (number) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(number);
  };

 
  // In LoginScreen.tsx - Update the useEffect
useEffect(() => {
  const auth = getAuth();
  
  const subscriber = onAuthStateChanged(auth, async (user) => {
    console.log('🔥 LoginScreen - Auth state changed:', user ? user.uid : 'No user');
    
    // Don't auto-navigate here - let AuthNavigator handle it
    // This prevents the blinking issue
  });
  
  // Only handle animations here
  Animated.parallel([
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.back(1)), useNativeDriver: true }),
    Animated.timing(scaleAnim, { toValue: 1, duration: 1000, easing: Easing.elastic(1), useNativeDriver: true }),
  ]).start();
  
  GoogleSignin.configure({
    webClientId: '885187906304-gt91ibpeqgbqpc991phkkntkjjnp8ui0.apps.googleusercontent.com',
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: ['profile', 'email'],
  });
  
  return () => subscriber();
}, [fadeAnim, slideAnim, scaleAnim, navigation]);



  const handlePhoneLogin = async () => {
    if (loading) return;
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (!validateIndianPhoneNumber(cleanedNumber)) {
      Alert.alert('Invalid Number', 'Please enter a valid Indian phone number');
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth();
      const confirmationResult = await signInWithPhoneNumber(auth, `+91${cleanedNumber}`);
      console.log('Phone auth initiated, confirmation:', !!confirmationResult);
      setConfirmation(confirmationResult);
      setShowOTPModal(true);
    } catch (error) {
      console.error('Phone login error:', error);
      if (error.code === 'auth/billing-not-enabled') {
        Alert.alert('Billing Required', 'Phone authentication requires a paid Firebase plan. Please use Google Sign-In or enable billing in Firebase.');
      } else {
        Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };




  

  // In your LoginScreen.js, update the handleEmailLogin function:
const handleEmailLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please enter email and password');
    return;
  }
  setLoading(true);
  try {
    console.log('Attempting login with email:', email);
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    // Log the response status and text for debugging
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid server response');
    }
    
    console.log('Login response:', data);
    
if (response.ok && data.success) {
  const loginResult = await login(
    data.token,
    {
      user: data.user,
      userData: data.user, // backend already returns profile
    },
    data.isNewUser
  );

  if (!loginResult.success) {
    throw new Error(loginResult.error);
  }
}


// In handleGoogleLogin function
if (response.ok && data.success) {
  const loginResult = await login(
    data.token,
    {
      user: data.user,
      userData: data.user,
    },
    data.isNewUser
  );

  if (!loginResult.success) {
    throw new Error(loginResult.error);
  }
}


// In handleVerifyOTP function
if (response.ok && data.success) {
  const loginResult = await login(
    data.token,
    {
      user: data.user,
      userData: data.user,
    },
    data.isNewUser
  );

  if (!loginResult.success) {
    throw new Error(loginResult.error);
  }

  setShowOTPModal(false);
  setOtp('');
}

  } catch (error) {
    console.error('Email login error:', error);
    Alert.alert('Error', error.message || 'Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};




// LoginScreen.tsx - Update the handleGoogleLogin and handleVerifyOTP functions

// Update handleGoogleLogin
const handleGoogleLogin = async () => {
  if (loading) return;
  setLoading(true);
  try {
    const hasPlayServices = await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
    
    if (!hasPlayServices) {
      throw new Error('Google Play Services are not available');
    }
    
    const userInfo = await GoogleSignin.signIn();
    console.log('Google Sign-In Response:', JSON.stringify(userInfo, null, 2));
    
    const idToken = userInfo.idToken || (userInfo.data && userInfo.data.idToken);
    
    if (!idToken) {
      throw new Error('No ID token found in Google Sign-In response');
    }
    
    const app = getApp();
    const auth = getAuth(app);
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, googleCredential);

    const firebaseUser = userCredential.user;
    console.log('Firebase user:', firebaseUser.uid, firebaseUser.email);
    
    const userData = {
      idToken: idToken
    };
    
    const response = await fetch(`${API_URL}/api/auth/google-signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    console.log('Google backend response:', data);
    
    if (response.ok && data.success) {
      console.log('Google authentication successful');
      
      // Store user profile with registrationComplete flag
      const userProfileData = {
        ...data.user,
        registrationComplete: data.user.registrationComplete !== false // Default to true if not specified
      };
      
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfileData));
      
      // Use UserContext to handle login
      const loginResult = await login(data.token, {
        user: data.user,
        userData: userProfileData
      });
      
      if (loginResult.success) {
        console.log('✅ Google login completed, navigation will be handled by AuthNavigator');
        // Navigation will be handled by AppNavigator based on registrationComplete
      } else {
        throw new Error(loginResult.error || 'Failed to update authentication state');
      }
    } else {
      throw new Error(data.message || `Backend returned ${response.status}`);
    }
    
  } catch (error) {
    console.log('Google Sign-In error:', error);
    
    let errorMessage = 'An unknown error occurred';
    
    if (error.code) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          errorMessage = 'You cancelled the Google sign-in process';
          break;
        case statusCodes.IN_PROGRESS:
          errorMessage = 'Another sign-in process is already in progress';
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          errorMessage = 'Google Play Services is not available';
          break;
        default:
          errorMessage = error.message || 'An unknown error occurred';
      }
    } else {
      errorMessage = error.message || 'An unknown error occurred';
    }
    
    Alert.alert('Error', errorMessage);
  } finally {
    setLoading(false);
  }
};

// Update handleVerifyOTP
const handleVerifyOTP = async () => {
  if (!confirmation || !otp || otp.length !== 6) {
    Alert.alert('Error', 'Please enter a valid 6-digit OTP');
    return;
  }
  setLoading(true);
  try {
    const result = await confirmation.confirm(otp);
    const currentUser = result.user;
    console.log('OTP verified, user:', currentUser.uid, currentUser.phoneNumber);
    if (currentUser) {
      const phone = `+91${phoneNumber}`;
      const response = await fetch(`${API_URL}/api/auth/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const data = await response.json();
      console.log('verify-phone response:', data);
      if (response.ok) {
        console.log('Phone verification successful');
        
        // Store user profile with registrationComplete flag
        const userProfileData = {
          ...data.user,
          registrationComplete: data.user.registrationComplete !== false // Default to true if not specified
        };
        
        await AsyncStorage.setItem('userProfile', JSON.stringify(userProfileData));
        
        // Use UserContext to handle login
        const loginResult = await login(data.token, {
          user: data.user,
          userData: userProfileData
        });
        
        if (loginResult.success) {
          setShowOTPModal(false);
          setOtp('');
          console.log('✅ Phone login completed, navigation will be handled by AuthNavigator');
          // Navigation will be handled by AppNavigator based on registrationComplete
        } else {
          throw new Error(loginResult.error || 'Failed to update authentication state');
        }
      } else {
        console.error('verify-phone failed:', data.message);
        Alert.alert('Error', data.message || 'Failed to verify user status');
      }
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    Alert.alert('Invalid OTP', error.message || 'The OTP you entered is incorrect. Please try again.');
  } finally {
    setLoading(false);
  }
};





  const handleSocialLogin = (provider) => {
    if (provider === 'google') {
      handleGoogleLogin();
    } else {
      Alert.alert('Social Login', `Login with ${provider} would be implemented here`);
    }
  };

  return (
    <SafeAreaView style={deepseekStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={deepseekStyles.background}>
        <View style={[deepseekStyles.gradientCircle, deepseekStyles.circle1]} />
        <View style={[deepseekStyles.gradientCircle, deepseekStyles.circle2]} />
        <View style={[deepseekStyles.gradientCircle, deepseekStyles.circle3]} />
        <View style={[deepseekStyles.gradientCircle, deepseekStyles.circle4]} />
      </View>
      <View style={deepseekStyles.content}>
        <Animated.View
          style={[
            deepseekStyles.logoContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
          ]}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2504/2504957.png' }}
            style={deepseekStyles.logo}
          />
          <Text style={deepseekStyles.appName}>Reals to Chat</Text>
          <Text style={deepseekStyles.tagline}>Create. Connect. Chat.</Text>
        </Animated.View>
        <View style={deepseekStyles.authMethodContainer}>
          <TouchableOpacity
            style={[
              deepseekStyles.authMethodButton,
              authMethod === 'email' && deepseekStyles.activeAuthMethod,
            ]}
            onPress={() => setAuthMethod('email')}
          >
            <Text style={deepseekStyles.authMethodText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              deepseekStyles.authMethodButton,
              authMethod === 'phone' && deepseekStyles.activeAuthMethod,
            ]}
            onPress={() => setAuthMethod('phone')}
          >
            <Text style={deepseekStyles.authMethodText}>Phone</Text>
          </TouchableOpacity>
        </View>
        {authMethod === 'email' && (
          <Animated.View
            style={[
              deepseekStyles.formContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TextInput
              style={deepseekStyles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={deepseekStyles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={[
                deepseekStyles.button,
                deepseekStyles.loginButton,
                loading && deepseekStyles.disabledButton,
              ]}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              <Text style={deepseekStyles.buttonText}>
                {loading ? 'Logging In...' : 'Login'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        {authMethod === 'phone' && (
          <Animated.View
            style={[
              deepseekStyles.formContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={deepseekStyles.sectionTitle}>Login with Mobile Number</Text>
            <View style={deepseekStyles.phoneInputContainer}>
              <Text style={deepseekStyles.countryCode}>+91</Text>
              <TextInput
                style={deepseekStyles.phoneInput}
                placeholder="Enter your phone number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
                editable={!loading}
              />
            </View>
            <TouchableOpacity
              style={[
                deepseekStyles.button,
                deepseekStyles.loginButton,
                loading && deepseekStyles.disabledButton,
              ]}
              onPress={handlePhoneLogin}
              disabled={loading}
            >
              <Text style={deepseekStyles.buttonText}>
                {loading ? 'Sending OTP...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        <View style={deepseekStyles.divider}>
          <View style={deepseekStyles.dividerLine} />
          <Text style={deepseekStyles.dividerText}>OR</Text>
          <View style={deepseekStyles.dividerLine} />
        </View>
        <Animated.View
          style={[
            deepseekStyles.socialContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={deepseekStyles.sectionTitle}>Continue with</Text>
          <View style={deepseekStyles.socialButtons}>
            <TouchableOpacity
              style={[
                deepseekStyles.socialButton,
                { backgroundColor: '#DB4437' },
                loading && deepseekStyles.disabledButton,
              ]}
              onPress={() => handleSocialLogin('google')}
              disabled={loading}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }}
                style={deepseekStyles.socialIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                deepseekStyles.socialButton,
                { backgroundColor: '#4267B2' },
                loading && deepseekStyles.disabledButton,
              ]}
              onPress={() => handleSocialLogin('facebook')}
              disabled={loading}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png' }}
                style={deepseekStyles.socialIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                deepseekStyles.socialButton,
                { backgroundColor: '#333333' },
                loading && deepseekStyles.disabledButton,
              ]}
              onPress={() => handleSocialLogin('github')}
              disabled={loading}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/733/733553.png' }}
                style={deepseekStyles.socialIcon}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
        <Animated.View style={[deepseekStyles.footer, { opacity: fadeAnim }]}>
          <Text style={deepseekStyles.footerText}>
            Don't have an account?
            <Text
              style={deepseekStyles.footerLink}
              onPress={() => navigation.navigate('Register')}
            >
              {' '}
              Register here
            </Text>
          </Text>
          <Text style={[deepseekStyles.footerText, { marginTop: 10 }]}>
            By continuing, you agree to our Terms of Service
          </Text>
          <Text style={deepseekStyles.footerText}>and Privacy Policy.</Text>
        </Animated.View>
      </View>
      <Modal
        visible={showOTPModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowOTPModal(false);
          setOtp('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>OTP Verification</Text>
            <Text style={styles.modalSubtitle}>
              We've sent a 6-digit code to +91{phoneNumber}
            </Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowOTPModal(false);
                  setOtp('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.verifyButton, loading && styles.disabledButton]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                <Text style={styles.verifyButtonText}>
                  {loading ? 'Verifying...' : 'Verify'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const deepseekStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
    opacity: 0.4,
  },
  circle1: {
    width: Dimensions.get('window').width * 1.5,
    height: Dimensions.get('window').width * 1.5,
    backgroundColor: '#FF0050',
    top: -Dimensions.get('window').width * 0.7,
    left: -Dimensions.get('window').width * 0.3,
  },
  circle2: {
    width: Dimensions.get('window').width * 1.2,
    height: Dimensions.get('window').width * 1.2,
    backgroundColor: '#00F0FF',
    bottom: -Dimensions.get('window').width * 0.5,
    right: -Dimensions.get('window').width * 0.4,
  },
  circle3: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').width * 0.8,
    backgroundColor: '#8A2BE2',
    bottom: Dimensions.get('window').height * 0.2,
    left: -Dimensions.get('window').width * 0.2,
  },
  circle4: {
    width: Dimensions.get('window').width * 0.6,
    height: Dimensions.get('window').width * 0.6,
    backgroundColor: '#1A1A2E',
    top: Dimensions.get('window').height * 0.3,
    right: -Dimensions.get('window').width * 0.1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Dimensions.get('window').height * 0.1,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
    tintColor: 'white',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  authMethodContainer: {
    flexDirection: 'row',
    width: '80%',
    marginBottom: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  authMethodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeAuthMethod: {
    backgroundColor: theme.primary,
  },
  authMethodText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  countryCode: {
    color: 'white',
    paddingHorizontal: 15,
    fontSize: 16,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    color: 'white',
    fontSize: 16,
    paddingRight: 15,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: '#FF0050',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 10,
    fontSize: 12,
  },
  socialContainer: {
    width: '100%',
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  socialIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  footer: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontSize: 12,
  },
  footerLink: {
    color: '#FF0050',
    fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  otpInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    fontSize: 18,
    paddingHorizontal: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    width: '45%',
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  verifyButton: {
    backgroundColor: '#FF0050',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;