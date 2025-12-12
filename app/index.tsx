import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { jwtDecode } from "jwt-decode";
import React, { useContext, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { PoultryContext } from './(utils)/Context';
// import { rootApi } from './(utils)/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import "./globals.css";

// --------------------------------------------------------
// ASSUMPTION: Placeholder for your API client (e.g., Axios instance)
// You must replace this with your actual API configuration.
// --------------------------------------------------------

// --------------------------------------------------------

const { height, width } = Dimensions.get('window');

export default function Login() {
  const router = useRouter();
  const {isAuthenticated, setIsAuthenticated} = useContext(PoultryContext);

  // State Variables
  // Renamed 'email' to 'username' to match your DTO
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // New state for loading

  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('Please enter both Username/Email and Password.');
      return;
    }

    setIsLoading(true); // Start loading

    try {
      // 1. DTO structure: { username: ..., password: ... }
      const loginPayload = {
        username: username,
        password: password,
      };

      // 2. API Call: rootApi.post(api/auth/login)
      const response = await axios.post('http://192.168.0.110:8083/api/auth/login', loginPayload);
      

     if(response.status==200){

          setIsAuthenticated(true)
          console.log('Login Successful:', response);
      console.log("Token",response.data.token)
      await AsyncStorage.setItem("userToken",response.data.token);
      const decoded = jwtDecode(response.data.token);
      console.log("Token Claims :",decoded);
      console.log("Logged In Role :",decoded.roles[0]);
       if(decoded.roles[0]=="VENDOR"){
        router.replace('/(vendor)/Orders');
       }else{
        router.replace('/(admin)/Dashboard');
       };

     }
      


      
      // Navigate to the dashboard (Assuming admin dashboard as per original code)
     

    } catch (err) {
      // --- Error Logic ---
      console.error('Login Failed:', err.message);
      // Display the specific error message from the API or the default one
      setError(err.message || 'An unexpected error occurred during login.');
      // Optional: Show a more prominent alert for critical errors
      // Alert.alert("Login Error", err.message || "Could not connect to the server.");
    } finally {
      setIsLoading(false); // Stop loading regardless of success/failure
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

      {/* 2. DARK OVERLAY LAYER (Slightly darker for better contrast with glass card) */}
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
            paddingBottom: 20 // Little padding at bottom
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

            {/* LOGIN FORM CARD (Glassmorphism Effect - TRANSPARENT) */}
            <View 
              className="w-full p-6 rounded-3xl border border-white/20 shadow-2xl space-y-4"
              style={{
                backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.1)' : '#00000055', // Glass effect
                backdropFilter: Platform.OS === 'web' ? 'blur(15px)' : undefined, // Strong Blur
              }}
            >
              
              {/* Error Box */}
              {error ? (
                <View className="bg-red-500/20 p-3 rounded-xl border border-red-500/50 flex-row items-center mb-2">
                  <Ionicons name="alert-circle" size={20} color="#fca5a5" />
                  <Text className="text-red-100 text-sm font-bold ml-2 flex-1">{error}</Text>
                </View>
              ) : null}

              {/* Username Input (renamed from Email) */}
              <View>
                <Text className="text-gray-200 font-semibold mb-2 ml-1 text-sm">Username / Email ID</Text>
                <TextInput
                  className="w-full bg-white/90 rounded-xl px-4 py-3.5 text-gray-900 border border-white/20 focus:border-orange-500 font-medium"
                  placeholder="e.g., admin@poultry.com"
                  placeholderTextColor="#6b7280"
                  value={username} // Use username state
                  onChangeText={(t) => { setUsername(t); setError(''); }} // Update username state
                  autoCapitalize="none"
                  keyboardType="email-address"
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
                // Disable button and change color when loading
                disabled={isLoading}
                className={`rounded-xl py-3.5 shadow-lg mt-2 border border-orange-500 ${isLoading ? 'bg-orange-800' : 'bg-orange-600 active:bg-orange-700'}`}
              >
                <Text className="text-white text-center font-bold text-lg tracking-wide">
                  {/* Show a spinner or 'LOGGING IN...' when loading */}
                  {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                </Text>
              </TouchableOpacity>

              {/* Vendor Link INSIDE the card (Better layout) */}
              <View className="flex-row justify-center items-center mt-4 pt-4 border-t border-white/10">
                 <Text className="text-gray-300 text-sm mr-2">New Vendor?</Text>
                 <TouchableOpacity onPress={() => alert("Vendor Registration")}>
                    <Text className="text-white font-bold text-sm underline decoration-orange-500">Create Account</Text>
                 </TouchableOpacity>
              </View>

            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Web Footer Copyright */}
      {Platform.OS === 'web' && (
        <View className="absolute bottom-2 w-full items-center z-20 pointer-events-none">
           <Text className="text-white/30 text-[10px]">© 2025 Poultry Farm Manager</Text>
        </View>
      )}

    </View>
  );
}