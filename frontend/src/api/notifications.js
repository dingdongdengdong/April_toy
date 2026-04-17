import { Platform } from 'react-native';
import apiClient from './client';

let Notifications;
let Device;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (e) {
  console.log('expo-notifications not available:', e.message);
}

export async function registerForPushNotificationsAsync() {
  if (!Notifications || !Device) {
    console.log('Push notifications require a development build');
    return null;
  }

  let token;

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    const pushTokenData = await Notifications.getExpoPushTokenAsync();
    token = pushTokenData.data;
    console.log('Expo Push Token:', token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (e) {
    console.log('Error getting push token:', e.message);
    return null;
  }

  return token;
}

export async function sendPushTokenToBackend(token) {
  try {
    await apiClient.post('/users/device-tokens/register/', {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
  } catch (e) {
    console.log('Register push token error:', e);
  }
}

export function addNotificationReceivedListener(callback) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(callback) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener(callback);
}
