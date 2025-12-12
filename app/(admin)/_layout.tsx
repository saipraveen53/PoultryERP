import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { Text, View } from 'react-native';
import "../globals.css";
 
// --- CUSTOM DRAWER COMPONENT ---
const CustomDrawerContent = (props: any) => {
  const router = useRouter();
 
  const handleLogout = async() => {
    router.replace('/');
    await AsyncStorage.removeItem("userToken");
  };
 
  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <View className="bg-orange-600 w-full p-6 pt-16 items-center justify-center mb-6">
            <View className="h-24 w-24 bg-white rounded-full items-center justify-center mb-3 shadow-md border-4 border-orange-300">
                <Text className="text-5xl">🐔</Text>
            </View>
            <Text className="text-white text-2xl font-bold text-center">Poultry Farm</Text>
            <Text className="text-orange-100 text-sm font-medium text-center opacity-90">Manager Portal</Text>
        </View>
 
        <View className="px-2">
            <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>
 
      <View className="p-4 border-t border-gray-200 pb-8">
        <DrawerItem
            label="Logout"
            labelStyle={{ color: '#dc2626', fontWeight: 'bold', marginLeft: -10, fontSize: 15 }}
            icon={({ size }) => (
                <Ionicons name="log-out-outline" size={24} color="#dc2626" />
            )}
            onPress={handleLogout}
            style={{ borderRadius: 12, backgroundColor: '#fef2f2' }}
        />
        <Text className="text-gray-400 text-xs text-center mt-4">App Version 1.0.0</Text>
      </View>
    </View>
  );
};
 
// --- MAIN DRAWER LAYOUT ---
const DrawerLayout = () => {
  return (
     <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
            headerStyle: { backgroundColor: '#ea580c' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            drawerActiveTintColor: '#ea580c',
            drawerActiveBackgroundColor: '#fff7ed',
            drawerInactiveTintColor: '#374151',
            drawerLabelStyle: { marginLeft: -10, fontWeight: '600', fontSize: 15 },
            drawerType: 'front',
            drawerStyle: { width: 280 },
        }}
     >
        <Drawer.Screen
            name='Dashboard'
            options={{
                drawerLabel: 'Dashboard',
                title: 'Overview',
                drawerIcon: ({ color, size }) => <Ionicons name="grid-outline" size={22} color={color} />
            }}
        />
        <Drawer.Screen
            name='Vendors'
            options={{
                drawerLabel: 'Vendors',
                title: 'Vendor Management',
                drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={22} color={color} />
            }}
        />
        {/* 🔥 NEW TRANSACTIONS PAGE ADDED HERE 🔥 */}
        <Drawer.Screen
            name='Transactions'
            options={{
                drawerLabel: 'Transactions',
                title: 'Ledger & Accounts',
                drawerIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={22} color={color} />
            }}
        />
     </Drawer>
  )
}
 
export default DrawerLayout;