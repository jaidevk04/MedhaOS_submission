/**
 * Home Stack Navigator
 * Stack navigation for home-related screens including triage and appointments
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { HomeScreen } from '@screens/home';
import { TriageScreen, TriageResultScreen } from '@screens/triage';
import {
  FacilitySelectionScreen,
  DoctorSelectionScreen,
  AppointmentConfirmationScreen,
} from '@screens/appointments';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="Triage" component={TriageScreen} />
      <Stack.Screen name="TriageResult" component={TriageResultScreen} />
      <Stack.Screen name="FacilitySelection" component={FacilitySelectionScreen} />
      <Stack.Screen name="DoctorSelection" component={DoctorSelectionScreen} />
      <Stack.Screen name="AppointmentConfirmation" component={AppointmentConfirmationScreen} />
    </Stack.Navigator>
  );
};
