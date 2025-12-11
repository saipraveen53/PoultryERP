import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";
import Context from "./(utils)/Context";
import './globals.css';
export default function RootLayout() {


useEffect(()=>{
  let handleRedirectLogic = async()=>{
    const  Token = await AsyncStorage.getItem("userToken");
    const decoded = jwtDecode(Token);
    const Role = decoded.roles[0];
    if(Role=="ADMIN"){
      router.replace('/(admin)/Dashboard')
    }else{
      router.replace('/(vendor)/Orders')
    }
  }
  handleRedirectLogic();
})

  return (

   <Context>
      <Stack>
        <Stack.Screen name="index" options={{headerShown:false}} />
        <Stack.Screen name="(admin)" options={{headerShown:false}} />
        <Stack.Screen name="(vendor)" options={{headerShown:false}} />
      </Stack>
   </Context>
       
    
     

  );
}
