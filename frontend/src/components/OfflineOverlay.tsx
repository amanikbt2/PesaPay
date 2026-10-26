import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { colors } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';

interface OfflineOverlayProps {
  visible: boolean;
  onDismiss: () => void;
  reason?: 'NO_NETWORK' | 'NO_INTERNET' | 'BACKEND_UNAVAILABLE';
}

export const OfflineOverlay: React.FC<OfflineOverlayProps> = ({
  visible,
  onDismiss,
  reason,
}) => {
  let message = 'Connect to the internet to scan and pay securely.';
  if (reason === 'BACKEND_UNAVAILABLE') {
    message = 'PesaPay servers are momentarily unreachable. Please check your connection and try again.';
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>

          <Text style={styles.title}>You&apos;re offline</Text>
          <Text style={styles.message}>{message}</Text>

          <PrimaryButton
            title="Try again"
            onPress={onDismiss}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    height: 48,
    borderRadius: 24,
  },
});
