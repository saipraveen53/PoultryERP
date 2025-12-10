import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export interface PushNotificationState {
  notification?: Notifications.Notification;
  expoPushToken?: string;
}

export const usePushNotification = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // ⭐ Android-only: run handler only on Android
  if (Platform.OS === "android") {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldShowAlert: true,
        shouldSetBadge: false,
      }),
    });
  }

  async function registerForPushNotificationsAsync() {
    // ❌ If NOT Android → skip
    if (Platform.OS !== "android") {
      console.log("Push notifications only enabled for Android.");
      return;
    }

    if (!Device.isDevice) {
      console.log("Please use a real device.");
      return;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Failed to get push token!");
      return;
    }

    // ⭐ Android Expo Push Token
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Android notification channel
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });

    return token;
  }

  useEffect(() => {
    // ❌ Skip web/iOS completely
    if (Platform.OS !== "android") return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) setExpoPushToken(token);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notif) => {
        setNotification(notif);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("User tapped notification:", response);
      });

    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      if (responseListener.current)
        Notifications.removeNotificationSubscription(
          responseListener.current
        );
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};
