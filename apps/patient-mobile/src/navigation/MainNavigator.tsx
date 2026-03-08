/**
 * Main Navigator
 * Bottom tab navigation for authenticated users
 */

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { theme } from '@theme';
import { HomeStackNavigator } from './HomeStackNavigator';
import { RecordsStackNavigator } from './RecordsStackNavigator';
import { MedicationsStackNavigator } from './MedicationsStackNavigator';
import { RecoveryStackNavigator } from './RecoveryStackNavigator';

// Placeholder screens - will be implemented in subsequent tasks
const AppointmentsScreen = () => null;
const ProfileScreen = () => null;

const Tab = createBottomTabNavigator<MainTabParamList>();

// Icon component for tab bar
interface TabBarIconProps {
  icon: string;
  focused: boolean;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ icon, focused }) => (
  <Text style={{ fontSize: focused ? 26 : 24, opacity: focused ? 1 : 0.6 }}>
    {icon}
  </Text>
);

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.neutral[500],
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopColor: theme.colors.border.light,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={AppointmentsScreen}
        options={{
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ focused }) => <TabBarIcon icon="📅" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="Records" 
        component={RecordsStackNavigator}
        options={{
          tabBarLabel: 'Records',
          tabBarIcon: ({ focused }) => <TabBarIcon icon="📋" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="Medications" 
        component={MedicationsStackNavigator}
        options={{
          tabBarLabel: 'Medications',
          tabBarIcon: ({ focused }) => <TabBarIcon icon="💊" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="Recovery" 
        component={RecoveryStackNavigator}
        options={{
          tabBarLabel: 'Recovery',
          tabBarIcon: ({ focused }) => <TabBarIcon icon="🏥" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
