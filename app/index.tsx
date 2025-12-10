import { Text, View } from "react-native";
import { usePushNotification } from "../usePushNotifications";
import "./globals.css";

export default function Index() {
  const { expoPushToken, notification } = usePushNotification();

  const data = JSON.stringify(notification, undefined, 2);

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 p-5">
      <Text className="text-xl font-bold text-blue-500 mb-4">
        Token: {expoPushToken}
      </Text>

      <Text className="text-gray-700">{data}</Text>
    </View>
  );
}