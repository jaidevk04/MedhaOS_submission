/**
 * Recovery Stack Navigator
 * Navigation for recovery plan screens
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  RecoveryPlanScreen,
  PhaseDetailScreen,
  EducationalContentScreen,
  VideoPlayerScreen,
  RecoveryChatScreen,
} from '@screens/recovery';

export type RecoveryStackParamList = {
  RecoveryPlan: undefined;
  PhaseDetail: { phaseId: string };
  EducationalContent: undefined;
  VideoPlayer: { contentId: string };
  RecoveryChat: undefined;
};

const Stack = createStackNavigator<RecoveryStackParamList>();

export const RecoveryStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="RecoveryPlan" component={RecoveryPlanScreen} />
      <Stack.Screen name="PhaseDetail" component={PhaseDetailScreen} />
      <Stack.Screen name="EducationalContent" component={EducationalContentScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
      <Stack.Screen name="RecoveryChat" component={RecoveryChatScreen} />
    </Stack.Navigator>
  );
};
