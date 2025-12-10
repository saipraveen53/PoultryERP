import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import "./globals.css";

const { height, width } = Dimensions.get('window');

export default function Login() {
  const router = useRouter();

  // State Variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    if (!email || !password) {
      setError('Please enter both Email and Password.');
      return;
    }
    // MOCK LOGIN
    if (email === 'admin@poultry.com' && password === '123456') {
      router.replace('/(admin)/Dashboard');
    } else {
      setError('Invalid Email or Password.');
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

              {/* Email Input */}
              <View>
                {/* Changed label color to white/gray-200 for readability on glass */}
                <Text className="text-gray-200 font-semibold mb-2 ml-1 text-sm">Email ID</Text>
                <TextInput
                  className="w-full bg-white/90 rounded-xl px-4 py-3.5 text-gray-900 border border-white/20 focus:border-orange-500 font-medium"
                  placeholder="admin@poultry.com"
                  placeholderTextColor="#6b7280"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
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
                className="bg-orange-600 rounded-xl py-3.5 shadow-lg active:bg-orange-700 mt-2 border border-orange-500"
              >
                <Text className="text-white text-center font-bold text-lg tracking-wide">LOGIN</Text>
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