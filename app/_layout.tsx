import { Stack } from "expo-router";
import Context from "./(utils)/Context";
import './globals.css';
export default function RootLayout() {
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
