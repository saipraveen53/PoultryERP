import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { jwtDecode } from "jwt-decode";
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { PoultryContext } from './(utils)/Context';
import "./globals.css";

const { height, width } = Dimensions.get('window');

export default function Login() {
  const router = useRouter();
  const { isAuthenticated, setIsAuthenticated } = useContext(PoultryContext);

  // --- LOGIN STATE ---
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- SIGNUP STATE ---
  const [signupVisible, setSignupVisible] = useState(false);
  const [sUsername, setSUsername] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPassword, setSPassword] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sLoading, setSLoading] = useState(false);

  // --- LOGIN HANDLER ---
  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('Please enter both Username/Email and Password.');
      return;
    }

    setIsLoading(true);

    try {
      const loginPayload = {
        username: username,
        password: password,
      };

      // Existing Login Endpoint (Port 8083)
      const response = await axios.post('http://192.168.0.110:8083/api/auth/login', loginPayload);
      
      if(response.status === 200){
        setIsAuthenticated(true);
        console.log('Login Successful:', response.data);
        await AsyncStorage.setItem("userToken", response.data.token);
        
        const decoded: any = jwtDecode(response.data.token);
        console.log("Logged In Role :", decoded.roles[0]);
        
        if(decoded.roles[0] === "VENDOR"){
          router.replace('/(vendor)/Orders');
        } else {
          router.replace('/(admin)/Dashboard');
        }
      }
    } catch (err: any) {
      console.error('Login Failed:', err.message);
      setError(err.response?.data?.message || 'Invalid Credentials or Server Error.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- SIGNUP HANDLER ---
  const handleSignup = async () => {
    if(!sUsername || !sEmail || !sPassword || !sPhone) {
        Alert.alert("Missing Details", "Please fill all fields to create an account.");
        return;
    }

    setSLoading(true);

    try {
        const payload = {
            username: sUsername,
            email: sEmail,
            password: sPassword,
            phone: sPhone
        };

        // Requested Signup Endpoint (Port 8080)
        const response = await axios.post('http://192.168.0.110:8083/api/auth/vendor/signup', payload);

        if(response.status === 200 || response.status === 201) {
            Alert.alert("Success", "Account created successfully! Please Login.");
            setSignupVisible(false);
            // Reset Form
            setSUsername('');
            setSEmail('');
            setSPassword('');
            setSPhone('');
        }
    } catch (error: any) {
        console.error("Signup Error:", error);
        Alert.alert("Registration Failed", error.response?.data?.message || "Could not connect to server.");
    } finally {
        setSLoading(false);
    }
  };

  return (
    // MAIN CONTAINER
    <View className="flex-1 bg-gray-900">
      
      {/* 1. BACKGROUND IMAGE LAYER */}
      <Image
        source={require('../assets/images/background.jpg')}
        className="absolute inset-0 w-full h-full z-0"
        resizeMode="cover"
        style={{ width: '100%', height: '100%' }}
      />

      {/* 2. DARK OVERLAY LAYER */}
      <View className="absolute inset-0 bg-black/50 z-0" />

      {/* 3. CONTENT LAYER */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 z-10"
      >
        <ScrollView
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingBottom: 20 
          }}
          className="w-full"
          keyboardShouldPersistTaps="handled"
        >
          {/* Responsive Card Container */}
          <View className="w-full md:w-[420px] p-6 items-center">
            
            {/* LOGO & HEADING */}
            <View className="items-center mb-6">
              <View className="h-20 w-20 bg-white/10 rounded-full items-center justify-center mb-3 border border-white/20 backdrop-blur-md">
                <Text className="text-4xl">🐔</Text> 
              </View>
              <Text className="text-3xl font-bold text-white shadow-md text-center">Poultry Farm</Text>
              <Text className="text-gray-300 text-base font-medium text-center">Manager Portal</Text>
            </View>

            {/* LOGIN FORM CARD */}
            <View 
              className="w-full p-6 rounded-3xl border border-white/20 shadow-2xl space-y-4"
              style={{
                backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.1)' : '#00000055',
                backdropFilter: Platform.OS === 'web' ? 'blur(15px)' : undefined, 
              }}
            >
              
              {/* Error Box */}
              {error ? (
                <View className="bg-red-500/20 p-3 rounded-xl border border-red-500/50 flex-row items-center mb-2">
                  <Ionicons name="alert-circle" size={20} color="#fca5a5" />
                  <Text className="text-red-100 text-sm font-bold ml-2 flex-1">{error}</Text>
                </View>
              ) : null}

              {/* Username Input */}
              <View>
                <Text className="text-gray-200 font-semibold mb-2 ml-1 text-sm">Username / Email ID</Text>
                <TextInput
                  className="w-full bg-white/90 rounded-xl px-4 py-3.5 text-gray-900 border border-white/20 focus:border-orange-500 font-medium"
                  placeholder="e.g., admin"
                  placeholderTextColor="#6b7280"
                  value={username} 
                  onChangeText={(t) => { setUsername(t); setError(''); }} 
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-gray-200 font-semibold mb-2 ml-1 text-sm">Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    className="w-full bg-white/90 rounded-xl px-4 py-3.5 text-gray-900 border border-white/20 focus:border-orange-500 font-medium pr-12"
                    placeholder="••••••••"
                    placeholderTextColor="#6b7280"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(''); }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 p-2"
                  >
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#4b5563" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity className="items-end mt-2">
                  <Text className="text-orange-300 font-medium text-xs">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                onPress={handleLogin}
                disabled={isLoading}
                className={`rounded-xl py-3.5 shadow-lg mt-2 border border-orange-500 ${isLoading ? 'bg-orange-800' : 'bg-orange-600 active:bg-orange-700'}`}
              >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text className="text-white text-center font-bold text-lg tracking-wide">LOGIN</Text>
                )}
              </TouchableOpacity>

              {/* Vendor Link INSIDE the card */}
              <View className="flex-row justify-center items-center mt-4 pt-4 border-t border-white/10">
                 <Text className="text-gray-300 text-sm mr-2">New Vendor?</Text>
                 <TouchableOpacity onPress={() => setSignupVisible(true)}>
                    <Text className="text-white font-bold text-sm underline decoration-orange-500">Create Account</Text>
                 </TouchableOpacity>
              </View>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- SIGNUP MODAL (GLASS STYLE) --- */}
      <Modal 
        animationType="fade" 
        transparent={true} 
        visible={signupVisible} 
        onRequestClose={() => setSignupVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70 px-6">
            <View 
                className="w-full max-w-[350px] rounded-3xl p-6 shadow-2xl border border-white/20"
                style={{
                    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.1)' : '#00000088', // Glass Effect
                    backdropFilter: Platform.OS === 'web' ? 'blur(15px)' : undefined, 
                }}
            >
                
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-xl font-bold text-white">New Account ✨</Text>
                    <TouchableOpacity onPress={() => setSignupVisible(false)} className="bg-white/20 p-2 rounded-full">
                        <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View className="space-y-4">
                    <View>
                        <Text className="text-gray-200 text-[10px] font-bold mb-1 ml-1">USERNAME</Text>
                        <TextInput 
                            className="bg-white/90 border border-white/20 rounded-xl px-4 py-3 text-gray-900 text-sm font-medium"
                            placeholder="Choose a username"
                            placeholderTextColor="#6b7280"
                            value={sUsername}
                            onChangeText={setSUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View>
                        <Text className="text-gray-200 text-[10px] font-bold mb-1 ml-1">EMAIL ADDRESS</Text>
                        <TextInput 
                            className="bg-white/90 border border-white/20 rounded-xl px-4 py-3 text-gray-900 text-sm font-medium"
                            placeholder="yourname@email.com"
                            placeholderTextColor="#6b7280"
                            keyboardType="email-address"
                            value={sEmail}
                            onChangeText={setSEmail}
                            autoCapitalize="none"
                        />
                    </View>

                    <View>
                        <Text className="text-gray-200 text-[10px] font-bold mb-1 ml-1">PHONE NUMBER</Text>
                        <TextInput 
                            className="bg-white/90 border border-white/20 rounded-xl px-4 py-3 text-gray-900 text-sm font-medium"
                            placeholder="98480..."
                            placeholderTextColor="#6b7280"
                            keyboardType="phone-pad"
                            value={sPhone}
                            onChangeText={setSPhone}
                        />
                    </View>

                    <View>
                        <Text className="text-gray-200 text-[10px] font-bold mb-1 ml-1">PASSWORD</Text>
                        <TextInput 
                            className="bg-white/90 border border-white/20 rounded-xl px-4 py-3 text-gray-900 text-sm font-medium"
                            placeholder="Min 6 characters"
                            placeholderTextColor="#6b7280"
                            secureTextEntry
                            value={sPassword}
                            onChangeText={setSPassword}
                        />
                    </View>

                    <TouchableOpacity 
                        className={`mt-4 py-3.5 rounded-xl items-center shadow-lg border border-orange-500 ${sLoading ? 'bg-orange-800' : 'bg-orange-600'}`}
                        onPress={handleSignup}
                        disabled={sLoading}
                    >
                        {sLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text className="text-white font-bold text-sm tracking-wide">REGISTER VENDOR</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* Web Footer Copyright */}
      {Platform.OS === 'web' && (
        <View className="absolute bottom-2 w-full items-center z-20 pointer-events-none">
           <Text className="text-white/30 text-[10px]">© 2025 Poultry Farm Manager</Text>
        </View>
      )}

    </View>
  );
}