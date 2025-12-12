import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";
import Context from "./(utils)/Context";
import './globals.css';

export default function RootLayout() {

  useEffect(() => {
    let handleRedirectLogic = async () => {
      try {
        const Token = await AsyncStorage.getItem("userToken");

        if (!Token) {
          router.replace('/');
          return;
        }

        const decoded = jwtDecode(Token);
        
        if (!decoded.roles || decoded.roles.length === 0) {
            router.replace('/');
            return;
        }

        const Role = decoded.roles[0];

        if (Role === "ADMIN") {
          router.replace('/(admin)/Dashboard');
        } else { // Assuming any non-admin role defaults to vendor path
          router.replace('/(vendor)/Orders');
        }
        
      } catch (error) {
        router.replace('/');
      }
    };
    
    handleRedirectLogic();
  }, []);

  return (
    <Context>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(vendor)" options={{ headerShown: false }} />
      </Stack>
    </Context>
  );
}