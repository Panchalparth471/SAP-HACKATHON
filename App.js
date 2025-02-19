import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View, Alert } from "react-native";
import Constants from "expo-constants";
import AddScheuleScreen from "./screens/AddScheduleScreen";
import * as Notifications from "expo-notifications";

// Import Screens
import HomeScreen from "./screens/HomeScreen";
import PrescriptionScreen from "./screens/PrescriptionScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ChatBotScreen from "./screens/ChatBotScreen";
import Scan from "./screens/Scan";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import SearchDoctor from "./screens/SearchDoctor";
import UploadScreen from "./screens/UploadScreen";
// Import Fonts
import { useFonts, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  // Check user session (auth)
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        if (storedToken) {
          setInitialRoute("Home");
        } else {
          setInitialRoute("signup");
        }
      } catch (error) {
        console.error("Error checking user session:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkUserSession();
  }, []);

  // Register for push notifications
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (!Constants.isDevice) {
        Alert.alert("Push notifications only work on a physical device");
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert("Failed to get push token for push notifications!");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const expoPushToken = tokenData.data;
      console.log("Expo Push Token:", expoPushToken);

      // Optionally, store the token in AsyncStorage or send it to your backend
      await AsyncStorage.setItem("expo_push_token", expoPushToken);
      console.log(expoPushToken)
    }
    registerForPushNotificationsAsync();
  }, []);

  if (!fontsLoaded || isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0E64D2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="addMedicine" component={AddScheuleScreen}/>
        <Stack.Screen name="prescriptionDetails" component={PrescriptionScreen} />
        <Stack.Screen name="search" component={SearchDoctor} />
        <Stack.Screen name="chatBot" component={ChatBotScreen} />
        <Stack.Screen name="uploadReports" component={UploadScreen}/>
        <Stack.Screen name="scan" component={Scan} />
        <Stack.Screen name="login" component={LoginScreen} />
        <Stack.Screen name="signup" component={SignupScreen} />
        <Stack.Screen name="forgot" component={ForgotPasswordScreen} />
        <Stack.Screen name="reset" component={ResetPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
