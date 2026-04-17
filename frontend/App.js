import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync, sendPushTokenToBackend, addNotificationReceivedListener, addNotificationResponseReceivedListener } from './src/api/notifications';

const PushNotificationSetup = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        sendPushTokenToBackend(token);
      }
    });

    const subscription = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    const responseSubscription = addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, [user]);

  return null;
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <PushNotificationSetup />
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
