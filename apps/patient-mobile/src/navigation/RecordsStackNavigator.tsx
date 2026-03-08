/**
 * Records Stack Navigator
 * Stack navigation for health records screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RecordsStackParamList } from './types';
import {
  RecordsListScreen,
  RecordDetailScreen,
  DiagnosticReportScreen,
  DocumentUploadScreen,
} from '@screens/records';

const Stack = createNativeStackNavigator<RecordsStackParamList>();

export const RecordsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="RecordsList" component={RecordsListScreen} />
      <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
      <Stack.Screen name="DiagnosticReport" component={DiagnosticReportScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
    </Stack.Navigator>
  );
};
