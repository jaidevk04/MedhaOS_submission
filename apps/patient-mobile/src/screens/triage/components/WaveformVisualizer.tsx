/**
 * Waveform Visualizer
 * Real-time audio waveform visualization
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '@theme';

interface WaveformVisualizerProps {
  isActive: boolean;
}

const BAR_COUNT = 20;

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isActive,
}) => {
  const animatedValues = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.2))
  ).current;

  useEffect(() => {
    if (isActive) {
      // Animate bars with random heights to simulate audio input
      const animations = animatedValues.map((anim, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: 150 + Math.random() * 100,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: 150 + Math.random() * 100,
              useNativeDriver: false,
            }),
          ])
        );
      });

      // Stagger the start of each animation
      animations.forEach((anim, index) => {
        setTimeout(() => anim.start(), index * 30);
      });

      return () => {
        animations.forEach((anim) => anim.stop());
      };
    } else {
      // Reset to baseline
      animatedValues.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isActive, animatedValues]);

  return (
    <View style={styles.container}>
      {animatedValues.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['20%', '100%'],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 3,
    paddingHorizontal: theme.spacing.md,
  },
  bar: {
    width: 4,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 2,
    minHeight: 8,
  },
});
