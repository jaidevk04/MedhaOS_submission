/**
 * Voice Input Button
 * Animated button for voice recording with pulse effect
 */

import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';

interface VoiceInputButtonProps {
  isRecording: boolean;
  onPress: () => void;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isRecording,
  onPress,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: Animated.multiply(pulseAnim, scaleAnim) }],
          },
        ]}
      >
        <LinearGradient
          colors={
            isRecording
              ? ['#FF6B6B', '#EE5A6F']
              : ['#667EEA', '#764BA2']
          }
          style={styles.gradient}
        >
          <Text style={styles.icon}>🎤</Text>
        </LinearGradient>
        
        {isRecording && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.15],
                  outputRange: [0.5, 0],
                }),
              },
            ]}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  gradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.large,
  },
  icon: {
    fontSize: 36,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FF6B6B',
    top: 0,
    left: 0,
  },
});
