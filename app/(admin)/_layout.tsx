import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { Text, View } from 'react-native';
import "../globals.css"; // Styles import check chesukondi

// --- CUSTOM DRAWER COMPONENT ---
const CustomDrawerContent = (props: any) => {
  const router = useRouter();

  const handleLogout = () => {
    // Logout logic: Redirect to Login Page
    router.replace('/');
  };

  return (
    <View style={{ flex: 1 }}>
      
      {/* 1. DRAWER SCROLLABLE AREA */}
      {/* contentContainerStyle={{ paddingTop: 0 }} pettadam valla Header paiki full ga velli gap lekunda fill avuthundi */}
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        
        {/* HEADER SECTION - CENTERED & FULL WIDTH */}
        <View className="bg-orange-600 w-full p-6 pt-16 items-center justify-center mb-6">
            
            {/* Icon Circle */}
            <View className="h-24 w-24 bg-white rounded-full items-center justify-center mb-3 shadow-md border-4 border-orange-300">
                <Text className="text-5xl">🐔</Text>
            </View>
            
            {/* Text Content - Centered */}
            <Text className="text-white text-2xl font-bold text-center">Poultry Farm</Text>
            <Text className="text-orange-100 text-sm font-medium text-center opacity-90">Manager Portal</Text>
        
        </View>

        {/* Menu Items (Dashboard, Vendors) */}
        <View className="px-2">
            <DrawerItemList {...props} />
        </View>

      </DrawerContentScrollView>

      {/* 2. LOGOUT BUTTON (Fixed at Bottom) */}
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
            headerStyle: { backgroundColor: '#ea580c' }, // Orange Header
            headerTintColor: '#fff', 
            headerTitleStyle: { fontWeight: 'bold' },
            drawerActiveTintColor: '#ea580c', // Active Item Text Color
            drawerActiveBackgroundColor: '#fff7ed', // Active Item BG Color (Light Orange)
            drawerInactiveTintColor: '#374151', 
            drawerLabelStyle: { marginLeft: -10, fontWeight: '600', fontSize: 15 },
            drawerType: 'front', 
            drawerStyle: { width: 280 }, // Sidebar width fixed
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
     </Drawer>
  )
}

export default DrawerLayout;