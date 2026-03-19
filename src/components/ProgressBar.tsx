import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {Colors, BorderRadius} from '../theme/colors';

type Props = {
  percent: number; // 0..1
};

export default function ProgressBar({percent}: Props) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(percent * 100, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [percent, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, animatedStyle]}>
        <View style={styles.glow} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.progressBg,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.progressFill,
    borderRadius: BorderRadius.full,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    right: 0,
    top: -2,
    width: 20,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accentGlow,
  },
});
