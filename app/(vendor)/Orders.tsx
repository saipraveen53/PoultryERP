import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const Orders = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.clear();     // remove login data
    router.replace("/");
    await AsyncStorage.removeItem("UserToken");    // go to login page
  };

  return (
    <View className="flex-1 p-6 bg-white">
      <Text className="text-xl font-bold mb-4">Orders</Text>

      <Link href="/Report" className="text-blue-600 mb-4">
        Go to Report Page
      </Link>

      {/* Logout Button */}
      <TouchableOpacity
        className="bg-red-500 p-3 rounded-xl mt-5"
        onPress={handleLogout}
      >
        <Text className="text-white text-center font-semibold">
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Orders;
