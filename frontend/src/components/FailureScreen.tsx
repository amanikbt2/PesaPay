import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface FailureScreenProps {
  message?: string;
  onRetry: () => void;
  onBackToScan: () => void;
}

export const FailureScreen: React.FC<FailureScreenProps> = ({
  message = 'The transaction was not completed. Please try again.',
  onRetry,
  onBackToScan,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Red X Badge */}
        <View style={styles.iconCircle}>
          <Text style={styles.xIcon}>✕</Text>
        </View>

        <Text style={styles.title}>Payment Failed</Text>
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Try Again"
          onPress={onRetry}
          style={styles.retryButton}
        />
        <SecondaryButton
          title="Back to Scan"
          onPress={onBackToScan}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  xIcon: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 12,
  },
  retryButton: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
});
