import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, StatusBar} from 'react-native';
import {
  downloadModel,
  isModelDownloaded,
  type DownloadProgress,
} from '../services/ModelDownloader';
import ProgressBar from '../components/ProgressBar';
import {Colors, Spacing, FontSize, BorderRadius} from '../theme/colors';

type Props = {
  onComplete: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function DownloadScreen({onComplete}: Props) {
  const [progress, setProgress] = useState<DownloadProgress>({
    received: 0,
    total: 0,
    percent: 0,
  });
  const [status, setStatus] = useState('Checking for model...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const exists = await isModelDownloaded();
        if (exists) {
          if (!cancelled) {
            onComplete();
          }
          return;
        }

        setStatus('Downloading Qwen 3.5 (2B)...');

        await downloadModel(p => {
          if (!cancelled) {
            setProgress(p);
          }
        });

        if (!cancelled) {
          setStatus('Download complete!');
          // Brief delay to show 100%
          setTimeout(() => {
            if (!cancelled) {
              onComplete();
            }
          }, 800);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Download failed. Check your connection.');
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* Top glow */}
      <View style={styles.glowCircle} />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>D</Text>
          </View>
        </View>

        <Text style={styles.title}>DreamChat</Text>
        <Text style={styles.subtitle}>Setting up your AI assistant</Text>

        {/* Progress section */}
        <View style={styles.progressSection}>
          <Text style={styles.statusText}>{error || status}</Text>

          {!error && (
            <>
              <View style={styles.progressBarWrapper}>
                <ProgressBar percent={progress.percent} />
              </View>

              <View style={styles.progressDetails}>
                <Text style={styles.percentText}>
                  {Math.round(progress.percent * 100)}%
                </Text>
                {progress.total > 0 && (
                  <Text style={styles.sizeText}>
                    {formatBytes(progress.received)} /{' '}
                    {formatBytes(progress.total)}
                  </Text>
                )}
              </View>
            </>
          )}

          {error && (
            <Text style={styles.errorHint}>
              Please check your internet connection and restart the app.
            </Text>
          )}
        </View>


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
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  progressSection: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  statusText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  progressBarWrapper: {
    marginBottom: Spacing.sm,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.accent,
  },
  sizeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  errorHint: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  infoCard: {
    width: '100%',
    backgroundColor: Colors.bgGlass,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  infoTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs + 2,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});
