/**
 * Medications Stack Navigator
 * Navigation stack for medication management features
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  MedicationsListScreen,
  MedicationDetailScreen,
  PillScannerScreen,
  ReminderSetupScreen,
} from '@screens/medications';

export type MedicationsStackParamList = {
  MedicationsList: undefined;
  MedicationDetail: { medicationId: string };
  PillScanner: { medicationId?: string };
  ReminderSetup: { medicationId: string };
};

const Stack = createNativeStackNavigator<MedicationsStackParamList>();

export const MedicationsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MedicationsList" component={MedicationsListScreen} />
      <Stack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
      <Stack.Screen 
        name="PillScanner" 
        component={PillScannerScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="ReminderSetup" component={ReminderSetupScreen} />
    </Stack.Navigator>
  );
};
