import { Ionicons } from '@expo/vector-icons'; // Icons kosam import
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import "./globals.css";
 
export default function Login() {
  const router = useRouter();
 
  // State Variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Eye toggle kosam
  const [error, setError] = useState(''); // Error message kosam
 
  const handleLogin = () => {
    setError(''); // Reset error before checking
 
    // Basic Validation
    if (!email || !password) {
      setError('Please enter both Email and Password.');
      return;
    }
 
    // MOCK LOGIN LOGIC (Backend API integration ikkada cheyali)
    // Testing kosam: Email "admin" & Password "1234" aithene login avuthundi.
    if (email === 'admin@poultry.com' && password === '123456') {
      console.log("Login Success");
      router.replace('/(admin)/Dashboard');
    } else {
      // Wrong credentials enter chesthe warning
      setError('Invalid Email or Password. Please try again.');
    }
  };
 
  const handleVendorRegister = () => {
    // Vendor registration page ki redirect cheyali
    // router.push('/register');
    alert("Redirecting to Vendor Registration Page...");
  };
 
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        className="w-full"
        keyboardShouldPersistTaps="handled"
      >
        {/* Responsive Container: Mobile: Full Width, Web: 450px Fixed */}
        <View className="w-full md:w-[450px] p-5">
         
          {/* 1. Header Logo */}
          <View className="items-center mb-6">
            <View className="h-20 w-20 bg-orange-100 rounded-full items-center justify-center mb-3 border-4 border-white shadow-sm">
              <Text className="text-3xl">🐔</Text>
            </View>
            <Text className="text-3xl font-bold text-slate-800">Poultry Farm</Text>
            <Text className="text-slate-500 text-sm mt-1">Welcome back!</Text>
          </View>
 
          {/* 2. Login Card */}
          <View className="bg-white p-6 md:p-8 rounded-3xl shadow-sm md:shadow-2xl border border-gray-100 space-y-5">
           
            {/* Error Message Display Area */}
            {error ? (
              <View className="bg-red-50 p-3 rounded-lg border border-red-200 flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-red-500 text-sm font-medium ml-2 flex-1">{error}</Text>
              </View>
            ) : null}
 
            {/* Email Field */}
            <View>
              <Text className="text-slate-700 font-semibold mb-2 ml-1 text-sm">Email / User ID</Text>
              <TextInput
                className={`w-full bg-slate-50 rounded-xl px-4 py-3.5 text-slate-700 border focus:border-orange-500 outline-none ${error ? 'border-red-300' : 'border-slate-200'}`}
                placeholder="admin@poultry.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={(text) => { setEmail(text); setError(''); }} // Type chesthunnappudu error povali
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
 
            {/* Password Field with Eye Icon */}
            <View>
              <Text className="text-slate-700 font-semibold mb-2 ml-1 text-sm">Password</Text>
              <View className="relative justify-center">
                <TextInput
                  className={`w-full bg-slate-50 rounded-xl px-4 py-3.5 text-slate-700 border focus:border-orange-500 outline-none pr-12 ${error ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={(text) => { setPassword(text); setError(''); }}
                  secureTextEntry={!showPassword} // Toggle logic
                />
               
                {/* Eye Icon Button */}
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 p-1"
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
 
              <TouchableOpacity className="items-end mt-2">
                <Text className="text-orange-500 text-xs font-bold hover:text-orange-600">Forgot Password?</Text>
              </TouchableOpacity>
            </View>
 
            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              className="bg-orange-500 rounded-xl py-4 shadow-lg active:bg-orange-600 hover:bg-orange-600 transition-all mt-2"
            >
              <Text className="text-white text-center font-bold text-lg tracking-wide">LOGIN</Text>
            </TouchableOpacity>
 
          </View>
 
          {/* 3. Vendor Registration Link */}
          <View className="mt-8 items-center space-y-2">
            <Text className="text-slate-400 text-sm">Are you a new Vendor?</Text>
            <TouchableOpacity
              onPress={handleVendorRegister}
              className="py-2 px-4 rounded-full bg-orange-50 border border-orange-100 active:bg-orange-100"
            >
              <Text className="text-orange-600 font-bold text-sm">Create Vendor Account</Text>
            </TouchableOpacity>
          </View>
 
        </View>
      </ScrollView>
 
      {/* Web Footer */}
      {Platform.OS === 'web' && (
         <View className="absolute bottom-4 w-full items-center pointer-events-none">
            <Text className="text-gray-300 text-xs">© 2025 Poultry Farm Manager</Text>
         </View>
      )}
 
    </View>
  );
}