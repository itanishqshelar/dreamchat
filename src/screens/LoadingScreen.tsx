import React, {useEffect} from 'react';
import {View, Text, StyleSheet, StatusBar, ActivityIndicator} from 'react-native';
import {initModel} from '../services/LlamaService';
import {getModelPath} from '../services/ModelDownloader';
import {Colors, Spacing, FontSize, BorderRadius} from '../theme/colors';

type Props = {
  onComplete: () => void;
  onError: (error: string) => void;
};

export default function LoadingScreen({onComplete, onError}: Props) {
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const modelPath = getModelPath();
        await initModel(modelPath);
        if (!cancelled) {
          onComplete();
        }
      } catch (err: any) {
        if (!cancelled) {
          onError(err?.message || 'Failed to load model.');
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [onComplete, onError]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      <View style={styles.glowCircle} />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>D</Text>
          </View>
        </View>

        <Text style={styles.title}>DreamChat</Text>

        <ActivityIndicator
          size="large"
          color={Colors.accent}
          style={styles.spinner}
        />

        <Text style={styles.statusText}>Loading model...</Text>
        <Text style={styles.hint}>
          This may take a moment on first launch
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  glowCircle: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.accentGlow,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logoText: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.textOnAccent,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  spinner: {
    marginBottom: Spacing.md,
  },
  statusText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
