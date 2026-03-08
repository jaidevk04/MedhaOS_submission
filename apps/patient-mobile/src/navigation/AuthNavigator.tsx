/**
 * Auth Navigator
 * Navigation for authentication flow
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import {
  WelcomeScreen,
  LanguageSelectionScreen,
  RegisterScreen,
  LoginScreen,
  ABHAIntegrationScreen,
} from '../screens/auth';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ABHAIntegration" component={ABHAIntegrationScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
