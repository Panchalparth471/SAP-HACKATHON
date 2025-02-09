import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import PrescriptionScreen from './screens/PrescriptionScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatBotScreen from './screens/ChatBotScreen';
import Scan from './screens/Scan';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';


const stack = createStackNavigator();
export default function App() {
  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }
  return (
    <NavigationContainer>
      <stack.Navigator initialRouteName="Home" screenOptions={{headerShown:false}}>
        <stack.Screen name="Home" component={HomeScreen}></stack.Screen>
        <stack.Screen name="Profile" component={ProfileScreen}></stack.Screen>
        <stack.Screen name="prescriptionDetails" component={PrescriptionScreen}></stack.Screen>
        <stack.Screen name="chatBot" component={ChatBotScreen}></stack.Screen>
        <stack.Screen name="scan" component={Scan}></stack.Screen>
        <stack.Screen name="login" component={LoginScreen}></stack.Screen>
        <stack.Screen name="signup" component={SignupScreen}></stack.Screen>
        <stack.Screen name="forgot" component={ForgotPasswordScreen}></stack.Screen>
      </stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
